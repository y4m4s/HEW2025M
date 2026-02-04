'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Loader2, TrendingUp, TrendingDown, DollarSign, AlertTriangle } from 'lucide-react';

interface PriceAdvisorProps {
  productName: string;
  onPriceSelect: (price: number) => void;
}

interface PriceData {
  suggestedPrice: number;
  medianPrice: number;
  minPrice: number;
  maxPrice: number;
  priceList: number[];
  sourceCount: number;
  message?: string;
}

// グラフ用のデータ形式に変換
const formatDataForChart = (priceList: number[], suggestedPrice: number) => {
    if (!priceList || priceList.length === 0) return [];
  
    // 価格帯を決定
    const maxPrice = Math.max(...priceList);
    const minPrice = Math.min(...priceList);
    const range = maxPrice - minPrice;
    const numBins = Math.min(10, Math.floor(Math.sqrt(priceList.length))); // スタージェスの公式の簡易版
    const binSize = Math.ceil(range / numBins) || 1;
  
    const bins: { name: string; count: number; range: [number, number]; isSuggested?: boolean }[] = [];
    for (let i = 0; i < numBins; i++) {
      const start = minPrice + i * binSize;
      const end = start + binSize;
      bins.push({
        name: `¥${start.toLocaleString()} ~`,
        count: 0,
        range: [start, end],
      });
    }
  
    // 各価格をビンに振り分ける
    priceList.forEach(price => {
      for (const bin of bins) {
        if (price >= bin.range[0] && price < bin.range[1]) {
          bin.count++;
          break;
        }
      }
    });

    // 提案価格がどのビンに属するかを見つける
    for (const bin of bins) {
        if (suggestedPrice >= bin.range[0] && suggestedPrice < bin.range[1]) {
            bin.isSuggested = true; // 提案価格のビンをマーク
            break;
        }
    }
  
    return bins.filter(b => b.count > 0);
};

export default function PriceAdvisor({ productName, onPriceSelect }: PriceAdvisorProps) {
  const [data, setData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productName) {
        setLoading(false);
        setError('商品名を入力してください。');
        return;
    };

    const fetchPriceData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/price-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productName }),
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || '価格データの取得に失敗しました。');
        }
        const result: PriceData = await response.json();
        setData(result);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : '価格データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchPriceData();
  }, [productName]);

  const chartData = data?.priceList ? formatDataForChart(data.priceList, data.suggestedPrice) : [];

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-80 text-gray-500">
          <Loader2 className="animate-spin h-10 w-10 mb-4" />
          <p className="text-lg">楽天の市場価格を分析中...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-80 text-red-500 bg-red-50 rounded-lg">
          <AlertTriangle className="h-10 w-10 mb-4" />
          <p className="text-lg font-semibold">エラー</p>
          <p>{error}</p>
        </div>
      );
    }

    if (!data || data.sourceCount === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-80 text-gray-500 bg-gray-50 rounded-lg">
          <AlertTriangle className="h-10 w-10 mb-4" />
          <p className="text-lg">関連する中古商品が見つかりませんでした。</p>
          <p className="text-sm">キーワードを変えてお試しください。</p>
        </div>
      );
    }

    return (
      <div className='space-y-6'>
        {/* サマリー */}
        <div className="text-center">
            <p className="text-lg text-gray-600">AIが分析した結果、おすすめの価格は...</p>
            <p className="text-5xl font-bold text-blue-600 my-2">¥{data.suggestedPrice.toLocaleString()}</p>
            <p className="text-sm text-gray-500">({data.sourceCount}件の中古商品データに基づく)</p>
            <button
                onClick={() => onPriceSelect(data.suggestedPrice)}
                className="mt-4 bg-blue-600 text-white font-bold py-2 px-6 rounded-full hover:bg-blue-700 transition-transform transform hover:scale-105"
            >
                この価格を使う
            </button>
        </div>
        
        {/* 詳細データ */}
        <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-green-50 p-4 rounded-lg">
                <TrendingDown className="mx-auto h-6 w-6 text-green-600 mb-1" />
                <p className="text-sm text-gray-500">最安値</p>
                <p className="text-lg font-semibold text-green-700">¥{data.minPrice.toLocaleString()}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
                <DollarSign className="mx-auto h-6 w-6 text-yellow-600 mb-1" />
                <p className="text-sm text-gray-500">中央値</p>
                <p className="text-lg font-semibold text-yellow-700">¥{data.medianPrice.toLocaleString()}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
                <TrendingUp className="mx-auto h-6 w-6 text-red-600 mb-1" />
                <p className="text-sm text-gray-500">最高値</p>
                <p className="text-lg font-semibold text-red-700">¥{data.maxPrice.toLocaleString()}</p>
            </div>
        </div>

        {/* グラフ */}
        <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-3 text-center">価格帯の分布グラフ</h3>
            <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} label={{ value: '商品数', angle: -90, position: 'insideLeft', offset: 0, style: { textAnchor: 'middle', fontSize: 14 } }} />
                    <Tooltip
                        formatter={(value) => [`${value} 件`, '商品数']}
                        labelFormatter={(label) => `価格帯: ${label}`}
                        contentStyle={{ fontSize: 14, borderRadius: '0.5rem', borderColor: '#ccc' }}
                    />
                    <Bar dataKey="count" name="商品数" unit="件">
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.isSuggested ? '#1d4ed8' : '#8884d8'} />
                        ))}
                    </Bar>
                </BarChart>
                </ResponsiveContainer>
            </div>
             <div className="flex items-center justify-center gap-4 mt-2 text-sm">
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#8884d8] rounded-sm"></div><span>他の価格帯</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#1d4ed8] rounded-sm"></div><span>提案価格の価格帯</span></div>
            </div>
        </div>
      </div>
    );
  };

  return <div className="p-4 sm:p-6">{renderContent()}</div>;
}