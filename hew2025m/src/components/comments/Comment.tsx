'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/useAuth';
import { useProfileStore } from '@/stores/useProfileStore';
import { Comment as CommentType } from '@/types/comment';
import { LoginRequiredModal } from '@/components';
import CommentInput from './CommentInput';
import CommentList from './CommentList';

interface CommentProps {
  productId?: string;
  postId?: string;
  itemOwnerId?: string;
  itemTitle?: string;
  onCommentCountChange?: (count: number) => void;
}

function countAllComments(list: CommentType[]): number {
  return list.reduce((total, comment) => {
    return total + 1 + countAllComments(comment.replies || []);
  }, 0);
}

export default function Comment(props: CommentProps) {
  const { productId, postId, onCommentCountChange } = props;
  const { user } = useAuth();
  const profile = useProfileStore((state) => state.profile);

  const [comments, setComments] = useState<CommentType[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginRequiredAction, setLoginRequiredAction] = useState('');
  const [targetCommentId, setTargetCommentId] = useState<string | null>(null);
  const handledTargetRef = useRef<string | null>(null);

  const targetId = productId || postId;
  const apiBasePath = productId ? 'products' : 'posts';

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncTargetFromHash = () => {
      const hash = window.location.hash;
      if (!hash.startsWith('#comment-')) {
        setTargetCommentId(null);
        return;
      }

      const id = hash.replace('#comment-', '').trim();
      setTargetCommentId(id || null);
    };

    syncTargetFromHash();
    window.addEventListener('hashchange', syncTargetFromHash);

    return () => {
      window.removeEventListener('hashchange', syncTargetFromHash);
    };
  }, []);

  useEffect(() => {
    if (!targetId) return;

    const run = async () => {
      await fetchComments();
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetId]);

  useEffect(() => {
    handledTargetRef.current = null;
  }, [targetCommentId, targetId]);

  useEffect(() => {
    if (!targetCommentId || commentsLoading) return;
    if (handledTargetRef.current === targetCommentId) return;

    const elementId = `comment-${targetCommentId}`;
    let attempts = 0;
    const maxAttempts = 20;

    const tryScroll = () => {
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('comment-highlight');

        window.setTimeout(() => {
          element.classList.remove('comment-highlight');
        }, 2000);

        handledTargetRef.current = targetCommentId;
        return;
      }

      if (attempts < maxAttempts) {
        attempts += 1;
        window.setTimeout(tryScroll, 120);
      }
    };

    tryScroll();
  }, [comments, commentsLoading, targetCommentId]);

  const fetchComments = async () => {
    if (!targetId) return;

    try {
      setCommentsLoading(true);
      const response = await fetch(`/api/${apiBasePath}/${targetId}/comments`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }

      const data = await response.json();
      const fetchedComments = data.comments || [];
      setComments(fetchedComments);

      if (onCommentCountChange) {
        onCommentCountChange(countAllComments(fetchedComments));
      }
    } catch (err) {
      console.error('Comment fetch error:', err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleSubmitComment = async (content: string, parentId?: string): Promise<boolean> => {
    if (!user) {
      setLoginRequiredAction('コメント');
      setShowLoginModal(true);
      return false;
    }

    if (!content.trim()) {
      toast.error('コメント内容を入力してください');
      return false;
    }

    if (content.length > 140) {
      toast.error('コメントは140文字以内で入力してください');
      return false;
    }

    setCommentSubmitting(true);
    try {
      const commentData = {
        userId: user.uid,
        userName: profile.displayName || user.displayName || 'ユーザー',
        userPhotoURL: profile.photoURL || user.photoURL || '',
        content,
        parentId: parentId || undefined,
      };

      const token = await user.getIdToken();
      if (!token) {
        throw new Error('Failed to get auth token');
      }

      const response = await fetch(`/api/${apiBasePath}/${targetId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(commentData),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Failed to post comment');
      }

      await response.json();
      await fetchComments();
      return true;
    } catch (err) {
      console.error('Comment submit error:', err);
      toast.error(err instanceof Error ? err.message : 'コメントの投稿に失敗しました');
      return false;
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleReplyComment = async (parentId: string, content: string): Promise<boolean> => {
    return handleSubmitComment(content, parentId);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user || !targetId) return;

    try {
      const token = await user.getIdToken();
      if (!token) {
        throw new Error('Failed to get auth token');
      }

      const response = await fetch(`/api/${apiBasePath}/${targetId}/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'Failed to delete comment');
      }

      await fetchComments();
    } catch (err) {
      console.error('Comment delete error:', err);
      toast.error(err instanceof Error ? err.message : 'コメントの削除に失敗しました');
    }
  };

  return (
    <div>
      <CommentInput
        onSubmit={handleSubmitComment}
        isSubmitting={commentSubmitting}
        maxLength={140}
      />

      <CommentList
        comments={comments}
        loading={commentsLoading}
        currentUserId={user?.uid}
        onDeleteComment={handleDeleteComment}
        onReply={handleReplyComment}
        targetCommentId={targetCommentId}
      />

      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        action={loginRequiredAction}
      />
    </div>
  );
}
