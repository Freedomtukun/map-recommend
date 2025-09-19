'use strict';

const https = require('https');

/**
 * 构建查询字符串
 */
function buildQueryString(params) {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');
}

/**
 * HTTPS GET 请求并解析 JSON
 */
function httpGetJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let raw = '';
      res.on('data', chunk => (raw += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(raw);
          resolve(json);
        } catch (e) {
          reject(new Error(`Response parse error: ${e.message}, raw: ${raw.slice(0, 200)}`));
        }
      });
    }).on('error', (err) => {
      reject(new Error(`HTTP request failed: ${err.message}`));
    });
  });
}

/**
 * 高德地图周边搜索
 */
async function searchAround(options) {
  const { key, lat, lng, radius, locale, bizType, enableReasons } = options;
  
  // 验证必需参数
  if (!key) throw new Error('Missing AMAP_KEY');
  if (!lat || !lng) throw new Error('Missing lat/lng');
  
  // 构建搜索关键词
  let keywords = '';
  let types = '';
  
  // 根据业务类型设置搜索参数
  if (bizType === 'yoga' || bizType === '瑜伽') {
    // 瑜伽场馆搜索：使用多个关键词提高召回率
    keywords = locale === 'zh' 
      ? '瑜伽|瑜珈|yoga|瑜伽馆|瑜伽会所|瑜伽工作室' 
      : 'yoga|yoga studio|yoga center|pilates';
    types = ''; // 不限制类型，让关键词发挥作用
  } else {
    // 其他类型直接使用 bizType 作为关键词
    keywords = bizType;
    types = '';
  }
  
  // 构建请求参数
  const params = {
    key,
    location: `${lng},${lat}`, // 注意：高德要求 lng,lat 顺序
    radius: radius || 3000,
    offset: 20,
    page: 1,
    keywords,
    types,
    extensions: 'all', // 返回详细信息
    output: 'json',
  };
  
  // 发起请求
  const url = `https://restapi.amap.com/v3/place/around?${buildQueryString(params)}`;
  console.log('[DEBUG] AMap request URL:', url);
  
  const data = await httpGetJSON(url);
  
  // 错误处理
  if (!data || data.status !== '1') {
    const errorInfo = data ? (data.info || data.infocode || 'Unknown error') : 'No response';
    throw new Error(`AMap API error: ${errorInfo}`);
  }
  
  // 解析 POI 数据
  const pois = Array.isArray(data.pois) ? data.pois : [];
  
  // 格式化返回数据
  const formattedPois = pois.map(poi => ({
    id: poi.id,
    name: poi.name,
    type: poi.type,
    typecode: poi.typecode,
    address: poi.address || '',
    location: poi.location, // "lng,lat" 格式
    tel: poi.tel || '',
    cityname: poi.cityname || '',
    adname: poi.adname || '',
    distance: poi.distance ? Number(poi.distance) : undefined,
    rating: poi.biz_ext?.rating || undefined,
    cost: poi.biz_ext?.cost || undefined,
    photos: Array.isArray(poi.photos) 
      ? poi.photos.map(photo => photo.url).filter(Boolean).slice(0, 3)
      : [],
  }));
  
  // 生成推荐理由（如果需要）
  let reasons = undefined;
  if (enableReasons && formattedPois.length > 0) {
    reasons = formattedPois.slice(0, 3).map((poi, index) => {
      const distanceText = poi.distance != null ? `，距离约 ${poi.distance} 米` : '';
      const ratingText = poi.rating ? `，评分 ${poi.rating}` : '';
      const addressText = poi.address ? `，位于${poi.address}` : '';
      return `推荐${index + 1}：${poi.name}${distanceText}${ratingText}${addressText}`;
    });
  }
  
  return {
    pois: formattedPois,
    reasons,
    total: formattedPois.length,
  };
}

/**
 * 文本搜索（预留接口）
 */
async function searchText(options) {
  // 预留实现，避免调用报错
  return { pois: [], total: 0 };
}

// 显式导出，确保函数可被正确引用
module.exports = {
  searchAround,
  searchText,
  buildQueryString,
  httpGetJSON,
};