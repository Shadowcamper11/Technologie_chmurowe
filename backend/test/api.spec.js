const request = require('supertest');
const { createApp } = require('../src/server');

describe('backend health and stats endpoints', () => {
  let app;

  beforeAll(async () => {
    const items = [
      { id: 1, name: 'Laptop', price: 4999 },
      { id: 2, name: 'Klawiatura', price: 299 },
    ];
    const cacheStore = new Map();

    const repo = {
      async getItems() {
        return [...items];
      },
      async getItemCount() {
        return items.length;
      },
      async addItem({ name, price }) {
        const item = {
          id: items.length + 1,
          name,
          price,
        };
        items.push(item);
        return item;
      },
      async checkHealth() {
        return true;
      },
      async close() {
        return true;
      },
    };

    const cache = {
      async get(key) {
        return cacheStore.get(key) || null;
      },
      async setEx(key, ttlSeconds, value) {
        cacheStore.set(key, value);
        return 'OK';
      },
      async del(key) {
        cacheStore.delete(key);
      },
      async checkHealth() {
        return 'PONG';
      },
      async close() {
        return true;
      },
    };

    const created = await createApp({ repo, cache });
    app = created.app;
  });

  it('GET /health reports postgres and redis status separately', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(typeof response.body.startedAt).toBe('string');
    expect(typeof response.body.uptime).toBe('number');
    expect(typeof response.body.requestCount).toBe('number');
    expect(response.body.postgres.status).toBe('up');
    expect(response.body.redis.status).toBe('up');
  });

  it('GET /stats uses Redis cache with MISS then HIT header', async () => {
    const firstResponse = await request(app).get('/stats');
    const secondResponse = await request(app).get('/stats');

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(firstResponse.headers['x-cache']).toBe('MISS');
    expect(secondResponse.headers['x-cache']).toBe('HIT');
    expect(firstResponse.body.totalItems).toBe(2);
    expect(typeof firstResponse.body.instanceId).toBe('string');
    expect(typeof firstResponse.body.serverTime).toBe('string');
    expect(typeof firstResponse.body.uptime).toBe('number');
    expect(typeof firstResponse.body.requestCount).toBe('number');
  });
});
