const express = require('express');

const STATS_CACHE_KEY = 'stats:v2';
const STATS_TTL_SECONDS = 10;
const TASK_QUEUE_NAME = process.env.TASK_QUEUE_NAME || 'jobs:items';

function createApiRouter({ repo, cache, instanceId, startedAt, getRequestCount }) {
  const router = express.Router();

  router.get('/items', async (req, res, next) => {
    try {
      const items = await repo.getItems();
      res.json(items);
    } catch (error) {
      next(error);
    }
  });

  router.post('/items', async (req, res, next) => {
    const { name, price } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ message: 'Pola name i price sa wymagane.' });
    }

    const parsedPrice = Number(price);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ message: 'Pole price musi byc poprawna liczba >= 0.' });
    }

    try {
      const newItem = await repo.addItem({
        name: String(name),
        price: parsedPrice,
      });

      if (typeof cache.enqueue === 'function') {
        await cache.enqueue(
          TASK_QUEUE_NAME,
          JSON.stringify({
            type: 'item.created',
            payload: newItem,
            queuedAt: new Date().toISOString(),
          })
        );
      }

      await cache.del(STATS_CACHE_KEY);
      return res.status(201).json(newItem);
    } catch (error) {
      return next(error);
    }
  });

  router.get('/stats', async (req, res, next) => {
    try {
      const cached = await cache.get(STATS_CACHE_KEY);
      if (cached) {
        res.set('X-Cache', 'HIT');
        return res.json(JSON.parse(cached));
      }

      const stats = {
        totalItems: await repo.getItemCount(),
        instanceId,
        serverTime: new Date().toISOString(),
        uptime: process.uptime(),
        requestCount: getRequestCount(),
      };

      await cache.setEx(STATS_CACHE_KEY, STATS_TTL_SECONDS, JSON.stringify(stats));
      res.set('X-Cache', 'MISS');
      return res.json(stats);
    } catch (error) {
      return next(error);
    }
  });

  router.get('/health', async (req, res) => {
    const postgres = { status: 'up' };
    const redis = { status: 'up' };

    try {
      await repo.checkHealth();
    } catch (error) {
      postgres.status = 'down';
      postgres.error = error instanceof Error ? error.message : 'unknown error';
    }

    try {
      await cache.checkHealth();
    } catch (error) {
      redis.status = 'down';
      redis.error = error instanceof Error ? error.message : 'unknown error';
    }

    const isHealthy = postgres.status === 'up' && redis.status === 'up';

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'ok' : 'degraded',
      startedAt: startedAt.toISOString(),
      uptime: process.uptime(),
      requestCount: getRequestCount(),
      postgres,
      redis,
    });
  });

  return router;
}

module.exports = {
  createApiRouter,
  STATS_CACHE_KEY,
  STATS_TTL_SECONDS,
};
