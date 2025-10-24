'use client';
import Map from "@/components/Map";
import { useState } from 'react';
import Button from '@/components/Button';
import { MapPin, Navigation, Plus, Minus, ExternalLink, User, Image } from 'lucide-react';

export default function MapPage() {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showLocationDetails, setShowLocationDetails] = useState(false);

  const handleMapClick = () => {
    setSelectedLocation({
      address: '東京都渋谷区渋谷1-1-1',
      lat: '35.6584',
      lng: '139.7016',
      nearestStation: 'JR渋谷駅'
    });
    setShowLocationDetails(true);
  };

  return (
    <div className="min-h-screen flex flex-col">

      <div className="flex-1 container mx-auto px-4 py-6">
        <main className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          <aside className="lg:col-span-1 bg-white rounded-lg shadow-sm border">
            <div className="bg-gray-50 px-4 py-3 rounded-t-lg border-b">
              <h3 className="flex items-center gap-2 font-semibold">
                <MapPin size={18} className="text-blue-600" />
                投稿情報
              </h3>
            </div>

            <div className="p-4">
              <div className="bg-white border rounded-lg overflow-hidden">
                <div className="relative h-32 bg-gray-200 flex items-center justify-center">
                  <Image size={32} className="text-gray-400" />
                  <span className="text-gray-500 text-sm ml-2">画像なし</span>
                </div>

                <div className="p-4">
                  <h4 className="font-semibold text-lg mb-2">今日の釣果報告！</h4>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    渋谷川で大きなマスを釣り上げました！朝早くから粘った甲斐がありました。天気も良くて最高の釣り日和でした。次回はもっと大きな魚を狙ってみたいと思います。
                  </p>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <User size={16} className="text-gray-600" />
                    </div>
                    <div className="text-sm font-medium">田中太郎</div>
                  </div>

                  <Button variant="primary" size="md" className="w-full" icon={<ExternalLink size={16} />}>
                    投稿詳細を見る
                  </Button>
                </div>
              </div>
            </div>
          </aside>

          <section className="lg:col-span-2 bg-white rounded-lg shadow-sm border">
            <div className="bg-gray-50 px-4 py-3 rounded-t-lg border-b flex justify-between items-center">
              <h3 className="flex items-center gap-2 font-semibold">
                <MapPin size={18} className="text-blue-600" />
                マップ
              </h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="bg-white border text-sm" icon={<Navigation size={14} />}>
                  現在地
                </Button>
                <Button variant="outline" size="sm" className="w-8 h-8 p-0 bg-white border">
                  <Plus size={14} />
                </Button>
                <Button variant="outline" size="sm" className="w-8 h-8 p-0 bg-white border">
                  <Minus size={14} />
                </Button>
              </div>
            </div>

            <div className="relative flex-1">
              <div className="h-80">
                <Map />
              </div>
            </div>

            <div className="p-4 border-t">
              <h4 className="flex items-center gap-2 font-semibold mb-3">
                <Navigation size={16} className="text-blue-600" />
                選択地点の情報
              </h4>

              {!showLocationDetails ? (
                <p className="text-gray-600 text-sm">
                  地図をクリックして詳細な位置情報を確認してください
                </p>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">住所:</span>
                    <span className="font-medium">{selectedLocation?.address}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">緯度:</span>
                    <span className="font-medium">{selectedLocation?.lat}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">経度:</span>
                    <span className="font-medium">{selectedLocation?.lng}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">最寄り駅:</span>
                    <span className="font-medium">{selectedLocation?.nearestStation}</span>
                  </div>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

    </div>
  );
}