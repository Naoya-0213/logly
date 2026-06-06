"use client";

import AppLayout from "@/components/layout/AppLayout";
import UserAvatar from "@/components/ui/UserAvatar";
import { useAvatar } from "@/hooks/useAvatar";
import { createClient } from "@/lib/supabase";
import { Info } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { uploadAvatar, uploading } = useAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [nameLoading, setNameLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      const { data } = await supabase
        .from("users")
        .select("display_name, email, avatar_url")
        .eq("id", user.id)
        .single();

      if (data) {
        setDisplayName(data.display_name || "");
        setEmail(data.email || "");
        setAvatarUrl(data.avatar_url || null);
      }
    };
    fetchUser();
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    const newUrl = await uploadAvatar(file, userId);
    if (newUrl) {
      setAvatarUrl(newUrl);
    }
    e.target.value = "";
  };

  const handleNameUpdate = async () => {
    if (!displayName.trim()) {
      toast.error("ユーザーネームを入力してください");
      return;
    }
    if (displayName.length > 20) {
      toast.error("20文字以内で入力してください");
      return;
    }
    setNameLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("users")
      .update({ display_name: displayName.trim() })
      .eq("id", user.id);
    if (error) {
      toast.error("更新に失敗しました");
    } else {
      toast.success("ユーザーネームを更新しました！");
    }
    setNameLoading(false);
  };

  const handleEmailUpdate = async () => {
    if (!newEmail.trim()) {
      toast.error("メールアドレスを入力してください");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast.error("正しいメールアドレスを入力してください");
      return;
    }
    setEmailLoading(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) {
      toast.error("更新に失敗しました");
    } else {
      toast.success("確認メールを送信しました！");
      setNewEmail("");
    }
    setEmailLoading(false);
  };

  const handlePasswordUpdate = async () => {
    if (!newPassword) {
      toast.error("パスワードを入力してください");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("8文字以上で入力してください");
      return;
    }
    if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      toast.error("英字と数字を含めてください");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("パスワードが一致しません");
      return;
    }
    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast.error("更新に失敗しました");
    } else {
      toast.success("パスワードを更新しました！");
      setNewPassword("");
      setConfirmPassword("");
    }
    setPasswordLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-800">
            アカウント設定
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            プロフィールとセキュリティ設定
          </p>
        </div>

        {/* アバター画像 */}
        <div className="flex justify-center mb-6">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="relative group"
            aria-label="アバター画像を変更"
          >
            <UserAvatar
              avatarUrl={avatarUrl}
              displayName={displayName}
              email={email}
              size="lg"
            />
            <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-xs font-medium">
                {uploading ? "..." : "変更"}
              </span>
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        <p className="text-center text-xs text-gray-400 -mt-4 mb-6">
          タップして画像を変更
        </p>

        {/* ユーザーネーム変更 */}
        <div className="card mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            ユーザーネーム変更
          </h2>
          <div className="flex flex-col gap-3">
            <div>
              <label className="label">新しいユーザーネーム</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="20文字以内"
                className="input-field"
                maxLength={20}
              />
              <p className="text-xs text-gray-400 mt-1 text-right">
                {displayName.length}/20
              </p>
            </div>
            <button
              onClick={handleNameUpdate}
              disabled={nameLoading}
              className="btn-primary"
            >
              {nameLoading ? "更新中..." : "更新する"}
            </button>
          </div>
        </div>

        {/* メールアドレス変更 */}
        <div className="card mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            メールアドレス変更
          </h2>
          <div className="flex flex-col gap-3">
            <div>
              <label className="label">現在のメールアドレス</label>
              <input
                type="email"
                value={email}
                disabled
                className="input-field bg-gray-50 text-gray-400"
              />
            </div>
            <div>
              <label className="label">新しいメールアドレス</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="example@email.com"
                className="input-field"
              />
            </div>
            <button
              onClick={handleEmailUpdate}
              disabled={emailLoading}
              className="btn-primary"
            >
              {emailLoading ? "更新中..." : "更新する"}
            </button>
          </div>
        </div>

        {/* パスワード変更 */}
        <div className="card mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            パスワード変更
          </h2>
          <div className="flex flex-col gap-3">
            <div>
              <label className="label">新しいパスワード</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="8文字以上・英数字混在"
                className="input-field"
              />
            </div>
            <div>
              <label className="label">パスワード（確認）</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="もう一度入力してください"
                className="input-field"
              />
            </div>
            <button
              onClick={handlePasswordUpdate}
              disabled={passwordLoading}
              className="btn-primary"
            >
              {passwordLoading ? "更新中..." : "更新する"}
            </button>
          </div>
        </div>

        {/* ログアウト */}
        <div className="card mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            アカウント操作
          </h2>
          <button
            onClick={handleLogout}
            className="btn-secondary w-full text-red-500 border-red-200 hover:bg-red-50"
          >
            ログアウト
          </button>
        </div>

        {/* アプリ情報 */}
        <Link
          href="/about"
          className="card flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <Info size={16} className="text-gray-400" />
            <span className="text-sm text-gray-600">
              アプリ情報・バージョン履歴
            </span>
          </div>
          <span className="text-xs text-gray-300 group-hover:text-indigo-400 transition-colors">
            ›
          </span>
        </Link>
      </div>
    </AppLayout>
  );
}
