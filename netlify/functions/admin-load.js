const fs = require('fs').promises;
const path = require('path');

exports.handler = async function(event, context) {
  try {
    const configPath = path.join(process.cwd(), 'site-data', 'config.json');
    try {
      const data = await fs.readFile(configPath, 'utf8');
      return { statusCode: 200, body: JSON.stringify({ success: true, data: JSON.parse(data) }) };
    } catch {
      return { statusCode: 200, body: JSON.stringify({ success: true, data: {} }) };
    }
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ success: false, message: '服务器错误' }) };
  }
};