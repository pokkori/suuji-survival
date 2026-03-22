const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const W = 1200, H = 630;
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');

// 背景
const grad = ctx.createLinearGradient(0, 0, 0, H);
grad.addColorStop(0, '#0a0a1a');
grad.addColorStop(1, '#1a1a3e');
ctx.fillStyle = grad;
ctx.fillRect(0, 0, W, H);

// アクセントライン
ctx.fillStyle = '#00FFAA';
ctx.fillRect(0, 0, W, 8);

// タイトル
ctx.fillStyle = '#00FFAA';
ctx.font = 'bold 72px sans-serif';
ctx.textAlign = 'center';
ctx.fillText('数字サバイバル', W/2, 140);

// ルール説明
ctx.fillStyle = '#FFFFFF';
ctx.font = 'bold 44px sans-serif';
ctx.fillText('隣接セルをスワイプして合計10を作ろう！', W/2, 230);

// 数字セル例
const cells = ['3', '7'];
const colors = ['#FF6B6B', '#4ECDC4'];
let cx = W/2 - 120;
cells.forEach((val, i) => {
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath();
  const r = 12;
  const x = cx, y = 290, w = 100, h = 100;
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
  ctx.fillStyle = colors[i];
  ctx.font = 'bold 52px sans-serif';
  ctx.fillText(val, cx + 50, 358);
  cx += 120;
});
ctx.fillStyle = '#fff';
ctx.font = 'bold 48px sans-serif';
ctx.fillText('= 10 ✓', W/2 + 60, 358);

// 特徴
ctx.fillStyle = 'rgba(255,255,255,0.7)';
ctx.font = '30px sans-serif';
ctx.fillText('カスケード連鎖 / フィーバーモード / デイリーチャレンジ', W/2, 450);

// URL
ctx.fillStyle = 'rgba(0,255,170,0.9)';
ctx.font = 'bold 28px sans-serif';
ctx.fillText('suuji-survival.vercel.app', W/2, H - 40);

const outDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'og-image.png'), canvas.toBuffer('image/png'));
console.log('og-image.png generated!');
