// src/components/ProfActivity.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageSquare, FileText, Loader2 } from 'lucide-react';
import { ActivityItem } from '@/app/api/users/[id]/activity/route';

interface ProfActivityProps {
  userId: string;
  onCountChange: (count: number) => void;
}

// 日付をフォーマットする関数
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ProfActivity = ({ userId, onCountChange }: ProfActivityProps) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const response = await fetch(`/api/users/${userId}/activity`);
        if (!response.ok) {
          throw new Error('Failed to fetch activities');
        }
        const data = await response.json();
        if (data.success) {
          setActivities(data.activities);
          onCountChange(data.activities.length);
        }
      } catch (error) {
        console.error(error);
        onCountChange(0);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, [userId, onCountChange]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-10">
        <Loader2 className="animate-spin h-8 w-8 text-[#2FA3E3]" />
      </div>
    );
  }

  if (activities.length === 0) {
    return <div className="p-10 text-center text-gray-500">活動履歴はありません。</div>;
  }

  return (
    <div className="p-4 space-y-4">
      {activities.map((activity, index) => {
        const key = `${activity.type}-${'id' in activity.data ? activity.data._id : index}`;
        
        if (activity.type === 'post') {
          const post = activity.data;
          return (
            <Link href={`/postDetail/${post._id}`} key={key}>
              <div className="block p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-start">
                  <FileText className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="ml-3">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      投稿を作成しました・{formatDate(activity.date.toString())}
                    </p>
                    <p className="font-semibold text-gray-800 dark:text-gray-200 mt-1">{post.title}</p>
                  </div>
                </div>
              </div>
            </Link>
          );
        }

        if (activity.type === 'comment') {
          // IComment & { parent?: IPost | IProduct }
          const commentData = activity.data as any; 
          const parent = commentData.parent;
          const parentType = parent?.brand ? 'product' : 'post';
          const parentUrl = parent ? `/${parentType === 'post' ? 'postDetail' : 'productDetail'}/${parent._id}` : '#';
          
          return (
            <Link href={parentUrl} key={key}>
               <div className="block p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-start">
                  <MessageSquare className="h-5 w-5 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="ml-3 w-full">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {parent ? `「${parent.title}」にコメントしました` : 'コメントしました'}・{formatDate(activity.date.toString())}
                    </p>
                    <p className="bg-gray-100 dark:bg-gray-700/50 rounded p-2 mt-2 text-gray-700 dark:text-gray-300 w-full truncate">
                      {commentData.content}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          );
        }
        return null;
      })}
    </div>
  );
};

export default ProfActivity;
