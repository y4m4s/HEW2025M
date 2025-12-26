import Link from 'next/link';
import Image from 'next/image';
import { Fish, MapPin, Heart, MessageCircle } from 'lucide-react';

export interface ProfilePost {
  id: string;
  title: string;
  excerpt: string;
  location: string;
  date: string;
  likes: number;
  comments: number;
  isLiked?: boolean;
  imageUrl?: string;
  tags?: string[];
}

interface ProfilePostCardProps {
  post: ProfilePost;
}

export default function ProfilePostCard({ post }: ProfilePostCardProps) {
  return (
    <Link href={`/post-detail/${post.id}`}>
      <article className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-lg hover:transform hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-full">
        <div className="relative flex-shrink-0">
          <div className="h-48 bg-gray-200 rounded-t-lg flex items-center justify-center overflow-hidden">
            {post.imageUrl ? (
              <Image
                src={post.imageUrl}
                alt={post.title}
                width={800}
                height={192}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center">
                <Fish size={48} className="text-gray-400 mb-2" />
                <p className="text-gray-500 text-sm">画像なし</p>
              </div>
            )}
          </div>
          {post.tags && post.tags.length > 0 && (
            <div className="absolute top-3 left-3 flex flex-wrap gap-2 max-w-[calc(100%-24px)]">
              {post.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm hover:shadow-xl transition-shadow duration-200"
                  style={{ backdropFilter: 'blur(8px)' }}
                >
                  {tag}
                </span>
              ))}
              {post.tags.length > 3 && (
                <span className="bg-gray-800/90 text-white px-2.5 py-1.5 rounded-full text-xs font-semibold shadow-lg backdrop-blur-sm">
                  +{post.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="p-4 flex flex-col flex-1">
          <div className="mb-2 flex-shrink-0">
            <h3 className="font-semibold text-lg line-clamp-1">{post.title}</h3>
          </div>
          <div className="mb-3 flex-shrink-0">
            <p className="text-gray-600 text-sm line-clamp-1">{post.excerpt}</p>
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
            <span className="text-sm text-gray-500">{post.date}</span>

            <div className="flex items-center gap-3 text-sm text-gray-600 flex-shrink-0">
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
      </article>
    </Link>
  );
}
