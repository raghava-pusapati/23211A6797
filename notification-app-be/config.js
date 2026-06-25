require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  affordmedApi: {
    baseUrl: process.env.AFFORDMED_API_URL || 'http://4.224.186.213',
    endpoints: {
      notifications: '/evaluation-service/notifications',
      auth: '/evaluation-service/auth',
      logs: '/evaluation-service/logs'
    }
  },
  auth: {
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    bearerToken: process.env.BEARER_TOKEN
  }
};
