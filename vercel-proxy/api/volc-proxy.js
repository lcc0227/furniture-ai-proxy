export default async function handler(req, res) {
  // 处理跨域
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  // 从环境变量读取密钥（后面在Vercel里填）
  const VOLC_AK = process.env.VOLC_AK;
  const VOLC_SK = process.env.VOLC_SK;

  if (!VOLC_AK || !VOLC_SK) {
    return res.status(500).json({ success: false, msg: '密钥未配置' });
  }

  const { model, prompt, negative_prompt, image_base64, strength, size } = req.body;

  try {
    const response = await fetch('https://visual.volcengineapi.com/v1/seedream/img2img', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${VOLC_AK}:${VOLC_SK}`
      },
      body: JSON.stringify({
        model,
        prompt,
        negative_prompt,
        images: [image_base64],
        strength,
        size,
        watermark: false
      })
    });

    const data = await response.json();
    return res.status(200).json({
      success: true,
      img: data.data?.images?.[0] || '',
      msg: ''
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, msg: '接口请求失败' });
  }
}