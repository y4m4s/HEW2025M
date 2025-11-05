'use client';

import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { X, MapPin, Navigation } from 'lucide-react';
import Button from './Button';

const containerStyle = {
  width: '100%',
  height: '400px',
};

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
          setSelectedPosition({ lat, lng });
          // 緯度経度から住所を取得
          getAddressFromLatLng(lat, lng);
        },
        (error) => {
          console.error('現在地の取得に失敗しました:', error);
          alert('現在地を取得できませんでした。位置情報の使用を許可してください。');
        }
      );
    } else {
      alert('お使いのブラウザは位置情報に対応していません。');
    }
  }, [getAddressFromLatLng]);

  // 位置情報を確定
  const handleConfirm = useCallback(() => {
    if (selectedPosition) {
      // 住所が取得できていない場合は警告
      if (!address) {
        alert('住所を取得できませんでした。別の位置を選択してください。');
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full my-8">
        {/* ヘッダー */}
        <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MapPin size={20} className="text-blue-600" />
            位置情報を選択
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
          {/* 案内メッセージ */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800 flex items-center gap-2">
              <MapPin size={16} className="text-blue-600" />
              地図上をクリックして位置を選択してください
            </p>
          </div>

          {/* 選択された住所（自動生成・表示専用） */}
          {selectedPosition && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                選択された位置
              </label>
              <div className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800">
                {isLoadingAddress ? (
                  <span className="text-gray-500">住所を取得中...</span>
                ) : (
                  address || '住所を取得できませんでした'
                )}
              </div>
            </div>
          )}

          {/* 選択された位置情報（緯度経度） */}
          {selectedPosition && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                <div className="text-gray-600 text-xs mb-1">緯度</div>
                <div className="font-medium text-sm">{selectedPosition.lat.toFixed(6)}</div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                <div className="text-gray-600 text-xs mb-1">経度</div>
                <div className="font-medium text-sm">{selectedPosition.lng.toFixed(6)}</div>
              </div>
            </div>
          )}

          {/* マップ */}
          <div className="mb-4">
            {isLoaded ? (
              <div className="border rounded-lg overflow-hidden">
                <GoogleMap
                  mapContainerStyle={containerStyle}
                  center={selectedPosition || defaultCenter}
                  zoom={selectedPosition ? 15 : 12}
                  onClick={handleMapClick}
                >
                  {selectedPosition && <Marker position={selectedPosition} />}
                </GoogleMap>
              </div>
            ) : (
              <div className="h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">マップを読み込み中...</p>
              </div>
            )}
          </div>

          {/* フッター */}
          <div className="bg-gray-50 px-6 py-4 border-t flex justify-between">
            {/* 現在地ボタン */}
            <Button
              variant="outline"
              size="md"
              onClick={handleGetCurrentLocation}
              icon={<Navigation size={16} />}
              className="w-full sm:w-auto"
            >
              現在地を取得
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" size="md" onClick={onClose}>
                キャンセル
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleConfirm}
                disabled={!selectedPosition || !address || isLoadingAddress}
              >
                この位置に決定
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapModal;
