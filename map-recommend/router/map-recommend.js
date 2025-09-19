/**
 * router/map-recommend.js
 * 地图推荐路由处理器 - 增强版（含推荐理由生成）
 */
const { searchAround } = require('../utils/amap');
const { batchBuildReasons, inferIntentFromSequence } = require('../utils/reason');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * 处理地图推荐请求
 */
async function handleMapRecommend(event) {
  try {
    // 兼容不同的参数格式
    const { 
      lat, lng, latitude, longitude, 
      type, bizType, category, 
      radius, 
      userIntent, sequenceType,  // 新增：用户意图和训练序列类型
      enableReasons = true,      // 新增：是否生成推荐理由
      useLLM = false            // 新增：是否使用LLM生成（默认使用规则版）
    } = event;
    
    // 参数标准化
    const standardLat = lat || latitude;
    const standardLng = lng || longitude;
    const standardBizType = bizType || type || category || 'yoga';
    const standardRadius = radius || config.AMAP_RADIUS_DEFAULT;

    // 参数验证
    if (typeof standardLat !== 'number' || typeof standardLng !== 'number') {
      return { 
        code: 400, 
        message: 'Missing/invalid lat or lng parameters',
        data: null,
        debug: { receivedLat: standardLat, receivedLng: standardLng }
      };
    }

    // 坐标范围检查
    if (standardLat < -90 || standardLat > 90 || standardLng < -180 || standardLng > 180) {
      return { 
        code: 400, 
        message: 'Invalid coordinate range',
        data: null 
      };
    }

    logger.info(`[MapRecommend] 搜索请求: ${standardBizType} @${standardLat},${standardLng} radius=${standardRadius}m`);

    // 🔥 核心搜索：调用修复后的 searchAround
    const pois = await searchAround(standardLat, standardLng, standardBizType, standardRadius);

    logger.info(`[MapRecommend] 搜索完成: 找到 ${pois.length} 个POI`);

    // 🆕 推荐理由生成
    let finalPois = pois;
    if (enableReasons && pois.length > 0) {
      // 推断用户意图
      const inferredIntent = sequenceType ? 
        inferIntentFromSequence(sequenceType) : 
        (userIntent || '瑜伽练习');
        
      logger.debug(`[MapRecommend] 生成推荐理由，用户意图: ${inferredIntent}`);
      
      // 批量生成推荐理由（控制超时时间）
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('推荐理由生成超时')), 5000)
        );
        
        const reasonPromise = batchBuildReasons(pois, inferredIntent, useLLM);
        
        finalPois = await Promise.race([reasonPromise, timeoutPromise]);
        logger.info(`[MapRecommend] 推荐理由生成完成`);
      } catch (reasonError) {
        logger.warn(`[MapRecommend] 推荐理由生成失败: ${reasonError.message}`);
        // 失败时保持原始POI数据
        finalPois = pois;
      }
    }

    // 返回结果
    const response = {
      code: 200,
      message: 'success',
      data: {
        pois: finalPois,
        searchParams: {
          lat: standardLat,
          lng: standardLng,
          bizType: standardBizType,
          radius: standardRadius,
          userIntent: userIntent || (sequenceType ? inferIntentFromSequence(sequenceType) : null)
        },
        total: finalPois.length,
        hasReasons: enableReasons && finalPois.some(poi => poi.recommendReason)
      }
    };

    return response;

  } catch (err) {
    logger.error('[MapRecommend] Error:', err);
    
    // 详细错误信息（开发环境）
    if (config.LOG_LEVEL === 'debug') {
      return {
        code: 500,
        message: 'Internal server error',
        data: null,
        debug: {
          error: err.message,
          stack: err.stack
        }
      };
    }

    return {
      code: 500,
      message: 'Internal server error',
      data: null
    };
  }
}

/**
 * 简化版处理器（兼容旧版本调用）
 */
async function handleMapRecommendSimple(lat, lng, bizType = 'yoga', radius) {
  return handleMapRecommend({
    lat, lng, bizType, radius,
    enableReasons: false  // 简化版不生成推荐理由
  });
}

module.exports = { 
  handleMapRecommend,
  handleMapRecommendSimple
};