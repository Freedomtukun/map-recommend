/**
 * LLM 推荐语生成
 * 调用现有的 callLLM 方法
 */

/**
 * 生成个性化推荐语
 * @param {Object} params - 生成参数
 * @param {string} params.bizType - 业务类型
 * @param {Array} params.pois - POI 列表（前3个）
 * @param {string} params.userId - 用户ID（可选）
 * @returns {string} 推荐语文案
 */
async function generateRecommendCopy({ bizType, pois, userId }) {
  try {
    // 构建商家信息摘要
    const poiSummary = pois.map((poi, index) => 
      `${index + 1}. ${poi.name}（距离${poi.distance}米）${poi.rating ? `，评分${poi.rating}` : ''}`
    ).join('\n');
    
    // 业务类型中文映射
    const bizTypeMap = {
      'yoga': '瑜伽馆',
      'massage': '按摩店',
      'coffee': '咖啡厅',
      'gym': '健身房',
      'beauty': '美容院',
      'restaurant': '餐厅',
      'hotel': '酒店',
      'shopping': '购物中心'
    };
    
    const bizTypeCN = bizTypeMap[bizType] || '商家';
    
    // 构建 prompt
    const systemPrompt = `你是一个贴心的生活助手，需要为用户推荐附近的${bizTypeCN}。
要求：
1. 语言亲切自然，像朋友聊天
2. 突出商家特色和距离优势
3. 字数控制在50-80字
4. 可以加入适当的emoji增加亲和力`;
    
    const userPrompt = `用户正在寻找附近的${bizTypeCN}，以下是附近的选择：
${poiSummary}

请生成一句吸引人的推荐语。`;
    
    // 调用 LLM（假设 callLLM 是全局可用的方法）
    const result = await callLLM({
      system: systemPrompt,
      user: userPrompt
    });
    
    return result || `发现附近有${pois.length}家优质${bizTypeCN}，快来看看吧！`;
    
  } catch (error) {
    console.error('生成推荐语失败：', error);
    // 返回默认文案
    return `附近有${pois.length}个不错的选择，点击查看详情～`;
  }
}

module.exports = {
  generateRecommendCopy
};