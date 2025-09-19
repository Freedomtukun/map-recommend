/**
 * 腾讯混元 / OpenAI 调用封装（axios 直调版）
 */
const axios = require('axios');
const config = require('../config');

async function callLLM({ system, user }) {
  const { data } = await axios.post(
    config.HUNYUAN_ENDPOINT,
    {
      model: config.DEFAULT_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ]
    },
    { headers: { Authorization: `Bearer ${config.HUNYUAN_API_KEY}` } }
  );

  return data.choices?.[0]?.message?.content?.trim() || '';
}

module.exports = callLLM;   // 默认导出
