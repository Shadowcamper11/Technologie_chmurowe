const fs = require('fs');

function readTextFile(path) {
  try {
    return fs.readFileSync(path, 'utf8').trim();
  } catch (error) {
    return null;
  }
}

function readJsonFile(path) {
  try {
    const raw = fs.readFileSync(path, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    return {};
  }
}

function getSecret(name) {
  return readTextFile(`/run/secrets/${name}`);
}

function getAppConfig() {
  const configPath = process.env.APP_CONFIG_PATH || '/app/app.config.json';
  return readJsonFile(configPath);
}

function buildDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const user = getSecret('db_user') || process.env.POSTGRES_USER || 'product';
  const password = getSecret('db_password') || process.env.POSTGRES_PASSWORD || 'product';
  const host = process.env.POSTGRES_HOST || 'postgres';
  const port = process.env.POSTGRES_PORT || '5432';
  const database = process.env.POSTGRES_DB || 'product_dashboard';

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

module.exports = {
  buildDatabaseUrl,
  getAppConfig,
  getSecret,
};
