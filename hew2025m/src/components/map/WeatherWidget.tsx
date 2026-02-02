'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Sun, Cloud, CloudRain, CloudSnow, Zap, Loader2, Droplets, Wind, Gauge } from 'lucide-react';
import { FaThermometerHalf } from "react-icons/fa";

interface WeatherData {
  name: string;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
    pressure: number;
    temp_min: number;
    temp_max: number;
  };
  weather: {
    main: string;
    description: string;
    icon: string;
  }[];
  wind: {
    speed: number;
    deg: number;
  };
  visibility: number;
  clouds: {
    all: number;
  };
}

interface WeatherWidgetProps {
  latitude?: number;
  longitude?: number;
}

const WeatherIcon = ({ iconCode, main, size = 64 }: { iconCode: string; main: string; size?: number }) => {
  const className = `w-${size === 64 ? '16' : '8'} h-${size === 64 ? '16' : '8'}`;

  switch (main) {
    case 'Clear':
      return <Sun className={`${className} text-yellow-400`} />;
    case 'Clouds':
      return <Cloud className={`${className} text-gray-400`} />;
    case 'Rain':
    case 'Drizzle':
      return <CloudRain className={`${className} text-blue-400`} />;
    case 'Snow':
      return <CloudSnow className={`${className} text-white`} />;
    case 'Thunderstorm':
      return <Zap className={`${className} text-yellow-500`} />;
    default:
      // OpenWeatherMapのアイコンを直接使う場合
      if (iconCode) {
        return <Image src={`https://openweathermap.org/img/wn/${iconCode}@2x.png`} alt={main} width={size} height={size} />;
      }
      return <Sun className={`${className} text-yellow-400`} />;
  }
};

// 風向きを取得
const getWindDirection = (deg: number): string => {
  const directions = ['北', '北北東', '北東', '東北東', '東', '東南東', '南東', '南南東', '南', '南南西', '南西', '西南西', '西', '西北西', '北西', '北北西'];
  const index = Math.round(deg / 22.5) % 16;
  return directions[index];
};

export default function WeatherWidget({ latitude, longitude }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = async (lat: number, lng: number) => {
      const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

      if (!apiKey) {
        setError('APIキーが設定されていません。');
        setLoading(false);
        return;
      }

      try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey}&units=metric&lang=ja`;
        const response = await fetch(url);

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
    };

    // propsで緯度経度が渡されている場合はそれを使用
    if (latitude !== undefined && longitude !== undefined) {
      setLoading(true);
      fetchWeather(latitude, longitude);
    }
    // propsがない場合は現在地を取得
    else {
      if (!navigator.geolocation) {
        setError('お使いのブラウザでは位置情報がサポートされていません。');
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude: lat, longitude: lng } = position.coords;
          await fetchWeather(lat, lng);
        },
        () => {
          setError('位置情報の取得に失敗しました。許可を確認してください。');
          setLoading(false);
        }
      );
    }
  }, [latitude, longitude]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>天気を取得中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="text-sm text-red-500 text-center">{error}</div>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg shadow-sm border border-blue-100 p-3">
      {/* メイン天気情報 */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-shrink-0">
          <WeatherIcon iconCode={weather.weather[0].icon} main={weather.weather[0].main} size={48} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-xl text-gray-900 leading-tight">
            {Math.round(weather.main.temp)}°C
          </h4>
          <p className="text-xs text-gray-600 capitalize truncate">{weather.weather[0].description}</p>
        </div>
      </div>

      {/* 詳細情報グリッド */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        {/* 体感温度 */}
        <div className="bg-white/60 backdrop-blur-sm rounded p-1.5 border border-white/40">
          <div className="flex items-center gap-1.5">
            <FaThermometerHalf className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-gray-500 leading-tight">体感</p>
              <p className="text-xs font-semibold text-gray-900 leading-tight">{Math.round(weather.main.feels_like)}°C</p>
            </div>
          </div>
        </div>

        {/* 湿度 */}
        <div className="bg-white/60 backdrop-blur-sm rounded p-1.5 border border-white/40">
          <div className="flex items-center gap-1.5">
            <Droplets className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-gray-500 leading-tight">湿度</p>
              <p className="text-xs font-semibold text-gray-900 leading-tight">{weather.main.humidity}%</p>
            </div>
          </div>
        </div>

        {/* 風速 */}
        <div className="bg-white/60 backdrop-blur-sm rounded p-1.5 border border-white/40">
          <div className="flex items-center gap-1.5">
            <Wind className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-gray-500 leading-tight">風速</p>
              <p className="text-xs font-semibold text-gray-900 leading-tight">{weather.wind.speed.toFixed(1)} m/s</p>
            </div>
          </div>
        </div>

        {/* 気圧 */}
        <div className="bg-white/60 backdrop-blur-sm rounded p-1.5 border border-white/40">
          <div className="flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-gray-500 leading-tight">気圧</p>
              <p className="text-xs font-semibold text-gray-900 leading-tight">{weather.main.pressure}</p>
            </div>
          </div>
        </div>
      </div>

      {/* フッター情報 */}
      <div className="pt-2 border-t border-blue-200/50 text-[10px] text-gray-600 text-center truncate">
        {weather.name} • 風向き: {getWindDirection(weather.wind.deg)}
      </div>
    </div>
  );
}