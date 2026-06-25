const axios = require('axios');

// Configuration
let config = {
  loggingServerUrl: process.env.LOGGING_SERVER_URL || 'http://4.224.186.213',
  bearerToken: process.env.BEARER_TOKEN || '',
  maxRetries: 3,
  retryDelay: 1000,
  enabled: true
};

/**
 * Configure the logging middleware
 * @param {Object} options - Configuration options
 */
function configure(options) {
  config = { ...config, ...options };
}

/**
 * Main logging function
 * @param {string} stack - Application stack (e.g., 'backend', 'frontend')
 * @param {string} level - Log level ('info', 'error', 'warn', 'debug', 'fatal')
 * @param {string} packageName - Package or module name
 * @param {string} message - Log message
 * @returns {Promise<void>}
 */
async function Log(stack, level, packageName, message) {
  if (!config.enabled) {
    return;
  }

  // Validate parameters are lowercase
  const validStacks = ['backend', 'frontend'];
  const validLevels = ['debug', 'info', 'warn', 'error', 'fatal'];
  
  if (!validStacks.includes(stack.toLowerCase())) {
    console.error(`Invalid stack: ${stack}. Must be 'backend' or 'frontend'`);
    return;
  }
  
  if (!validLevels.includes(level.toLowerCase())) {
    console.error(`Invalid level: ${level}. Must be one of: ${validLevels.join(', ')}`);
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
        // Fallback to console in production so logs aren't lost
        console.error('Failed to send log after retries:', {
          ...logData,
          error: error.message
        });
        return;
      }
      
      // Wait before retry with exponential backoff
      await new Promise(resolve => 
        setTimeout(resolve, config.retryDelay * Math.pow(2, attempt - 1))
      );
    }
  }
}

/**
 * Convenience methods for different log levels
 */
const logger = {
  info: (stack, packageName, message) => Log(stack, 'info', packageName, message),
  error: (stack, packageName, message) => Log(stack, 'error', packageName, message),
  warn: (stack, packageName, message) => Log(stack, 'warn', packageName, message),
  debug: (stack, packageName, message) => Log(stack, 'debug', packageName, message),
  fatal: (stack, packageName, message) => Log(stack, 'fatal', packageName, message)
};

module.exports = {
  Log,
  configure,
  logger
};
