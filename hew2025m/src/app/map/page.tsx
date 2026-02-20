'use client';
import dynamic from 'next/dynamic';
import { decodeHtmlEntities } from '@/lib/sanitize';
import { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin, Navigation, ExternalLink, User, Fish, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';

// 直接インポート（軽量コンポーネント）
import Button from '@/components/ui/Button';
import LoginRequiredModal from '@/components/user/LoginRequiredModal';

// 動的インポート（重いコンポーネント - Google Maps API等）
const Map = dynamic(() => import('@/components/map/Map'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3"></div>
        <p className="text-gray-500 text-sm">マップを読み込み中...</p>
      </div>
    </div>
  )
});

const WeatherWidget = dynamic(() => import('@/components/map/WeatherWidget'), {
  ssr: false,
  loading: () => <div className="h-24 animate-pulse bg-gray-100 rounded-lg" />
});

const TideWidget = dynamic(() => import('@/components/map/TideWidget'), {
  ssr: false,
  loading: () => <div className="h-16 animate-pulse bg-gray-100 rounded-lg" />
});

// MapRefとMapPostの型をインポート
import type { MapRef, MapPost } from '@/components/map/Map';

// SelectedPostはMapPostを拡張して、ページ内で必要なプロパティを必須化
type SelectedPost = MapPost;

interface AuthorProfile {
  displayName: string;
  username: string;
  photoURL?: string;
}

export default function MapPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const mapRef = useRef<MapRef>(null);
  const [selectedPost, setSelectedPost] = useState<SelectedPost | null>(null);
  const [clickedLocation, setClickedLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [authorProfile, setAuthorProfile] = useState<AuthorProfile | null>(null);
  const [isLoadingAuthor, setIsLoadingAuthor] = useState(false);
  const [postsAtSameLocation, setPostsAtSameLocation] = useState<SelectedPost[]>([]);
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [allPosts, setAllPosts] = useState<SelectedPost[]>([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginRequiredAction, setLoginRequiredAction] = useState('');

  // 全投稿を取得
  useEffect(() => {
    fetch('/api/posts')
      .then(res => res.json())
      .then(data => {
        if (data.posts) {
          setAllPosts(data.posts.filter((p: SelectedPost) => p.location && p.location.lat && p.location.lng));
        }
      })
      .catch(err => {
        console.error('投稿の取得に失敗しました:', err);
      });
  }, []);

  // マーカークリック処理
  const handleMarkerClick = useCallback((post: SelectedPost) => {
    // 同じ位置にある投稿を検索（緯度経度が完全一致するもの）
    const postsAtLocation = allPosts.filter(
      p => p.location &&
           post.location &&
           Math.abs(p.location.lat - post.location.lat) < 0.0001 &&
           Math.abs(p.location.lng - post.location.lng) < 0.0001
    );

    setPostsAtSameLocation(postsAtLocation);

    // クリックされた投稿のインデックスを見つける
    const clickedIndex = postsAtLocation.findIndex(p => p._id === post._id);
    setCurrentPostIndex(clickedIndex >= 0 ? clickedIndex : 0);

    setSelectedPost(post);

    // 投稿に位置情報がある場合は、クリックした場所として設定
    if (post.location && post.address) {
      setClickedLocation({
        lat: post.location.lat,
        lng: post.location.lng,
        address: post.address
      });

      // 地図を投稿の位置に移動
      if (mapRef.current) {
        mapRef.current.panToLocation(post.location.lat, post.location.lng, 15);
      }
    } else {
      setClickedLocation(null);
    }
  }, [allPosts]);

  // URLパラメータから投稿IDを取得して該当投稿を選択
  useEffect(() => {
    const postId = searchParams.get('postId');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const address = searchParams.get('address');

    // 投稿データとmapRefが読み込まれるまで待つ
    if (allPosts.length === 0 || !mapRef.current) return;

    if (postId) {
      // 投稿IDから該当投稿を検索
      const targetPost = allPosts.find(p => p._id === postId);

      if (targetPost) {
        // 該当投稿が見つかった場合、handleMarkerClickを呼び出す
        handleMarkerClick(targetPost);
      }
    } else if (lat && lng) {
      // postIdがない場合は従来通り位置情報のみで移動
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      if (!isNaN(latitude) && !isNaN(longitude)) {
        // 地図を指定された位置に移動
        mapRef.current.panToLocation(latitude, longitude, 15);

        // クリックした場所として設定
        if (address) {
          setClickedLocation({
            lat: latitude,
            lng: longitude,
            address: decodeURIComponent(address)
          });
        }
      }
    }
  }, [searchParams, allPosts, handleMarkerClick]);

  // 前の投稿に移動
  const handlePreviousPost = () => {
    if (currentPostIndex > 0) {
      const newIndex = currentPostIndex - 1;
      setCurrentPostIndex(newIndex);
      setSelectedPost(postsAtSameLocation[newIndex]);
    }
  };

  // 次の投稿に移動
  const handleNextPost = () => {
    if (currentPostIndex < postsAtSameLocation.length - 1) {
      const newIndex = currentPostIndex + 1;
      setCurrentPostIndex(newIndex);
      setSelectedPost(postsAtSameLocation[newIndex]);
    }
  };

  // 投稿者情報を取得
  useEffect(() => {
    const fetchAuthorProfile = async () => {
      if (!selectedPost) {
        setAuthorProfile(null);
        return;
      }

      setIsLoadingAuthor(true);
      try {
        const userId = (selectedPost.authorId || '').replace('user-', '');
        const userDoc = await getDoc(doc(db, 'users', userId));

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setAuthorProfile({
            displayName: userData.displayName || 'ユーザー',
            username: userData.username || '',
            photoURL: userData.photoURL,
          });
        } else {
          setAuthorProfile({
            displayName: selectedPost.authorName || 'ユーザー',
            username: '',
            photoURL: undefined,
          });
        }
      } catch (error) {
        // permission-deniedエラーの場合は静かに処理（ログアウト時など）
        if (error && typeof error === 'object' && 'code' in error && error.code === 'permission-denied') {
          // エラーを静かに処理
        } else {
          console.error('投稿者情報の取得に失敗しました:', error);
        }
        setAuthorProfile({
          displayName: selectedPost.authorName || 'ユーザー',
          username: '',
          photoURL: undefined,
        });
      } finally {
        setIsLoadingAuthor(false);
      }
    };

    fetchAuthorProfile();
  }, [selectedPost]);

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

        // 郵便番号（例：〒123-4567、123-4567）を除外
        formattedAddress = formattedAddress.replace(/〒?\d{3}-?\d{4}\s*/g, '');

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

  const handleCurrentLocation = () => {
    if (mapRef.current) {
      mapRef.current.moveToCurrentLocation();
    }
  };

  return (
    <div className="min-h-screen flex flex-col">

      <div className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
          <aside className="lg:col-span-1 bg-white rounded-lg shadow-sm border order-2 lg:order-first flex flex-col lg:h-[calc(100vh-8rem)] lg:max-h-[800px]">
            <div className="bg-gray-50 px-3 sm:px-4 py-2.5 sm:py-3 rounded-t-lg border-b">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-semibold text-sm sm:text-base">
                  <MapPin size={16} className="text-blue-600 sm:w-[18px] sm:h-[18px]" />
                  投稿情報
                </h3>
                {postsAtSameLocation.length > 1 && selectedPost && (
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                      onClick={handlePreviousPost}
                      disabled={currentPostIndex === 0}
                      className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 ${currentPostIndex === 0 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
                      aria-label="前の投稿"
                    >
                      <ChevronLeft size={14} className="sm:w-4 sm:h-4" />
                    </button>
                    <span className="text-[10px] sm:text-xs text-gray-600 font-medium min-w-[50px] sm:min-w-[60px] text-center">
                      {currentPostIndex + 1} / {postsAtSameLocation.length}
                    </span>
                    <button
                      onClick={handleNextPost}
                      disabled={currentPostIndex === postsAtSameLocation.length - 1}
                      className={`p-1.5 sm:p-2 rounded-lg transition-all duration-200 ${currentPostIndex === postsAtSameLocation.length - 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
                      aria-label="次の投稿"
                    >
                      <ChevronRight size={14} className="sm:w-4 sm:h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {!selectedPost ? (
                <div className="p-3 sm:p-4 text-center py-8 sm:py-10 text-gray-500">
                  <MapPin size={40} className="mx-auto mb-3 sm:mb-4 text-gray-400 sm:w-12 sm:h-12" />
                  <p className="text-xs sm:text-sm">マップ上のマーカーをクリックして</p>
                  <p className="text-xs sm:text-sm">投稿情報を表示</p>
                </div>
              ) : (
                <>
                  {/* 画像エリア */}
                  <Link href={`/post-detail/${selectedPost._id}`} className="block group">
                  <div className="relative h-32 sm:h-40 bg-gray-200 flex items-center justify-center overflow-hidden">
                    {selectedPost.media && selectedPost.media.length > 0 ? (
                      <Image
                        src={selectedPost.media.sort((a, b) => a.order - b.order)[0].url}
                        alt={selectedPost.title}
                        width={400}
                        height={160}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <>
                        <Fish size={32} className="text-gray-400 sm:w-10 sm:h-10" />
                        <span className="text-gray-500 text-xs sm:text-sm ml-2">画像がありません</span>
                      </>
                    )}
                  </div>
                </Link>

                {/* コンテンツエリア */}
                <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                  <Link href={`/post-detail/${selectedPost._id}`} className="block group">
                    <h4 className="font-bold text-base sm:text-xl mb-1.5 sm:mb-2 line-clamp-2 text-gray-900 group-hover:text-blue-600 transition-colors">{selectedPost.title}</h4>
                    <p className="px-1 text-gray-600 text-xs sm:text-sm line-clamp-3 leading-relaxed">
                      {selectedPost.content}
                    </p>
                  </Link>

                  {/* 投稿者情報 */}
                  {isLoadingAuthor ? (
                    <div className="flex items-center gap-2.5 sm:gap-3 py-2.5 sm:py-3 border-y border-gray-100">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="flex-1">
                        <div className="h-3.5 sm:h-4 bg-gray-200 rounded w-20 sm:w-24 mb-1 animate-pulse"></div>
                        <div className="h-3 bg-gray-200 rounded w-14 sm:w-16 animate-pulse"></div>
                      </div>
                    </div>
                  ) : authorProfile ? (
                    <Link
                      href={`/profile/${(selectedPost.authorId || '').replace('user-', '')}`}
                      className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 border-y border-gray-100 rounded-lg bg-white hover:bg-gray-50 hover:border-[#2FA3E3] transition-all duration-200 group/author"
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center flex-shrink-0 border-2 border-gray-200 group-hover/author:border-[#2FA3E3] transition-all duration-200">
                        {authorProfile.photoURL ? (
                          <Image
                            src={decodeHtmlEntities(authorProfile.photoURL)}
                            alt={authorProfile.displayName}
                            width={40}
                            height={40}
                            quality={90}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={16} className="text-blue-600 sm:w-5 sm:h-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm font-semibold text-gray-800 group-hover/author:text-[#2FA3E3] transition-colors truncate">
                          {authorProfile.displayName}
                        </div>
                        {authorProfile.username && (
                          <div className="text-[10px] sm:text-xs text-gray-500 group-hover/author:text-gray-700 transition-colors truncate">@{authorProfile.username}</div>
                        )}
                      </div>
                    </Link>
                  ) : null}

                  {/* 位置情報 */}
                  <div className="space-y-2.5 sm:space-y-3">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <MapPin size={14} className="text-blue-600 flex-shrink-0 sm:w-4 sm:h-4" />
                      <span className="text-xs sm:text-sm font-bold text-gray-800">位置情報</span>
                    </div>
                    <div className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm pl-4 sm:pl-6">
                      <div className="space-y-0.5 sm:space-y-1">
                        <span className="text-gray-500 text-[10px] sm:text-xs block">住所</span>
                        <span className="font-medium text-gray-900 block break-words">{selectedPost.address || '住所未設定'}</span>
                      </div>
                      <div className="space-y-0.5 sm:space-y-1">
                        <span className="text-gray-500 text-[10px] sm:text-xs block">投稿日</span>
                        <span className="font-medium text-gray-900 block">{selectedPost.createdAt ? new Date(selectedPost.createdAt).toLocaleDateString('ja-JP') : '日付未設定'}</span>
                      </div>
                    </div>
                  </div>

                  <Link href={`/post-detail/${selectedPost._id}`}>
                    <Button variant="primary" size="md" className="w-full text-xs sm:text-sm" icon={<ExternalLink size={14} className="sm:w-4 sm:h-4" />}>
                      投稿詳細を見る
                    </Button>
                  </Link>
                </div>
              </>
            )}
            </div>
          </aside>

          {/* 地図と新しい場所を選択のコンテナ */}
          <div className="contents lg:col-span-2 lg:block lg:space-y-4 xl:space-y-6 order-1 lg:order-last">
            {/* 地図の枠 */}
            <section className="bg-white rounded-lg shadow-sm border order-1">
              <div className="bg-gray-50 px-3 sm:px-4 py-2.5 sm:py-3 rounded-t-lg border-b flex justify-between items-center">
                <h3 className="flex items-center gap-1.5 sm:gap-2 font-semibold text-sm sm:text-base">
                  <MapPin size={16} className="text-blue-600 sm:w-[18px] sm:h-[18px]" />
                  マップ
                </h3>
                <Button
                  variant="outline"
                  size="md"
                  className="bg-white border text-xs sm:text-sm"
                  icon={<Navigation size={12} className="sm:w-3.5 sm:h-3.5" />}
                  onClick={handleCurrentLocation}
                >
                  現在地
                </Button>
              </div>

              <div className="relative overflow-hidden rounded-b-lg">
                <div className="h-64 sm:h-80 md:h-96">
                  <Map
                    ref={mapRef}
                    onMarkerClick={handleMarkerClick}
                    onMapClick={handleMapClick}
                    posts={allPosts}
                    selectedPostId={selectedPost?._id || null}
                  />
                </div>
              </div>
            </section>

            {/* 新しい場所で投稿の枠 */}
            <section className="bg-white rounded-lg shadow-sm border order-3">
            <div className="bg-gray-50 px-3 sm:px-4 py-2.5 sm:py-3 rounded-t-lg border-b">
              <h3 className="flex items-center gap-1.5 sm:gap-2 font-semibold text-sm sm:text-base">
                <Navigation size={16} className="text-blue-600 sm:w-[18px] sm:h-[18px]" />
                新しい場所を選択
              </h3>
            </div>

            <div className="p-3 sm:p-4 min-h-[120px] sm:min-h-[150px] flex flex-col justify-center">
              {!clickedLocation ? (
                <p className="text-gray-500 text-xs sm:text-sm text-center">
                  地図上の任意の場所をクリックして、その場所で投稿を作成できます
                </p>
              ) : (
                // レイアウトを7:3の比率で分割
                <div className="grid grid-cols-10 gap-3 sm:gap-4">
                  {/* 左側 (7割): 場所の情報と投稿ボタン */}
                  <div className="col-span-10 lg:col-span-6">
                    {isLoadingAddress ? (
                      <p className="text-gray-500 text-xs sm:text-sm">住所を取得中...</p>
                    ) : (
                      <div className="space-y-3 sm:space-y-4">
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4">
                          <div className="flex items-start gap-2.5 sm:gap-3 mb-3 sm:mb-4">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <MapPin size={16} className="text-blue-600 sm:w-5 sm:h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] sm:text-xs text-gray-500 mb-1 sm:mb-1.5 font-medium">選択した場所</p>
                              <p className="text-sm sm:text-base font-bold text-gray-900 line-clamp-2 leading-relaxed">{clickedLocation.address}</p>
                            </div>
                          </div>

                          <div className="pt-2.5 sm:pt-3 border-t border-gray-200">
                            <TideWidget latitude={clickedLocation.lat} longitude={clickedLocation.lng} />
                          </div>
                        </div>

                        <Button
                          onClick={() => {
                            if (!user) {
                              setLoginRequiredAction('この場所で投稿を作成');
                              setShowLoginModal(true);
                            } else {
                              router.push(`/post?lat=${clickedLocation.lat}&lng=${clickedLocation.lng}&address=${encodeURIComponent(clickedLocation.address)}`);
                            }
                          }}
                          variant="primary"
                          size="md"
                          className="w-full text-xs sm:text-sm"
                          icon={<Plus size={14} className="sm:w-4 sm:h-4" />}
                          disabled={isLoadingAddress}
                        >
                          この場所で投稿を作成
                        </Button>
                      </div>
                    )}
                  </div>
                  {/* 右側 (3割): 天気情報 */}
                  <div className="col-span-10 lg:col-span-4">
                    <WeatherWidget latitude={clickedLocation.lat} longitude={clickedLocation.lng} />
                  </div>
                </div>
              )}
            </div>
          </section>
          </div>
        </main>
      </div>

      {/* ログイン必須モーダル */}
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        action={loginRequiredAction}
      />
    </div>
  );
}
