const fs = require('fs').promises;
const path = require('path');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ success: false, message: '方法不允许' }) };
  }

  try {
    const { password, messageId } = JSON.parse(event.body);
    const correctPassword = process.env.SITE_ADMIN_PASSWORD;
    
    if (!correctPassword) {
      return { statusCode: 500, body: JSON.stringify({ success: false, message: '服务器未配置密码' }) };
    }
    
    if (password !== correctPassword) {
      return { statusCode: 401, body: JSON.stringify({ success: false, message: '密码错误' }) };
    }
    
    if (!messageId) {
      return { statusCode: 400, body: JSON.stringify({ success: false, message: '缺少留言ID' }) };
    }
    
    const messagesPath = path.join(process.cwd(), 'site-data', 'messages.json');
    let messages = [];
    
    try {
      const data = await fs.readFile(messagesPath, 'utf8');
      messages = JSON.parse(data);
      if (!Array.isArray(messages)) messages = [];
    } catch {
      return { statusCode: 404, body: JSON.stringify({ success: false, message: '留言文件不存在' }) };
    }
    
    const initialLength = messages.length;
    messages = messages.filter(msg => msg.id !== messageId);
    
    if (messages.length === initialLength) {
      return { statusCode: 404, body: JSON.stringify({ success: false, message: '未找到留言' }) };
    }
    
    await fs.writeFile(messagesPath, JSON.stringify(messages, null, 2), 'utf8');
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ success: false, message: '删除失败' }) };
  }
};