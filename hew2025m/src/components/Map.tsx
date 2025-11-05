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

const Map: React.FC = () => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const [posts, setPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/posts")
      .then(res => res.json())
      .then(data => {
        if (data.posts) {
          setPosts(data.posts.filter((p: any) => p.locationData && p.locationData.lat && p.locationData.lng));
        }
      });
  }, []);

  if (!isLoaded) return <div>Carregando mapa...</div>;

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
            lat: post.locationData.lat,
            lng: post.locationData.lng,
          }}
          onClick={() => setSelectedPost(post)}
          title={post.title}
        />
      ))}
      {selectedPost && (
        <InfoWindow
          position={{
            lat: selectedPost.locationData.lat,
            lng: selectedPost.locationData.lng,
          }}
          onCloseClick={() => setSelectedPost(null)}
        >
          <div>
            <h3 style={{ fontWeight: 'bold', marginBottom: 6 }}>{selectedPost.title}</h3>
            <p style={{ fontSize: 12, color: '#444' }}>{selectedPost.locationData.address}</p>
            <p style={{ fontSize: 14 }}>{selectedPost.content}</p>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
};

export default Map;