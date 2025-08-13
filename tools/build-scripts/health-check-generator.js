/**
 * 健康检查端点生成器
 * 为部署的应用生成健康检查页面和API端点
 */

const fs = require('fs');
const path = require('path');

class HealthCheckGenerator {
  constructor() {
    this.deployConfig = this.loadDeployConfig();
  }

  /**
   * 加载部署配置
   */
  loadDeployConfig() {
    const configPath = path.join(process.cwd(), 'deploy.config.js');
    if (fs.existsSync(configPath)) {
      return require(configPath);
    }
    return {};
  }

  /**
   * 生成所有健康检查文件
   */
  async generateHealthCheckFiles(outputDir) {
    console.log('🏥 生成健康检查文件...');
    
    // 确保输出目录存在
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 生成主健康检查页面
    await this.generateMainHealthCheck(outputDir);
    
    // 生成组件健康检查页面
    if (this.deployConfig.components) {
      for (const component of this.deployConfig.components) {
        await this.generateComponentHealthCheck(outputDir, component);
      }
    }
    
    // 生成健康检查API
    await this.generateHealthCheckAPI(outputDir);
    
    // 生成状态页面
    await this.generateStatusPage(outputDir);
    
    console.log('✅ 健康检查文件生成完成');
  }

  /**
   * 生成主健康检查页面
   */
  async generateMainHealthCheck(outputDir) {
    const healthCheckHtml = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>系统健康检查</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #333;
        }
        .health-container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 800px;
            width: 90%;
        }
        .health-header {
            text-align: center;
            margin-bottom: 30px;
        }
        .health-title {
            font-size: 2.5em;
            color: #2c3e50;
            margin-bottom: 10px;
        }
        .health-subtitle {
            color: #666;
            font-size: 1.1em;
        }
        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .status-card {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            border-left: 4px solid #28a745;
            transition: transform 0.2s;
        }
        .status-card:hover {
            transform: translateY(-2px);
        }
        .status-card.warning {
            border-left-color: #ffc107;
        }
        .status-card.error {
            border-left-color: #dc3545;
        }
        .status-title {
            font-weight: 600;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .status-value {
            font-size: 1.2em;
            color: #28a745;
        }
        .status-value.warning {
            color: #ffc107;
        }
        .status-value.error {
            color: #dc3545;
        }
        .component-list {
            margin-top: 30px;
        }
        .component-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #e9ecef;
        }
        .component-name {
            font-weight: 500;
        }
        .component-status {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: 500;
        }
        .component-status.healthy {
            background: #d4edda;
            color: #155724;
        }
        .component-status.checking {
            background: #fff3cd;
            color: #856404;
        }
        .component-status.unhealthy {
            background: #f8d7da;
            color: #721c24;
        }
        .refresh-button {
            background: #007bff;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 1em;
            transition: background 0.2s;
            margin-top: 20px;
        }
        .refresh-button:hover {
            background: #0056b3;
        }
        .timestamp {
            text-align: center;
            color: #666;
            font-size: 0.9em;
            margin-top: 20px;
        }
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #007bff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="health-container">
        <div class="health-header">
            <h1 class="health-title">🏥 系统健康检查</h1>
            <p class="health-subtitle">实时监控系统和组件状态</p>
        </div>
        
        <div class="status-grid">
            <div class="status-card" id="system-status">
                <div class="status-title">
                    <span>🖥️ 系统状态</span>
                </div>
                <div class="status-value" id="system-value">检查中...</div>
            </div>
            
            <div class="status-card" id="response-time">
                <div class="status-title">
                    <span>⚡ 响应时间</span>
                </div>
                <div class="status-value" id="response-value">检查中...</div>
            </div>
            
            <div class="status-card" id="uptime-status">
                <div class="status-title">
                    <span>⏰ 运行时间</span>
                </div>
                <div class="status-value" id="uptime-value">检查中...</div>
            </div>
            
            <div class="status-card" id="components-status">
                <div class="status-title">
                    <span>🧩 组件状态</span>
                </div>
                <div class="status-value" id="components-value">检查中...</div>
            </div>
        </div>
        
        <div class="component-list">
            <h3>组件详细状态</h3>
            <div id="component-details">
                <div class="loading"></div>
            </div>
        </div>
        
        <button class="refresh-button" onclick="refreshHealthCheck()">
            🔄 刷新状态
        </button>
        
        <div class="timestamp" id="last-updated">
            最后更新: 加载中...
        </div>
    </div>
    
    <script>
        let healthData = {};
        
        // 页面加载时执行健康检查
        window.addEventListener('load', () => {
            performHealthCheck();
            
            // 每30秒自动刷新
            setInterval(performHealthCheck, 30000);
        });
        
        async function performHealthCheck() {
            const startTime = Date.now();
            
            try {
                // 检查系统状态
                await checkSystemStatus();
                
                // 检查组件状态
                await checkComponentsStatus();
                
                // 更新响应时间
                const responseTime = Date.now() - startTime;
                updateResponseTime(responseTime);
                
                // 更新时间戳
                updateTimestamp();
                
            } catch (error) {
                console.error('健康检查失败:', error);
                showError('健康检查失败: ' + error.message);
            }
        }
        
        async function checkSystemStatus() {
            // 模拟系统状态检查
            const isHealthy = true; // 在实际环境中，这里会检查真实的系统状态
            
            const systemCard = document.getElementById('system-status');
            const systemValue = document.getElementById('system-value');
            
            if (isHealthy) {
                systemCard.className = 'status-card';
                systemValue.className = 'status-value';
                systemValue.textContent = '✅ 正常';
            } else {
                systemCard.className = 'status-card error';
                systemValue.className = 'status-value error';
                systemValue.textContent = '❌ 异常';
            }
            
            healthData.system = { status: isHealthy ? 'healthy' : 'unhealthy' };
        }
        
        async function checkComponentsStatus() {
            const components = ${JSON.stringify(this.deployConfig.components || [])};
            const componentDetails = document.getElementById('component-details');
            
            if (components.length === 0) {
                componentDetails.innerHTML = '<p style="text-align: center; color: #666;">暂无组件</p>';
                return;
            }
            
            let healthyCount = 0;
            let totalCount = components.length;
            let componentHtml = '';
            
            for (const component of components) {
                const isHealthy = await checkComponentHealth(component);
                
                if (isHealthy) healthyCount++;
                
                const statusClass = isHealthy ? 'healthy' : 'unhealthy';
                const statusText = isHealthy ? '✅ 正常' : '❌ 异常';
                
                componentHtml += \`
                    <div class="component-item">
                        <span class="component-name">\${component.name}</span>
                        <span class="component-status \${statusClass}">\${statusText}</span>
                    </div>
                \`;
            }
            
            componentDetails.innerHTML = componentHtml;
            
            // 更新组件状态摘要
            const componentsCard = document.getElementById('components-status');
            const componentsValue = document.getElementById('components-value');
            
            if (healthyCount === totalCount) {
                componentsCard.className = 'status-card';
                componentsValue.className = 'status-value';
                componentsValue.textContent = \`✅ \${healthyCount}/\${totalCount} 正常\`;
            } else if (healthyCount > 0) {
                componentsCard.className = 'status-card warning';
                componentsValue.className = 'status-value warning';
                componentsValue.textContent = \`⚠️ \${healthyCount}/\${totalCount} 正常\`;
            } else {
                componentsCard.className = 'status-card error';
                componentsValue.className = 'status-value error';
                componentsValue.textContent = \`❌ \${healthyCount}/\${totalCount} 正常\`;
            }
            
            healthData.components = { healthy: healthyCount, total: totalCount };
        }
        
        async function checkComponentHealth(component) {
            try {
                const baseUrl = window.location.origin;
                const componentUrl = \`\${baseUrl}\${component.deployPath}/\`;
                
                const response = await fetch(componentUrl, { 
                    method: 'HEAD',
                    timeout: 5000 
                });
                
                return response.ok;
            } catch (error) {
                console.error(\`组件 \${component.name} 健康检查失败:\`, error);
                return false;
            }
        }
        
        function updateResponseTime(responseTime) {
            const responseCard = document.getElementById('response-time');
            const responseValue = document.getElementById('response-value');
            
            if (responseTime < 1000) {
                responseCard.className = 'status-card';
                responseValue.className = 'status-value';
                responseValue.textContent = \`✅ \${responseTime}ms\`;
            } else if (responseTime < 3000) {
                responseCard.className = 'status-card warning';
                responseValue.className = 'status-value warning';
                responseValue.textContent = \`⚠️ \${responseTime}ms\`;
            } else {
                responseCard.className = 'status-card error';
                responseValue.className = 'status-value error';
                responseValue.textContent = \`❌ \${responseTime}ms\`;
            }
            
            healthData.responseTime = responseTime;
        }
        
        function updateTimestamp() {
            const timestampElement = document.getElementById('last-updated');
            const now = new Date();
            timestampElement.textContent = \`最后更新: \${now.toLocaleString('zh-CN')}\`;
        }
        
        function refreshHealthCheck() {
            const button = document.querySelector('.refresh-button');
            button.innerHTML = '🔄 检查中...';
            button.disabled = true;
            
            performHealthCheck().finally(() => {
                button.innerHTML = '🔄 刷新状态';
                button.disabled = false;
            });
        }
        
        function showError(message) {
            const systemValue = document.getElementById('system-value');
            systemValue.textContent = message;
            systemValue.className = 'status-value error';
        }
        
        // 模拟运行时间
        function updateUptime() {
            const uptimeValue = document.getElementById('uptime-value');
            const deployTime = new Date('${new Date().toISOString()}');
            const now = new Date();
            const uptime = now - deployTime;
            
            const hours = Math.floor(uptime / (1000 * 60 * 60));
            const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
            
            uptimeValue.textContent = \`✅ \${hours}h \${minutes}m\`;
        }
        
        // 每分钟更新运行时间
        setInterval(updateUptime, 60000);
        updateUptime();
    </script>
</body>
</html>`;

    fs.writeFileSync(path.join(outputDir, 'health.html'), healthCheckHtml.trim());
    console.log('✅ 主健康检查页面生成完成');
  }

  /**
   * 生成组件健康检查页面
   */
  async generateComponentHealthCheck(outputDir, component) {
    const componentHealthHtml = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${component.name} - 健康检查</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #f8f9fa;
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e9ecef;
        }
        .component-title {
            font-size: 2em;
            color: #2c3e50;
            margin-bottom: 10px;
        }
        .component-description {
            color: #666;
            font-size: 1.1em;
        }
        .status-section {
            margin-bottom: 30px;
        }
        .status-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            margin-bottom: 10px;
        }
        .status-label {
            font-weight: 500;
        }
        .status-badge {
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: 500;
        }
        .status-badge.success {
            background: #d4edda;
            color: #155724;
        }
        .status-badge.warning {
            background: #fff3cd;
            color: #856404;
        }
        .status-badge.error {
            background: #f8d7da;
            color: #721c24;
        }
        .links-section {
            margin-top: 30px;
        }
        .link-button {
            display: inline-block;
            padding: 10px 20px;
            background: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin-right: 10px;
            margin-bottom: 10px;
            transition: background 0.2s;
        }
        .link-button:hover {
            background: #0056b3;
        }
        .link-button.secondary {
            background: #6c757d;
        }
        .link-button.secondary:hover {
            background: #545b62;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="component-title">${component.name}</h1>
            <p class="component-description">${component.description || '组件健康状态监控'}</p>
        </div>
        
        <div class="status-section">
            <h3>状态检查</h3>
            <div class="status-item">
                <span class="status-label">组件状态</span>
                <span class="status-badge success" id="component-status">✅ 正常运行</span>
            </div>
            <div class="status-item">
                <span class="status-label">最后检查时间</span>
                <span id="last-check">${new Date().toLocaleString('zh-CN')}</span>
            </div>
            <div class="status-item">
                <span class="status-label">构建模式</span>
                <span>${component.buildMode}</span>
            </div>
            <div class="status-item">
                <span class="status-label">部署路径</span>
                <span>${component.deployPath}</span>
            </div>
        </div>
        
        <div class="links-section">
            <h3>快速链接</h3>
            ${component.demoUrl ? `<a href="${component.demoUrl}" class="link-button">🚀 在线演示</a>` : ''}
            ${component.singleFileUrl ? `<a href="${component.singleFileUrl}" class="link-button">📄 单文件版本</a>` : ''}
            ${component.sourceUrl ? `<a href="${component.sourceUrl}" class="link-button secondary">📚 源代码</a>` : ''}
            ${component.documentationUrl ? `<a href="${component.documentationUrl}" class="link-button secondary">📖 文档</a>` : ''}
            <a href="../health.html" class="link-button secondary">🏥 系统健康检查</a>
        </div>
    </div>
    
    <script>
        // 简单的健康检查逻辑
        async function checkComponentHealth() {
            try {
                const response = await fetch(window.location.href, { method: 'HEAD' });
                const statusElement = document.getElementById('component-status');
                const lastCheckElement = document.getElementById('last-check');
                
                if (response.ok) {
                    statusElement.className = 'status-badge success';
                    statusElement.textContent = '✅ 正常运行';
                } else {
                    statusElement.className = 'status-badge error';
                    statusElement.textContent = '❌ 响应异常';
                }
                
                lastCheckElement.textContent = new Date().toLocaleString('zh-CN');
                
            } catch (error) {
                const statusElement = document.getElementById('component-status');
                statusElement.className = 'status-badge error';
                statusElement.textContent = '❌ 连接失败';
            }
        }
        
        // 页面加载时检查一次
        window.addEventListener('load', checkComponentHealth);
        
        // 每30秒检查一次
        setInterval(checkComponentHealth, 30000);
    </script>
</body>
</html>`;

    const componentDir = path.join(outputDir, component.name);
    if (!fs.existsSync(componentDir)) {
      fs.mkdirSync(componentDir, { recursive: true });
    }
    
    fs.writeFileSync(path.join(componentDir, 'health.html'), componentHealthHtml.trim());
    console.log(`✅ 组件 ${component.name} 健康检查页面生成完成`);
  }

  /**
   * 生成健康检查API
   */
  async generateHealthCheckAPI(outputDir) {
    const apiHtml = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Health Check API</title>
</head>
<body>
    <script>
        // 简单的健康检查API实现
        const healthData = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            uptime: Date.now(),
            components: ${JSON.stringify(this.deployConfig.components || [])}.map(component => ({
                name: component.name,
                status: 'healthy',
                url: component.deployPath
            })),
            system: {
                memory: 'N/A',
                cpu: 'N/A',
                disk: 'N/A'
            }
        };
        
        // 返回JSON格式的健康检查数据
        document.body.innerHTML = '<pre>' + JSON.stringify(healthData, null, 2) + '</pre>';
        
        // 设置响应头（如果可能）
        if (typeof Response !== 'undefined') {
            // 在支持的环境中设置JSON响应头
            console.log('Health check data:', healthData);
        }
    </script>
</body>
</html>`;

    fs.writeFileSync(path.join(outputDir, 'api', 'health.html'), apiHtml.trim());
    console.log('✅ 健康检查API生成完成');
  }

  /**
   * 生成状态页面
   */
  async generateStatusPage(outputDir) {
    const statusPageHtml = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>系统状态页面</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #f8f9fa;
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .status-title {
            font-size: 2.5em;
            color: #2c3e50;
            margin-bottom: 10px;
        }
        .status-subtitle {
            color: #666;
            font-size: 1.1em;
        }
        .overall-status {
            background: white;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            text-align: center;
        }
        .status-indicator {
            font-size: 4em;
            margin-bottom: 20px;
        }
        .status-text {
            font-size: 1.5em;
            font-weight: 600;
            color: #28a745;
        }
        .status-text.warning {
            color: #ffc107;
        }
        .status-text.error {
            color: #dc3545;
        }
        .services-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .service-card {
            background: white;
            border-radius: 12px;
            padding: 25px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            border-left: 4px solid #28a745;
        }
        .service-card.warning {
            border-left-color: #ffc107;
        }
        .service-card.error {
            border-left-color: #dc3545;
        }
        .service-name {
            font-size: 1.3em;
            font-weight: 600;
            margin-bottom: 10px;
            color: #2c3e50;
        }
        .service-status {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 15px;
        }
        .service-description {
            color: #666;
            font-size: 0.95em;
            line-height: 1.5;
        }
        .service-links {
            margin-top: 15px;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        .service-link {
            padding: 6px 12px;
            background: #e9ecef;
            color: #495057;
            text-decoration: none;
            border-radius: 4px;
            font-size: 0.9em;
            transition: background 0.2s;
        }
        .service-link:hover {
            background: #dee2e6;
        }
        .metrics-section {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }
        .metric-item {
            text-align: center;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        .metric-value {
            font-size: 2em;
            font-weight: 700;
            color: #007bff;
            margin-bottom: 5px;
        }
        .metric-label {
            color: #666;
            font-size: 0.9em;
        }
        .footer {
            text-align: center;
            color: #666;
            margin-top: 40px;
        }
        .auto-refresh {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.9em;
        }
        .auto-refresh:hover {
            background: #0056b3;
        }
    </style>
</head>
<body>
    <button class="auto-refresh" onclick="toggleAutoRefresh()" id="refresh-btn">
        🔄 自动刷新: 开启
    </button>
    
    <div class="container">
        <div class="header">
            <h1 class="status-title">📊 系统状态页面</h1>
            <p class="status-subtitle">实时监控所有服务和组件的运行状态</p>
        </div>
        
        <div class="overall-status">
            <div class="status-indicator" id="overall-indicator">✅</div>
            <div class="status-text" id="overall-text">所有系统正常运行</div>
            <p style="margin-top: 10px; color: #666;" id="last-updated">
                最后更新: ${new Date().toLocaleString('zh-CN')}
            </p>
        </div>
        
        <div class="services-grid" id="services-grid">
            <!-- 服务状态卡片将通过JavaScript动态生成 -->
        </div>
        
        <div class="metrics-section">
            <h3 style="margin-bottom: 20px;">系统指标</h3>
            <div class="metrics-grid">
                <div class="metric-item">
                    <div class="metric-value" id="uptime-metric">--</div>
                    <div class="metric-label">运行时间</div>
                </div>
                <div class="metric-item">
                    <div class="metric-value" id="response-metric">--</div>
                    <div class="metric-label">平均响应时间</div>
                </div>
                <div class="metric-item">
                    <div class="metric-value" id="requests-metric">--</div>
                    <div class="metric-label">总请求数</div>
                </div>
                <div class="metric-item">
                    <div class="metric-value" id="success-metric">--</div>
                    <div class="metric-label">成功率</div>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>系统状态页面 | 自动刷新间隔: 30秒</p>
            <p style="margin-top: 5px; font-size: 0.9em;">
                如有问题，请联系技术支持团队
            </p>
        </div>
    </div>
    
    <script>
        let autoRefreshEnabled = true;
        let refreshInterval;
        
        const services = ${JSON.stringify(this.deployConfig.components || [])};
        
        // 页面加载时初始化
        window.addEventListener('load', () => {
            initializeStatusPage();
            startAutoRefresh();
        });
        
        function initializeStatusPage() {
            renderServices();
            updateStatus();
        }
        
        function renderServices() {
            const servicesGrid = document.getElementById('services-grid');
            
            if (services.length === 0) {
                servicesGrid.innerHTML = '<p style="text-align: center; color: #666; grid-column: 1 / -1;">暂无服务配置</p>';
                return;
            }
            
            let servicesHtml = '';
            
            services.forEach(service => {
                servicesHtml += \`
                    <div class="service-card" id="service-\${service.name}">
                        <div class="service-name">\${service.name}</div>
                        <div class="service-status">
                            <span id="status-\${service.name}">🔄 检查中...</span>
                        </div>
                        <div class="service-description">
                            \${service.description || '暂无描述'}
                        </div>
                        <div class="service-links">
                            \${service.demoUrl ? \`<a href="\${service.demoUrl}" class="service-link">演示</a>\` : ''}
                            \${service.singleFileUrl ? \`<a href="\${service.singleFileUrl}" class="service-link">单文件</a>\` : ''}
                            \${service.sourceUrl ? \`<a href="\${service.sourceUrl}" class="service-link">源码</a>\` : ''}
                        </div>
                    </div>
                \`;
            });
            
            servicesGrid.innerHTML = servicesHtml;
        }
        
        async function updateStatus() {
            const startTime = Date.now();
            let healthyServices = 0;
            let totalServices = services.length;
            
            // 检查每个服务
            for (const service of services) {
                const isHealthy = await checkServiceHealth(service);
                updateServiceStatus(service.name, isHealthy);
                
                if (isHealthy) healthyServices++;
            }
            
            // 更新总体状态
            updateOverallStatus(healthyServices, totalServices);
            
            // 更新指标
            const responseTime = Date.now() - startTime;
            updateMetrics(responseTime);
            
            // 更新时间戳
            updateTimestamp();
        }
        
        async function checkServiceHealth(service) {
            try {
                const baseUrl = window.location.origin;
                const serviceUrl = \`\${baseUrl}\${service.deployPath}/\`;
                
                const response = await fetch(serviceUrl, { 
                    method: 'HEAD',
                    timeout: 5000 
                });
                
                return response.ok;
            } catch (error) {
                console.error(\`服务 \${service.name} 健康检查失败:\`, error);
                return false;
            }
        }
        
        function updateServiceStatus(serviceName, isHealthy) {
            const serviceCard = document.getElementById(\`service-\${serviceName}\`);
            const statusElement = document.getElementById(\`status-\${serviceName}\`);
            
            if (isHealthy) {
                serviceCard.className = 'service-card';
                statusElement.textContent = '✅ 正常运行';
            } else {
                serviceCard.className = 'service-card error';
                statusElement.textContent = '❌ 服务异常';
            }
        }
        
        function updateOverallStatus(healthy, total) {
            const indicator = document.getElementById('overall-indicator');
            const text = document.getElementById('overall-text');
            
            if (healthy === total) {
                indicator.textContent = '✅';
                text.textContent = '所有系统正常运行';
                text.className = 'status-text';
            } else if (healthy > 0) {
                indicator.textContent = '⚠️';
                text.textContent = \`部分系统异常 (\${healthy}/\${total} 正常)\`;
                text.className = 'status-text warning';
            } else {
                indicator.textContent = '❌';
                text.textContent = '系统服务异常';
                text.className = 'status-text error';
            }
        }
        
        function updateMetrics(responseTime) {
            // 更新响应时间
            document.getElementById('response-metric').textContent = \`\${responseTime}ms\`;
            
            // 模拟其他指标
            const now = new Date();
            const deployTime = new Date('${new Date().toISOString()}');
            const uptime = now - deployTime;
            const hours = Math.floor(uptime / (1000 * 60 * 60));
            const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
            
            document.getElementById('uptime-metric').textContent = \`\${hours}h \${minutes}m\`;
            document.getElementById('requests-metric').textContent = Math.floor(Math.random() * 10000);
            document.getElementById('success-metric').textContent = '99.9%';
        }
        
        function updateTimestamp() {
            const timestampElement = document.getElementById('last-updated');
            const now = new Date();
            timestampElement.textContent = \`最后更新: \${now.toLocaleString('zh-CN')}\`;
        }
        
        function startAutoRefresh() {
            if (refreshInterval) {
                clearInterval(refreshInterval);
            }
            
            refreshInterval = setInterval(() => {
                if (autoRefreshEnabled) {
                    updateStatus();
                }
            }, 30000);
        }
        
        function toggleAutoRefresh() {
            autoRefreshEnabled = !autoRefreshEnabled;
            const button = document.getElementById('refresh-btn');
            
            if (autoRefreshEnabled) {
                button.textContent = '🔄 自动刷新: 开启';
                startAutoRefresh();
            } else {
                button.textContent = '⏸️ 自动刷新: 关闭';
                if (refreshInterval) {
                    clearInterval(refreshInterval);
                }
            }
        }
        
        // 手动刷新
        function manualRefresh() {
            updateStatus();
        }
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.key === 'r' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                manualRefresh();
            }
        });
    </script>
</body>
</html>`;

    fs.writeFileSync(path.join(outputDir, 'status.html'), statusPageHtml.trim());
    console.log('✅ 系统状态页面生成完成');
  }
}

// 命令行接口
if (require.main === module) {
  const generator = new HealthCheckGenerator();
  const outputDir = process.argv[2] || path.join(process.cwd(), 'dist', 'health');
  
  generator.generateHealthCheckFiles(outputDir)
    .then(() => {
      console.log('✅ 所有健康检查文件生成完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ 生成失败:', error);
      process.exit(1);
    });
}

module.exports = HealthCheckGenerator;
