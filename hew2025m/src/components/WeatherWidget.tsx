'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Sun, Cloud, CloudRain, CloudSnow, Zap, Loader2 } from 'lucide-react';

interface WeatherData {
  name: string;
  main: {
    temp: number;
  };
  weather: {
    main: string;
    description: string;
    icon: string;
  }[];
}

const WeatherIcon = ({ iconCode, main }: { iconCode: string; main: string }) => {
  switch (main) {
    case 'Clear':
      return <Sun className="w-6 h-6 text-yellow-400" />;
    case 'Clouds':
      return <Cloud className="w-6 h-6 text-gray-400" />;
    case 'Rain':
    case 'Drizzle':
      return <CloudRain className="w-6 h-6 text-blue-400" />;
    case 'Snow':
      return <CloudSnow className="w-6 h-6 text-white" />;
    case 'Thunderstorm':
      return <Zap className="w-6 h-6 text-yellow-500" />;
    default:
      // OpenWeatherMapのアイコンを直接使う場合
      if (iconCode) {
        return <Image src={`https://openweathermap.org/img/wn/${iconCode}.png`} alt={main} width={24} height={24} />;
      }
      return <Sun className="w-6 h-6 text-yellow-400" />;
  }
};

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('お使いのブラウザでは位置情報がサポートされていません。');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

      if (!apiKey) {
        setError('APIキーが設定されていません。');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric&lang=ja`);
        // APIからのレスポンスをコンソールに表示してデバッグ
        console.log('OpenWeatherMap API Response:', response);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`天気情報の取得に失敗しました。Status: ${response.status}, Message: ${errorData.message}`);
        }
        const data = await response.json();
        setWeather(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '不明なエラーが発生しました。');
      } finally {
        setLoading(false);
      }
    }, () => {
      setError('位置情報の取得に失敗しました。許可を確認してください。');
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="w-4 h-4 animate-spin" />現在地の天気を取得中...</div>;
  if (error) return <div className="text-sm text-red-500">{error}</div>;
  if (!weather) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-gray-700 bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow">
      <WeatherIcon iconCode={weather.weather[0].icon} main={weather.weather[0].main} />
      <span>{weather.name}: <strong>{Math.round(weather.main.temp)}°C</strong> ({weather.weather[0].description})</span>
    </div>
  );
}