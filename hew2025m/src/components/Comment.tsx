'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/useAuth';
import { useProfile } from '@/contexts/ProfileContext';
import { Comment as CommentType } from '@/types/comment';
import CommentInput from './CommentInput';
import CommentList from './CommentList';
import LoginRequiredModal from './LoginRequiredModal';
import toast from 'react-hot-toast';

interface CommentProps {
  productId?: string;
  postId?: string;
  onCommentCountChange?: (count: number) => void;
}

export default function Comment({ productId, postId, onCommentCountChange }: CommentProps) {
  const { user } = useAuth();
  const { profile } = useProfile();

  const [comments, setComments] = useState<CommentType[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginRequiredAction, setLoginRequiredAction] = useState('');

  // どちらのIDが渡されたかに基づいてAPIエンドポイントを決定
  const targetId = productId || postId;
  const apiBasePath = productId ? 'products' : 'posts';

  useEffect(() => {
    if (targetId) {
      fetchComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId]);

  // コメント一覧を取得
  const fetchComments = async () => {
    try {
      setCommentsLoading(true);
      const response = await fetch(`/api/${apiBasePath}/${targetId}/comments`);
      if (!response.ok) {
        throw new Error('コメントの取得に失敗しました');
      }
      const data = await response.json();
      const fetchedComments = data.comments || [];
      setComments(fetchedComments);

      // 親コンポーネントにコメント数を通知
      if (onCommentCountChange) {
        onCommentCountChange(fetchedComments.length);
      }
    } catch (err) {
      console.error('コメント取得エラー:', err);
    } finally {
      setCommentsLoading(false);
    }
  };

  // コメントを投稿
  const handleSubmitComment = async (content: string, parentId?: string) => {
    if (!user) {
      setLoginRequiredAction('コメント');
      setShowLoginModal(true);
      return;
    }

    if (!content.trim()) {
      toast.error('コメント内容を入力してください');
      return;
    }

    if (content.length > 140) {
      toast.error('コメントは140文字以内で入力してください');
      return;
    }

    setCommentSubmitting(true);
    try {
      const commentData = {
        userId: user.uid,
        userName: profile.displayName || user.displayName || 'ゲスト',
        userPhotoURL: profile.photoURL || user.photoURL || '',
        content: content,
        parentId: parentId || undefined,
      };

      const response = await fetch(`/api/${apiBasePath}/${targetId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commentData),
      });

      if (!response.ok) {
        throw new Error('コメントの投稿に失敗しました');
      }

      // コメントをリロード
      await fetchComments();
    } catch (err) {
      console.error('コメント投稿エラー:', err);
      toast.error('コメントの投稿に失敗しました');
    } finally {
      setCommentSubmitting(false);
    }
  };

  // 返信を投稿
  const handleReplyComment = async (parentId: string, content: string) => {
    await handleSubmitComment(content, parentId);
  };

  // コメントを削除
  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;

    if (!confirm('このコメントを削除しますか?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/${apiBasePath}/${targetId}/comments/${commentId}?userId=${user.uid}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'コメントの削除に失敗しました');
      }

      // コメントをリロード
      await fetchComments();
    } catch (err) {
      console.error('コメント削除エラー:', err);
      toast.error(err instanceof Error ? err.message : 'コメントの削除に失敗しました');
    }
  };

  return (
    <div>
      {/* コメント入力欄 */}
      <CommentInput
        onSubmit={handleSubmitComment}
        isSubmitting={commentSubmitting}
        maxLength={140}
      />

      {/* コメント一覧 */}
      <CommentList
        comments={comments}
        loading={commentsLoading}
        currentUserId={user?.uid}
        onDeleteComment={handleDeleteComment}
        onReply={handleReplyComment}
      />

      {/* ログイン必須モーダル */}
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        action={loginRequiredAction}
      />
    </div>
  );
}
