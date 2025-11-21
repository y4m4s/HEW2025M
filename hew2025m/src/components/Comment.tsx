'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/useAuth';
import { useProfile } from '@/contexts/ProfileContext';
import { Comment as CommentType } from '@/types/comment';
import CommentInput from './CommentInput';
import CommentList from './CommentList';

interface CommentProps {
  productId?: string;
  postId?: string;
}

export default function Comment({ productId, postId }: CommentProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useProfile();

  const [comments, setComments] = useState<CommentType[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);

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
      console.log('取得したコメント:', data.comments);
      setComments(data.comments || []);
    } catch (err) {
      console.error('コメント取得エラー:', err);
    } finally {
      setCommentsLoading(false);
    }
  };

  // コメントを投稿
  const handleSubmitComment = async (content: string) => {
    if (!user) {
      alert('コメントするにはログインが必要です');
      router.push('/login');
      return;
    }

    if (!content.trim()) {
      alert('コメント内容を入力してください');
      return;
    }

    if (content.length > 140) {
      alert('コメントは140文字以内で入力してください');
      return;
    }

    setCommentSubmitting(true);
    try {
      const commentData = {
        userId: user.uid,
        userName: profile.displayName || user.displayName || 'ゲスト',
        userPhotoURL: profile.photoURL || user.photoURL || '',
        content: content,
      };
      console.log('送信するコメントデータ:', commentData);
      console.log('プロフィール情報:', profile);

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
      alert('コメントの投稿に失敗しました');
    } finally {
      setCommentSubmitting(false);
    }
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
      alert(err instanceof Error ? err.message : 'コメントの削除に失敗しました');
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
      />
    </div>
  );
}
