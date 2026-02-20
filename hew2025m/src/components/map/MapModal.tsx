'use client';

import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { X, MapPin, Navigation, Search } from 'lucide-react';
import { Button, LoadingSpinner } from '@/components';
import toast from 'react-hot-toast';

const getContainerStyle = () => ({
  width: '100%',
  height: typeof window !== 'undefined' && window.innerWidth < 640 ? '280px' : '400px',
});

const defaultCenter = {
  lat: 35.6895,
  lng: 139.6917,
};

export interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

interface MapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (location: LocationData) => void;
  initialLocation?: LocationData;
}

const MapModal: React.FC<MapModalProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
  initialLocation,
}) => {
  const [selectedPosition, setSelectedPosition] = useState<google.maps.LatLngLiteral | null>(
    initialLocation ? { lat: initialLocation.lat, lng: initialLocation.lng } : null
  );
  const [address, setAddress] = useState<string>(initialLocation?.address || '');
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>(
    initialLocation ? { lat: initialLocation.lat, lng: initialLocation.lng } : defaultCenter
  );

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  // 緯度経度から住所を取得（Geocoding API使用）
  const getAddressFromLatLng = useCallback(async (lat: number, lng: number) => {
    setIsLoadingAddress(true);
    try {
      const geocoder = new google.maps.Geocoder();
      const result = await geocoder.geocode({
        location: { lat, lng },
        language: 'ja', // 日本語で取得
        region: 'JP',   // 日本地域を優先
      });

      if (result.results[0]) {
        // 日本語住所から国名を除外
        let formattedAddress = result.results[0].formatted_address;

        // Plus Code（例：5XPM+4X）を除外
        formattedAddress = formattedAddress.replace(/[A-Z0-9]{4}\+[A-Z0-9]{2,3}\s*/g, '');

        // 末尾の「日本」または「Japan」を削除
        formattedAddress = formattedAddress.replace(/[、,]\s*(日本|Japan)\s*$/, '');
        formattedAddress = formattedAddress.replace(/^\s*(日本|Japan)[、,]\s*/, '');
        formattedAddress = formattedAddress.replace(/\s+(日本|Japan)\s*$/, '');

        setAddress(formattedAddress.trim());
      } else {
        // 住所が取得できない場合は空文字列を設定
        setAddress('');
      }
    } catch (error) {
      console.error('住所の取得に失敗しました:', error);
      // エラーの場合も空文字列を設定
      setAddress('');
    } finally {
      setIsLoadingAddress(false);
    }
  }, []);

  // 住所から緯度経度を検索
  const handleSearchLocation = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const geocoder = new google.maps.Geocoder();
      const result = await geocoder.geocode({
        address: searchQuery,
        language: 'ja',
        region: 'JP',
      });

      if (result.results[0]) {
        const location = result.results[0].geometry.location;
        const newCenter = {
          lat: location.lat(),
          lng: location.lng(),
        };
        // 地図の中心を移動
        setMapCenter(newCenter);
        // 検索結果の位置にピンを設置
        setSelectedPosition(newCenter);
        // 住所を取得
        getAddressFromLatLng(newCenter.lat, newCenter.lng);
      }
      // 場所が見つからなくてもエラーは表示しない
    } catch {
      // Geocoding APIのエラーはログに出力せず、静かに無視する
      // エラーが発生してもトーストは表示しない
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, getAddressFromLatLng]);

  // マップクリック時の処理
  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setSelectedPosition({ lat, lng });
        // 緯度経度から住所を取得
        getAddressFromLatLng(lat, lng);
      }
    },
    [getAddressFromLatLng]
  );

  // 現在地を取得
  const handleGetCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const newLocation = { lat, lng };
          setSelectedPosition(newLocation);
          setMapCenter(newLocation);
          // 緯度経度から住所を取得
          getAddressFromLatLng(lat, lng);
        },
        (error) => {
          console.error('現在地の取得に失敗しました:', error);
          toast.error('現在地を取得できませんでした。位置情報の使用を許可してください。');
        }
      );
    } else {
      toast.error('お使いのブラウザは位置情報に対応していません。');
    }
  }, [getAddressFromLatLng]);

  // 位置情報を確定
  const handleConfirm = useCallback(() => {
    if (selectedPosition) {
      // 住所が取得できていない場合は警告
      if (!address) {
        toast.error('住所を取得できませんでした。別の位置を選択してください。');
        return;
      }
      onSelectLocation({
        lat: selectedPosition.lat,
        lng: selectedPosition.lng,
        address: address,
      });
      onClose();
    }
  }, [selectedPosition, address, onSelectLocation, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl max-w-3xl w-full max-h-[100vh] flex flex-col overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-gray-50 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b flex justify-between items-center flex-shrink-0">
          <h2 className="text-base sm:text-lg md:text-xl font-bold flex items-center gap-1.5 sm:gap-2">
            <MapPin size={18} className="text-blue-600 sm:w-5 sm:h-5" />
            位置情報を選択
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors p-1"
          >
            <X size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="px-3 sm:px-4 md:px-6 py-3 overflow-y-auto flex-1">
          {/* 住所検索 */}
          <div className="mb-3 sm:mb-4">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              住所で検索
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearchLocation();
                    }
                  }}
                  placeholder="例：愛知県名古屋市"
                  className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm sm:text-base"
                  disabled={isSearching}
                />
              </div>
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleSearchLocation}
                disabled={!searchQuery.trim() || isSearching}
                className="px-4 sm:px-6 w-full sm:w-auto"
              >
                {isSearching ? '検索中...' : '検索'}
              </Button>
            </div>
          </div>

          {/* 選択された住所（自動生成・表示専用） */}
          <div className="mb-3 sm:mb-4">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
              選択された位置
            </label>
            <div className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800 text-sm sm:text-base">
              {isLoadingAddress ? (
                <span className="text-gray-500">住所を取得中...</span>
              ) : selectedPosition && address ? (
                address
              ) : (
                <span className="text-gray-400 text-xs sm:text-sm">地図をクリックするか検索で位置情報を登録してください。</span>
              )}
            </div>
          </div>

          {/* マップ */}
          <div className="mb-4">
            {isLoaded ? (
              <div className="border rounded-lg overflow-hidden">
                <GoogleMap
                  mapContainerStyle={getContainerStyle()}
                  center={mapCenter}
                  zoom={selectedPosition ? 15 : 12}
                  onClick={handleMapClick}
                  options={{
                    mapTypeControl: false,
                  }}
                >
                  {selectedPosition && <Marker position={selectedPosition} />}
                </GoogleMap>
              </div>
            ) : (
              <div className="h-[280px] sm:h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
                <LoadingSpinner message="マップを読み込み中..." size="md" />
              </div>
            )}
          </div>
        </div>

        {/* フッター */}
        <div className="bg-gray-50 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-t flex flex-col sm:flex-row justify-between items-stretch sm:items-center flex-shrink-0 gap-2 sm:gap-3">
          {/* 現在地ボタン */}
          <Button
            variant="outline"
            size="md"
            onClick={handleGetCurrentLocation}
            icon={<Navigation size={16} />}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            現在地を取得
          </Button>
          <div className="flex gap-2 sm:gap-3 order-1 sm:order-2">
            <Button variant="outline" size="md" onClick={onClose} className="flex-1 sm:flex-none">
              キャンセル
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleConfirm}
              disabled={!selectedPosition || !address || isLoadingAddress}
              className="flex-1 sm:flex-none"
            >
              この位置に決定
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapModal;
