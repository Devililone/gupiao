/**
 * build-web.js — 构建Web资源到 www/ 目录（Capacitor用）
 *
 * 用法: node scripts/build-web.js
 *
 * 功能：
 *   1. 将所有Web资源复制到 www/ 目录
 *   2. 注入版本号
 *   3. 生成版本清单 version.json
 */

var fs = require('fs');
var path = require('path');

var ROOT = path.resolve(__dirname, '..');
var SRC = ROOT;
var DEST = path.join(ROOT, 'www');

// 版本号（从 package.json 读取）
var pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
var VERSION = pkg.version;
var BUILD_TIME = new Date().toISOString();

console.log('[Build] Version:', VERSION);
console.log('[Build] Time:', BUILD_TIME);

// 清理目标目录
function cleanDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });
}

// 递归复制目录
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  var entries = fs.readdirSync(src, { withFileTypes: true });
  fs.mkdirSync(dest, { recursive: true });
  for (var entry of entries) {
    var srcPath = path.join(src, entry.name);
    var destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      // 跳过不需要的文件
      var skip = ['node_modules', '.git', 'android', 'ios', 'scripts', 'DEPLOY.md', 'package-lock.json'];
      if (skip.indexOf(entry.name) !== -1) continue;
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 生成版本信息文件
function generateVersionFile() {
  var versionInfo = {
    version: VERSION,
    buildTime: BUILD_TIME,
    changelog: '',
    minClientVersion: VERSION,
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
  fs.writeFileSync(
    path.join(DEST, 'version.json'),
    JSON.stringify(versionInfo, null, 2)
  );
  console.log('[Build] version.json generated');
}

// 注入版本号到HTML
function injectVersion() {
  var htmlPath = path.join(DEST, 'stock-trend-workstation.html');
  if (fs.existsSync(htmlPath)) {
    var html = fs.readFileSync(htmlPath, 'utf8');
    // 在标题后添加版本标记
    html = html.replace(
      /<title>(.*?)<\/title>/,
      '<title>$1</title>\n<!-- App Version: ' + VERSION + ' Build: ' + BUILD_TIME + ' -->'
    );
    fs.writeFileSync(htmlPath, html);
    console.log('[Build] Version injected into HTML');
  }
}

// 执行构建
function build() {
  console.log('[Build] Building web resources...');
  cleanDir(DEST);

  // 复制核心文件
  var filesToCopy = [
    'stock-trend-workstation.html',
    'manifest.json',
    'sw.js',
    'capacitor.config.json'
  ];

  filesToCopy.forEach(function(f) {
    var src = path.join(SRC, f);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(DEST, f));
      console.log('[Build] Copied:', f);
    }
  });

  // 复制目录
  var dirsToCopy = ['assets', '_shared'];
  dirsToCopy.forEach(function(d) {
    copyDir(path.join(SRC, d), path.join(DEST, d));
    console.log('[Build] Copied dir:', d);
  });

  // 生成版本文件
  generateVersionFile();

  // 注入版本号
  injectVersion();

  console.log('[Build] Build complete! Output: www/');
  console.log('[Build] Files in www/:', fs.readdirSync(DEST).join(', '));
}

build();
