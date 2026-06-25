require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  affordmedApiUrl: process.env.AFFORDMED_API_URL || 'https://test-server-r7km.onrender.com',
  clientId: process.env.CLIENT_ID || '',
  clientSecret: process.env.CLIENT_SECRET || '',
  bearerToken: process.env.BEARER_TOKEN || ''
};
