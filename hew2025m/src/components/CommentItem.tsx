'use client';

import { useState } from 'react';
import Image from 'next/image';
import { User, Trash2, MessageCircle } from 'lucide-react';
import { Comment } from '@/types/comment';
import CommentInput from './CommentInput';

interface CommentItemProps {
  comment: Comment;
  currentUserId?: string;
  onDelete: (commentId: string) => void;
  onReply?: (parentId: string, content: string) => Promise<void>;
  isReply?: boolean;
}

export default function CommentItem({
  comment,
  currentUserId,
  onDelete,
  onReply,
  isReply = false
}: CommentItemProps) {
  const [imageError, setImageError] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleReplySubmit = async (content: string) => {
    if (!onReply) return;

    setIsSubmitting(true);
    try {
      await onReply(comment._id, content);
      setShowReplyInput(false);
      setShowReplies(true); // 返信後、返信一覧を表示
    } catch (error) {
      console.error('返信エラー:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const replyCount = comment.replies?.length || 0;

  return (
    <div className={`pb-4 last:border-none ${isReply ? 'ml-10 border-l-2 border-gray-200 pl-4' : 'border-b border-gray-200'}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          {comment.userPhotoURL && !imageError ? (
            <Image
              src={comment.userPhotoURL}
              alt={comment.userName}
              width={32}
              height={32}
              quality={90}
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

      <p className="text-gray-700 whitespace-pre-wrap ml-10 mb-2">
        {comment.content}
      </p>

      {/* 返信ボタンと返信を見るボタン（親コメントの場合のみ） */}
      {!isReply && (
        <div className="ml-10 flex items-center gap-4">
          {onReply && currentUserId && (
            <button
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="text-sm text-[#2FA3E3] hover:text-[#1d7bb8] transition-colors flex items-center gap-1"
            >
              <MessageCircle size={14} />
              <span>{showReplyInput ? '返信をやめる' : '返信'}</span>
            </button>
          )}

          {replyCount > 0 && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="text-sm text-gray-600 hover:text-[#2FA3E3] transition-colors flex items-center gap-1"
            >
              <MessageCircle size={14} />
              <span>{showReplies ? '返信を隠す' : `返信を見る (${replyCount}件)`}</span>
            </button>
          )}
        </div>
      )}

      {/* 返信入力フォーム */}
      {showReplyInput && (
        <div className="ml-10 mt-3">
          <CommentInput
            onSubmit={handleReplySubmit}
            isSubmitting={isSubmitting}
            maxLength={140}
            placeholder={`${comment.userName}さんに返信...`}
          />
        </div>
      )}

      {/* 返信コメント一覧 */}
      {showReplies && comment.replies && comment.replies.length > 0 && (
        <div className="mt-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply._id}
              comment={reply}
              currentUserId={currentUserId}
              onDelete={onDelete}
              isReply={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
