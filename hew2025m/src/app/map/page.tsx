'use client';
import Map from "@/components/Map";
import { useState } from 'react';
import Button from '@/components/Button';
import { MapPin, Navigation, Plus, Minus, ExternalLink, User, Fish } from 'lucide-react';
import Link from 'next/link';

interface SelectedPost {
  _id: string;
  title: string;
  content: string;
  authorName: string;
  address?: string;
  location?: {
    lat: number;
    lng: number;
  };
  media?: Array<{ url: string; order: number }>;
  createdAt: string;
}

export default function MapPage() {
  const [selectedPost, setSelectedPost] = useState<SelectedPost | null>(null);
  const [clickedLocation, setClickedLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  const handleMarkerClick = (post: SelectedPost) => {
    setSelectedPost(post);
    setClickedLocation(null); // 既存の投稿を選択した場合はクリック位置をクリア
  };

  // 緯度経度から住所を取得
  const getAddressFromLatLng = async (lat: number, lng: number) => {
    setIsLoadingAddress(true);
    try {
      const geocoder = new google.maps.Geocoder();
      const result = await geocoder.geocode({
        location: { lat, lng },
        language: 'ja',
        region: 'JP',
      });

      if (result.results[0]) {
        let formattedAddress = result.results[0].formatted_address;

        // Plus Code（例：5XPM+4X）を除外
        formattedAddress = formattedAddress.replace(/[A-Z0-9]{4}\+[A-Z0-9]{2,3}\s*/g, '');

        // 国名を除外
        formattedAddress = formattedAddress.replace(/[、,]\s*(日本|Japan)\s*$/, '');
        formattedAddress = formattedAddress.replace(/^\s*(日本|Japan)[、,]\s*/, '');
        formattedAddress = formattedAddress.replace(/\s+(日本|Japan)\s*$/, '');

        return formattedAddress.trim();
      }
      return '住所を取得できませんでした';
    } catch (error) {
      console.error('住所の取得に失敗しました:', error);
      return '住所を取得できませんでした';
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const handleMapClick = async (lat: number, lng: number) => {
    setSelectedPost(null); // 地図をクリックしたら投稿選択をクリア
    const address = await getAddressFromLatLng(lat, lng);
    setClickedLocation({ lat, lng, address });
  };

  return (
    <div className="min-h-screen flex flex-col">

      <div className="flex-1 container mx-auto px-4 py-6">
        <main className="grid lg:grid-cols-3 gap-6">
          <aside className="lg:col-span-1 bg-white rounded-lg shadow-sm border">
            <div className="bg-gray-50 px-4 py-3 rounded-t-lg border-b">
              <h3 className="flex items-center gap-2 font-semibold">
                <MapPin size={18} className="text-blue-600" />
                投稿情報
              </h3>
            </div>

            <div className="p-4">
              {!selectedPost ? (
                <div className="text-center py-10 text-gray-500">
                  <MapPin size={48} className="mx-auto mb-4 text-gray-400" />
                  <p className="text-sm">マップ上のマーカーをクリックして</p>
                  <p className="text-sm">投稿情報を表示</p>
                </div>
              ) : (
                <div className="bg-white border rounded-lg overflow-hidden">
                  <div className="relative h-32 bg-gray-200 flex items-center justify-center">
                    {selectedPost.media && selectedPost.media.length > 0 ? (
                      <img
                        src={selectedPost.media.sort((a, b) => a.order - b.order)[0].url}
                        alt={selectedPost.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <>
                        <Fish size={32} className="text-gray-400" />
                        <span className="text-gray-500 text-sm ml-2">画像なし</span>
                      </>
                    )}
                  </div>

                  <div className="p-4">
                    <h4 className="font-semibold text-lg mb-2 line-clamp-2">{selectedPost.title}</h4>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {selectedPost.content}
                    </p>

                    {/* 投稿者情報 */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <User size={16} className="text-gray-600" />
                      </div>
                      <div className="text-sm font-medium">{selectedPost.authorName}</div>
                    </div>

                    {/* 位置情報 */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin size={14} className="text-blue-600" />
                        <span className="text-xs font-semibold text-gray-700">位置情報</span>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-600">住所:</span>
                          <span className="font-medium text-gray-800">{selectedPost.address || '住所未設定'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">緯度:</span>
                          <span className="font-medium text-gray-800">{selectedPost.location?.lat.toFixed(6)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">経度:</span>
                          <span className="font-medium text-gray-800">{selectedPost.location?.lng.toFixed(6)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">投稿日:</span>
                          <span className="font-medium text-gray-800">{new Date(selectedPost.createdAt).toLocaleDateString('ja-JP')}</span>
                        </div>
                      </div>
                    </div>

                    <Link href={`/postDetail/${selectedPost._id}`}>
                      <Button variant="primary" size="md" className="w-full" icon={<ExternalLink size={16} />}>
                        投稿詳細を見る
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </aside>

          <div className="lg:col-span-2 space-y-6">
            {/* 地図の枠 */}
            <section className="bg-white rounded-lg shadow-sm border">
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

            <div className="relative">
              <div className="h-96">
                <Map onMarkerClick={handleMarkerClick} onMapClick={handleMapClick} />
              </div>
            </div>
          </section>

          {/* 新しい場所で投稿の枠 */}
          <section className="bg-white rounded-lg shadow-sm border">
            <div className="bg-gray-50 px-4 py-3 rounded-t-lg border-b">
              <h3 className="flex items-center gap-2 font-semibold">
                <Navigation size={18} className="text-blue-600" />
                新しい場所を選択
              </h3>
            </div>

            <div className="p-4">
              {!clickedLocation ? (
                <p className="text-gray-600 text-sm">
                  地図上の任意の場所をクリックして、その場所で投稿を作成できます
                </p>
              ) : (
                <div className="space-y-3">
                  {isLoadingAddress ? (
                    <p className="text-gray-500 text-sm">住所を取得中...</p>
                  ) : (
                    <>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div className="flex items-start gap-2">
                          <MapPin size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-blue-900 mb-1">選択した場所</p>
                            <p className="text-sm text-blue-800">{clickedLocation.address}</p>
                          </div>
                        </div>
                      </div>

                      <Link
                        href={{
                          pathname: '/post',
                          query: {
                            lat: clickedLocation.lat,
                            lng: clickedLocation.lng,
                            address: clickedLocation.address
                          }
                        }}
                      >
                        <Button
                          variant="primary"
                          size="md"
                          className="w-full"
                          icon={<Plus size={16} />}
                          disabled={isLoadingAddress}
                        >
                          この場所で投稿を作成する
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
        </main>
      </div>

    </div>
  );
}