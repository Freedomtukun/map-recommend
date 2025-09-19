/**
 * utils/reason.js
 * POI推荐理由生成器 - 支持规则版和LLM版
 */
const config = require('../config');
const logger = require('./logger');

/**
 * 规则版推荐理由生成（无需LLM，快速可靠）
 */
function buildReasonByRule(poi, userIntent = '瑜伽练习') {
  const parts = [];
  
  // 距离信息
  if (poi.distance && poi.distance < 5000) {
    const distanceKm = Math.round(poi.distance / 100) / 10; // 保留一位小数
    if (poi.distance <= 500) {
      parts.push(`步行可达 ${Math.round(poi.distance)}米`);
    } else if (poi.distance <= 2000) {
      parts.push(`距离约${distanceKm}公里`);
    } else {
      parts.push(`${distanceKm}公里内`);
    }
  }
  
  // 位置信息
  if (poi.adname && poi.adname !== poi.cityname) {
    parts.push(`位于${poi.adname}`);
  }
  
  // 评分信息
  if (poi.rating && parseFloat(poi.rating) > 0) {
    const rating = parseFloat(poi.rating);
    if (rating >= 4.5) {
      parts.push('高评分推荐');
    } else if (rating >= 4.0) {
      parts.push('口碑不错');
    }
  }
  
  // 根据用户意图添加适配性描述
  const intentMap = {
    '肩颈舒缓': '适合肩颈放松课程',
    '核心训练': '核心力量训练佳选',
    '冥想放松': '静心冥想好去处',
    '入门体验': '新手友好环境',
    '高温瑜伽': '专业热瑜伽体验',
    '阴瑜伽': '深度拉伸放松',
    '流瑜伽': '动态流畅练习',
    '瑜伽练习': '瑜伽练习优选'
  };
  
  const intentDesc = intentMap[userIntent] || `适合${userIntent}体验`;
  parts.push(intentDesc);
  
  // 组合成推荐语（控制在30字以内）
  let reason = parts.join(' · ');
  if (reason.length > 30) {
    // 如果太长，优先保留距离+意图
    reason = parts.slice(0, 1).concat([intentDesc]).join(' · ');
  }
  
  return reason;
}

/**
 * LLM版推荐理由生成（需要配置LLM服务）
 */
async function buildReasonByLLM(poi, userIntent = '瑜伽练习') {
  try {
    // 检查是否有可用的LLM配置
    const hasHunyuan = config.LLM_CONFIG?.HUNYUAN?.API_KEY;
    const hasOpenAI = config.LLM_CONFIG?.OPENAI?.API_KEY;
    
    if (!hasHunyuan && !hasOpenAI) {
      logger.warn('[Reason] 未配置LLM，使用规则版生成推荐理由');
      return buildReasonByRule(poi, userIntent);
    }
    
    // 尝试导入LLM调用模块
    let callLLM;
    try {
      callLLM = require('./call_llm');
    } catch (err) {
      logger.warn('[Reason] call_llm模块不可用，回退到规则版');
      return buildReasonByRule(poi, userIntent);
    }
    
    // 构建提示词
    const distanceText = poi.distance ? `距离${Math.round(poi.distance)}米` : '';
    const locationText = poi.adname ? `位于${poi.adname}` : '';
    const ratingText = poi.rating ? `评分${poi.rating}` : '';
    
    const prompt = `为瑜伽馆"${poi.name}"写一句15字以内的推荐理由。
场馆信息：${distanceText} ${locationText} ${ratingText}
用户需求：${userIntent}
要求：简洁有吸引力，突出适合该用户需求的特点。`;

    const llmResponse = await callLLM({
      system: '你是专业的瑜伽顾问，善于写简洁有力的推荐语。',
      user: prompt
    });
    
    // 清理和验证LLM响应
    let reason = llmResponse.trim();
    if (reason.length > 30) {
      reason = reason.substring(0, 30) + '...';
    }
    
    return reason || buildReasonByRule(poi, userIntent);
    
  } catch (err) {
    logger.error('[Reason] LLM生成失败，回退到规则版:', err.message);
    return buildReasonByRule(poi, userIntent);
  }
}

/**
 * 批量为POI列表生成推荐理由
 */
async function batchBuildReasons(pois, userIntent = '瑜伽练习', useLLM = false) {
  const results = await Promise.allSettled(
    pois.map(async (poi) => {
      try {
        if (useLLM) {
          poi.recommendReason = await buildReasonByLLM(poi, userIntent);
        } else {
          poi.recommendReason = buildReasonByRule(poi, userIntent);
        }
        return poi;
      } catch (err) {
        logger.warn(`[Reason] 为POI ${poi.id} 生成推荐理由失败:`, err.message);
        poi.recommendReason = buildReasonByRule(poi, userIntent);
        return poi;
      }
    })
  );
  
  // 返回处理后的POI列表
  return results.map(result => 
    result.status === 'fulfilled' ? result.value : result.reason
  );
}

/**
 * 根据训练序列推断用户意图
 */
function inferIntentFromSequence(sequenceType) {
  const sequenceIntentMap = {
    'neck-relief': '肩颈舒缓',
    'core-strength': '核心训练', 
    'meditation': '冥想放松',
    'beginner': '入门体验',
    'hot-yoga': '高温瑜伽',
    'yin-yoga': '阴瑜伽',
    'vinyasa': '流瑜伽',
    'flexibility': '柔韧性训练',
    'stress-relief': '压力释放',
    'balance': '平衡训练'
  };
  
  return sequenceIntentMap[sequenceType] || '瑜伽练习';
}

module.exports = {
  buildReasonByRule,
  buildReasonByLLM,
  batchBuildReasons,
  inferIntentFromSequence
};