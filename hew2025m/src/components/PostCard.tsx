import Link from 'next/link';
import Image from 'next/image';
import { Fish, MapPin, Heart, MessageCircle, User } from 'lucide-react';

export interface Post {
  id: string;
  title: string;
  excerpt: string;
  fishName: string;
  fishSize: string;
  fishWeight?: string;
  fishCount?: string;
  location: string;
  author: string;
  date: string;
  likes: number;
  comments: number;
  category: 'sea' | 'river';
  isLiked?: boolean;
  imageUrl?: string;
}

interface PostCardProps {
  post: Post;
  variant?: 'default' | 'simple' | 'compact';
}

export default function PostCard({ post, variant = 'default' }: PostCardProps) {
  if (variant === 'simple') {
    return (
      <Link href={`/postDetail/${post.id}`}>
        <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
          <div className="flex gap-4">
            {/* 画像 */}
            <div className="w-32 h-32 flex-shrink-0 bg-gray-200 flex items-center justify-center">
              {post.imageUrl ? (
                <Image src={post.imageUrl} alt={post.title} width={128} height={128} quality={90} className="w-full h-full object-cover" />
              ) : (
                <Fish size={24} className="text-gray-400" />
              )}
            </div>

            {/* コンテンツ */}
            <div className="flex-1 p-4">
              <h3 className="font-semibold text-lg mb-2 line-clamp-1">{post.title}</h3>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{post.excerpt}</p>

              {/* 位置情報 */}
              {post.location && post.location !== '場所未設定' && (
                <div className="flex items-center text-xs text-gray-500 mb-2">
                  <MapPin size={12} className="mr-1" />
                  {post.location}
                </div>
              )}

              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>{post.author}</span>
                <span>{post.date}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link href={`/postDetail/${post.id}`}>
        <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
          {/* 画像 */}
          {post.imageUrl && (
            <div className="h-64 bg-gray-200 flex items-center justify-center overflow-hidden">
              <Image src={post.imageUrl} alt={post.title} width={800} height={600} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="p-8">
            <h3 className="font-semibold text-xl mb-3">{post.title}</h3>
            <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>

            {/* 位置情報 */}
            {post.location && post.location !== '場所未設定' && (
              <div className="flex items-center text-sm text-gray-600 mb-4">
                <MapPin size={14} className="mr-1" />
                {post.location}
              </div>
            )}

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User size={16} className="text-gray-600" />
                </div>
                <span className="text-sm font-medium">{post.author}</span>
              </div>
              <span className="text-sm text-gray-500">{post.date}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/postDetail/${post.id}`}>
      <article className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer">
        <div className="relative">
          <div className="h-48 bg-gray-200 rounded-t-lg flex items-center justify-center overflow-hidden">
            {post.imageUrl ? (
              <Image src={post.imageUrl} alt={post.title} width={800} height={600} className="w-full h-full object-cover" />
            ) : (
              <>
                <div className="aspect-video bg-gray-200 rounded-lg flex flex-col items-center justify-center">
                  <Fish size={64} className="text-gray-400 mb-3" />
                  <p className="text-gray-500 text-sm">画像がありません</p>
                </div>
              </>
            )}
          </div>
          <div className={`absolute top-3 left-3 px-2 py-1 rounded text-xs font-medium text-white ${post.category === 'sea' ? 'bg-blue-500' : 'bg-green-500'
            }`}>
            {post.category === 'sea' ? '海釣り' : '川釣り'}
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">{post.title}</h3>
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">{post.excerpt}</p>

          <div className="space-y-3 mb-4">
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="bg-gray-100 px-2 py-1 rounded">{post.fishName}</span>
              <span className="bg-gray-100 px-2 py-1 rounded">{post.fishSize}</span>
              {post.fishWeight && (
                <span className="bg-gray-100 px-2 py-1 rounded">{post.fishWeight}</span>
              )}
              {post.fishCount && (
                <span className="bg-gray-100 px-2 py-1 rounded">{post.fishCount}</span>
              )}
            </div>

            <div className="flex items-center text-sm text-gray-600">
              <MapPin size={14} className="mr-1" />
              {post.location}
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                <User size={12} className="text-gray-600" />
              </div>
              <span className="text-sm font-medium">{post.author}</span>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>{post.date}</span>
              <div className="flex items-center gap-3">
                <button className={`flex items-center gap-1 ${post.isLiked ? 'text-red-500' : 'hover:text-red-500'} transition-colors`}>
                  <Heart size={14} className={post.isLiked ? 'fill-current' : ''} />
                  <span>{post.likes}</span>
                </button>
                <button className="flex items-center gap-1 hover:text-blue-500 transition-colors">
                  <MessageCircle size={14} />
                  <span>{post.comments}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}