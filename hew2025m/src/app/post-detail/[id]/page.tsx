'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Fish, MapPin, Heart, MessageCircle, Calendar, ArrowLeft, Trash2, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Button, Comment, ImageModal, CancelModal, LoginRequiredModal, UserInfoCard, LikedUsersModal, TagBadge } from '@/components';
import { createPostLikeNotification, deletePostLikeNotification } from '@/lib/notifications';
import { useAuth } from '@/lib/useAuth';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { decodeHtmlEntities } from '@/lib/sanitize';

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
  const [likesCount, setLikesCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [showLikedUsersModal, setShowLikedUsersModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [authorProfile, setAuthorProfile] = useState<{
    uid: string;
    username: string;
    displayName: string;
    bio?: string;
    photoURL?: string;
  } | null>(null);
  const [authorProfileLoading, setAuthorProfileLoading] = useState(false);

  // ログイン必須モーダル
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginRequiredAction, setLoginRequiredAction] = useState('');

  const fetchAuthorProfile = async (authorId: string) => {
    try {
      setAuthorProfileLoading(true);
      const uid = authorId.startsWith('user-') ? authorId.replace('user-', '') : authorId;
      const userDocRef = doc(db, 'users', uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setAuthorProfile({
          uid: uid,
          username: userData.username || '',
          displayName: userData.displayName || '',
          bio: userData.bio || '',
          photoURL: userData.photoURL || undefined,
        });
      }
    } catch (error) {
      // permission-deniedエラーの場合は静かに処理（ログアウト時など）
      if (error && typeof error === 'object' && 'code' in error && error.code === 'permission-denied') {
        // エラーを静かに処理
      } else {
        console.error('投稿者プロフィール取得エラー:', error);
      }
    } finally {
      setAuthorProfileLoading(false);
    }
  };

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

      // 投稿者のプロフィール情報を取得
      if (data.post.authorId) {
        fetchAuthorProfile(data.post.authorId);
      }
    } catch (err) {
      console.error('投稿取得エラー:', err);
      setError(err instanceof Error ? err.message : '投稿の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  // いいね状態をチェック
  const checkLikeStatus = useCallback(async () => {
    if (!user || !params.id) return;
    try {
      const response = await fetch(`/api/posts/${params.id}/likes`);
      if (!response.ok) return;
      const data = await response.json();
      const userLiked = data.likes?.some((like: { userId: string }) => like.userId === user.uid);
      setIsLiked(userLiked);
      setLikesCount(data.count || 0);
    } catch (error) {
      console.error('いいね状態の確認エラー:', error);
    }
  }, [user, params.id]);

  useEffect(() => {
    if (params.id) {
      fetchPost();
      checkLikeStatus();
    }
  }, [params.id, fetchPost, checkLikeStatus]);

  // いいねをトグル
  const handleLikeToggle = async () => {
    if (!user) {
      setLoginRequiredAction('いいね');
      setShowLoginModal(true);
      return;
    }
    if (!post) return;

    setLikeLoading(true);
    try {
      const token = await user.getIdToken();
      if (!token) {
        throw new Error('認証トークンの取得に失敗しました');
      }

      if (isLiked) {
        // いいねを削除
        const response = await fetch(`/api/posts/${params.id}/likes`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error('いいねの削除に失敗しました');
        setIsLiked(false);
        setLikesCount((prev) => Math.max(0, prev - 1));

        // 通知を削除
        if (post.authorId !== user.uid && post.authorId !== `user-${user.uid}`) {
          const authorId = post.authorId.startsWith('user-') ? post.authorId.replace('user-', '') : post.authorId;
          deletePostLikeNotification(authorId, user.uid, params.id as string);
        }

        toast.success('いいねを取り消しました');
      } else {
        // いいねを追加
        const response = await fetch(`/api/posts/${params.id}/likes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: user.uid,
            userName: user.displayName || user.email?.split('@')[0] || '名無しユーザー',
            userPhotoURL: user.photoURL || '',
          }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'いいねの追加に失敗しました');
        }
        setIsLiked(true);
        setLikesCount((prev) => prev + 1);

        // 通知を作成
        if (post.authorId !== user.uid && post.authorId !== `user-${user.uid}`) {
          const authorId = post.authorId.startsWith('user-') ? post.authorId.replace('user-', '') : post.authorId;
          createPostLikeNotification(
            authorId,
            user.uid,
            user.displayName || user.email?.split('@')[0] || '名無しユーザー',
            params.id as string,
            post.title
          );
        }

        toast.success('いいねしました');
      }
    } catch (error) {
      console.error('いいね処理エラー:', error);
      toast.error(error instanceof Error ? error.message : 'いいねの処理に失敗しました');
    } finally {
      setLikeLoading(false);
    }
  };

  // URLハッシュからコメントへスクロール
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash;
      const targetId = hash.substring(1); // #を除去

      // ページの読み込みを待ってからスクロール
      setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // ハイライト効果を追加
          element.classList.add('comment-highlight');
          setTimeout(() => {
            element.classList.remove('comment-highlight');
          }, 2000);
        }
      }, 500);
    }
  }, [post]); // postが読み込まれた後に実行

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const handleDelete = () => {
    if (!post || !user) return;

    // 自分の投稿かどうか確認
    if (post.authorId !== user.uid && post.authorId !== `user-${user.uid}`) {
      toast.error('自分の投稿のみ削除できます');
      return;
    }

    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!post || !user) return;

    try {
      setDeleting(true);

      // Firebaseトークンを取得
      const token = await user.getIdToken();

      const response = await fetch(`/api/posts/${params.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('投稿の削除に失敗しました');
      }

      toast.success('投稿を削除しました');
      setShowDeleteModal(false);
      router.push('/community');
    } catch (err) {
      console.error('投稿削除エラー:', err);
      toast.error(err instanceof Error ? err.message : '投稿の削除に失敗しました');
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto max-w-3xl px-4 py-4 md:py-8">
        <Button
          onClick={() => router.back()}
          variant="ghost"
          size="sm"
          icon={<ArrowLeft size={16} />}
          className="mb-4 md:mb-6 hover:bg-white/80"
        >
          戻る
        </Button>

        <article className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          {/* ヘッダー */}
          <div className="p-5 md:p-7">
            {/* タグと日付 */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {post.tags && post.tags.length > 0 ? (
                post.tags.map((tag, index) => (
                  <TagBadge key={index} tag={tag} size="lg" />
                ))
              ) : (
                <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-gray-300 text-gray-600 shadow-sm">
                  タグなし
                </span>
              )}
              <div className="ml-auto flex items-center gap-2 text-gray-500 text-sm">
                <Calendar size={16} />
                <span>{formatDate(post.createdAt)}</span>
              </div>
            </div>

            {/* タイトルと削除ボタン */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight flex-1">
                {post.title}
              </h1>
              {isOwnPost && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  title="投稿を削除"
                >
                  <Trash2 size={18} />
                  <span className="text-sm font-medium hidden sm:inline">{deleting ? '削除中...' : '削除'}</span>
                </button>
              )}
            </div>
          </div>

          {/* 画像ギャラリー - より大きく表示 */}
          {post.media && post.media.length > 0 ? (
            <div className="relative">
              <div className="relative overflow-hidden bg-gray-900">
                <div
                  className="flex transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {post.media.map((item, index) => (
                    <div key={index} className="w-full flex-shrink-0">
                      {item.mimeType.startsWith('image/') ? (
                        <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                          <Image
                            src={decodeHtmlEntities(item.url)}
                            alt={`投稿画像${index + 1}`}
                            fill
                            sizes="(max-width: 768px) 100vw, 800px"
                            className="object-cover cursor-pointer hover:opacity-95 transition-opacity"
                            onClick={() => handleImageClick(index)}
                            priority={index === 0}
                          />
                        </div>
                      ) : (
                        <div className="w-full flex items-center justify-center bg-gray-800" style={{ aspectRatio: '16/9' }}>
                          <Fish size={64} className="text-gray-600" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* ナビゲーションボタン */}
                {post.media && post.media.length > 1 && (
                  <>
                    <button
                      onClick={prevSlide}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-xl transition-all hover:scale-110"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={nextSlide}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-xl transition-all hover:scale-110"
                    >
                      <ChevronRight size={20} />
                    </button>
                    {/* 画像カウンター */}
                    <div className="absolute top-3 right-3 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {currentSlide + 1} / {post.media.length}
                    </div>
                  </>
                )}
              </div>

              {/* インジケーター */}
              {post.media && post.media.length > 1 && (
                <div className="flex justify-center py-4 gap-2 bg-gray-50">
                  {post.media.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      className={`h-1.5 rounded-full transition-all ${
                        currentSlide === index ? 'w-8 bg-[#2FA3E3]' : 'w-1.5 bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center py-20">
              <Fish size={64} className="text-gray-400 mb-4" />
              <p className="text-gray-500 font-medium">画像がありません</p>
            </div>
          )}

          {/* 本文とアクション */}
          <div className="p-5 md:p-7">
            {/* 本文 */}
            <p className="text-base md:text-lg text-gray-800 leading-relaxed whitespace-pre-wrap mb-5 break-words-safe">
              {post.content}
            </p>

            {/* 場所情報 */}
            {post.address && post.location && (
              <Link
                href={`/map?postId=${post._id}&lat=${post.location.lat}&lng=${post.location.lng}&address=${encodeURIComponent(post.address)}`}
                className="flex items-center gap-3 px-4 py-3 mb-5 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 hover:border-[#2FA3E3] transition-all duration-200 group/location"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center flex-shrink-0 border-2 border-gray-200 group-hover/location:border-[#2FA3E3] transition-all duration-200">
                  <MapPin size={20} className="text-blue-600 group-hover/location:scale-110 transition-transform duration-200" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 mb-0.5">釣り場所</p>
                  <p className="text-sm font-semibold text-gray-900 group-hover/location:text-[#2FA3E3] transition-colors duration-200 truncate">{post.address}</p>
                </div>
                <ExternalLink size={18} className="text-gray-400 flex-shrink-0 opacity-0 group-hover/location:opacity-100 group-hover/location:text-[#2FA3E3] transition-all duration-200" />
              </Link>
            )}
            {post.address && !post.location && (
              <div className="flex items-center gap-3 px-4 py-3 mb-5 border border-gray-200 rounded-lg bg-gray-50">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0 border-2 border-gray-300">
                  <MapPin size={20} className="text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-500 mb-0.5">釣り場所</p>
                  <p className="text-sm font-semibold text-gray-700 truncate">{post.address}</p>
                </div>
              </div>
            )}

            {/* アクションボタン */}
            <div className="flex items-center gap-6 py-4 border-t border-gray-200">
              <button
                onClick={handleLikeToggle}
                disabled={likeLoading}
                className={`flex items-center gap-2.5 px-4 py-2 rounded-full transition-all ${
                  isLiked
                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                    : 'text-gray-600 hover:bg-gray-100'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Heart size={20} className={`${isLiked ? 'fill-current' : ''} transition-transform hover:scale-110`} />
                <span className="font-semibold">{likesCount}</span>
              </button>
              <button
                onClick={() => {
                  const commentSection = document.getElementById('comment-section');
                  if (commentSection) {
                    commentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="flex items-center gap-2.5 px-4 py-2 rounded-full text-gray-600 hover:bg-gray-100 transition-all"
              >
                <MessageCircle size={20} className="transition-transform hover:scale-110" />
                <span className="font-semibold">{commentCount}</span>
              </button>
            </div>

            {/* いいねユーザー表示 */}
            {likesCount > 0 && (
              <div className="pt-2">
                <button
                  onClick={() => setShowLikedUsersModal(true)}
                  className="text-sm text-gray-700 hover:text-blue-600 hover:underline transition-colors font-medium"
                >
                  {likesCount}人がいいねしています
                </button>
              </div>
            )}
          </div>

        </article>

        {/* 投稿者情報 */}
        <div className="mt-6">
          <UserInfoCard
            title="投稿者"
            userProfile={authorProfile}
            loading={authorProfileLoading}
            fallbackName={post.authorName}
            showRating={false}
          />
        </div>

        {/* コメントセクション */}
        <section id="comment-section" className="mt-6 bg-white rounded-2xl shadow-lg p-5 md:p-7 border border-gray-100">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
            <MessageCircle size={24} className="text-blue-600" />
            <h3 className="text-xl md:text-2xl font-bold text-gray-900">コメント</h3>
            {commentCount > 0 && (
              <span className="ml-auto px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                {commentCount}
              </span>
            )}
          </div>
          <Comment
            postId={params.id as string}
            itemOwnerId={post.authorId.startsWith('user-') ? post.authorId.replace('user-', '') : post.authorId}
            itemTitle={post.title}
            onCommentCountChange={setCommentCount}
          />
        </section>
      </div>

      {/* 画像モーダル */}
      {post.media && post.media.length > 0 && (
        <ImageModal
          images={post.media.filter(item => item.mimeType.startsWith('image/')).map(item => decodeHtmlEntities(item.url))}
          initialIndex={modalImageIndex}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}

      {/* 削除確認モーダル */}
      <CancelModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="投稿の削除"
        message="この投稿を本当に削除しますか？この操作は取り消せません。"
        isDeleting={deleting}
      >
        <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-md w-full border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-wrap gap-2">
                {post.tags && post.tags.length > 0 ? (
                  post.tags.slice(0, 2).map((tag, index) => (
                    <TagBadge key={index} tag={tag} size="sm" />
                  ))
                ) : (
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-300 text-gray-600 shadow-sm">
                    タグなし
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                <Calendar size={14} />
                <span>{formatDate(post.createdAt)}</span>
              </div>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-3 line-clamp-2">{post.title}</h3>
            {post.media && post.media.length > 0 && post.media[0].mimeType.startsWith('image/') ? (
              <div className="relative w-full mb-3 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                <Image
                  src={decodeHtmlEntities(post.media[0].url)}
                  alt={post.title}
                  fill
                  sizes="400px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex flex-col items-center justify-center mb-3" style={{ aspectRatio: '16/9' }}>
                <Fish size={48} className="text-gray-400 mb-2" />
                <p className="text-gray-500 text-sm">画像がありません</p>
              </div>
            )}
            <p className="text-gray-700 text-sm line-clamp-3 mb-3 leading-relaxed">{post.content}</p>
            {post.address && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <MapPin size={16} className="text-blue-600 flex-shrink-0" />
                <span className="text-sm text-blue-800 truncate">{post.address}</span>
              </div>
            )}
          </div>
        </div>
      </CancelModal>

      {/* いいねしたユーザー一覧モーダル */}
      <LikedUsersModal
        isOpen={showLikedUsersModal}
        onClose={() => setShowLikedUsersModal(false)}
        postId={params.id as string}
      />

      {/* ログイン必須モーダル */}
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        action={loginRequiredAction}
      />
    </div>
  );
}
