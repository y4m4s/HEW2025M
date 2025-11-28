import Link from 'next/link';
import Image from 'next/image';
import { User } from 'lucide-react';

interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  bio?: string;
  photoURL?: string;
}

interface UserInfoCardProps {
  title: string;
  userProfile: UserProfile | null;
  loading?: boolean;
  fallbackName?: string;
}

export default function UserInfoCard({
  title,
  userProfile,
  loading = false,
  fallbackName
}: UserInfoCardProps) {
  return (
    <section className="mt-8 bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      {loading ? (
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
          </div>
        </div>
      ) : userProfile ? (
        <Link href={`/profile/${userProfile.uid}`}>
          <div className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-[#2FA3E3] min-h-[120px]">
            {userProfile.photoURL ? (
              <Image
                src={userProfile.photoURL}
                alt={userProfile.displayName}
                width={64}
                height={64}
                quality={90}
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-300 flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                <User size={32} className="text-gray-600" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-lg truncate">{userProfile.displayName}</p>
              <p className="text-sm text-gray-500 truncate">@{userProfile.username}</p>
              {userProfile.bio && (
                <p className="text-sm text-gray-700 mt-2 break-words whitespace-pre-wrap line-clamp-3">
                  {userProfile.bio}
                </p>
              )}
            </div>
          </div>
        </Link>
      ) : (
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
            <User size={32} className="text-gray-600" />
          </div>
          <div>
            <p className="font-semibold text-lg">{fallbackName || '不明なユーザー'}</p>
            <p className="text-sm text-gray-600">
              {title.includes('出品') ? '出品者' : '投稿者'}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
