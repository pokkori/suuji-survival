const fs = require('fs');
const path = require('path');

const distIndexPath = path.join(__dirname, '..', 'dist', 'index.html');

if (!fs.existsSync(distIndexPath)) {
  console.error('dist/index.html not found. Run expo export first.');
  process.exit(1);
}

let html = fs.readFileSync(distIndexPath, 'utf8');

// 既にOGPタグが存在する場合はスキップ
if (html.includes('og:image')) {
  console.log('OGP tags already present, skipping.');
  process.exit(0);
}

const ogpTags = `<meta property="og:type" content="website" />
<meta property="og:title" content="数字サバイバル - スワイプで合計10を作る数字パズル" />
<meta property="og:description" content="隣接セルをなぞって合計10を作る無料数字パズル！カスケード8連鎖・フィーバーモード・デイリーチャレンジ搭載。スコアをシェアして友達に挑戦しよう。" />
<meta property="og:url" content="https://suuji-survival.vercel.app" />
<meta property="og:image" content="https://suuji-survival.vercel.app/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="数字サバイバル - スワイプで合計10を作る数字パズル" />
<meta name="twitter:description" content="隣接セルをスワイプして合計10を作ろう！カスケード連鎖が気持ちいい数字パズル。" />
<meta name="twitter:image" content="https://suuji-survival.vercel.app/og-image.png" />
`;

html = html.replace('<link rel="icon"', ogpTags + '<link rel="icon"');
fs.writeFileSync(distIndexPath, html, 'utf8');
console.log('OGP tags injected into dist/index.html');
