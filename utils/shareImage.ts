// Canvas OGP score card generator for web platform
// Generates a 1200x630 PNG blob with score, Wordle grid, and hashtags

interface ShareImageParams {
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
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText('🏆 NEW RECORD!', W / 2, 140);
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

  // Wordle grid
  if (params.wordleGrid) {
    const lines = params.wordleGrid.split('\n');
    const emojiSize = 44;
    const gridStartY = statsY + 40;
    ctx.font = `${emojiSize}px sans-serif`;
    ctx.textAlign = 'center';
    lines.forEach((line, i) => {
      ctx.fillText(line, W / 2, gridStartY + i * (emojiSize + 4));
    });
  }

  // Hashtags at bottom
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '26px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('#数字サバイバル  #NumberSurvivor', W / 2, H - 30);

  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}
