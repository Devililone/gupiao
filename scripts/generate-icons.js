/**
 * generate-icons.js — 从基础图标生成所有尺寸
 *
 * 用法: node scripts/generate-icons.js
 *
 * 需要依赖: sharp 或 jimp
 *   npm install sharp
 *   或
 *   npm install jimp
 */

var fs = require('fs');
var path = require('path');

var ROOT = path.resolve(__dirname, '..');
var ICONS_DIR = path.join(ROOT, 'assets', 'icons');
var BASE_ICON = path.join(ICONS_DIR, 'icon-base.jpg');

// 需要生成的图标尺寸
var SIZES = [
  { name: 'icon-72.png',   size: 72 },
  { name: 'icon-96.png',   size: 96 },
  { name: 'icon-128.png',  size: 128 },
  { name: 'icon-144.png',  size: 144 },
  { name: 'icon-152.png',  size: 152 },
  { name: 'icon-167.png',  size: 167 },
  { name: 'icon-180.png',  size: 180 },
  { name: 'icon-192.png',  size: 192 },
  { name: 'icon-256.png',  size: 256 },
  { name: 'icon-384.png',  size: 384 },
  { name: 'icon-512.png',  size: 512 },
  { name: 'badge-72.png',  size: 72 }
];

// 快捷方式图标
var SHORTCUTS = [
  { name: 'shortcut-funnel.png',  icon: '\\u2699',  size: 96 },
  { name: 'shortcut-dragon.png',  icon: '\\u1f409', size: 96 },
  { name: 'shortcut-daily.png',   icon: '\\u1f4ca', size: 96 }
];

async function generate() {
  if (!fs.existsSync(BASE_ICON)) {
    console.error('Base icon not found:', BASE_ICON);
    console.error('Generate it first: node scripts/generate-base-icon.js');
    process.exit(1);
  }

  // 确保目录存在
  fs.mkdirSync(ICONS_DIR, { recursive: true });

  // 尝试使用 sharp
  var sharp = null;
  try { sharp = require('sharp'); } catch(e) {}

  if (sharp) {
    console.log('Using sharp for icon generation');
    for (var s of SIZES) {
      await sharp(BASE_ICON)
        .resize(s.size, s.size)
        .png()
        .toFile(path.join(ICONS_DIR, s.name));
      console.log('Generated:', s.name);
    }
  } else {
    // 回退到 jimp
    var Jimp = null;
    try { Jimp = require('jimp'); } catch(e) {}

    if (Jimp) {
      console.log('Using jimp for icon generation');
      for (var s of SIZES) {
        var img = await Jimp.read(BASE_ICON);
        await img.resize(s.size, s.size).write(path.join(ICONS_DIR, s.name));
        console.log('Generated:', s.name);
      }
    } else {
      console.error('Neither sharp nor jimp is installed.');
      console.error('Install one: npm install sharp  OR  npm install jimp');
      console.error('');
      console.error('Alternatively, use Python PIL:');
      console.error('  python3 -c "from PIL import Image; ..."');
      process.exit(1);
    }
  }

  console.log('\nAll icons generated in:', ICONS_DIR);
}

generate().catch(console.error);
