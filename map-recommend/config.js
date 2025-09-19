/**
 * 全局配置 & 环境变量读取
 */
const cfg = {
  /* ---------- 高德 ---------- */
  AMAP_KEY: process.env.AMAP_KEY,

  /* ---------- 混元 / LLM ---------- */
  HUNYUAN_API_KEY: process.env.HUNYUAN_API_KEY || '',
  HUNYUAN_ENDPOINT: process.env.HUNYUAN_ENDPOINT
    || 'https://api.hunyuan.cloud.tencent.com/v1/chat/completions',
  DEFAULT_MODEL: 'hunyuan-lite',

  /* ---------- 业务默认值 ---------- */
  DEFAULT_SEARCH_RADIUS: 3000,   // 半径 (m)
  DEFAULT_OFFSET: 20            // 返回条数
};

module.exports = cfg;
