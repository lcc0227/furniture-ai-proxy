export default async function handler(req, res) {
  // 关键：对所有请求，强制加上跨域头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理预检请求（浏览器会先发送OPTIONS请求）
  if (req.method === 'OPTIONS') {
    return res.status(200).end('ok');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, msg: '仅支持POST请求' });
  }

  const VOLC_AK = process.env.VOLC_AK;
  const VOLC_SK = process.env.VOLC_SK;

  if (!VOLC_AK || !VOLC_SK) {
    return res.status(500).json({ success: false, msg: 'VOLC_AK 或 VOLC_SK 未配置' });
  }

  const { model, prompt, image_base64, strength, size } = req.body;
  if (!prompt || !image_base64) {
    return res.status(400).json({ success: false, msg: 'prompt 和 image_base64 不能为空' });
  }

  try {
    const response = await fetch('https://visual.volcengineapi.com/v1/seedream/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${VOLC_AK}:${VOLC_SK}`
      },
      body: JSON.stringify({
        model: model || 'seedream-5.0',
        prompt: prompt,
        negative_prompt: '模糊，变形，低质量，多余物体',
        image_base64: image_base64,
        strength: strength || 0.38,
        size: size || '1024x1024'
      })
    });

    const data = await response.json();
    console.log('火山引擎返回:', data);

    if (data?.data?.image_base64) {
      return res.status(200).json({
        success: true,
        img: `data:image/png;base64,${data.data.image_base64}`
      });
    } else {
      return res.status(400).json({
        success: false,
        msg: data?.message || '生成失败，接口未返回图片'
      });
    }
  } catch (err) {
    console.error('请求错误:', err);
    return res.status(500).json({ success: false, msg: '服务器错误：' + err.message });
  }
}
