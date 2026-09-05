/**
 * release.js — 完整发布流程
 *
 * 用法:
 *   node scripts/release.js [platform] [version]
 *   node scripts/release.js pwa 1.0.0        # 发布PWA
 *   node scripts/release.js android 1.0.0   # 构建Android APK
 *   node scripts/release.js ios 1.0.0       # 构建iOS
 *   node scripts/release.js ota 1.1.0       # 发布OTA热更新
 *
 * 功能：
 *   1. 版本号管理
 *   2. 资源构建
 *   3. 平台打包
 *   4. OTA发布
 *   5. Git标签
 */

var fs = require('fs');
var path = require('path');
var { execSync } = require('child_process');

var ROOT = path.resolve(__dirname, '..');
var platform = process.argv[2] || 'pwa';
var version = process.argv[3];

var pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
if (!version) version = pkg.version;

console.log('============================================');
console.log('  Stock Trend Workstation - Release');
console.log('  Platform:', platform);
console.log('  Version:', version);
console.log('============================================');

function run(cmd, label) {
  console.log('\n[' + label + '] Running:', cmd);
  try {
    execSync(cmd, { stdio: 'inherit', cwd: ROOT });
    return true;
  } catch(e) {
    console.error('[' + label + '] Failed:', e.message);
    return false;
  }
}

switch(platform) {
  case 'pwa':
    // PWA发布：构建 + 部署到静态托管
    console.log('\n=== PWA Release ===');
    run('node scripts/build-web.js', 'Build Web');
    console.log('\n[PWA] Build complete. Deploy www/ to:');
    console.log('  - GitHub Pages: git push origin gh-pages');
    console.log('  - Netlify: netlify deploy --dir=www');
    console.log('  - Vercel: vercel --prod');
    console.log('  - Any static hosting');
    break;

  case 'android':
    // Android构建
    console.log('\n=== Android Release ===');
    if (!fs.existsSync(path.join(ROOT, 'android'))) {
      console.log('[Android] Adding platform...');
      if (!run('npx cap add android', 'Add Android')) {
        console.error('[Android] Failed to add platform. Make sure @capacitor/cli is installed.');
        process.exit(1);
      }
    }
    run('node scripts/build-web.js', 'Build Web');
    run('npx cap sync android', 'Sync Android');
    console.log('\n[Android] Opening Android Studio...');
    run('npx cap open android', 'Open Android Studio');
    console.log('\n[Android] In Android Studio:');
    console.log('  1. Build > Generate Signed Bundle / APK');
    console.log('  2. Select APK or AAB');
    console.log('  3. Configure keystore');
    console.log('  4. Select release variant');
    console.log('  5. Build and distribute');
    break;

  case 'ios':
    // iOS构建
    console.log('\n=== iOS Release ===');
    if (!fs.existsSync(path.join(ROOT, 'ios'))) {
      console.log('[iOS] Adding platform...');
      if (!run('npx cap add ios', 'Add iOS')) {
        console.error('[iOS] Failed to add platform. Make sure you are on macOS with Xcode.');
        process.exit(1);
      }
    }
    run('node scripts/build-web.js', 'Build Web');
    run('npx cap sync ios', 'Sync iOS');
    console.log('\n[iOS] Opening Xcode...');
    run('npx cap open ios', 'Open Xcode');
    console.log('\n[iOS] In Xcode:');
    console.log('  1. Select target > App');
    console.log('  2. Product > Archive');
    console.log('  3. Distribute App > App Store / Ad Hoc');
    break;

  case 'ota':
    // OTA热更新发布
    console.log('\n=== OTA Release ===');
    var changelog = process.argv[4] || '';
    run('node scripts/ota-publish.js ' + version + ' "' + changelog + '"', 'OTA Publish');
    break;

  case 'all':
    // 全量发布
    console.log('\n=== Full Release ===');
    run('node scripts/build-web.js', 'Build Web');
    console.log('\n[All] Web build complete.');
    console.log('[All] Next: deploy to hosting, build native apps, publish OTA.');
    break;

  default:
    console.log('\nUsage: node scripts/release.js [pwa|android|ios|ota|all] [version]');
    console.log('  pwa     - Build PWA for web hosting');
    console.log('  android - Build Android APK/AAB');
    console.log('  ios     - Build iOS app');
    console.log('  ota     - Publish OTA hot update');
    console.log('  all     - Full release (build only)');
    process.exit(1);
}
