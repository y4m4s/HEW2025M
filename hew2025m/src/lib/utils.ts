import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 商品の状態マッピング
const CONDITION_MAP: Record<string, string> = {
  'new': '新品・未使用',
  'like-new': '未使用に近い',
  'good': '目立った傷汚れなし',
  'fair': 'やや傷や汚れあり',
  'poor': '傷や汚れあり'
};

/**
 * 商品の状態を日本語に変換
 */
export function formatCondition(condition: string): string {
  return CONDITION_MAP[condition] || condition;
}

/**
 * 日付を相対的な日本語表記にフォーマット
 */
export function formatRelativeDate(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return '今日';
  } else if (diffDays === 1) {
    return '昨日';
  } else if (diffDays < 7) {
    return `${diffDays}日前`;
  } else {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }
}

/**
 * 日付を日本語の標準フォーマットに変換
 */
export function formatDate(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * 金額を日本円フォーマットに変換
 */
export function formatPrice(price: number): string {
  return `¥${price.toLocaleString()}`;
}

/**
 * 文字列を指定の長さで切り詰める
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

/**
 * 安全なJSON parse
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

// カテゴリマッピング
const CATEGORY_MAP: Record<string, string> = {
  'rod': 'ロッド/竿',
  'reel': 'リール',
  'lure': 'ルアー',
  'line': 'ライン/糸',
  'hook': 'ハリ/針',
  'bait': '餌',
  'wear': 'ウェア',
  'set': 'セット用品',
  'service': 'サービス',
  'other': 'その他'
};

/**
 * カテゴリコードを日本語に変換
 */
export function formatCategory(category: string): string {
  return CATEGORY_MAP[category] || category;
}

// 商品ステータスマッピング
const STATUS_MAP: Record<string, string> = {
  'available': '販売中',
  'sold': '売り切れ',
  'reserved': '取り置き中'
};

/**
 * 商品ステータスを日本語に変換
 */
export function formatStatus(status: string): string {
  return STATUS_MAP[status] || status;
}

// 発送日数マッピング
const SHIPPING_DAYS_MAP: Record<string, string> = {
  '1-2': '1〜2日で発送',
  '2-3': '2〜3日で発送',
  '4-7': '4〜7日で発送'
};

/**
 * 発送日数を日本語に変換
 */
export function formatShippingDays(days: string): string {
  return SHIPPING_DAYS_MAP[days] || days;
}

/**
 * Firebase Timestamp または文字列を相対的な時刻表記に変換
 */
export function formatTimestamp(timestamp: { toDate?: () => Date } | string | Date): string {
  let date: Date;

  if (typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (timestamp && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else {
    return '';
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) {
    return 'たった今';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}分前`;
  } else if (diffHours < 24) {
    return `${diffHours}時間前`;
  } else if (diffDays < 7) {
    return `${diffDays}日前`;
  } else {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }
}

/**
 * uidからuser-プレフィックスを除去
 */
export function extractUid(userId: string): string {
  return userId.startsWith('user-') ? userId.replace('user-', '') : userId;
}