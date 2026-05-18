const { Pool } = require('pg');
const { createClient } = require('redis');
const { buildDatabaseUrl } = require('./runtime-config');

const queueName = process.env.TASK_QUEUE_NAME || 'jobs:items';
const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';
const databaseUrl = buildDatabaseUrl();
const instanceId = process.env.INSTANCE_ID || 'worker';

let shuttingDown = false;

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getJobPayload(entry) {
  if (!entry) {
    return null;
  }

  if (typeof entry === 'object' && !Array.isArray(entry)) {
    return entry.element || null;
  }

  if (Array.isArray(entry) && entry.length >= 2) {
    return entry[1] || null;
  }

  return null;
}

async function ensureTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS background_jobs (
      id SERIAL PRIMARY KEY,
      worker_id TEXT NOT NULL,
      job_type TEXT NOT NULL,
      payload JSONB NOT NULL,
      processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function persistJob(pool, rawPayload) {
  const parsed = JSON.parse(rawPayload);
  const jobType = parsed.type || 'unknown';

  await pool.query(
    'INSERT INTO background_jobs (worker_id, job_type, payload) VALUES ($1, $2, $3::jsonb)',
    [instanceId, jobType, JSON.stringify(parsed)]
  );

  console.log(`[${instanceId}] processed job type=${jobType}`);
}

async function startWorker() {
  const redis = createClient({ url: redisUrl });
  const pool = new Pool({ connectionString: databaseUrl });

  redis.on('error', (error) => {
    console.error('Redis client error:', error.message);
  });

  const stop = () => {
    shuttingDown = true;
  };

  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);

  try {
    await pool.query('SELECT 1');
    await ensureTable(pool);
    await redis.connect();

    console.log(`[${instanceId}] worker started, queue=${queueName}`);

    while (!shuttingDown) {
      try {
        const result = await redis.brPop(queueName, 5);
        const rawPayload = getJobPayload(result);

        if (!rawPayload) {
          continue;
        }

        await persistJob(pool, rawPayload);
      } catch (error) {
        if (!shuttingDown) {
          console.error(`[${instanceId}] processing error:`, error.message);
          await delay(1000);
        }
      }
    }
  } finally {
    if (redis.isOpen) {
      await redis.quit();
    }
    await pool.end();
    console.log(`[${instanceId}] worker stopped`);
  }
}

startWorker().catch((error) => {
  console.error('Worker failed to start:', error);
  process.exit(1);
});
