"use client";
import { useState, useEffect } from "react";
import { User, X } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

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
}

export default function ProfileEdit({ isOpen, onClose, currentProfile }: ProfileEditProps) {
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
      console.error("画像サイズが5MBを超えています:", file.size);
      return;
    }

    // 画像タイプチェック
    if (!file.type.startsWith("image/")) {
      console.error("画像ファイル以外が選択されました:", file.type);
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
      console.error("ユーザーが未認証です");
      return;
    }

    setSaving(true);
    console.log("保存開始:", new Date().toISOString());
    console.log("Firebase接続状態確認 - db:", db ? "初期化済み" : "未初期化");
    console.log("ユーザー情報:", { uid: user.uid, email: user.email });

    try {
      let photoURL = editProfile.photoURL;

      // 画像がアップロードされている場合
      if (selectedFile) {
        console.log("画像アップロード開始");
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
          console.log("画像アップロード完了:", photoURL);
        } catch (uploadError) {
          console.error("画像アップロードエラー:", uploadError);
          setSaving(false);
          return;
        }
      }

      // Firestoreに保存
      console.log("Firestore保存開始 - ユーザーID:", user.uid);
      const updatedProfile: UserProfile = {
        displayName: editProfile.displayName.trim(),
        username: editProfile.username.trim(),
        bio: editProfile.bio.trim(),
        photoURL,
      };

      console.log("保存するデータ:", updatedProfile);

      try {
        // Firestoreに直接保存（タイムアウト30秒）
        const docRef = doc(db, "users", user.uid);
        console.log("ドキュメント参照作成完了:", docRef.path);

        const startTime = Date.now();
        console.log("Firestore保存開始:", new Date().toISOString());

        // タイムアウト用のAbortController
        let timeoutId: NodeJS.Timeout | null = null;

        try {
          // 30秒のタイムアウトを設定
          const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutId = setTimeout(() => {
              const elapsed = Date.now() - startTime;
              console.error(`Firestore保存がタイムアウトしました（${elapsed}ms）`);
              reject(new Error("Firestore保存がタイムアウトしました（30秒）"));
            }, 30000);
          });

          await Promise.race([
            setDoc(docRef, updatedProfile, { merge: true }),
            timeoutPromise
          ]);

          const endTime = Date.now();

          console.log("✅ Firestore保存完了:", new Date().toISOString());
          console.log("✅ 保存にかかった時間:", endTime - startTime, "ms");
        } finally {
          // タイムアウトタイマーをクリア
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
        }
      } catch (firestoreError: any) {
        console.error("Firestore保存中のエラー:", firestoreError);
        console.error("エラーコード:", firestoreError?.code);
        console.error("エラーメッセージ:", firestoreError?.message);
        console.error("エラー名:", firestoreError?.name);

        // 権限エラーの場合は詳細を表示
        if (firestoreError?.code === "permission-denied") {
          console.error("⚠️ Firestoreの書き込み権限がありません");
          console.error("Firebaseコンソールでセキュリティルールを確認してください");
        }

        // タイムアウトやオフラインエラーの場合
        if (firestoreError?.code === "unavailable" ||
            firestoreError?.message?.includes("offline") ||
            firestoreError?.message?.includes("タイムアウト")) {
          console.error("⚠️ Firestoreへの接続に問題があります");
          console.error("ネットワーク接続を確認してください");
        }

        throw firestoreError;
      }

      // クリーンアップ
      if (previewURL) {
        URL.revokeObjectURL(previewURL);
        setPreviewURL("");
      }
      setSelectedFile(null);

      console.log("全処理完了:", new Date().toISOString());

      // モーダルを閉じる
      onClose();
    } catch (error) {
      console.error("プロフィール保存エラー:", error);
      console.error("エラー詳細:", {
        message: error instanceof Error ? error.message : "不明なエラー",
        stack: error instanceof Error ? error.stack : undefined,
      });
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
              <img
                src={previewURL || editProfile.photoURL}
                alt="プロフィール画像"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2FA3E3]"
            placeholder="表示名を入力"
          />
        </div>

        {/* ユーザー名 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ユーザー名
          </label>
          <input
            type="text"
            value={editProfile.username}
            onChange={(e) => setEditProfile({ ...editProfile, username: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2FA3E3]"
            placeholder="@ユーザー名"
          />
        </div>

        {/* 自己紹介 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            自己紹介
          </label>
          <textarea
            value={editProfile.bio}
            onChange={(e) => setEditProfile({ ...editProfile, bio: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2FA3E3] resize-none"
            rows={4}
            placeholder="自己紹介を入力"
          />
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
