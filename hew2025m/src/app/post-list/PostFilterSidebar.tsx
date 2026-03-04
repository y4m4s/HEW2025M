'use client';

import type { ReactNode } from 'react';
import { Search } from 'lucide-react';
import CustomSelect from '@/components/ui/CustomSelect';

export const SORT_OPTIONS = [
  { label: '新着順', value: 'latest' },
  { label: 'おすすめ順', value: 'popular' },
];

export const FILTER_TABS = [
  { key: 'all', label: 'すべて' },
  { key: '釣行記', label: '釣行記' },
  { key: '情報共有', label: '情報共有' },
  { key: '質問', label: '質問' },
  { key: 'レビュー', label: 'レビュー' },
  { key: '雑談', label: '雑談' },
  { key: '初心者向け', label: '初心者向け' },
  { key: '釣果報告', label: '釣果報告' },
];

interface PostFilterSidebarProps {
  keyword: string;
  sortBy: string;
  activeFilter: string;
  totalPostCount: number;
  tagCounts: Record<string, number>;
  isMobileFilterOpen: boolean;
  onKeywordChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onFilterChange: (key: string) => void;
}

function FixedSidebar({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="lg:hidden">{children}</div>
      <div className="hidden lg:block sticky top-[calc(50%+3.3rem)] -translate-y-1/2 w-full">
        {children}
      </div>
    </>
  );
}

export default function PostFilterSidebar({
  keyword,
  sortBy,
  activeFilter,
  totalPostCount,
  tagCounts,
  isMobileFilterOpen,
  onKeywordChange,
  onSortChange,
  onFilterChange,
}: PostFilterSidebarProps) {
  return (
    <div className={`lg:col-span-1 order-first lg:order-last ${isMobileFilterOpen ? 'block' : 'hidden lg:block'}`}>
      <FixedSidebar>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Search size={18} className="text-[#2FA3E3]" />
            検索・絞り込み
          </h3>

          {/* 検索バー */}
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

          {/* 並び替え */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">並び替え</label>
            <CustomSelect
              value={sortBy}
              onChange={onSortChange}
              options={SORT_OPTIONS}
              className="w-full"
            />
          </div>

          {/* タグフィルター */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">タグで探す</label>
            <div className="flex flex-col space-y-1">
              {FILTER_TABS.map((tab) => {
                const count = tab.key === 'all'
                  ? totalPostCount
                  : tagCounts[tab.key] || 0;

                return (
                  <button
                    key={tab.key}
                    onClick={() => {
                      onFilterChange(tab.key);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`flex justify-between items-center w-full px-3 py-2 text-sm rounded-lg transition-all duration-200 group ${activeFilter === tab.key
                      ? 'bg-[#2FA3E3]/10 text-[#2FA3E3] font-bold'
                      : 'text-gray-600 hover:bg-gray-50'
                      }`}
                  >
                    <span className="flex items-center gap-2">
                      {tab.label}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${activeFilter === tab.key
                      ? 'bg-[#2FA3E3] text-white'
                      : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                      }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </FixedSidebar>
    </div>
  );
}
