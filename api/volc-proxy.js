import { visual } from '@volcengine/openapi';

export default async function handler(req, res) {
    // 1. 处理跨域
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method !== 'POST') return res.status(405).json({ msg: '仅支持 POST 请求' });

    // 2. 检查环境变量 (从 Vercel Dashboard 配置)
    const { VOLC_AK, VOLC_SK } = process.env;
    if (!VOLC_AK || !VOLC_SK) {
        return res.status(500).json({ success: false, msg: '服务器未配置 API 密钥 (AK/SK)' });
    }

    // 3. 初始化官方 SDK
    const visualService = new visual.VisualService({
        accessKeyId: VOLC_AK,
        secretAccessKey: VOLC_SK,
        region: 'cn-north-1', // 默认华北区域
        host: 'visual.volcengineapi.com',
    });

    const { prompt, negative_prompt, image_base64, strength } = req.body;

    try {
        // 4. 调用图生图接口 (CV_IMG2IMG)
        const params = {
            req_key: 'community_resigen', // 根据具体模型需求可能需要调整
            prompt: prompt,
            negative_prompt: negative_prompt || '模糊，变形，低质量',
            binary_data_base64: [image_base64],
            strength: parseFloat(strength) || 0.4,
        };

        const result = await visualService.CVImg2Img(params);

        // 5. 增强错误排查：检查返回体
        if (result.ResponseMetadata && result.ResponseMetadata.Error) {
            console.error('火山引擎原始错误:', result.ResponseMetadata.Error);
            return res.status(200).json({ 
                success: false, 
                msg: `火山接口报错: ${result.ResponseMetadata.Error.Message}` 
            });
        }

        if (result.data && result.data.image_urls && result.data.image_urls[0]) {
            return res.status(200).json({
                success: true,
                img: result.data.image_urls[0], // 返回生成的图片链接或base64
                msg: '生成成功'
            });
        }

        return res.status(200).json({ success: false, msg: '接口未返回图片数据' });

    } catch (err) {
        console.error('SDK 调用异常:', err);
        return res.status(500).json({ success: false, msg: '后端服务异常: ' + err.message });
    }
}
