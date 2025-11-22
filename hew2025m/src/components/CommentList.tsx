'use client';

import { useState } from 'react';
import { Comment } from '@/types/comment';
import CommentItem from './CommentItem';
import CommentModal from './CommentModal';
import { MessageCircle } from 'lucide-react';

interface CommentListProps {
  comments: Comment[];
  loading: boolean;
  currentUserId?: string;
  onDeleteComment: (commentId: string) => void;
  onReply?: (parentId: string, content: string) => Promise<void>;
}

const INITIAL_DISPLAY_COUNT = 5;

export default function CommentList({
  comments,
  loading,
  currentUserId,
  onDeleteComment,
  onReply,
}: CommentListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const hasMore = comments.length > INITIAL_DISPLAY_COUNT;
  const displayedComments = comments.slice(0, INITIAL_DISPLAY_COUNT);

  return (
    <>
      <div className="space-y-4">
        {displayedComments.map((comment) => (
          <CommentItem
            key={comment._id}
            comment={comment}
            currentUserId={currentUserId}
            onDelete={onDeleteComment}
            onReply={onReply}
          />
        ))}

        {hasMore && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full py-3 text-[#2FA3E3] hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <MessageCircle size={18} />
            <span>もっと見る ({comments.length - INITIAL_DISPLAY_COUNT}件)</span>
          </button>
        )}
      </div>

      {/* コメントモーダル */}
      <CommentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        comments={comments}
        currentUserId={currentUserId}
        onDeleteComment={onDeleteComment}
        onReply={onReply}
      />
    </>
  );
}
