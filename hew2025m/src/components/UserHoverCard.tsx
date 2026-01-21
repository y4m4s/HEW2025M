"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { User as UserIcon } from "lucide-react";
import HoverCard from "@/components/HoverCard";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

interface UserHoverCardProps {
  userId: string;
  displayName: string;
  className?: string;
}

interface UserProfile {
  displayName?: string;
  username?: string;
  photoURL?: string;
  bio?: string;
}

export default function UserHoverCard({
  userId,
  displayName,
  className = "",
}: UserHoverCardProps) {
  const [profile, setProfile] = useState<UserProfile>({
    displayName: displayName,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfile({
            displayName: data.displayName || displayName,
            username: data.username,
            photoURL: data.photoURL,
            bio: data.bio,
          });
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchProfile();
  }, [userId, displayName]);

  return (
    <span className="relative inline-block z-[1000]">
      <HoverCard
        trigger={
          <Link
            href={`/profile/${userId}`}
            className={`font-bold text-gray-900 hover:text-[#2FA3E3] hover:underline transition-colors duration-200 ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            {profile.displayName || displayName}さん
          </Link>
        }
        side="bottom"
        align="start"
      >
      <Link
        href={`/profile/${userId}`}
        className="block w-[280px] rounded-lg p-1 -m-1 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-gray-200 border-1 border-gray-300 flex-shrink-0">
            <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
              {profile.photoURL ? (
                <Image
                  src={profile.photoURL}
                  alt="プロフィール画像"
                  width={48}
                  height={48}
                  quality={90}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <UserIcon size={24} />
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg text-gray-900 truncate">
              {profile.displayName || displayName}
            </h3>
            {profile.username && (
              <p className="text-sm text-gray-500 truncate">@{profile.username}</p>
            )}
          </div>
        </div>
        {profile.bio && (
          <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
            {profile.bio}
          </p>
        )}
      </Link>
    </HoverCard>
    </span>
  );
}
