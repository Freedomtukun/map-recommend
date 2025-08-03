/**
 * 配置文件
 * 从环境变量读取敏感信息，避免硬编码
 */
module.exports = {
  // 高德地图 Web服务 API Key
  AMAP_KEY: process.env.AMAP_KEY || '',
  
  // 高德地图 API 配置
  AMAP_API: {
    // 周边搜索接口
    SEARCH_URL: 'https://restapi.amap.com/v3/place/around',
    // 搜索半径（米）
    RADIUS: 3000,
    // 返回结果数量
    LIMIT: 20,
    // 返回数据格式
    OUTPUT: 'JSON'
  },
  
  // 业务类型映射到高德 POI 分类
  BIZ_TYPE_MAP: {
    'yoga': '080601',         // 瑜伽馆
    'massage': '071400',      // 按摩店
    'coffee': '050500',       // 咖啡厅
    'gym': '080600',          // 健身场所
    'beauty': '071100',       // 美容美发
    'restaurant': '050000',   // 餐饮服务
    'hotel': '100000',        // 住宿服务
    'shopping': '060000'      // 购物服务
  }
};
