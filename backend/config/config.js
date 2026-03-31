require('dotenv').config({ path: '../.env' });

module.exports = {
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    name: process.env.DB_NAME || 'icnp_db',
    user: process.env.DB_USER || 'icnp_user',
    password: process.env.DB_PASSWORD || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  port: parseInt(process.env.PORT, 10) || 5000,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};
