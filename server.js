/**
 * server.js — 远程配置 & 数据更新服务（模板）
 *
 * 部署到你的服务器，提供以下API接口：
 *
 *   GET  /api/config/version          — 版本检查 & 远程配置下发
 *   POST /api/ota/publish             — OTA发布（管理员）
 *   GET  /api/market/sectors          — 板块数据
 *   GET  /api/market/stocks           — 个股数据
 *   GET  /api/market/dragon          — 龙头数据
 *   GET  /api/market/daily-review     — 复盘数据
 *   POST /api/push/subscribe          — 推送订阅
 *   POST /api/push/send               — 发送推送（管理员）
 *
 * 用法:
 *   npm install express
 *   node server.js
 *
 * 生产环境建议用 PM2 管理:
 *   pm2 start server.js --name stock-trend-api
 */

var http = require('http');
var fs = require('fs');
var path = require('path');
var url = require('url');

var PORT = process.env.PORT || 3000;
var DATA_DIR = path.resolve(__dirname, 'data');

// 确保数据目录存在
fs.mkdirSync(DATA_DIR, { recursive: true });

// ==================== 路由处理 ====================
var server = http.createServer(function(req, res) {
  var parsedUrl = url.parse(req.url, true);
  var pathname = parsedUrl.pathname;
  var method = req.method;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-OTA-Token');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // ==================== 版本配置接口 ====================
  if (pathname === '/api/config/version' && method === 'GET') {
    serveJsonFile(res, 'remote-config.json', {
      version: '1.0.0',
      buildTime: new Date().toISOString(),
      changelog: '初始版本',
      features: { autoRefresh: true, pushNotification: true, offlineMode: true }
    });
    return;
  }

  // ==================== OTA发布接口 ====================
  if (pathname === '/api/ota/publish' && method === 'POST') {
    // 验证Token
    var token = req.headers['x-ota-token'];
    if (token !== process.env.OTA_TOKEN && process.env.OTA_TOKEN) {
      sendError(res, 401, 'Unauthorized');
      return;
    }

    var body = '';
    req.on('data', function(chunk) { body += chunk; });
    req.on('end', function() {
      try {
        var data = JSON.parse(body);
        // 保存远程配置
        fs.writeFileSync(path.join(DATA_DIR, 'remote-config.json'), JSON.stringify(data.config || data, null, 2));
        // 保存OTA清单
        fs.writeFileSync(path.join(DATA_DIR, 'ota-manifest.json'), JSON.stringify(data.manifest || {}, null, 2));
        sendJson(res, { success: true, version: data.version, message: 'OTA published successfully' });
      } catch(e) {
        sendError(res, 400, 'Invalid JSON: ' + e.message);
      }
    });
    return;
  }

  // ==================== 市场数据接口 ====================
  if (pathname === '/api/market/sectors' && method === 'GET') {
    serveJsonFile(res, 'market-sectors.json', { sectors: [], updatedAt: new Date().toISOString() });
    return;
  }

  if (pathname === '/api/market/stocks' && method === 'GET') {
    serveJsonFile(res, 'market-stocks.json', { stocks: [], updatedAt: new Date().toISOString() });
    return;
  }

  if (pathname === '/api/market/dragon' && method === 'GET') {
    serveJsonFile(res, 'market-dragon.json', { dragon: null, updatedAt: new Date().toISOString() });
    return;
  }

  if (pathname === '/api/market/daily-review' && method === 'GET') {
    serveJsonFile(res, 'market-daily.json', { daily: null, updatedAt: new Date().toISOString() });
    return;
  }

  // ==================== 推送订阅接口 ====================
  if (pathname === '/api/push/subscribe' && method === 'POST') {
    var pushBody = '';
    req.on('data', function(chunk) { pushBody += chunk; });
    req.on('end', function() {
      try {
        var subscription = JSON.parse(pushBody);
        // 保存订阅
        var subsFile = path.join(DATA_DIR, 'push-subscriptions.json');
        var subs = [];
        if (fs.existsSync(subsFile)) {
          subs = JSON.parse(fs.readFileSync(subsFile, 'utf8'));
        }
        subs.push({ subscription: subscription, createdAt: new Date().toISOString() });
        fs.writeFileSync(subsFile, JSON.stringify(subs, null, 2));
        sendJson(res, { success: true, message: 'Subscribed to push notifications' });
      } catch(e) {
        sendError(res, 400, 'Invalid subscription: ' + e.message);
      }
    });
    return;
  }

  // ==================== 发送推送接口 ====================
  if (pathname === '/api/push/send' && method === 'POST') {
    var pushToken = req.headers['x-ota-token'];
    if (pushToken !== process.env.OTA_TOKEN && process.env.OTA_TOKEN) {
      sendError(res, 401, 'Unauthorized');
      return;
    }
    var sendBody = '';
    req.on('data', function(chunk) { sendBody += chunk; });
    req.on('end', function() {
      try {
        var payload = JSON.parse(sendBody);
        // 这里应该调用 Web Push API 发送推送
        // 需要 web-push 库: npm install web-push
        console.log('[Push] Sending notification:', payload);
        sendJson(res, { success: true, message: 'Notification queued' });
      } catch(e) {
        sendError(res, 400, 'Invalid payload: ' + e.message);
      }
    });
    return;
  }

  // ==================== 静态文件服务（www目录） ====================
  if (pathname === '/' || pathname === '/stock-trend-workstation.html') {
    serveStaticFile(res, path.join(__dirname, 'www', 'stock-trend-workstation.html'), 'text/html');
    return;
  }

  // 404
  sendError(res, 404, 'Not Found: ' + pathname);
});

// ==================== 工具函数 ====================
function serveJsonFile(res, filename, fallback) {
  var filePath = path.join(DATA_DIR, filename);
  if (fs.existsSync(filePath)) {
    var data = fs.readFileSync(filePath, 'utf8');
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(data);
  } else {
    sendJson(res, fallback);
  }
}

function sendJson(res, data) {
  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function sendError(res, code, message) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ error: message, code: code }));
}

function serveStaticFile(res, filePath, contentType) {
  if (fs.existsSync(filePath)) {
    var data = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType + '; charset=utf-8' });
    res.end(data);
  } else {
    sendError(res, 404, 'File not found');
  }
}

// ==================== 启动服务器 ====================
server.listen(PORT, function() {
  console.log('');
  console.log('============================================');
  console.log('  Stock Trend API Server');
  console.log('  Port:', PORT);
  console.log('  Data dir:', DATA_DIR);
  console.log('============================================');
  console.log('');
  console.log('API endpoints:');
  console.log('  GET  /api/config/version          - Version check');
  console.log('  POST /api/ota/publish              - OTA publish');
  console.log('  GET  /api/market/sectors           - Sector data');
  console.log('  GET  /api/market/stocks            - Stock data');
  console.log('  GET  /api/market/dragon            - Dragon data');
  console.log('  GET  /api/market/daily-review      - Daily review');
  console.log('  POST /api/push/subscribe           - Push subscribe');
  console.log('  POST /api/push/send                - Send push');
  console.log('');
  console.log('Set OTA_TOKEN environment variable for admin endpoints.');
  console.log('');
});
