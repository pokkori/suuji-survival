import { Achievement } from '../types';

export const ACHIEVEMENTS: Achievement[] = [
  // === 初心者 ===
  {
    id: 'first_game', title: 'はじめの一歩', description: '初めてゲームをプレイした',
    icon: 'START', condition: { type: 'games_played', threshold: 1 }, reward: { coins: 10 }, unlockedAt: null,
  },
  {
    id: 'first_combo', title: 'コンボ入門', description: '初めて2コンボを達成した',
    icon: 'COMBO', condition: { type: 'combo', threshold: 2 }, reward: { coins: 20 }, unlockedAt: null,
  },
  {
    id: 'score_1000', title: '千の道も一歩から', description: 'スコア1,000を達成した',
    icon: '1K', condition: { type: 'score', threshold: 1000 }, reward: { coins: 20 }, unlockedAt: null,
  },
  // === 中級 ===
  {
    id: 'combo_5', title: 'コンボマスター', description: '5コンボを達成した',
    icon: 'x5', condition: { type: 'combo', threshold: 5 }, reward: { coins: 50 }, unlockedAt: null,
  },
  {
    id: 'score_5000', title: '五千の壁突破', description: 'スコア5,000を達成した',
    icon: '5K', condition: { type: 'score', threshold: 5000 }, reward: { coins: 50 }, unlockedAt: null,
  },
  {
    id: 'blocks_100', title: '百ブロッカー', description: '累計100ブロック消した',
    icon: '100', condition: { type: 'blocks_cleared', threshold: 100 }, reward: { coins: 30 }, unlockedAt: null,
  },
  {
    id: 'games_10', title: 'リピーター', description: '10回プレイした',
    icon: 'x10', condition: { type: 'games_played', threshold: 10 }, reward: { coins: 30 }, unlockedAt: null,
  },
  {
    id: 'first_fever', title: 'フィーバータイム！', description: '初めてフィーバーモードに突入した',
    icon: 'FVR', condition: { type: 'fever_count', count: 1 }, reward: { coins: 50 }, unlockedAt: null,
  },
  {
    id: 'first_perfect', title: 'パーフェクトクリア', description: '全ブロックを消した（全消し）',
    icon: 'PRF', condition: { type: 'perfect_clear', count: 1 }, reward: { coins: 100 }, unlockedAt: null,
  },
  // === 上級 ===
  {
    id: 'combo_10', title: '10コンボの達人', description: '10コンボを達成した',
    icon: 'x10', condition: { type: 'combo', threshold: 10 }, reward: { coins: 100 }, unlockedAt: null,
  },
  {
    id: 'score_10000', title: '万点プレイヤー', description: 'スコア10,000を達成した',
    icon: '10K', condition: { type: 'score', threshold: 10000 }, reward: { coins: 100 }, unlockedAt: null,
  },
  {
    id: 'score_25000', title: '数字の職人', description: 'スコア25,000を達成した',
    icon: '25K', condition: { type: 'score', threshold: 25000 }, reward: { coins: 150 }, unlockedAt: null,
  },
  {
    id: 'blocks_500', title: '500ブロッカー', description: '累計500ブロック消した',
    icon: '500', condition: { type: 'blocks_cleared', threshold: 500 }, reward: { coins: 80 }, unlockedAt: null,
  },
  {
    id: 'blocks_1000', title: '千ブロッカー', description: '累計1,000ブロック消した',
    icon: '1K', condition: { type: 'blocks_cleared', threshold: 1000 }, reward: { coins: 150 }, unlockedAt: null,
  },
  {
    id: 'games_50', title: '常連', description: '50回プレイした',
    icon: 'x50', condition: { type: 'games_played', threshold: 50 }, reward: { coins: 100 }, unlockedAt: null,
  },
  {
    id: 'daily_3', title: '三日坊主卒業', description: 'デイリーチャレンジを3日連続クリアした',
    icon: '3D', condition: { type: 'daily_streak', days: 3 }, reward: { coins: 50 }, unlockedAt: null,
  },
  {
    id: 'daily_7', title: '一週間マスター', description: 'デイリーチャレンジを7日連続クリアした',
    icon: '7D', condition: { type: 'daily_streak', days: 7 }, reward: { coins: 200 }, unlockedAt: null,
  },
  {
    id: 'bomb_10', title: '爆破魔', description: 'ボムブロックを10回使った',
    icon: 'BOM', condition: { type: 'special_block_used', blockType: 'bomb', count: 10 }, reward: { coins: 50 }, unlockedAt: null,
  },
  {
    id: 'freeze_10', title: '氷結の使い手', description: 'フリーズブロックを10回使った',
    icon: 'ICE', condition: { type: 'special_block_used', blockType: 'freeze', count: 10 }, reward: { coins: 50 }, unlockedAt: null,
  },
  {
    id: 'theme_1', title: 'おしゃれさん', description: 'テーマを1つ購入した',
    icon: 'SKN', condition: { type: 'theme_purchased', count: 1 }, reward: { coins: 30 }, unlockedAt: null,
  },
  // === 超上級 ===
  {
    id: 'score_50000', title: '数字の神', description: 'スコア50,000を達成した',
    icon: '50K', condition: { type: 'score', threshold: 50000 }, reward: { coins: 200 }, unlockedAt: null,
  },
  {
    id: 'combo_20', title: '止まらない連鎖', description: '20コンボを達成した',
    icon: 'x20', condition: { type: 'combo', threshold: 20 }, reward: { coins: 200 }, unlockedAt: null,
  },
  {
    id: 'perfect_5', title: '全消しの達人', description: '全消しを5回達成した',
    icon: 'P5', condition: { type: 'perfect_clear', count: 5 }, reward: { coins: 200 }, unlockedAt: null,
  },
  {
    id: 'total_100000', title: '累計10万点', description: '累計スコア100,000に到達した',
    icon: '100K', condition: { type: 'total_score', threshold: 100000 }, reward: { coins: 150 }, unlockedAt: null,
  },
  {
    id: 'daily_30', title: '皆勤賞', description: 'デイリーチャレンジを30日連続クリアした',
    icon: '30D', condition: { type: 'daily_streak', days: 30 }, reward: { coins: 1000 }, unlockedAt: null,
  },
];
