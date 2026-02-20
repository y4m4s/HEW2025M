"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { User, X } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/useAuth";
import { uploadFileToFirebase } from "@/lib/firebaseUtils";

interface UserProfile {
  displayName: string;
  username?: string;
  bio: string;
  photoURL: string;
}

interface ProfileEditProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: UserProfile;
  onSaveSuccess?: (updated: UserProfile) => void;
}

export default function ProfileEdit({
  isOpen,
  onClose,
  currentProfile,
  onSaveSuccess,
}: ProfileEditProps) {
  const { user } = useAuth();
  const [editProfile, setEditProfile] = useState<UserProfile>(currentProfile);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setEditProfile(currentProfile);
  }, [currentProfile]);

  useEffect(() => {
    if (!isOpen) {
      if (previewURL) {
        URL.revokeObjectURL(previewURL);
      }
      setPreviewURL("");
      setSelectedFile(null);
    }
  }, [isOpen, previewURL]);

  const handleImgSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("画像サイズが5MBを超えています");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("画像ファイルを選択してください");
      return;
    }

    if (previewURL) {
      URL.revokeObjectURL(previewURL);
    }

    setSelectedFile(file);
    const preview = URL.createObjectURL(file);
    setPreviewURL(preview);
  };

  const handleSaveProfile = async () => {
    if (!user) {
      toast.error("ユーザーが認証されていません");
      return;
    }

    if (editProfile.displayName.length > 15) {
      toast.error("表示名は15文字以内で入力してください");
      return;
    }

    if (editProfile.bio.length > 140) {
      toast.error("自己紹介は140文字以内で入力してください");
      return;
    }

    setSaving(true);

    try {
      let photoURL = editProfile.photoURL;

      if (selectedFile) {
        try {
          photoURL = await uploadFileToFirebase(selectedFile, "avatars");
        } catch (uploadError) {
          console.error("画像アップロードエラー:", uploadError);
          toast.error("画像のアップロードに失敗しました");
          setSaving(false);
          return;
        }
      }

      const updatedProfile = {
        displayName: editProfile.displayName.trim(),
        bio: editProfile.bio.trim(),
        photoURL,
      };

      const idToken = await user.getIdToken();

      const response = await Promise.race<Response>([
        fetch(`/api/users/${user.uid}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify(updatedProfile),
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("プロフィールの更新がタイムアウトしました")), 30000)
        ),
      ]);

      if (!response.ok) {
        let errorMessage = "プロフィールの更新に失敗しました";
        try {
          const errorData = await response.json();
          if (typeof errorData?.error === "string" && errorData.error.length > 0) {
            errorMessage = errorData.error;
          }
        } catch {
          // JSONパースエラーは無視し、デフォルトメッセージを使用
        }
        throw new Error(errorMessage);
      }

      if (previewURL) {
        URL.revokeObjectURL(previewURL);
        setPreviewURL("");
      }
      setSelectedFile(null);

      if (onSaveSuccess) {
        onSaveSuccess({
          ...editProfile,
          displayName: updatedProfile.displayName,
          bio: updatedProfile.bio,
          photoURL: updatedProfile.photoURL,
        });
      }

      onClose();
    } catch (error) {
      console.error("プロフィール保存エラー:", error);

      if (error instanceof Error) {
        if (error.message.includes("permission-denied") || error.message.includes("Forbidden")) {
          toast.error("プロフィールの保存権限がありません");
        } else if (error.message.includes("タイムアウト")) {
          toast.error("保存がタイムアウトしました。ネットワーク接続を確認してください");
        } else {
          toast.error("プロフィールの保存に失敗しました");
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setEditProfile(currentProfile);
    setSelectedFile(null);
    if (previewURL) {
      URL.revokeObjectURL(previewURL);
      setPreviewURL("");
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800/30 p-4">
      <div className="relative w-full max-w-md rounded-xl bg-white p-6">
        <button
          className="absolute right-3 top-3 text-gray-600 hover:text-black"
          onClick={handleClose}
        >
          <X size={22} />
        </button>

        <h2 className="mb-4 text-lg font-bold">プロフィール編集</h2>

        <div className="mb-4 flex flex-col items-center">
          <div className="mb-3 flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-gray-200">
            {previewURL || editProfile.photoURL ? (
              <Image
                src={previewURL || editProfile.photoURL}
                alt="プロフィール画像"
                width={112}
                height={112}
                quality={90}
                className="h-full w-full object-cover"
              />
            ) : (
              <User size={40} className="text-gray-500" />
            )}
          </div>

          <label className="cursor-pointer rounded-md bg-[#2FA3E3] px-4 py-2 text-white transition hover:bg-[#1d7bb8]">
            画像を選択
            <input type="file" className="hidden" accept="image/*" onChange={handleImgSelect} />
          </label>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">表示名</label>
          <input
            type="text"
            value={editProfile.displayName}
            onChange={(e) => setEditProfile({ ...editProfile, displayName: e.target.value })}
            className={`w-full rounded-lg border px-3 py-2 transition-colors focus:outline-none focus:ring-1 ${
              editProfile.displayName.length > 15
                ? "border-red-500 text-gray-900 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-[#2FA3E3]"
            }`}
            placeholder="表示名を入力"
          />
          <div
            className={`ml-1 mt-1.5 text-right text-sm ${
              editProfile.displayName.length > 15 ? "font-semibold text-red-600" : "text-gray-500"
            }`}
          >
            {editProfile.displayName.length}/15文字
            {editProfile.displayName.length > 15 && (
              <span className="ml-2">({editProfile.displayName.length - 15}文字超過)</span>
            )}
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">ユーザーID</label>
          <p className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-gray-600">
            {editProfile.username}
          </p>
          <p className="mt-1 text-xs text-gray-500">ユーザーIDは変更できません</p>
        </div>

        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">自己紹介</label>
          <textarea
            value={editProfile.bio}
            onChange={(e) => setEditProfile({ ...editProfile, bio: e.target.value })}
            className={`w-full resize-none rounded-lg border px-3 py-2 transition-colors focus:outline-none focus:ring-1 ${
              editProfile.bio.length > 140
                ? "border-red-500 text-gray-900 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-[#2FA3E3] focus:ring-[#2FA3E3]"
            }`}
            rows={4}
            placeholder="自己紹介を140字以内で入力してください。"
          />
          <div
            className={`ml-1 mt-1.5 text-right text-sm ${
              editProfile.bio.length > 140 ? "font-semibold text-red-600" : "text-gray-500"
            }`}
          >
            {editProfile.bio.length}/140文字
            {editProfile.bio.length > 140 && <span className="ml-2">({editProfile.bio.length - 140}文字超過)</span>}
          </div>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="mt-5 w-full rounded-lg bg-[#2FA3E3] py-2 text-white hover:bg-[#1d7bb8] disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {saving ? "保存中..." : "保存"}
        </button>
      </div>
    </div>
  );
}
