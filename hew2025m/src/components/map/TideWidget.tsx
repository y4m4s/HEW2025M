'use client';

import { useState, useEffect } from 'react';
import { Waves, Loader2 } from 'lucide-react';

interface TideData {
  nextHigh: string;
  nextLow: string;
}

interface TideWidgetProps {
  latitude?: number;
  longitude?: number;
}

// 簡易的な潮汐計算（月齢から推定）
const calculateSimplifiedTides = (lng: number): TideData => {
  const now = new Date();

  // 月齢を計算（2000年1月6日が新月）
  const knownNewMoon = new Date(2000, 0, 6, 18, 14);
  const timeDiff = now.getTime() - knownNewMoon.getTime();
  const daysSinceKnownNewMoon = timeDiff / (1000 * 60 * 60 * 24);
  const lunarCycle = 29.530588853; // 朔望月の平均日数
  const moonAge = daysSinceKnownNewMoon % lunarCycle;

  // 経度による時差を計算（東経135度を基準=日本標準時）
  const longitudeOffset = (lng - 135) / 15 * 60; // 経度15度で1時間=60分

  // 今日の満潮・干潮時刻を計算（月の南中時刻を基準に満潮）
  // 月の南中は月齢に応じて変化（1日あたり約50分遅れる）
  const moonTransitDelay = moonAge * 50; // 分単位
  const baseTransitHour = 12; // 正午を基準

  const transitMinutes = (baseTransitHour * 60 + moonTransitDelay + longitudeOffset) % (24 * 60);
  const transitHour = Math.floor(transitMinutes / 60);
  const transitMinute = Math.floor(transitMinutes % 60);

  // 満潮は月の南中時刻と南中の反対側（±12時間）
  const highTide1 = new Date(now);
  highTide1.setHours(transitHour, transitMinute, 0, 0);

  const highTide2 = new Date(highTide1);
  highTide2.setHours(highTide2.getHours() + 12);

  // 干潮は満潮の約6時間前後
  const lowTide1 = new Date(highTide1);
  lowTide1.setHours(lowTide1.getHours() - 6);

  const lowTide2 = new Date(highTide1);
  lowTide2.setHours(lowTide2.getHours() + 6);

  // 現在時刻より後の次の満潮・干潮を見つける
  const allHighTides = [highTide1, highTide2].sort((a, b) => a.getTime() - b.getTime());
  const allLowTides = [lowTide1, lowTide2].sort((a, b) => a.getTime() - b.getTime());

  // 明日の潮汐も含める
  const tomorrowHighTide1 = new Date(highTide1);
  tomorrowHighTide1.setDate(tomorrowHighTide1.getDate() + 1);
  const tomorrowHighTide2 = new Date(highTide2);
  tomorrowHighTide2.setDate(tomorrowHighTide2.getDate() + 1);
  const tomorrowLowTide1 = new Date(lowTide1);
  tomorrowLowTide1.setDate(tomorrowLowTide1.getDate() + 1);
  const tomorrowLowTide2 = new Date(lowTide2);
  tomorrowLowTide2.setDate(tomorrowLowTide2.getDate() + 1);

  allHighTides.push(tomorrowHighTide1, tomorrowHighTide2);
  allLowTides.push(tomorrowLowTide1, tomorrowLowTide2);

  const nextHigh = allHighTides.find(tide => tide.getTime() > now.getTime());
  const nextLow = allLowTides.find(tide => tide.getTime() > now.getTime());

  return {
    nextHigh: nextHigh ? nextHigh.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '---',
    nextLow: nextLow ? nextLow.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '---',
  };
};

export default function TideWidget({ latitude, longitude }: TideWidgetProps) {
  const [tideData, setTideData] = useState<TideData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTideData = (lng: number) => {
      setLoading(true);
      setError(null);
      try {
        const tides = calculateSimplifiedTides(lng);
        setTideData(tides);
      } catch (err) {
        console.error('潮汐情報の計算エラー:', err);
        setError('潮汐情報を取得できませんでした');
        setTideData(null);
      } finally {
        setLoading(false);
      }
    };

    // propsで経度が渡されている場合はそれを使用
    if (longitude !== undefined) {
      fetchTideData(longitude);
    } else {
      setError('位置情報が指定されていません');
      setLoading(false);
    }
  }, [latitude, longitude]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2 flex items-center justify-center py-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          <span className="ml-2 text-xs text-gray-500">潮汐情報を取得中...</span>
        </div>
      </div>
    );
  }

  if (error || !tideData) {
    return (
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2 text-center py-2">
          <p className="text-xs text-gray-400">{error || '潮汐情報を取得できませんでした'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {/* 満潮 */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-2.5 border border-blue-200">
        <div className="flex items-center gap-1.5 mb-1">
          <Waves className="w-3 h-3 text-blue-600" />
          <p className="text-[10px] text-blue-700 font-medium">次の満潮</p>
        </div>
        <p className="text-sm font-bold text-blue-900">{tideData.nextHigh}</p>
      </div>

      {/* 干潮 */}
      <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg p-2.5 border border-cyan-200">
        <div className="flex items-center gap-1.5 mb-1">
          <Waves className="w-3 h-3 text-cyan-600" />
          <p className="text-[10px] text-cyan-700 font-medium">次の干潮</p>
        </div>
        <p className="text-sm font-bold text-cyan-900">{tideData.nextLow}</p>
      </div>
    </div>
  );
}
