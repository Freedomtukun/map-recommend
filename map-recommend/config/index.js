'use strict';

// 从环境变量读取配置
const AMAP_KEY = process.env.AMAP_KEY || '';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info'; // debug|info|warn|error
const DEFAULT_RADIUS_M = process.env.DEFAULT_RADIUS_M || 3000;

module.exports = {
  AMAP_KEY,
  LOG_LEVEL,
  DEFAULT_RADIUS_M,
};