const axios = require('axios');

let config = {
  loggingServerUrl: process.env.LOGGING_SERVER_URL || 'http://4.224.186.213',
  bearerToken: process.env.BEARER_TOKEN || '',
  maxRetries: 3,
  retryDelay: 1000,
  enabled: true
};

function configure(options) {
  config = { ...config, ...options };
}

async function Log(stack, level, packageName, message) {
  if (!config.enabled) return;

  const validStacks = ['backend', 'frontend'];
  const validLevels = ['debug', 'info', 'warn', 'error', 'fatal'];
  
  if (!validStacks.includes(stack.toLowerCase())) {
    console.error(`Invalid stack: ${stack}`);
    return;
  }
  
  if (!validLevels.includes(level.toLowerCase())) {
    console.error(`Invalid level: ${level}`);
    return;
  }

  const logData = {
    stack: stack.toLowerCase(),
    level: level.toLowerCase(),
    package: packageName.toLowerCase(),
    message
  };

  let attempt = 0;
  
  while (attempt < config.maxRetries) {
    try {
      await axios.post(
        `${config.loggingServerUrl}/evaluation-service/logs`,
        logData,
        {
          headers: {
            'Authorization': `Bearer ${config.bearerToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );
      return;
    } catch (error) {
      attempt++;
      
      if (attempt >= config.maxRetries) {
        console.error('Log send failed:', {
          ...logData,
          error: error.message
        });
        return;
      }
      
      await new Promise(resolve => 
        setTimeout(resolve, config.retryDelay * Math.pow(2, attempt - 1))
      );
    }
  }
}

const logger = {
  info: (stack, pkg, msg) => Log(stack, 'info', pkg, msg),
  error: (stack, pkg, msg) => Log(stack, 'error', pkg, msg),
  warn: (stack, pkg, msg) => Log(stack, 'warn', pkg, msg),
  debug: (stack, pkg, msg) => Log(stack, 'debug', pkg, msg),
  fatal: (stack, pkg, msg) => Log(stack, 'fatal', pkg, msg)
};

module.exports = { Log, configure, logger };
