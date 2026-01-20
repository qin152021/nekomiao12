const fs = require('fs').promises;
const path = require('path');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ success: false, message: '方法不允许' }) };
  }

  try {
    const { password, data } = JSON.parse(event.body);
    const correctPassword = process.env.SITE_ADMIN_PASSWORD;
    
    if (!correctPassword) {
      return { statusCode: 500, body: JSON.stringify({ success: false, message: '服务器未配置密码' }) };
    }
    
    if (password !== correctPassword) {
      return { statusCode: 401, body: JSON.stringify({ success: false, message: '密码错误' }) };
    }
    
    const siteDataDir = path.join(process.cwd(), 'site-data');
    try { await fs.access(siteDataDir); } catch { await fs.mkdir(siteDataDir, { recursive: true }); }
    
    const configPath = path.join(siteDataDir, 'config.json');
    await fs.writeFile(configPath, JSON.stringify(data, null, 2), 'utf8');
    
    return { statusCode: 200, body: JSON.stringify({ success: true, message: '保存成功' }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ success: false, message: '保存失败' }) };
  }
};