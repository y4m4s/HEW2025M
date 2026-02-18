"use client";

import React, { useEffect, useState, useImperativeHandle, forwardRef, useCallback } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import toast from "react-hot-toast";
import { Search, X } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const containerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 35.6895,
  lng: 139.6917,
};

export interface MapPost {
  _id: string;
  title: string;
  content?: string;
  authorId?: string;
  authorName?: string;
  address?: string;
  location?: {
    lat: number;
    lng: number;
  };
  media?: Array<{ url: string; order: number }>;
  createdAt?: string;
}

interface MapProps {
  onMarkerClick?: (post: MapPost) => void;
  onMapClick?: (lat: number, lng: number) => void;
  posts?: MapPost[]; // 親から投稿データを受け取る（オプション）
  selectedPostId?: string | null; // 外部から選択された投稿IDを受け取る
}

export interface MapRef {
  moveToCurrentLocation: () => void;
  panToLocation: (lat: number, lng: number, zoom?: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
}

const Map = forwardRef<MapRef, MapProps>(({ onMarkerClick, onMapClick, posts: externalPosts, selectedPostId }, ref) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const [internalPosts, setInternalPosts] = useState<MapPost[]>([]);
  // 外部からpostsが渡されている場合はそれを使用、なければ内部で取得したものを使用
  const posts = externalPosts ?? internalPosts;
  const [selectedPost, setSelectedPost] = useState<MapPost | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState(defaultCenter);
  const [zoom, setZoom] = useState(7);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);

  const handleMarkerClick = (post: MapPost) => {
    setSelectedPost(post);

    // マーカーの位置を地図の中心に移動
    if (post.location && map) {
      const newCenter = {
        lat: post.location.lat,
        lng: post.location.lng,
      };
      map.panTo(newCenter);
      setCenter(newCenter);
    }

    if (onMarkerClick) {
      onMarkerClick(post);
    }
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng && onMapClick) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      onMapClick(lat, lng);
    }
  };

  // 住所から緯度経度を検索
  const handleSearchLocation = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);

    // トーストメッセージ用に検索クエリを適切な長さに切り詰める
    const maxLength = 25;
    const displayQuery = searchQuery.length > maxLength
      ? searchQuery.substring(0, maxLength) + '...'
      : searchQuery;

    try {
      const geocoder = new google.maps.Geocoder();
      const result = await geocoder.geocode({
        address: searchQuery,
        language: 'ja',
        region: 'JP',
      });

      if (result.results && result.results.length > 0) {
        const location = result.results[0].geometry.location;
        const newCenter = {
          lat: location.lat(),
          lng: location.lng(),
        };
        setCenter(newCenter);
        setZoom(15);
        if (map) {
          map.panTo(newCenter);
          map.setZoom(15);
        }
        toast.success(`「${displayQuery}」に移動しました`);
      } else {
        // 検索結果が見つからない場合（ZERO_RESULTS）
        toast.error(`「${displayQuery}」にヒットする場所はありませんでした`);
      }
    } catch (error: unknown) {
      // エラーが発生した場合
      // Google Maps APIのエラーを静かに処理（コンソールログを抑制）
      const mapsError = error as { code?: string };
      if (mapsError.code !== 'ZERO_RESULTS') {
        console.error('場所の検索に失敗しました:', error);
      }
      toast.error(`「${displayQuery}」にヒットする場所はありませんでした`);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, map]);

  // Enterキーで検索
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchLocation();
    }
  };

  // 親コンポーネントから呼び出せるメソッドを公開
  useImperativeHandle(ref, () => ({
    moveToCurrentLocation: () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const newCenter = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setCenter(newCenter);
            setZoom(15); // 現在地に移動時はズームを拡大
            if (map) {
              map.panTo(newCenter);
              map.setZoom(15);
            }
          },
          (error) => {
            console.error('位置情報の取得に失敗しました:', error);
            toast.error('位置情報の取得に失敗しました。ブラウザの位置情報へのアクセスを許可してください。');
          }
        );
      } else {
        toast.error('このブラウザは位置情報に対応していません。');
      }
    },
    panToLocation: (lat: number, lng: number, zoom = 15) => {
      const newCenter = { lat, lng };
      setCenter(newCenter);
      setZoom(zoom);
      if (map) {
        map.panTo(newCenter);
        map.setZoom(zoom);
      }
    },
    zoomIn: () => {
      if (map) {
        const currentZoom = map.getZoom() || 7;
        const newZoom = Math.min(currentZoom + 1, 20); // 最大ズーム20
        setZoom(newZoom);
        map.setZoom(newZoom);
      }
    },
    zoomOut: () => {
      if (map) {
        const currentZoom = map.getZoom() || 7;
        const newZoom = Math.max(currentZoom - 1, 1); // 最小ズーム1
        setZoom(newZoom);
        map.setZoom(newZoom);
      }
    },
  }));

  useEffect(() => {
    // 外部からpostsが渡されている場合はAPIを呼ばない
    if (externalPosts !== undefined) return;

    fetch("/api/posts")
      .then(res => res.json())
      .then(data => {
        if (data.posts) {
          // location フィールドに緯度経度がある投稿のみをフィルター
          setInternalPosts(data.posts.filter((p: MapPost) => p.location && p.location.lat && p.location.lng));
        }
      })
      .catch(err => {
        console.error('投稿の取得に失敗しました:', err);
      });
  }, [externalPosts]);

  if (!isLoaded) return (
    <div className="h-full flex items-center justify-center">
      <LoadingSpinner message="マップを読み込み中..." size="md" />
    </div>
  );

  return (
    <div className="relative w-full h-full">
      {/* 検索バー（地図の上にオーバーレイ） */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-full max-w-md px-4">
        <div className="flex gap-2 bg-white rounded-lg shadow-lg p-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="住所や場所を検索..."
              className="w-full px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSearching}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="クリア"
              >
                <X size={18} />
              </button>
            )}
          </div>
          <button
            onClick={handleSearchLocation}
            disabled={isSearching || !searchQuery.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 font-medium"
          >
            <Search size={18} />
            {isSearching ? '検索中...' : '検索'}
          </button>
        </div>
      </div>

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={zoom}
        onClick={handleMapClick}
        onLoad={(map) => setMap(map)}
        options={{
          mapTypeControl: false,
        }}
      >
        {posts.filter(post => post.location).map((post, idx) => {
          // 内部のselectedPostまたは外部から渡されたselectedPostIdで選択判定
          const isSelected = (selectedPost && selectedPost._id === post._id) ||
                            (selectedPostId && selectedPostId === post._id);
          return (
            <Marker
              key={idx}
              position={{
                lat: post.location!.lat,
                lng: post.location!.lng,
              }}
              onClick={() => handleMarkerClick(post)}
              title={post.title}
              icon={
                isSelected
                  ? {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                      <svg width="80" height="92" viewBox="0 0 80 92" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
                            <feOffset dx="0" dy="2" result="offsetblur"/>
                            <feComponentTransfer>
                              <feFuncA type="linear" slope="0.3"/>
                            </feComponentTransfer>
                            <feMerge>
                              <feMergeNode/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                        </defs>
                        <circle cx="40" cy="40" r="18" fill="#EF4444" opacity="0.3">
                          <animate attributeName="r" values="18;35;18" dur="1.5s" repeatCount="indefinite"/>
                          <animate attributeName="opacity" values="0.3;0;0.3" dur="1.5s" repeatCount="indefinite"/>
                        </circle>
                        <path d="M40 24c-7.73 0-14 6.27-14 14 0 10.5 14 26 14 26s14-15.5 14-26c0-7.73-6.27-14-14-14z"
                              fill="#EF4444" filter="url(#shadow)"/>
                        <circle cx="40" cy="38" r="6" fill="white"/>
                      </svg>
                    `),
                    scaledSize: new google.maps.Size(80, 92),
                    anchor: new google.maps.Point(40, 72),
                  }
                  : undefined
              }
            />
          );
        })}
      </GoogleMap>
    </div>
  );
});

Map.displayName = 'Map';

export default Map;