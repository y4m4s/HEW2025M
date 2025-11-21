'use client';

import { useState } from 'react';
import Button from './Button';

interface CommentInputProps {
  onSubmit: (content: string) => Promise<void>;
  isSubmitting: boolean;
  maxLength?: number;
}

export default function CommentInput({
  onSubmit,
  isSubmitting,
  maxLength = 140,
}: CommentInputProps) {
  const [commentText, setCommentText] = useState('');

  const handleSubmit = async () => {
    if (!commentText.trim()) {
      return;
    }

    await onSubmit(commentText);
    setCommentText('');
  };

  const isOverLimit = commentText.length > maxLength;

  return (
    <div className="mb-6">
      <textarea
        placeholder={`コメントを入力... (${maxLength}文字まで)`}
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:border-[#2FA3E3] transition-colors"
        rows={4}
      />
      <div className="flex justify-between items-center mt-2">
        <span className={`text-sm ${isOverLimit ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
          {commentText.length}/{maxLength}文字
        </span>
        <Button
          variant="primary"
          size="md"
          onClick={handleSubmit}
          disabled={isSubmitting || !commentText.trim() || isOverLimit}
        >
          {isSubmitting ? '投稿中...' : 'コメントする'}
        </Button>
      </div>
    </div>
  );
}
