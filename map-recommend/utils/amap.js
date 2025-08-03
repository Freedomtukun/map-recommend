/**
 * 高德地图 API 封装
 * 使用 axios + qs 发送 HTTP 请求
 */
const axios = require('axios');
const qs = require('qs');
const config = require('../config');

/**
 * 搜索附近商家
 * @param {Object} params - 搜索参数
 * @param {string} params.location - 中心点坐标，格式：经度,纬度
 * @param {string} params.bizType - 业务类型（yoga/massage/coffee等）
 * @returns {Array} POI列表
 */
async function searchNearby({ location, bizType }) {
  try {
    // 获取 POI 类型编码
    const types = config.BIZ_TYPE_MAP[bizType] || config.BIZ_TYPE_MAP['coffee'];
    
    // 构建请求参数
    const params = {
      key: config.AMAP_KEY,
      location: location,
      radius: config.AMAP_API.RADIUS,
      types: types,
      offset: config.AMAP_API.LIMIT,
      output: config.AMAP_API.OUTPUT,
      extensions: 'all' // 返回详细信息
    };
    
    // 发送请求（高德 API 需要 query string 格式）
    const url = `${config.AMAP_API.SEARCH_URL}?${qs.stringify(params)}`;
    console.log('请求高德 API：', url.replace(config.AMAP_KEY, '***'));
    
    const response = await axios.get(url);
    const data = response.data;
    
    // 错误处理
    if (data.status !== '1') {
      throw new Error(`高德 API 错误：${data.info || '未知错误'}`);
    }
    
    // 格式化返回数据
    const pois = (data.pois || []).map(poi => ({
      id: poi.id,
      name: poi.name,
      type: poi.type,
      typecode: poi.typecode,
      address: poi.address,
      location: poi.location, // 格式：经度,纬度
      tel: poi.tel,
      distance: parseInt(poi.distance), // 距离（米）
      rating: poi.biz_ext?.rating || '', // 评分
      cost: poi.biz_ext?.cost || '', // 人均消费
      photos: poi.photos?.map(p => p.url) || [] // 图片列表
    }));
    
    return pois;
    
  } catch (error) {
    console.error('高德 API 调用失败：', error.message);
    // 返回空数组而不是抛出错误，让上层决定如何处理
    return [];
  }
}

module.exports = {
  searchNearby
};