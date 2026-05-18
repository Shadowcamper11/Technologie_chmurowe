const express = require('express');
const cors = require('cors');
const os = require('os');
const { createClient } = require('redis');
const { createPostgreService } = require('./postgre');
const { createApiRouter } = require('./api');
const { buildDatabaseUrl, getAppConfig } = require('./runtime-config');

function createRedisService({ url }) {
  const client = createClient({ url });

  client.on('error', (error) => {
    console.error('Redis client error:', error.message);
  });

  return {
    async connect() {
      if (!client.isOpen) {
        await client.connect();
      }
    },
    async get(key) {
      return client.get(key);
    },
    async setEx(key, ttlSeconds, value) {
      return client.setEx(key, ttlSeconds, value);
    },
    async enqueue(queueName, value) {
      return client.lPush(queueName, value);
    },
    async del(key) {
      return client.del(key);
    },
    async checkHealth() {
      await client.ping();
    },
    async close() {
      if (client.isOpen) {
        await client.quit();
      }
    },
  };
}

async function createApp(options = {}) {
  const app = express();
  const startedAt = new Date();
  let requestCount = 0;
  const devReloadMessage = process.env.DEV_RELOAD_MESSAGE || 'reload-proof-v2';
  const appConfig = getAppConfig();
  const instanceId = process.env.INSTANCE_ID || appConfig.instanceLabel || os.hostname();

  app.use(cors());
  app.use(express.json());
  app.use((req, res, next) => {
    requestCount += 1;
    res.set('X-Backend-Instance', instanceId);
    next();
  });
  const repo =
    options.repo ||
    createPostgreService({
      connectionString: buildDatabaseUrl(),
    });
  const cache =
    options.cache ||
    createRedisService({
      url: process.env.REDIS_URL || 'redis://redis:6379',
    });

  if (!options.repo) {
    await repo.connect();
    await repo.init();
  }

  if (!options.cache) {
    await cache.connect();
  }

  app.use(
    '/',
    createApiRouter({
      repo,
      cache,
      instanceId,
      startedAt,
      getRequestCount: () => requestCount,
    })
  );

  app.get('/dev-reload-proof', (req, res) => {
    res.json({
      message: devReloadMessage,
      instanceId,
      pid: process.pid,
      serverTime: new Date().toISOString(),
    });
  });

  app.use((error, req, res, next) => {
    console.error(error);
    res.status(500).json({ message: 'Wewnetrzny blad serwera.' });
  });

  return {
    app,
    async close() {
      await Promise.all([repo.close(), cache.close()]);
    },
  };
}

async function startServer() {
  const port = Number(process.env.BACKEND_PORT || process.env.PORT || 5000);
  const { app } = await createApp();
  app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Unable to start server:', error);
    process.exit(1);
  });
}

module.exports = { createApp };





