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

  const handleMarkerClick = (post: SelectedPost) => {
    setSelectedPost(post);
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

                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <User size={16} className="text-gray-600" />
                      </div>
                      <div className="text-sm font-medium">{selectedPost.authorName}</div>
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
                <Map onMarkerClick={handleMarkerClick} />
              </div>
            </div>

            <div className="p-4 border-t">
              <h4 className="flex items-center gap-2 font-semibold mb-3">
                <Navigation size={16} className="text-blue-600" />
                選択地点の情報
              </h4>

              {!selectedPost ? (
                <p className="text-gray-600 text-sm">
                  マーカーをクリックして詳細な位置情報を確認してください
                </p>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">住所:</span>
                    <span className="font-medium">{selectedPost.address || '住所未設定'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">緯度:</span>
                    <span className="font-medium">{selectedPost.location?.lat.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">経度:</span>
                    <span className="font-medium">{selectedPost.location?.lng.toFixed(6)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">投稿日:</span>
                    <span className="font-medium">{new Date(selectedPost.createdAt).toLocaleDateString('ja-JP')}</span>
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