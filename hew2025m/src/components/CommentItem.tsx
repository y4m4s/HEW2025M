'use client';

import { useState } from 'react';
import Image from 'next/image';
import { User, Trash2 } from 'lucide-react';
import { Comment } from '@/types/comment';

interface CommentItemProps {
  comment: Comment;
  currentUserId?: string;
  onDelete: (commentId: string) => void;
}

export default function CommentItem({ comment, currentUserId, onDelete }: CommentItemProps) {
  const [imageError, setImageError] = useState(false);

  // コメントの日時をフォーマット
  const formatCommentDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return 'たった今';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}分前`;
    } else if (diffHours < 24) {
      return `${diffHours}時間前`;
    } else if (diffDays < 7) {
      return `${diffDays}日前`;
    } else {
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  const isOwner = currentUserId && currentUserId === comment.userId;

  return (
    <div className="border-b border-gray-200 pb-4 last:border-none">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          {comment.userPhotoURL && !imageError ? (
            <Image
              src={comment.userPhotoURL}
              alt={comment.userName}
              className="w-8 h-8 rounded-full object-cover border border-gray-300"
              onError={() => {
                console.error('画像読み込みエラー:', comment.userPhotoURL);
                setImageError(true);
              }}
            />
          ) : (
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <User size={16} className="text-gray-600" />
            </div>
          )}
          <div>
            <p className="font-medium text-sm">{comment.userName}</p>
            <p className="text-xs text-gray-500">
              {formatCommentDate(comment.createdAt)}
            </p>
          </div>
        </div>
        {isOwner && (
          <button
            onClick={() => onDelete(comment._id)}
            className="text-red-600 hover:text-red-800 transition-colors p-1"
            title="コメントを削除"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
      <p className="text-gray-700 whitespace-pre-wrap ml-10">
        {comment.content}
      </p>
    </div>
  );
}
