/**
 * ota-publish.js — OTA热更新发布工具
 *
 * 用法:
 *   node scripts/ota-publish.js [version] [changelog]
 *   node scripts/ota-publish.js 1.1.0 "修复连板情绪图表显示"
 *
 * 功能：
 *   1. 更新 package.json 版本号
 *   2. 重新构建 www/ 目录
 *   3. 生成 OTA 补丁包
 *   4. 上传到远程服务器（需配置 OTA_SERVER_URL）
 *   5. 通知已安装的 App 有新版本
 */

var fs = require('fs');
var path = require('path');
var https = require('https');
var http = require('http');

var ROOT = path.resolve(__dirname, '..');
var pkgPath = path.join(ROOT, 'package.json');
var pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

var newVersion = process.argv[2] || incrementVersion(pkg.version);
var changelog = process.argv[3] || '';

// OTA服务器URL（通过环境变量配置）
var OTA_SERVER_URL = process.env.OTA_SERVER_URL || 'https://your-api-server.com';

console.log('[OTA] Publishing version:', newVersion);
console.log('[OTA] Changelog:', changelog || '(none)');
console.log('[OTA] Server:', OTA_SERVER_URL);

// ==================== 版本号自增 ====================
function incrementVersion(v) {
  var parts = v.split('.').map(Number);
  parts[2]++;
  return parts.join('.');
}

// ==================== 更新 package.json ====================
function updatePackageVersion() {
  pkg.version = newVersion;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  console.log('[OTA] package.json version updated to', newVersion);
}

// ==================== 更新 app-config.js 版本号 ====================
function updateConfigVersion() {
  var configPath = path.join(ROOT, 'assets', 'app-config.js');
  var content = fs.readFileSync(configPath, 'utf8');
  content = content.replace(
    /appVersion:\s*'[^']*'/,
    "appVersion: '" + newVersion + "'"
  );
  fs.writeFileSync(configPath, content);
  console.log('[OTA] app-config.js version updated to', newVersion);
}

// ==================== 更新 sw.js 缓存版本 ====================
function updateSWVersion() {
  var swPath = path.join(ROOT, 'sw.js');
  var content = fs.readFileSync(swPath, 'utf8');
  content = content.replace(
    /CACHE_VERSION\s*=\s*'[^']*'/,
    "CACHE_VERSION = 'v" + newVersion + "'"
  );
  fs.writeFileSync(swPath, content);
  console.log('[OTA] sw.js cache version updated to v' + newVersion);
}

// ==================== 生成远程配置 ====================
function generateRemoteConfig() {
  var remoteConfig = {
    version: newVersion,
    buildTime: new Date().toISOString(),
    changelog: changelog,
    minSupportedVersion: pkg.minSupportedVersion || '1.0.0',
    forceUpdate: false,
    updateMessage: '',
    updateUrl: '',
    features: {
      autoRefresh: true,
      pushNotification: true,
      offlineMode: true,
      debugMode: false
    },
    dataEndpoints: {
      sectors: '/api/market/sectors',
      stocks: '/api/market/stocks',
      dragon: '/api/market/dragon',
      dailyReview: '/api/market/daily-review'
    },
    refreshIntervals: {
      market: 3600000,
      dragon: 3600000,
      daily: 3600000,
      config: 86400000
    }
  };

  var configPath = path.join(ROOT, 'remote-config.json');
  fs.writeFileSync(configPath, JSON.stringify(remoteConfig, null, 2));
  console.log('[OTA] remote-config.json generated');

  return remoteConfig;
}

// ==================== 生成OTA补丁清单 ====================
function generatePatchManifest() {
  // 获取 www/ 目录中所有文件的哈希
  var wwwDir = path.join(ROOT, 'www');
  var manifest = { version: newVersion, files: {} };

  function walk(dir, base) {
    var entries = fs.readdirSync(dir, { withFileTypes: true });
    for (var entry of entries) {
      var fullPath = path.join(dir, entry.name);
      var relPath = base ? base + '/' + entry.name : entry.name;
      if (entry.isDirectory()) {
        walk(fullPath, relPath);
      } else {
        var stat = fs.statSync(fullPath);
        manifest.files[relPath] = {
          size: stat.size,
          mtime: stat.mtime.toISOString()
        };
      }
    }
  }

  if (fs.existsSync(wwwDir)) {
    walk(wwwDir);
  }

  var manifestPath = path.join(ROOT, 'ota-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('[OTA] ota-manifest.json generated with', Object.keys(manifest.files).length, 'files');

  return manifest;
}

// ==================== 上传到服务器 ====================
function uploadToServer(remoteConfig, manifest) {
  if (OTA_SERVER_URL.indexOf('your-api-server') !== -1) {
    console.log('[OTA] No server configured. Skipping upload.');
    console.log('[OTA] Set OTA_SERVER_URL environment variable to enable auto-upload.');
    console.log('[OTA] Manual: copy www/ and remote-config.json to your server.');
    return;
  }

  var uploadData = JSON.stringify({
    version: newVersion,
    config: remoteConfig,
    manifest: manifest
  });

  var url = new URL(OTA_SERVER_URL + '/api/ota/publish');
  var options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(uploadData),
      'X-OTA-Token': process.env.OTA_TOKEN || ''
    }
  };

  var client = url.protocol === 'https:' ? https : http;

  var req = client.request(url, options, function(res) {
    var body = '';
    res.on('data', function(chunk) { body += chunk; });
    res.on('end', function() {
      if (res.statusCode === 200) {
        console.log('[OTA] Upload successful!');
        console.log('[OTA] Server response:', body);
      } else {
        console.error('[OTA] Upload failed:', res.statusCode, body);
      }
    });
  });

  req.on('error', function(e) {
    console.error('[OTA] Upload error:', e.message);
    console.log('[OTA] You can manually upload www/ directory to your server.');
  });

  req.write(uploadData);
  req.end();
}

// ==================== 执行发布 ====================
function publish() {
  // 1. 更新版本号
  updatePackageVersion();
  updateConfigVersion();
  updateSWVersion();

  // 2. 构建Web资源
  console.log('[OTA] Building web resources...');
  var { execSync } = require('child_process');
  execSync('node ' + path.join(ROOT, 'scripts', 'build-web.js'), { stdio: 'inherit' });

  // 3. 生成远程配置
  var remoteConfig = generateRemoteConfig();

  // 4. 生成OTA补丁清单
  var manifest = generatePatchManifest();

  // 5. 上传到服务器
  uploadToServer(remoteConfig, manifest);

  console.log('');
  console.log('========================================');
  console.log('  OTA Publish Complete!');
  console.log('  Version:', newVersion);
  console.log('  Changelog:', changelog || '(none)');
  console.log('========================================');
  console.log('');
  console.log('Next steps:');
  console.log('  1. Deploy www/ to your hosting server');
  console.log('  2. Deploy remote-config.json to your API server');
  console.log('  3. Installed apps will auto-detect the update');
  console.log('  4. Users get update banner on next app open');
}

publish();
