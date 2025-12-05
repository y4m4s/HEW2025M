/**
 * @file 閲覧履歴をlocalStorageで管理するためのユーティリティ関数
 * @description 閲覧した商品をlocalStorageに保存し、取得する機能を提供します。
 */

// 商品アイテムの型定義
export interface HistoryItem {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
  productUrl: string; // 商品ページへのリンク用
}

const HISTORY_KEY = 'recentlyViewed';
const MAX_HISTORY_COUNT = 10;

/**
 * 閲覧履歴に商品を追加します。
 * 履歴は最新の10件まで保持されます。
 * @param {HistoryItem} item - 追加する商品オブジェクト
 */
export const addToHistory = (item: HistoryItem): void => {
  if (typeof window === 'undefined') return;

  // 既存の履歴を取得し、重複があれば削除
  let history: HistoryItem[] = getHistory().filter(historyItem => historyItem.id !== item.id);

  // 新しいアイテムを履歴の先頭に追加
  history.unshift(item);

  // 履歴の件数を制限
  const newHistory = history.slice(0, MAX_HISTORY_COUNT);

  // localStorageに保存
  localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
};

/**
 * localStorageから閲覧履歴を取得します。
 * @returns {HistoryItem[]} 閲覧履歴の配列
 */
export const getHistory = (): HistoryItem[] => {
  if (typeof window === 'undefined') return [];

  const historyJson = localStorage.getItem(HISTORY_KEY);
  return historyJson ? JSON.parse(historyJson) : [];
};