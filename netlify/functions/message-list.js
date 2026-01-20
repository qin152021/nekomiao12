const fs = require('fs').promises;
const path = require('path');

exports.handler = async function(event, context) {
  try {
    const messagesPath = path.join(process.cwd(), 'site-data', 'messages.json');
    try {
      const data = await fs.readFile(messagesPath, 'utf8');
      return { statusCode: 200, body: JSON.stringify({ success: true, messages: JSON.parse(data) }) };
    } catch {
      return { statusCode: 200, body: JSON.stringify({ success: true, messages: [] }) };
    }
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ success: false, message: '服务器错误' }) };
  }
};