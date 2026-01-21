import Link from 'next/link';
import Image from 'next/image';
import { Fish, User } from 'lucide-react';

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
  tags?: string[];
}

interface PostCardProps {
  post: Post;
  variant?: 'default' | 'simple' | 'compact' | 'grid';
}

export default function PostCard({ post, variant = 'default' }: PostCardProps) {
  // Simple variant (Sidebar/Small list) - Keep existing or slight adjust?
  // User asked for specific design "Image on left, Title/Body/Tags/Date/Author on right".
  // This sounds like the new 'default' or a new 'horizontal' variant.
  // Given "PostCard is imported in various places", I should probably keep 'simple' for sidebar small items,
  // but update 'default' to be this new rich horizontal card.

  if (variant === 'simple') {
    return (
      <Link href={`/post-detail/${post.id}`}>
        <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex h-24 overflow-hidden border">
          {/* 画像 */}
          <div className="w-24 h-full flex-shrink-0 bg-gray-100 flex items-center justify-center relative">
            {post.imageUrl ? (
              <Image src={post.imageUrl} alt={post.title} fill className="object-cover" />
            ) : (
              <Fish size={24} className="text-gray-400" />
            )}
          </div>

          {/* コンテンツ */}
          <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
            <h3 className="font-medium text-sm line-clamp-2 leading-tight mb-1">{post.title}</h3>
            <div className="flex justify-between items-center text-xs text-gray-500 mt-auto">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-5 h-5 bg-gray-200 rounded-full flex-shrink-0 relative overflow-hidden">
                  {post.authorPhotoURL ? (
                    <Image src={post.authorPhotoURL} alt={post.author} fill className="object-cover" />
                  ) : (
                    <User size={12} className="text-gray-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  )}
                </div>
                <span className="truncate max-w-[80px]">{post.author}</span>
              </div>
              <span className="flex-shrink-0 text-[10px]">{post.date}</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Grid/Vertical Design (for Profile page grids etc)
  if (variant === 'grid') {
    return (
      <Link href={`/post-detail/${post.id}`} className="block h-full">
        <article className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col h-full">
          {/* Top: Image */}
          <div className="w-full h-48 bg-gray-100 relative group overflow-hidden">
            {post.imageUrl ? (
              <Image
                src={post.imageUrl}
                alt={post.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-50">
                <Fish size={32} className="mb-2 opacity-50" />
                <span className="text-xs font-medium">No Image</span>
              </div>
            )}
          </div>

          {/* Bottom: Content */}
          <div className="flex-1 p-4 flex flex-col">
            <h3 className="font-bold text-gray-800 mb-2 line-clamp-2 hover:text-[#2FA3E3] transition-colors">
              {post.title}
            </h3>

            <p className="text-gray-600 text-sm line-clamp-2 mb-3 flex-1">
              {post.excerpt || '本文のプレビューが表示されます。'}
            </p>

            <div className="border-t border-gray-100 pt-3 mt-auto flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-1.5 overflow-hidden">
                <div className="w-5 h-5 rounded-full bg-gray-200 relative overflow-hidden flex-shrink-0">
                  {post.authorPhotoURL ? (
                    <Image src={post.authorPhotoURL} alt={post.author} fill className="object-cover" />
                  ) : (
                    <User size={12} className="text-gray-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  )}
                </div>
                <span className="truncate max-w-[100px]">{post.author}</span>
              </div>
              <span>{post.date}</span>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  // New Standard Horizontal Design (requested by user)
  // Used for default locatons (Post List etc)
  return (
    <Link href={`/post-detail/${post.id}`} className="block h-full">
      <article className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col sm:flex-row h-full">
        {/* Left Side: Image */}
        <div className="w-full sm:w-[180px] md:w-[200px] lg:w-[220px] h-[160px] sm:h-auto sm:min-h-[200px] bg-gray-100 flex-shrink-0 relative group overflow-hidden">
          {post.imageUrl ? (
            <Image
              src={post.imageUrl}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-50">
              <Fish size={32} className="mb-2 opacity-50 sm:w-12 sm:h-12" />
              <span className="text-xs sm:text-sm font-medium">No Image</span>
            </div>
          )}
        </div>

        {/* Right Side: Content */}
        <div className="flex-1 p-3 sm:p-4 flex flex-col min-w-0 overflow-hidden">
          {/* Title */}
          <h3 className="font-bold text-sm sm:text-base md:text-lg text-gray-800 mb-1.5 sm:mb-2 line-clamp-2 hover:text-[#2FA3E3] transition-colors break-words overflow-hidden" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
            {post.title}
          </h3>

          {/* Excerpt */}
          <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-3 leading-relaxed line-clamp-2 overflow-hidden" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {post.excerpt || '本文のプレビューが表示されます。'}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-2 sm:mb-3">
            {post.tags && post.tags.length > 0 ? (
              <>
                {/* モバイル: 2つまで、タブレット以上: 3つまで */}
                {post.tags.slice(0, 2).map((tag, i) => (
                  <span key={i} className={`px-2 py-0.5 text-xs rounded-full truncate max-w-[100px] ${post.category === 'sea' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'}`}>
                    {tag}
                  </span>
                ))}
                {post.tags.length > 2 && (
                  <span className={`hidden sm:inline-block px-2 py-0.5 text-xs rounded-full truncate max-w-[100px] ${post.category === 'sea' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'}`}>
                    {post.tags[2]}
                  </span>
                )}
                {post.tags.length > 3 && (
                  <span className="hidden sm:inline-block px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full">
                    +{post.tags.length - 3}
                  </span>
                )}
              </>
            ) : (
              <span className="px-2 py-0.5 bg-gray-300 text-gray-600 text-xs rounded-full">
                タグなし
              </span>
            )}
          </div>

          {/* Meta: Date & Author - Pushed to bottom */}
          <div className="mt-auto flex items-center justify-between pt-2 border-t border-gray-100 min-w-0">
            <div className="flex items-center gap-2 text-xs text-gray-500 min-w-0">
              {/* Date */}
              <span className="font-medium truncate">{post.date}</span>
            </div>

            {/* Author */}
            <div className="flex items-center gap-1.5 min-w-0 flex-shrink-0">
              <span className="text-xs text-gray-600 hidden md:inline truncate max-w-[100px]">by <span className="underline decoration-gray-300 underline-offset-2">{post.author}</span></span>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-200 ring-1 ring-white shadow-sm relative overflow-hidden flex-shrink-0">
                {post.authorPhotoURL ? (
                  <Image src={post.authorPhotoURL} alt={post.author} fill className="object-cover" />
                ) : (
                  <User size={12} className="text-gray-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 sm:w-3.5 sm:h-3.5" />
                )}
              </div>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}