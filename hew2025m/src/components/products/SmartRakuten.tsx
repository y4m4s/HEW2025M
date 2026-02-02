'use client';

import { useState, useEffect } from 'react';
import { Sparkles, AlertTriangle } from 'lucide-react';
import RakutenProducts from './rakuten'; 

interface SmartRakutenProps {
  productName: string;
  description: string;
  category: string; // カテゴリを追加
}

export default function SmartRakuten({ productName, description, category }: SmartRakutenProps) {
  const [keyword, setKeyword] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [debugError, setDebugError] = useState<string | null>(null);

  useEffect(() => {
    if (!productName) return;

    const fetchKeyword = async () => {
      setLoading(true);
      setDebugError(null);
      
      try {
        const res = await fetch('/api/generate-keyword', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // カテゴリも一緒に送る
          body: JSON.stringify({ productName, description, category }),
        });
        
        const data = await res.json();

        if (!res.ok || data.error) {
          const msg = data.message || data.error;
          setDebugError(`AIエラー: ${msg}`);
          setKeyword(productName); // エラー時は「商品名」をそのまま使う（カテゴリではない）
        } else {
          setKeyword(data.keyword);
        }
        
      } catch (error: unknown) {
        setDebugError(`通信エラー: ${error instanceof Error ? error.message : '不明なエラー'}`);
        setKeyword(productName);
      } finally {
        setLoading(false);
      }
    };

    fetchKeyword();
  }, [productName, description, category]);

  return (
    <div className="flex flex-col gap-3 mt-6">
      {/* エラー表示 */}
      {debugError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm flex items-center gap-2">
          <AlertTriangle size={16} />
          <span>{debugError}</span>
        </div>
      )}

      {/* ローディング表示 */}
      {loading && (
        <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-md w-full animate-pulse border border-blue-100">
          <Sparkles size={16} />
          <span>AIが最適な商品を分析中...</span>
        </div>
      )}

      {/* 結果表示 */}
      {!loading && keyword && (
        <RakutenProducts keyword={keyword} />
      )}
    </div>
  );
}