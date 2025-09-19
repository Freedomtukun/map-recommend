/**
 * 生成单条推荐语
 */
const callLLM = require('./call_llm');

const SYSTEM_PROMPT =
  '你是一名友好的本地向导，请根据商家信息，用一句轻松、有温度的中文推荐语吸引用户。';

async function generateRecommendCopy(poi) {
  const userPrompt =
    `店名「${poi.name}」，离用户 ${poi.distance} 米，请生成一句推荐语（20字以内）。`;

  try {
    return await callLLM({ system: SYSTEM_PROMPT, user: userPrompt });
  } catch (err) {
    console.error('[LLM] 调用失败：', err.message);
    return `推荐 ${poi.name}，距离仅${poi.distance}米，值得一试！`;
  }
}

module.exports = generateRecommendCopy;
