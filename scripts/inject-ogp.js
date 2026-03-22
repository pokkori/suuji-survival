const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../dist/index.html");

if (!fs.existsSync(filePath)) {
  console.log("dist/index.html not found, skipping");
  process.exit(0);
}

let html = fs.readFileSync(filePath, "utf8");

// 1. lang="en" → lang="ja" に変更（常に実行）※スペース数に関わらずマッチ
html = html.replace(/<html([^>]*?)\s+lang="en"/, '<html$1 lang="ja"');

const TITLE = "数字サバイバル - 合計10スワイプパズル";
const DESCRIPTION = "隣の数字をなぞって合計10にするシンプルパズル！チェーンコンボでハイスコアを狙え。フィーバーモードで爆発的スコアアップ！";

// 2. titleタグをキーワード強化（常に実行）
html = html.replace(
  /<title[^>]*>数字サバイバル<\/title>/,
  `<title>${TITLE}</title>`
);
// data-rh属性がある場合も対応
html = html.replace(
  /<title[^>]*><\/title>/,
  `<title>${TITLE}</title>`
);

// 3. OGPタグ注入（未注入の場合のみ）
if (!html.includes('property="og:title"')) {
  const ogTags = `
  <meta property="og:title" content="${TITLE}" />
  <meta property="og:description" content="${DESCRIPTION}" />
  <meta property="og:image" content="https://suuji-survival.vercel.app/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://suuji-survival.vercel.app" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${TITLE}" />
  <meta name="twitter:description" content="${DESCRIPTION}" />
  <meta name="twitter:image" content="https://suuji-survival.vercel.app/og-image.png" />`;
  html = html.replace("</head>", ogTags + "\n</head>");
  console.log("OGP tags injected");
} else {
  console.log("OGP tags already present, lang/title updated only");
}

fs.writeFileSync(filePath, html, "utf8");
console.log("inject-ogp.js completed: lang=ja, title updated");
