import React, { useEffect, useState, useImperativeHandle, forwardRef } from "react";
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 35.6895,
  lng: 139.6917,
};

interface MapProps {
  onMarkerClick?: (post: any) => void;
  onMapClick?: (lat: number, lng: number) => void;
}

export interface MapRef {
  moveToCurrentLocation: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
}

const Map = forwardRef<MapRef, MapProps>(({ onMarkerClick, onMapClick }, ref) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const [posts, setPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState(defaultCenter);
  const [zoom, setZoom] = useState(7);

  const handleMarkerClick = (post: any) => {
    setSelectedPost(post);
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
            alert('位置情報の取得に失敗しました。ブラウザの位置情報へのアクセスを許可してください。');
          }
        );
      } else {
        alert('このブラウザは位置情報に対応していません。');
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
    fetch("/api/posts")
      .then(res => res.json())
      .then(data => {
        if (data.posts) {
          // location フィールドに緯度経度がある投稿のみをフィルター
          setPosts(data.posts.filter((p: any) => p.location && p.location.lat && p.location.lng));
        }
      })
      .catch(err => {
        console.error('投稿の取得に失敗しました:', err);
      });
  }, []);

  if (!isLoaded) return <div className="h-full flex items-center justify-center text-gray-500">マップを読み込み中...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={zoom}
      onClick={handleMapClick}
      onLoad={(map) => setMap(map)}
    >
      {posts.map((post, idx) => (
        <Marker
          key={idx}
          position={{
            lat: post.location.lat,
            lng: post.location.lng,
          }}
          onClick={() => handleMarkerClick(post)}
          title={post.title}
        />
      ))}
      {selectedPost && (
        <InfoWindow
          position={{
            lat: selectedPost.location.lat,
            lng: selectedPost.location.lng,
          }}
          onCloseClick={() => setSelectedPost(null)}
        >
          <div>
            <h3 style={{ fontWeight: 'bold', marginBottom: 6 }}>{selectedPost.title}</h3>
            <p style={{ fontSize: 12, color: '#444' }}>{selectedPost.address || '住所未設定'}</p>
            <p style={{ fontSize: 14 }}>{selectedPost.content}</p>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
});

Map.displayName = 'Map';

export default Map;