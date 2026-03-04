'use client';

import type { ReactNode } from 'react';
import { Search, Puzzle } from 'lucide-react';
import { GiFishingPole, GiFishingHook, GiFishingLure } from 'react-icons/gi';
import { FaTape, FaTshirt, FaBox } from 'react-icons/fa';
import { SiHelix } from 'react-icons/si';
import CustomSelect from '@/components/ui/CustomSelect';

export const CATEGORY_OPTIONS = [
  { label: 'すべて', value: '' },
  { label: 'ロッド/竿', value: 'rod', icon: GiFishingPole },
  { label: 'リール', value: 'reel', icon: FaTape },
  { label: 'ルアー', value: 'lure', icon: GiFishingLure },
  { label: 'ライン/糸', value: 'line', icon: SiHelix },
  { label: 'ハリ/針', value: 'hook', icon: GiFishingHook },
  { label: 'ウェア', value: 'wear', icon: FaTshirt },
  { label: 'セット用品', value: 'set', icon: FaBox },
  { label: 'その他', value: 'other', icon: Puzzle },
];

export const PRICE_OPTIONS = [
  { label: '指定なし', value: '' },
  { label: '1,000円', value: '1000' },
  { label: '2,000円', value: '2000' },
  { label: '3,000円', value: '3000' },
  { label: '4,000円', value: '4000' },
  { label: '5,000円', value: '5000' },
  { label: '10,000円', value: '10000' },
];

export const SHIPPING_PAYER_OPTIONS = [
  { label: '指定なし', value: '' },
  { label: '出品者負担', value: 'seller' },
  { label: '購入者負担', value: 'buyer' },
];

interface FilterSidebarProps {
  category: string;
  minPrice: string;
  maxPrice: string;
  shippingPayer: string;
  keyword: string;
  hideSold: boolean;
  hasActiveFilters: boolean;
  isMobileFilterOpen: boolean;
  onCategoryChange: (value: string) => void;
  onMinPriceChange: (value: string) => void;
  onMaxPriceChange: (value: string) => void;
  onShippingPayerChange: (value: string) => void;
  onKeywordChange: (value: string) => void;
  onHideSoldToggle: () => void;
  onReset: () => void;
}

function FixedSidebar({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="lg:hidden">{children}</div>
      <div className="hidden lg:block sticky top-[calc(50%+3rem)] -translate-y-1/2 w-full">
        {children}
      </div>
    </>
  );
}

export default function FilterSidebar({
  category,
  minPrice,
  maxPrice,
  shippingPayer,
  keyword,
  hideSold,
  hasActiveFilters,
  isMobileFilterOpen,
  onCategoryChange,
  onMinPriceChange,
  onMaxPriceChange,
  onShippingPayerChange,
  onKeywordChange,
  onHideSoldToggle,
  onReset,
}: FilterSidebarProps) {
  return (
    <div className={`lg:w-72 shrink-0 lg:pt-4 order-first lg:order-last ${isMobileFilterOpen ? 'block' : 'hidden lg:block'}`}>
      <FixedSidebar>
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Search size={18} className="text-[#2FA3E3]" />
              検索・絞り込み
            </h3>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">キーワード</label>
              <form className="relative w-full" onSubmit={(e) => e.preventDefault()}>
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Search size={16} />
                </div>
                <input
                  type="search"
                  placeholder="キーワードを入力"
                  value={keyword}
                  onChange={(e) => onKeywordChange(e.target.value)}
                  className="w-full py-2.5 pl-10 pr-4 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white outline-none [transition:background-color_150ms_ease-out,border-color_150ms_ease-out,box-shadow_150ms_ease-out] focus:border-gray-300 focus:shadow-md"
                />
              </form>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリー</label>
              <CustomSelect
                value={category}
                onChange={onCategoryChange}
                options={CATEGORY_OPTIONS}
                placeholder="すべて"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">価格（最小 - 最大）</label>
              <div className="flex items-center gap-2">
                <CustomSelect
                  value={minPrice}
                  onChange={onMinPriceChange}
                  options={PRICE_OPTIONS}
                  placeholder="指定なし"
                  className="flex-1 min-w-0"
                  size="sm"
                />
                <span className="text-gray-400 text-sm shrink-0">〜</span>
                <CustomSelect
                  value={maxPrice}
                  onChange={onMaxPriceChange}
                  options={PRICE_OPTIONS}
                  placeholder="指定なし"
                  className="flex-1 min-w-0"
                  size="sm"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">送料負担</label>
              <CustomSelect
                value={shippingPayer}
                onChange={onShippingPayerChange}
                options={SHIPPING_PAYER_OPTIONS}
                placeholder="指定なし"
              />
            </div>

            <div className="mb-4">
              <button
                onClick={onHideSoldToggle}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 shadow-sm ${
                  hideSold
                    ? 'bg-[#2FA3E3] text-white hover:bg-[#1d7bb8]'
                    : 'bg-white text-[#2FA3E3] border border-[#2FA3E3] hover:bg-blue-50'
                }`}
              >
                <span className="inline-block w-2 h-2 rounded-full bg-current opacity-70" />
                {hideSold ? 'SOLDを非表示中' : 'SOLDを非表示にする'}
              </button>
            </div>

            {hasActiveFilters && (
              <button
                onClick={onReset}
                className="w-full text-sm text-[#2FA3E3] hover:text-[#1d7bb8] underline"
              >
                フィルターをリセット
              </button>
            )}
          </div>
        </div>
      </FixedSidebar>
    </div>
  );
}
