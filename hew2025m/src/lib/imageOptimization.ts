/**
 * 画像最適化ユーティリティ
 * blur placeholderの生成と画像品質の定数を提供
 */

/**
 * 画像品質の標準設定
 */
export const IMAGE_QUALITY = {
  /** 高品質 - プロフィール画像、アバターなど */
  HIGH: 90,
  /** 標準品質 - 商品画像、投稿画像など */
  STANDARD: 75,
  /** 低品質 - サムネイルなど */
  LOW: 60,
} as const;

/**
 * シンプルなSVGベースのblur placeholder
 * 指定された色でぼかし効果を生成
 */
export function generateBlurDataURL(color: string = '#e5e7eb'): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
      <filter id="b" color-interpolation-filters="sRGB">
        <feGaussianBlur stdDeviation="20"/>
        <feComponentTransfer>
          <feFuncA type="discrete" tableValues="1 1"/>
        </feComponentTransfer>
      </filter>
      <rect width="100%" height="100%" fill="${color}"/>
      <g filter="url(#b)">
        <rect width="100%" height="100%" fill="${color}"/>
      </g>
    </svg>
  `;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/**
 * カテゴリ別のblur placeholder色
 */
export const BLUR_COLORS = {
  /** デフォルト - グレー */
  default: '#e5e7eb',
  /** 商品画像 - ライトブルー */
  product: '#dbeafe',
  /** 投稿画像 - ライトグリーン */
  post: '#dcfce7',
  /** ユーザー画像 - ライトパープル */
  user: '#f3e8ff',
} as const;

/**
 * 事前生成されたblur placeholder
 */
export const BLUR_DATA_URLS = {
  default: generateBlurDataURL(BLUR_COLORS.default),
  product: generateBlurDataURL(BLUR_COLORS.product),
  post: generateBlurDataURL(BLUR_COLORS.post),
  user: generateBlurDataURL(BLUR_COLORS.user),
} as const;

/**
 * useDebounce Hook用のユーティリティ型
 */
export type DebouncedFunction<T extends (...args: any[]) => any> = (
  ...args: Parameters<T>
) => void;

/**
 * 検索入力のデバウンス遅延時間（ミリ秒）
 */
export const SEARCH_DEBOUNCE_DELAY = 300;
