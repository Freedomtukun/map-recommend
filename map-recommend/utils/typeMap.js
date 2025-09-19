'use strict';

/**
 * 路由类型归一化
 * 将各种输入统一到 'map-recommend' 或 'yoga'
 */
function normalizeType(input) {
  const s = String(input || '').trim().toLowerCase();
  
  // 空值默认返回 map-recommend
  if (!s) return 'map-recommend';
  
  // 精确匹配映射表
  const typeMap = {
    // map-recommend 路由
    'map': 'map-recommend',
    'map-recommend': 'map-recommend',
    '地图': 'map-recommend',
    'poi': 'map-recommend',
    
    // yoga 路由
    'yoga': 'yoga',
    'pose': 'yoga',
    '瑜伽': 'yoga',
    '瑜珈': 'yoga',
    'yujia': 'yoga',
    '瑜伽馆': 'yoga',
    '瑜珈馆': 'yoga',
  };
  
  // 优先精确匹配
  if (typeMap[s]) {
    return typeMap[s];
  }
  
  // 模糊匹配：包含关键词
  if (s.includes('map') || s.includes('地图') || s.includes('poi')) {
    return 'map-recommend';
  }
  
  if (s.includes('yoga') || s.includes('瑜') || s.includes('pose')) {
    return 'yoga';
  }
  
  // 默认返回 map-recommend
  return 'map-recommend';
}

/**
 * 业务关键词归一化（用于高德地图搜索）
 */
function normalizeBizType(input, locale = 'zh') {
  const raw = String(input || '').trim().toLowerCase();
  
  // 默认值
  if (!raw) return locale === 'zh' ? '瑜伽' : 'yoga';
  
  // 瑜伽相关的归一化
  const yogaVariants = new Set([
    'yoga', 'pose', 'yujia',
    '瑜伽', '瑜珈', '瑜伽馆', '瑜珈馆', '瑜伽馆yoga'
  ]);
  
  if (yogaVariants.has(raw) || raw.includes('瑜') || raw.includes('yoga')) {
    // 根据语言返回合适的搜索关键词
    return locale === 'zh' ? '瑜伽' : 'yoga';
  }
  
  // 其他业务类型直接返回原值
  return raw;
}

/**
 * 语言归一化
 */
function toLocale(input) {
  const v = String(input || '').trim().toLowerCase();
  
  // 中文相关
  if (v.startsWith('zh') || v === 'cn' || v === 'chinese') {
    return 'zh';
  }
  
  // 默认英文
  return 'en';
}

module.exports = {
  normalizeType,
  normalizeBizType,
  toLocale,
};