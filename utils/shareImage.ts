// Canvas OGP score card generator for web platform
// Generates a 1200x630 PNG blob with score, Wordle grid, and hashtags

export interface ShareImageParams {
  score: number;
  maxChain: number;
  blocksCleared: number;
  isNewRecord: boolean;
  wordleGrid: string;
  themeColors: {
    background: string;
    accentColor: string;
    cellColors: Record<string, string>;
  };
  dailyStreak?: number;
  personalBest?: number;  // 追加
}

export async function generateScoreCard(params: ShareImageParams): Promise<Blob | null> {
  if (typeof document === 'undefined') return null;

  const W = 1200;
  const H = 630;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#0a0a1a');
  grad.addColorStop(1, '#1a1a3e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Accent border line at top
  ctx.fillStyle = params.themeColors.accentColor || '#00FFAA';
  ctx.fillRect(0, 0, W, 6);

  // Title
  ctx.fillStyle = params.themeColors.accentColor || '#00FFAA';
  ctx.font = 'bold 56px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('数字サバイバル', W / 2, 90);

  // New record badge
  if (params.isNewRecord) {
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(W / 2 - 120, 115, 240, 40);
    ctx.fillStyle = '#1a1a3e';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('NEW RECORD', W / 2, 140);
  }

  // Score value
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 100px sans-serif';
  ctx.fillText(params.score.toLocaleString(), W / 2, params.isNewRecord ? 270 : 240);

  // Sub stats
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '28px sans-serif';
  const statsY = params.isNewRecord ? 320 : 290;
  ctx.fillText(
    `最大チェーン: ${params.maxChain}  消去: ${params.blocksCleared}`,
    W / 2,
    statsY,
  );

  // Wordle grid (color rect version, no emoji)
  if (params.wordleGrid) {
    const lines = params.wordleGrid.split('\n');
    const cellSize = 36;
    const cellGap = 4;
    const cols = lines[0] ? [...lines[0]].filter(ch => ch.trim().length > 0 || ch === '\u2B1C').length : 6;
    // Count cells per line by splitting Unicode characters
    const colCount = lines.reduce((max, l) => {
      const chars = [...l];
      return Math.max(max, chars.length);
    }, 0) || 6;
    const totalW = colCount * (cellSize + cellGap) - cellGap;
    const gridStartX = W / 2 - totalW / 2;
    const gridStartY = statsY + 40;
    const ROW_COLORS = ['#3BA55C', '#C9B458', '#E74C3C', '#3498DB', '#9B59B6', '#E67E22'];
    lines.forEach((line, rowIdx) => {
      const chars = [...line];
      chars.forEach((ch, colIdx) => {
        const x = gridStartX + colIdx * (cellSize + cellGap);
        const y = gridStartY + rowIdx * (cellSize + cellGap);
        if (ch === '\u2B1C' || ch === ' ') {
          ctx.fillStyle = '#1a1a3e';
        } else {
          ctx.fillStyle = ROW_COLORS[(rowIdx + colIdx) % ROW_COLORS.length];
        }
        ctx.fillRect(x, y, cellSize, cellSize);
      });
    });
  }

  // Streak badge（新規追加）
  if (params.dailyStreak && params.dailyStreak >= 2) {
    ctx.fillStyle = 'rgba(255,107,53,0.85)';
    ctx.beginPath();
    ctx.roundRect(W / 2 - 150, H - 110, 300, 55, 8);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${params.dailyStreak}日連続達成!`, W / 2, H - 74);
  }
  if (params.personalBest !== undefined && params.score > 0) {
    const diff = params.score - params.personalBest;
    const pbText = diff > 0
      ? `自己ベスト+${diff}点！`
      : diff === 0
      ? `自己ベスト更新！`
      : `自己ベストまであと${Math.abs(diff)}点`;
    ctx.font = "bold 28px sans-serif";
    ctx.fillStyle = diff >= 0 ? "#00FF88" : "#FFFFFF88";
    ctx.textAlign = "center";
    ctx.fillText(pbText, W / 2, 420);
  }

  // Hashtags at bottom
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '26px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('#数字サバイバル #数字ゲーム #NumberSurvivor', W / 2, H - 48);

  // URL
  ctx.fillStyle = 'rgba(0,255,170,0.8)';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('suuji-survival.vercel.app', W / 2, H - 18);

  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}
