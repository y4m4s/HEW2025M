"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { User, X } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import toast from "react-hot-toast";

interface UserProfile {
  displayName: string;
  username: string;
  bio: string;
  photoURL: string;
}

interface ProfileEditProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: UserProfile;
  onSaveSuccess?: () => void; // 保存成功時のコールバック
}

export default function ProfileEdit({ isOpen, onClose, currentProfile, onSaveSuccess }: ProfileEditProps) {
  const { user } = useAuth();
  const [editProfile, setEditProfile] = useState<UserProfile>(currentProfile);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // currentProfileが変更されたら編集用の状態も更新
  useEffect(() => {
    setEditProfile(currentProfile);
  }, [currentProfile]);

  // モーダルが閉じられた時にプレビューをクリーンアップ
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

    // ファイルサイズチェック（5MB制限）
    if (file.size > 5 * 1024 * 1024) {
      toast.error("画像サイズが5MBを超えています");
      return;
    }

    // 画像タイプチェック
    if (!file.type.startsWith("image/")) {
      toast.error("画像ファイルを選択してください");
      return;
    }

    // 古いプレビューURLをクリーンアップ
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

    // 文字数チェック
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

      // 画像がアップロードされている場合
      if (selectedFile) {
        try {
          const formData = new FormData();
          formData.append("file", selectedFile);
          formData.append("userId", user.uid);

          const uploadResponse = await Promise.race([
            fetch("/api/upload-avatar", {
              method: "POST",
              body: formData,
            }),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("画像アップロードがタイムアウトしました")), 30000)
            ),
          ]);

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            throw new Error(errorData.error || "画像のアップロードに失敗しました");
          }

          const uploadData = await uploadResponse.json();
          photoURL = `${uploadData.imageUrl}?t=${Date.now()}`;
        } catch (uploadError) {
          console.error("画像アップロードエラー:", uploadError);
          toast.error("画像のアップロードに失敗しました");
          setSaving(false);
          return;
        }
      }

      // Firestoreに保存（usernameは除外して保存）
      const updatedProfile = {
        displayName: editProfile.displayName.trim(),
        bio: editProfile.bio.trim(),
        photoURL,
      };

      const docRef = doc(db, "users", user.uid);

      // タイムアウト付きでFirestoreに保存
      await Promise.race([
        setDoc(docRef, updatedProfile, { merge: true }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Firestore保存がタイムアウトしました")), 30000)
        ),
      ]);

      // クリーンアップ
      if (previewURL) {
        URL.revokeObjectURL(previewURL);
        setPreviewURL("");
      }
      setSelectedFile(null);

      // 保存成功時のコールバックを呼び出し
      if (onSaveSuccess) {
        onSaveSuccess();
      }

      // モーダルを閉じる
      onClose();
    } catch (error) {
      console.error("プロフィール保存エラー:", error);

      if (error instanceof Error) {
        if (error.message.includes("permission-denied")) {
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
    // 編集をキャンセルして元の値に戻す
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
    <div className="fixed inset-0 bg-gray-800/30 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md relative">
        <button
          className="absolute top-3 right-3 text-gray-600 hover:text-black"
          onClick={handleClose}
        >
          <X size={22} />
        </button>

        <h2 className="text-lg font-bold mb-4">プロフィール編集</h2>

        <div className="flex flex-col items-center mb-4">
          {/* Avatar Preview */}
          <div className="w-28 h-28 mb-3 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
            {previewURL || editProfile.photoURL ? (
              <Image
                src={previewURL || editProfile.photoURL}
                alt="プロフィール画像"
                width={112}
                height={112}
                quality={90}
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={40} className="text-gray-500" />
            )}
          </div>

          <label className="bg-[#2FA3E3] text-white px-4 py-2 rounded-md cursor-pointer hover:bg-[#1d7bb8] transition">
            画像を選択
            <input type="file" className="hidden" accept="image/*" onChange={handleImgSelect} />
          </label>
        </div>

        {/* 表示名 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            表示名
          </label>
          <input
            type="text"
            value={editProfile.displayName}
            onChange={(e) => setEditProfile({ ...editProfile, displayName: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
              editProfile.displayName.length > 15
                ? 'border-red-500 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-[#2FA3E3]'
            }`}
            placeholder="表示名を入力"
          />
          <div className={`text-right text-sm mt-1 ${editProfile.displayName.length > 15 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
            {editProfile.displayName.length}/15文字
            {editProfile.displayName.length > 15 && (
              <span className="ml-2">({editProfile.displayName.length - 15}文字超過)</span>
            )}
          </div>
        </div>

        {/* ユーザー名（読み取り専用） */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ユーザーID
          </label>
          <input
            type="text"
            value={editProfile.username}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
            placeholder="@ユーザー名"
          />
          <p className="text-xs text-gray-500 mt-1">ユーザーIDは変更できません</p>
        </div>

        {/* 自己紹介 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            自己紹介
          </label>
          <textarea
            value={editProfile.bio}
            onChange={(e) => setEditProfile({ ...editProfile, bio: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 resize-none transition-colors ${
              editProfile.bio.length > 140
                ? "border-red-500 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-[#2FA3E3] focus:ring-[#2FA3E3]"
            }`}
            rows={4}
            placeholder="自己紹介を140字以内で入力してください。"
          />
          <div
            className={`text-right text-sm mt-1 ${
              editProfile.bio.length > 140 ? "text-red-600 font-semibold" : "text-gray-500"
            }`}
          >
            {editProfile.bio.length}/140文字
            {editProfile.bio.length > 140 && (
              <span className="ml-2">({editProfile.bio.length - 140}文字超過)</span>
            )}
          </div>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="mt-5 w-full bg-[#2FA3E3] text-white py-2 rounded-lg hover:bg-[#1d7bb8] disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {saving ? "保存中..." : "保存"}
        </button>
      </div>
    </div>
  );
}
