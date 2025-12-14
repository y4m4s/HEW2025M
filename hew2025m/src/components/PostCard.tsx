import Link from 'next/link';
import Image from 'next/image';
import { Fish, MapPin, Heart, MessageCircle, User } from 'lucide-react';

export interface Post {
  id: string;
  title: string;
  excerpt: string;
  location: string;
  author: string;
  authorId?: string;
  authorPhotoURL?: string;
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
        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg hover:transform hover:-translate-y-1 transition-all duration-300 cursor-pointer h-[180px]">
          <div className="flex h-full">
            {/* 画像 */}
            <div className="w-44 h-full flex-shrink-0 bg-gray-200 flex items-center justify-center">
              {post.imageUrl ? (
                <Image src={post.imageUrl} alt={post.title} width={176} height={180} quality={90} className="w-full h-full object-cover" />
              ) : (
                <Fish size={32} className="text-gray-400" />
              )}
            </div>

            {/* コンテンツ */}
            <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
              <div className="flex-1 min-h-0">
                <h3 className="font-semibold text-lg mb-2 line-clamp-1 h-7">{post.title}</h3>
                <p className="text-gray-600 text-sm m-1 line-clamp-2 break-all">{post.excerpt}</p>

              </div>

              {/* 位置情報 - 常に表示（スペースを確保） */}
              <div className="flex items-center text-xs text-gray-500 mx-1 mb-2 h-4">
                {post.location && post.location !== '場所未設定' ? (
                  <>
                    <MapPin size={12} className="mr-1 flex-shrink-0" />
                    <span className="truncate">{post.location}</span>
                  </>
                ) : (
                  <>
                    <MapPin size={14} className="mr-1 flex-shrink-0 text-gray-400" />
                    <span className="text-gray-400">位置情報なし</span>
                  </>
                )}
              </div>

              <div className="flex justify-between items-center text-sm text-gray-500 mt-auto">
                <div className="flex items-center gap-2 min-w-0 mr-2">
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                    {post.authorPhotoURL ? (
                      <Image src={post.authorPhotoURL} alt={post.author} width={24} height={24} quality={90} className="w-full h-full object-cover" />
                    ) : (
                      <User size={12} className="text-gray-600" />
                    )}
                  </div>
                  <span className="truncate">{post.author}</span>
                </div>
                <span className="flex-shrink-0">{post.date}</span>
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
        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg hover:transform hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col">
          {/* 画像 - 固定の高さ */}
          <div className="h-80 bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
            {post.imageUrl ? (
              <Image src={post.imageUrl} alt={post.title} width={800} height={320} className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center">
                <Fish size={64} className="text-gray-400 mb-2" />
                <p className="text-gray-500 text-sm">画像なし</p>
              </div>
            )}
          </div>

          <div className="p-8 flex flex-col flex-1">
            <h3 className="font-semibold text-xl mb-3 line-clamp-2">{post.title}</h3>
            <p className="text-gray-600 ml-2 mb-4 line-clamp-3">{post.excerpt}</p>

            {/* 位置情報 - 常に表示（スペースを確保） */}
            <div className="flex items-center text-sm text-gray-600 ml-2 mb-4 h-5">
              {post.location && post.location !== '場所未設定' ? (
                <>
                  <MapPin size={14} className="mr-1 flex-shrink-0" />
                  <span className="truncate">{post.location}</span>
                </>
              ) : (
                <>
                  <MapPin size={14} className="mr-1 flex-shrink-0 text-gray-400" />
                  <span className="text-gray-400">位置情報なし</span>
                </>
              )}
            </div>

            <div className="flex justify-between items-center mt-auto">
              <div className="flex items-center gap-2 min-w-0 mr-4">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                  {post.authorPhotoURL ? (
                    <Image src={post.authorPhotoURL} alt={post.author} width={32} height={32} quality={90} className="w-full h-full object-cover" />
                  ) : (
                    <User size={16} className="text-gray-600" />
                  )}
                </div>
                <span className="text-sm font-medium truncate">{post.author}</span>
              </div>
              <span className="text-sm text-gray-500 flex-shrink-0">{post.date}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/postDetail/${post.id}`}>
      <article className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-lg hover:transform hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-[420px]">
        <div className="relative flex-shrink-0">
          <div className="h-48 bg-gray-200 rounded-t-lg flex items-center justify-center overflow-hidden">
            {post.imageUrl ? (
              <Image src={post.imageUrl} alt={post.title} width={800} height={192} className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center">
                <Fish size={48} className="text-gray-400 mb-2" />
                <p className="text-gray-500 text-sm">画像なし</p>
              </div>
            )}
          </div>
          <div className={`absolute top-3 left-3 px-2 py-1 rounded text-xs font-medium text-white ${post.category === 'sea' ? 'bg-blue-500' : 'bg-green-500'
            }`}>
            {post.category === 'sea' ? '海釣り' : '川釣り'}
          </div>
        </div>

        <div className="p-4 flex flex-col h-full">
          <div className="mb-2 flex-shrink-0">
            <h3 className="font-semibold text-lg line-clamp-2">{post.title}</h3>
          </div>
          <div className="mb-3 flex-shrink-0">
            <p className="text-gray-600 text-sm line-clamp-3">{post.excerpt}</p>
          </div>

          <div className="flex items-center text-sm text-gray-600 mb-3 flex-shrink-0 mt-auto">
            {post.location && post.location !== '場所未設定' ? (
              <>
                <MapPin size={14} className="mr-1 flex-shrink-0" />
                <span className="truncate">{post.location}</span>
              </>
            ) : (
              <>
                <MapPin size={14} className="mr-1 flex-shrink-0 text-gray-400" />
                <span className="text-gray-400">位置情報なし</span>
              </>
            )}
          </div>

          <div className="flex justify-between items-center pt-3 border-t flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0 mr-2">
              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                {post.authorPhotoURL ? (
                  <Image src={post.authorPhotoURL} alt={post.author} width={24} height={24} quality={90} className="w-full h-full object-cover" />
                ) : (
                  <User size={12} className="text-gray-600" />
                )}
              </div>
              <span className="text-sm font-medium truncate">{post.author}</span>
            </div>

            <div className="flex items-center gap-3 text-sm text-gray-600 flex-shrink-0">
              <span className="hidden sm:block">{post.date}</span>
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1 ${post.isLiked ? 'text-red-500' : ''}`}>
                  <Heart size={14} className={post.isLiked ? 'fill-current' : ''} />
                  <span>{post.likes}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle size={14} />
                  <span>{post.comments}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}