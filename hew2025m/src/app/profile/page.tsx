"use client";
import { useState, useEffect } from "react";
import { User, Fish, X } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

interface UserProfile {
  displayName: string;
  username: string;
  bio: string;
  photoURL: string;
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>({
    displayName: "",
    username: "",
    bio: "",
    photoURL: "",
  });
  const [editProfile, setEditProfile] = useState<UserProfile>({
    displayName: "",
    username: "",
    bio: "",
    photoURL: "",
  });
  const [editOpen, setEditOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // ユーザー認証チェック
  useEffect(() => {
    if (!authLoading && user === null) {
      // 認証されていない場合はログインページへ
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // プロフィールデータの取得
  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          setProfile(data);
          setEditProfile(data);
        } else {
          // 初回ログイン時のデフォルト値
          const defaultProfile: UserProfile = {
            displayName: user.displayName || "名無しユーザー",
            username: user.email?.split("@")[0] || "user",
            bio: "",
            photoURL: user.photoURL || "",
          };
          setProfile(defaultProfile);
          setEditProfile(defaultProfile);
        }
      } catch (error) {
        console.error("プロフィール取得エラー:", error);
      }
    };

    fetchProfile();
  }, [user]);

  const handleImgSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const preview = URL.createObjectURL(file);
    setPreviewURL(preview);
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      let photoURL = editProfile.photoURL;

      // 画像がアップロードされている場合
      if (selectedFile) {
        try {
          // APIを使ってローカルに画像を保存
          const formData = new FormData();
          formData.append("file", selectedFile);
          formData.append("userId", user.uid);

          const uploadResponse = await fetch("/api/upload-avatar", {
            method: "POST",
            body: formData,
          });

          if (!uploadResponse.ok) {
            throw new Error("画像のアップロードに失敗しました");
          }

          const uploadData = await uploadResponse.json();
          photoURL = uploadData.imageUrl;
        } catch (uploadError) {
          console.error("画像アップロードエラー:", uploadError);
          alert("画像のアップロードに失敗しました。テキスト情報のみ保存します。");
          // 画像アップロードが失敗しても、テキスト情報は保存を続ける
          photoURL = editProfile.photoURL;
        }
      }

      // Firestoreに保存
      const updatedProfile: UserProfile = {
        ...editProfile,
        photoURL,
      };

      await setDoc(doc(db, "users", user.uid), updatedProfile);
      setProfile(updatedProfile);
      setEditProfile(updatedProfile);
      setEditOpen(false);
      setSelectedFile(null);
      setPreviewURL("");
      alert("プロフィールを保存しました");
    } catch (error) {
      console.error("プロフィール保存エラー:", error);
      alert("プロフィールの保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <>
      {/* Modal */}
      {editOpen && (
        <div className="fixed inset-0 bg-gray-800/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md relative">
            <button
              className="absolute top-3 right-3 text-gray-600 hover:text-black"
              onClick={() => {
                setEditOpen(false);
                setSelectedFile(null);
                setPreviewURL("");
                setEditProfile(profile); // 編集をキャンセルして元の値に戻す
              }}
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
      )}

      {/* Página */}
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-5 py-8">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Profile Left */}
            <div>
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6 text-center">
                {/* Avatar */}
                <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4 overflow-hidden flex items-center justify-center">
                  {profile.photoURL ? (
                    <img
                      src={profile.photoURL}
                      alt="プロフィール画像"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={48} />
                  )}
                </div>

                <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "せのびゴシック" }}>
                  {profile.displayName || "名無しユーザー"}
                </h1>
                <p className="text-gray-600 mb-4">@{profile.username || "user"}</p>

                <button
                  className="w-full bg-[#2FA3E3] text-white py-3 rounded-lg mb-3 hover:bg-[#1d7bb8] transition-colors"
                  onClick={() => setEditOpen(true)}
                >
                  プロフィール編集
                </button>
                <button className="w-full border border-[#2FA3E3] text-[#2FA3E3] py-3 rounded-lg hover:bg-[#2FA3E3] hover:text-white transition-colors">
                  メッセージ
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="font-bold mb-2" style={{ fontFamily: "せのびゴシック" }}>
                  自己紹介
                </h2>
                <p className="text-sm text-gray-600">
                  {profile.bio || "自己紹介が設定されていません"}
                </p>
              </div>
            </div>

            {/* Produtos */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-lg">
              <div className="flex border-b text-sm">
                <button className="px-6 py-4 text-[#2FA3E3] border-b-2 border-[#2FA3E3] font-medium">出品中 (24)</button>
                <button className="px-6 py-4 text-gray-600 hover:text-[#2FA3E3]">販売済み (78)</button>
                <button className="px-6 py-4 text-gray-600 hover:text-[#2FA3E3]">評価 (156)</button>
              </div>

              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg overflow-hidden hover:shadow-lg transition">
                    <div className="h-36 bg-gray-200 flex items-center justify-center">
                      <Fish />
                    </div>
                    <div className="p-3 text-sm">
                      <p className="font-medium">釣り竿セット 初心者向け</p>
                      <p className="text-lg font-bold text-[#2FA3E3]">¥3,500</p>
                      <p className="text-xs text-gray-500">出品中・2日前</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
