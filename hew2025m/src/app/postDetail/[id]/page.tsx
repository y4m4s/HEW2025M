'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { Fish, MapPin, Heart, MessageCircle, User, Calendar, ArrowLeft } from 'lucide-react';
import Button from '@/components/Button';
import Comment from '@/components/Comment';

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
  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchPost();
    }
  }, [params.id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/posts/${params.id}`);
      if (!response.ok) {
        throw new Error('投稿の取得に失敗しました');
      }

      const data = await response.json();
      setPost(data.post);
    } catch (err) {
      console.error('投稿取得エラー:', err);
      setError(err instanceof Error ? err.message : '投稿の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

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
              <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${
                post.category === 'sea' ? 'bg-blue-500' : 'bg-green-500'
              }`}>
                {getCategoryLabel(post.category)}
              </span>
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Calendar size={16} />
                <span>{formatDate(post.createdAt)}</span>
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-800 mb-4">{post.title}</h1>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <User size={20} className="text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-800">{post.authorName}</p>
              </div>
            </div>
          </div>

          {/* 画像ギャラリー */}
          {post.media && post.media.length > 0 && (
            <div className="bg-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4">
                {post.media.map((item, index) => (
                  <div key={index} className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                    {item.mimeType.startsWith('image/') ? (
                      <Image
                        src={item.url}
                        alt={`投稿画像${index + 1}`}
                        width={600}
                        height={600}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Fish size={48} className="text-gray-400" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
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
                className={`flex items-center gap-2 ${
                  isLiked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
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
    </div>
  );
}
