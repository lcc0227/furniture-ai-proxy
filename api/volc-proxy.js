export default async function handler(req, res) {
  // 关键：处理跨域
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const VOLC_AK = process.env.VOLC_AK;
  const VOLC_SK = process.env.VOLC_SK;

  if (!VOLC_AK || !VOLC_SK) {
    return res.status(500).json({ success: false, msg: '密钥未配置' });
  }

  const { model, prompt, negative_prompt, image_base64, strength, size } = req.body;

  try {
    const response = await fetch('https://visual.volcengineapi.com/v1/seedream/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${VOLC_AK}:${VOLC_SK}`
      },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        negative_prompt: negative_prompt || '',
        image_base64: image_base64,
        strength: strength || 0.38,
        size: size || '1024x1024'
      })
    });

    const data = await response.json();
    if (data.data && data.data.image_base64) {
      return res.status(200).json({
        success: true,
        img: `data:image/png;base64,${data.data.image_base64}`
      });
    } else {
      return res.status(400).json({ success: false, msg: data.message || '生成失败' });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, msg: '接口请求错误' });
  }
}
