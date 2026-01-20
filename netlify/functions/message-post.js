const fs = require('fs').promises;
const path = require('path');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ success: false, message: '方法不允许' }) };
  }

  try {
    const messageData = JSON.parse(event.body);
    
    if (!messageData.userId || !messageData.username) {
      return { statusCode: 400, body: JSON.stringify({ success: false, message: '缺少必要字段' }) };
    }
    
    const siteDataDir = path.join(process.cwd(), 'site-data');
    try { await fs.access(siteDataDir); } catch { await fs.mkdir(siteDataDir, { recursive: true }); }
    
    const messagesPath = path.join(siteDataDir, 'messages.json');
    let messages = [];
    
    try {
      const data = await fs.readFile(messagesPath, 'utf8');
      messages = JSON.parse(data);
      if (!Array.isArray(messages)) messages = [];
    } catch { messages = []; }
    
    if (!messageData.id) {
      messageData.id = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      messageData.timestamp = new Date().toISOString();
      if (!messageData.replies) messageData.replies = [];
      messages.unshift(messageData);
    } else {
      const parentIndex = messages.findIndex(msg => msg.id === messageData.parentId);
      if (parentIndex !== -1) {
        if (!messages[parentIndex].replies) messages[parentIndex].replies = [];
        messages[parentIndex].replies.push({
          id: 'reply_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
          userId: messageData.userId,
          username: messageData.username,
          avatar: messageData.avatar || '',
          content: messageData.content,
          timestamp: new Date().toISOString()
        });
      } else {
        return { statusCode: 404, body: JSON.stringify({ success: false, message: '未找到留言' }) };
      }
    }
    
    await fs.writeFile(messagesPath, JSON.stringify(messages, null, 2), 'utf8');
    return { statusCode: 200, body: JSON.stringify({ success: true, messageId: messageData.id }) };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ success: false, message: '发布失败' }) };
  }
};