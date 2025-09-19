'use strict';

const { AMAP_KEY, DEFAULT_RADIUS_M, LOG_LEVEL } = require('./config');
const { normalizeType, normalizeBizType, toLocale } = require('./utils/typeMap');
const { searchAround } = require('./utils/amap');

const log = (level, ...args) => {
  const allow = { debug: 0, info: 1, warn: 2, error: 3 };
  const cur = allow[LOG_LEVEL || 'info'] ?? 1;
  const lvl = allow[level] ?? 1;
  if (lvl >= cur) console[level === 'debug' ? 'log' : level](`[${level.toUpperCase()}]`, ...args);
};

exports.main = async (event = {}) => {
  try {
    // === 参数解析入口 ===
    let params = {};
    const isHttp = event && (event.httpMethod || event.path);

    if (isHttp) {
      // 合并 query 与 body（body 覆盖 query）
      const query = event.queryStringParameters || {};
      let body = {};
      try {
        body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : (event.body || {});
      } catch (_) { body = {}; }
      params = { ...query, ...body };
    } else if (typeof event === 'string') {
      params = JSON.parse(event || '{}');
    } else {
      params = event || {};
    }

    // === 经纬度归一化 ===
    const latNum =
      Number(params.lat ?? params.latitude ?? params?.location?.lat ?? params?.location?.latitude ?? params?.coords?.lat);
    const lngNum =
      Number(params.lng ?? params.lon ?? params.longitude ?? params?.location?.lng ?? params?.location?.longitude ?? params?.coords?.lng);

    const {
      type: rawType,
      bizType: rawBizType,
      radius,
      enableReasons,
      locale: rawLocale,
    } = params;

    // === 归一化逻辑 ===
    const type = normalizeType(rawType || rawBizType || 'map-recommend');
    const locale = toLocale(rawLocale);
    const bizType = normalizeBizType(rawBizType || rawType || 'yoga', locale);
    const searchRadius = Number(radius) > 0 ? Number(radius) : (DEFAULT_RADIUS_M || 3000);

    log('info', '[[Main] Normalized]', { type, bizType, lat: latNum, lng: lngNum, radius: searchRadius, enableReasons, locale });

    // === 参数校验 ===
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
      return { code: 400, message: '缺少必需参数: lat/lng', data: null };
    }

    if (!AMAP_KEY) {
      log('error', 'AMAP_KEY not configured in environment variables');
      return { code: 500, message: 'AMAP_KEY 未配置', data: null };
    }

    // === 调用 AMap 搜索 ===
    log('debug', '[[Main] Calling searchAround with params:', {
      key: AMAP_KEY ? 'configured' : 'missing',
      lat: latNum,
      lng: lngNum,
      radius: searchRadius,
      locale,
      bizType,
      enableReasons: Boolean(enableReasons),
    });

    const searchResult = await searchAround({
      key: AMAP_KEY,
      lat: latNum,
      lng: lngNum,
      radius: searchRadius,
      locale,
      bizType,
      enableReasons: Boolean(enableReasons),
    });

    log('info', `[[Main] Search completed, found ${searchResult.pois?.length || 0} POIs]`);
    return { code: 200, message: 'success', data: searchResult };

  } catch (err) {
    log('error', '[[Main] Error]', err.message, err.stack);
    return { code: 500, message: err.message || 'Internal Error', data: null };
  }
};