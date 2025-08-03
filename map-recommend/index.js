/**
 * 云函数主入口
 * 接收参数：lat（纬度）、lng（经度）、bizType（业务类型）、userId（用户ID）
 * 返回：POI列表 + 个性化推荐语
 */
const { searchNearby } = require('./utils/amap');
const { generateRecommendCopy } = require('./utils/llm');

// 云函数入口
exports.main = async (event, context) => {
  try {
    // 解析请求参数
    const { lat, lng, bizType = 'coffee', userId } = event;
    
    // 参数校验
    if (!lat || !lng) {
      return {
        code: 400,
        message: '缺少必要参数：经纬度信息',
        data: null
      };
    }
    
    // 查询附近商家
    console.log(`开始查询附近的 ${bizType}，坐标：${lat},${lng}`);
    const pois = await searchNearby({
      location: `${lng},${lat}`, // 高德使用 经度,纬度 格式
      bizType
    });
    
    // 生成推荐语
    let copy = '';
    if (pois && pois.length > 0) {
      console.log(`找到 ${pois.length} 个商家，开始生成推荐语`);
      copy = await generateRecommendCopy({
        bizType,
        pois: pois.slice(0, 3), // 只传前3个商家给 LLM
        userId
      });
    }
    
    // 返回结果
    return {
      code: 200,
      message: 'success',
      data: {
        pois,
        copy,
        total: pois.length
      }
    };
    
  } catch (error) {
    console.error('云函数执行错误：', error);
    return {
      code: 500,
      message: error.message || '服务器内部错误',
      data: null
    };
  }
};