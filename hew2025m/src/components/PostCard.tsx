import { Fish, MapPin, Heart, MessageCircle, User } from 'lucide-react';

export interface Post {
  id: number;
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
}

interface PostCardProps {
  post: Post;
  variant?: 'default' | 'simple' | 'compact';
}

export default function PostCard({ post, variant = 'default' }: PostCardProps) {
  if (variant === 'simple') {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 min-h-32 hover:shadow-lg transition-shadow">
        <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{post.excerpt}</p>
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>{post.author}</span>
          <span>{post.date}</span>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 mb-6 min-h-48 hover:shadow-lg transition-shadow">
        <h3 className="font-semibold text-xl mb-3">{post.title}</h3>
        <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
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
    );
  }

  return (
    <article className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
      <div className="relative">
        <div className="h-48 bg-gray-200 rounded-t-lg flex items-center justify-center">
          <Fish size={32} className="text-gray-400" />
          <span className="text-gray-500 text-sm ml-2">画像なし</span>
        </div>
        <div className={`absolute top-3 left-3 px-2 py-1 rounded text-xs font-medium text-white ${
          post.category === 'sea' ? 'bg-blue-500' : 'bg-green-500'
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
  );
}