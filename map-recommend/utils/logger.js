/**
 * utils/logger.js
 * 简单日志器实现 - 支持按级别输出
 */
const config = require('../config');

const LOG_LEVELS = {
  debug: 0,
  info: 1, 
  warn: 2,
  error: 3
};

const LEVEL_COLORS = {
  debug: '\x1b[36m', // 青色
  info: '\x1b[32m',  // 绿色
  warn: '\x1b[33m',  // 黄色
  error: '\x1b[31m'  // 红色
};

const RESET_COLOR = '\x1b[0m';

function shouldLog(level) {
  const currentLevel = config.LOG_LEVEL || 'info';
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatMessage(level, prefix, ...args) {
  const timestamp = new Date().toISOString();
  const color = LEVEL_COLORS[level] || '';
  const levelTag = `[${level.toUpperCase()}]`;
  const prefixTag = prefix ? `[${prefix}]` : '';
  
  // 在云函数环境中可能不支持颜色，所以做兼容处理
  const useColor = process.env.NODE_ENV !== 'production';
  
  if (useColor) {
    return [`${color}${timestamp} ${levelTag}${RESET_COLOR}${prefixTag}`, ...args];
  } else {
    return [`${timestamp} ${levelTag}${prefixTag}`, ...args];
  }
}

const logger = {
  debug: (prefix, ...args) => {
    if (shouldLog('debug')) {
      if (typeof prefix === 'string' && !prefix.startsWith('[')) {
        console.log(...formatMessage('debug', null, prefix, ...args));
      } else {
        console.log(...formatMessage('debug', prefix, ...args));
      }
    }
  },
  
  info: (prefix, ...args) => {
    if (shouldLog('info')) {
      if (typeof prefix === 'string' && !prefix.startsWith('[')) {
        console.log(...formatMessage('info', null, prefix, ...args));
      } else {
        console.log(...formatMessage('info', prefix, ...args));
      }
    }
  },
  
  warn: (prefix, ...args) => {
    if (shouldLog('warn')) {
      if (typeof prefix === 'string' && !prefix.startsWith('[')) {
        console.warn(...formatMessage('warn', null, prefix, ...args));
      } else {
        console.warn(...formatMessage('warn', prefix, ...args));
      }
    }
  },
  
  error: (prefix, ...args) => {
    if (shouldLog('error')) {
      if (typeof prefix === 'string' && !prefix.startsWith('[')) {
        console.error(...formatMessage('error', null, prefix, ...args));
      } else {
        console.error(...formatMessage('error', prefix, ...args));
      }
    }
  }
};

// 兼容原有的调用方式 logger.info('[Main] Req', event)
module.exports = logger;