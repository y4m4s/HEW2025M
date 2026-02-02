// アプリケーション全体で使用する共通定数

import { GiFishingPole, GiFishingHook, GiFishingLure, GiEarthWorm, GiSpanner } from "react-icons/gi";
import { FaTape, FaTshirt, FaBox } from "react-icons/fa";
import { SiHelix } from "react-icons/si";
import { Puzzle } from "lucide-react";
import type { IconType } from "react-icons";
import type { LucideIcon } from "lucide-react";

// カテゴリー定義（商品・フィルタリング用）
export interface Category {
  name: string;
  value: string;
  href: string;
  Icon: IconType | LucideIcon;
}

export const CATEGORIES: Category[] = [
  { name: "ロッド/竿", value: "rod", href: "/product-list?category=rod", Icon: GiFishingPole },
  { name: "リール", value: "reel", href: "/product-list?category=reel", Icon: FaTape },
  { name: "ルアー", value: "lure", href: "/product-list?category=lure", Icon: GiFishingLure },
  { name: "ライン/糸", value: "line", href: "/product-list?category=line", Icon: SiHelix },
  { name: "ハリ/針", value: "hook", href: "/product-list?category=hook", Icon: GiFishingHook },
  { name: "餌", value: "bait", href: "/product-list?category=bait", Icon: GiEarthWorm },
  { name: "ウェア", value: "wear", href: "/product-list?category=wear", Icon: FaTshirt },
  { name: "セット用品", value: "set", href: "/product-list?category=set", Icon: FaBox },
  { name: "サービス", value: "service", href: "/product-list?category=service", Icon: GiSpanner },
  { name: "その他", value: "other", href: "/product-list?category=other", Icon: Puzzle },
];

// 商品の状態定義
export const CONDITION_MAP: Record<string, string> = {
  'new': '新品・未使用',
  'like-new': '未使用に近い',
  'good': '目立った傷汚れなし',
  'fair': 'やや傷や汚れあり',
  'poor': '傷や汚れあり'
};

// 商品ステータス
export const PRODUCT_STATUS = {
  AVAILABLE: 'available',
  SOLD: 'sold',
  RESERVED: 'reserved',
} as const;

// ページネーション
export const PAGINATION = {
  DEFAULT_LIMIT: 12,
  MAX_LIMIT: 50,
} as const;

// 投稿カテゴリー
export const POST_CATEGORIES = {
  SEA: 'sea',
  RIVER: 'river',
} as const;

// APIレスポンスのキャッシュ時間（秒）
export const CACHE_DURATION = {
  SHORT: 60,      // 1分
  MEDIUM: 300,    // 5分
  LONG: 3600,     // 1時間
  DAY: 86400,     // 1日
} as const;

// ISR revalidate時間（秒）
export const REVALIDATE = {
  HOME: 300,       // ホームページ: 5分
  PRODUCTS: 60,    // 商品リスト: 1分
  STATIC: 86400,   // 静的ページ: 1日
} as const;
