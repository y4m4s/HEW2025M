import React, { useEffect, useState } from "react";
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "400px",
};

const center = {
  lat: 35.6895,
  lng: 139.6917,
};

interface MapProps {
  onMarkerClick?: (post: any) => void;
}

const Map: React.FC<MapProps> = ({ onMarkerClick }) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const [posts, setPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  const handleMarkerClick = (post: any) => {
    setSelectedPost(post);
    if (onMarkerClick) {
      onMarkerClick(post);
    }
  };

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
      zoom={7}
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
};

export default Map;