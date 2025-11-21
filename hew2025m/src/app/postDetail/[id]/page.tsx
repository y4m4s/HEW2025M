'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Fish, MapPin, Heart, MessageCircle, User, Calendar, ArrowLeft, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '@/components/Button';
import Comment from '@/components/Comment';
import ImageModal from '@/components/ImageModal';
import { useAuth } from '@/lib/useAuth';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface PostDetail {
  _id: string;
  title: string;
  content: string;
  category?: string;
  media?: Array<{
    url: string;
    mimeType: string;
  }>;
  authorId: string;
  authorName: string;
  tags?: string[];
  address?: string;
  location?: {
    lat: number;
    lng: number;
  };
  likes?: number;
  comments?: Array<{
    userId: string;
    userName: string;
    content: string;
    createdAt: Date;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [authorPhotoURL, setAuthorPhotoURL] = useState<string | undefined>(undefined);

  const fetchPost = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/posts/${params.id}`);
      if (!response.ok) {
        throw new Error('投稿の取得に失敗しました');
      }

      const data = await response.json();
      setPost(data.post);

      // 投稿者のアイコン画像を取得
      if (data.post.authorId) {
        const uid = data.post.authorId.startsWith('user-')
          ? data.post.authorId.replace('user-', '')
          : data.post.authorId;

        try {
          const userDocRef = doc(db, 'users', uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setAuthorPhotoURL(userData.photoURL || undefined);
          }
        } catch (error) {
          console.error('ユーザー情報取得エラー:', error);
        }
      }
    } catch (err) {
      console.error('投稿取得エラー:', err);
      setError(err instanceof Error ? err.message : '投稿の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id) {
      fetchPost();
    }
  }, [params.id, fetchPost]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryLabel = (category?: string): string => {
    if (category === 'sea') return '海釣り';
    if (category === 'river') return '川釣り';
    return 'その他';
  };

  const handleDelete = async () => {
    if (!post || !user) return;

    // 自分の投稿かどうか確認
    if (post.authorId !== user.uid && post.authorId !== `user-${user.uid}`) {
      alert('自分の投稿のみ削除できます');
      return;
    }

    if (!confirm('この投稿を削除しますか？この操作は取り消せません。')) {
      return;
    }

    try {
      setDeleting(true);
      const response = await fetch(`/api/posts/${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('投稿の削除に失敗しました');
      }

      alert('投稿を削除しました');
      router.push('/community');
    } catch (err) {
      console.error('投稿削除エラー:', err);
      alert(err instanceof Error ? err.message : '投稿の削除に失敗しました');
    } finally {
      setDeleting(false);
    }
  };

  // カルーセルのナビゲーション
    const nextSlide = () => {
      if (post?.media && post.media.length > 0) {
        const len = post.media.length;
        setCurrentSlide((prev) => (prev + 1) % len);
      }
    };
  
    const prevSlide = () => {
      if (post?.media && post.media.length > 0) {
        const len = post.media.length;
        setCurrentSlide((prev) => (prev - 1 + len) % len);
      }
    };
  
    const goToSlide = (index: number) => {
      setCurrentSlide(index);
    };

  // 画像クリック時にモーダルを開く
  const handleImageClick = (index: number) => {
    setModalImageIndex(index);
    setIsModalOpen(true);
  };

  // モーダルを閉じる
  const handleCloseModal = (finalIndex?: number) => {
    setIsModalOpen(false);
    if (finalIndex !== undefined) {
      setCurrentSlide(finalIndex);
    }
  };

  // 自分の投稿かどうかを判定
  const isOwnPost = user && post && (post.authorId === user.uid || post.authorId === `user-${user.uid}`);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
        <p className="text-red-600 mb-4">{error || '投稿が見つかりませんでした'}</p>
        <Button onClick={() => router.back()} variant="primary" size="md">
          戻る
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          onClick={() => router.back()}
          variant="ghost"
          size="sm"
          icon={<ArrowLeft size={16} />}
          className="mb-6"
        >
          戻る
        </Button>

        <article className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* ヘッダー */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${post.category === 'sea' ? 'bg-blue-500' : 'bg-green-500'
                }`}>
                {getCategoryLabel(post.category)}
              </span>
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Calendar size={16} />
                <span>{formatDate(post.createdAt)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-800">{post.title}</h1>
              {isOwnPost && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="投稿を削除"
                >
                  <Trash2 size={20} />
                  <span className="text-sm font-medium">{deleting ? '削除中...' : '削除'}</span>
                </button>
              )}
            </div>

            <Link
              href={`/profile/${post.authorId.startsWith('user-') ? post.authorId.replace('user-', '') : post.authorId}`}
              className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {authorPhotoURL ? (
                  <Image src={authorPhotoURL} alt={post.authorName} width={40} height={40} className="w-full h-full object-cover" />
                ) : (
                  <User size={20} className="text-gray-600" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-800 hover:text-[#2FA3E3] transition-colors">{post.authorName}</p>
              </div>
            </Link>
          </div>

          {/* 画像ギャラリー - カルーセル */}
          {post.media && post.media.length > 0 ? (
            <div className="bg-gray-100 p-4">
              <div className="relative overflow-hidden rounded-lg bg-gray-200">
                <div
                  className="flex transition-transform duration-300 ease-in-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {post.media.map((item, index) => (
                    <div key={index} className="w-full flex-shrink-0">
                      {item.mimeType.startsWith('image/') ? (
                        <Image
                          src={item.url}
                          alt={`投稿画像${index + 1}`}
                          width={800}
                          height={600}
                          className="w-full h-96 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => handleImageClick(index)}
                        />
                      ) : (
                        <div className="w-full h-96 flex items-center justify-center">
                          <Fish size={64} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* ナビゲーションボタン（複数画像がある場合のみ） */}
                {post.media && post.media.length > 1 && (
                  <>
                    <button
                      onClick={prevSlide}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-gray-800/70 hover:bg-gray-800/90 text-white rounded-full p-2 shadow-lg transition-all"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={nextSlide}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-800/70 hover:bg-gray-800/90 text-white rounded-full p-2 shadow-lg transition-all"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
              </div>

              {/* インジケーター（複数画像がある場合のみ） */}
              {post.media && post.media.length > 1 && (
                <div className="flex justify-center mt-4 gap-2">
                  {post.media.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        currentSlide === index ? 'bg-[#2FA3E3]' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-video bg-gray-200 rounded-lg flex flex-col items-center justify-center">
              <Fish size={64} className="text-gray-400 mb-3" />
              <p className="text-gray-500 text-sm">画像がありません</p>
            </div>
          )}

          {/* 本文 */}
          <div className="p-6">
            <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-wrap mb-6">
              {post.content}
            </p>

            {/* タグ */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* 場所 */}
            {post.address && (
              <div className="flex items-center gap-2 text-gray-600 mb-6">
                <MapPin size={20} />
                <span>{post.address}</span>
              </div>
            )}

            {/* アクション */}
            <div className="flex items-center gap-6 pt-4 border-t">
              <button
                onClick={() => setIsLiked(!isLiked)}
                className={`flex items-center gap-2 ${isLiked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
                  } transition-colors`}
              >
                <Heart size={20} className={isLiked ? 'fill-current' : ''} />
                <span>{(post.likes || 0) + (isLiked ? 1 : 0)}</span>
              </button>
              <button className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors">
                <MessageCircle size={20} />
                <span>{post.comments?.length || 0}</span>
              </button>
            </div>
          </div>

          {/* コメントセクション */}
          <div className="p-6 bg-gray-50 border-t">
            <h3 className="text-xl font-bold mb-4">コメント</h3>
            <Comment postId={params.id as string} />
          </div>
        </article>
      </div>

      {/* 画像モーダル */}
      {post.media && post.media.length > 0 && (
        <ImageModal
          images={post.media.filter(item => item.mimeType.startsWith('image/')).map(item => item.url)}
          initialIndex={modalImageIndex}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
