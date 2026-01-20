const fs = require('fs').promises;
const path = require('path');

exports.handler = async function(event, context) {
  console.log('=== admin-save 开始执行 ===');
  
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ 
        success: false, 
        message: '方法不允许',
        receivedMethod: event.httpMethod 
      }) 
    };
  }

  try {
    // 1. 解析请求数据
    const requestData = JSON.parse(event.body);
    console.log('收到的数据:', Object.keys(requestData));
    
    // 2. 验证密码
    const correctPassword = process.env.SITE_ADMIN_PASSWORD;
    
    if (!correctPassword) {
      console.error('错误: 未设置SITE_ADMIN_PASSWORD环境变量');
      return { 
        statusCode: 500, 
        body: JSON.stringify({ 
          success: false, 
          message: '服务器配置错误：未设置管理员密码',
          hint: '请在Netlify控制台中设置SITE_ADMIN_PASSWORD环境变量'
        }) 
      };
    }
    
    // 3. 检查数据格式并处理
    let dataToSave;
    let password;
    
    // 情况1：前端发送 {password, data} 格式（旧格式）
    if (requestData.password && requestData.data) {
      password = requestData.password;
      dataToSave = requestData.data;
      console.log('使用旧格式数据');
    }
    // 情况2：前端直接发送配置数据，密码在另一个字段
    else if (requestData.adminPassword) {
      password = requestData.adminPassword;
      // 复制除密码外的所有数据
      dataToSave = {...requestData};
      delete dataToSave.adminPassword;
      console.log('使用adminPassword格式数据');
    }
    // 情况3：前端发送完整的配置对象（可能密码在别的字段）
    else {
      // 尝试从可能的字段获取密码
      password = requestData.password || requestData.adminPassword;
      
      if (!password) {
        console.error('错误: 请求中未找到密码字段');
        return { 
          statusCode: 400, 
          body: JSON.stringify({ 
            success: false, 
            message: '请求格式错误：未提供密码',
            receivedFields: Object.keys(requestData)
          }) 
        };
      }
      
      // 使用整个请求数据作为配置（但移除密码字段）
      dataToSave = {...requestData};
      delete dataToSave.password;
      delete dataToSave.adminPassword;
      console.log('使用自动检测格式');
    }
    
    console.log('密码验证中...');
    
    // 4. 验证密码
    if (password !== correctPassword) {
      console.error('密码错误，输入:', password.substring(0, 3) + '...', '正确:', correctPassword.substring(0, 3) + '...');
      return { 
        statusCode: 401, 
        body: JSON.stringify({ 
          success: false, 
          message: '密码错误',
          hint: '请检查开发者密码是否正确'
        }) 
      };
    }
    
    console.log('密码验证通过');
    
    // 5. 确保site-data目录存在
    const siteDataDir = path.join(process.cwd(), 'site-data');
    console.log('site-data目录:', siteDataDir);
    
    try {
      await fs.access(siteDataDir);
      console.log('目录已存在');
    } catch {
      console.log('创建site-data目录');
      await fs.mkdir(siteDataDir, { recursive: true });
    }
    
    // 6. 保存配置文件
    const configPath = path.join(siteDataDir, 'config.json');
    console.log('保存到:', configPath);
    console.log('保存的数据:', Object.keys(dataToSave));
    
    await fs.writeFile(configPath, JSON.stringify(dataToSave, null, 2), 'utf8');
    
    // 7. 验证文件是否成功写入
    const stats = await fs.stat(configPath);
    console.log('文件保存成功，大小:', stats.size, '字节');
    
    return { 
      statusCode: 200, 
      body: JSON.stringify({ 
        success: true, 
        message: '保存成功',
        savedFields: Object.keys(dataToSave),
        fileSize: stats.size
      }) 
    };
    
  } catch (error) {
    console.error('=== 保存失败，详细错误 ===');
    console.error('错误类型:', error.constructor.name);
    console.error('错误信息:', error.message);
    console.error('错误堆栈:', error.stack);
    
    // 返回详细的错误信息
    return { 
      statusCode: 200, // 使用200状态码，让前端能收到错误信息
      body: JSON.stringify({ 
        success: false, 
        message: '保存失败',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        hint: '请检查控制台日志获取详细信息'
      }) 
    };
  }
};
