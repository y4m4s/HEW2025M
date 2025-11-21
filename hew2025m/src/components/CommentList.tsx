'use client';

import { Comment } from '@/types/comment';
import CommentItem from './CommentItem';

interface CommentListProps {
  comments: Comment[];
  loading: boolean;
  currentUserId?: string;
  onDeleteComment: (commentId: string) => void;
}

export default function CommentList({
  comments,
  loading,
  currentUserId,
  onDeleteComment,
}: CommentListProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2FA3E3]"></div>
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <p className="text-center text-gray-500 py-8">
        この商品へのコメントはまだありません
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <CommentItem
          key={comment._id}
          comment={comment}
          currentUserId={currentUserId}
          onDelete={onDeleteComment}
        />
      ))}
    </div>
  );
}
