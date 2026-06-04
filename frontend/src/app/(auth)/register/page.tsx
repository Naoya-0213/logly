"use client";

import { createClient } from "@/lib/supabase";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

const schema = z.object({
  display_name: z
    .string()
    .min(1, "ユーザーネームを入力してください")
    .max(20, "ユーザーネームは20文字以内で入力してください"),
  email: z.string().email("正しいメールアドレスを入力してください"),
  password: z
    .string()
    .min(8, "パスワードは8文字以上で入力してください")
    .regex(/[a-zA-Z]/, "パスワードに英字を含めてください")
    .regex(/[0-9]/, "パスワードに数字を含めてください"),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { display_name: data.display_name },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // トーストは1回だけ！
    toast.success("確認メールを送信しました！📧", {
      duration: 4000,
      style: {
        background: "#fff",
        color: "#374151",
        borderRadius: "12px",
        border: "1px solid #F3F4F6",
        padding: "12px 16px",
        fontSize: "14px",
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
      },
      iconTheme: {
        primary: "#6366F1",
        secondary: "#fff",
      },
    });

    setSent(true);
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mt-4">
            {/* ロゴ */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-indigo-500">Logly</h1>
              <p className="text-gray-500 text-sm mt-2">学習記録をシンプルに</p>
            </div>
            {/* メインカード */}
            <div className="card">
              <div className="text-center mb-4">
                <div className="text-5xl mb-3">📧</div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  確認メールを送信しました！
                </h2>
                <p className="text-gray-500 text-sm">
                  ご登録のメールアドレスに
                  <br />
                  確認メールをお送りしました。
                </p>
              </div>
            </div>

            {/* ① メール確認が必要なことを強調 */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-4 mt-4">
              <p className="text-indigo-700 text-sm font-medium text-center">
                ⚠️ ログインの前にメール認証が必要です
              </p>
            </div>

            {/* 手順 */}
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  1
                </div>
                <p className="text-sm text-gray-600 text-left">
                  受信したメールを開いてください
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  2
                </div>
                <p className="text-sm text-gray-600 text-left">
                  「メールアドレスを確認する」ボタンをクリック
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  3
                </div>
                <p className="text-sm text-gray-600 text-left">
                  認証完了後にログインページからログインしてください
                </p>
              </div>
            </div>

            {/* ② ログインできない理由を説明 */}
            <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 mb-4">
              <p className="text-yellow-700 text-xs text-center">
                💡 メール認証が完了するまではログインできません。
                <br />
                先にメールのリンクをクリックしてください。
              </p>
            </div>

            {/* ③ メールが届かない場合 */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5">
              <p className="text-gray-500 text-xs font-medium mb-2">
                📭 メールが届かない場合
              </p>
              <ul className="text-gray-400 text-xs flex flex-col gap-1">
                <li>・ 迷惑メールフォルダをご確認ください</li>
                <li>・ メールアドレスが正しいか確認してください</li>
                <li>・ 数分待ってから再度お試しください</li>
              </ul>
            </div>

            <Link
              href="/login"
              className="btn-primary inline-block text-center"
            >
              ログインページへ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-500">Logly</h1>
          <p className="text-gray-500 text-sm mt-2">学習記録をシンプルに</p>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">新規登録</h2>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <div>
              <label className="label">ユーザーネーム</label>
              <input
                {...register("display_name")}
                type="text"
                placeholder="例：田中太郎（20文字以内）"
                className="input-field"
              />
              {errors.display_name && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.display_name.message}
                </p>
              )}
            </div>

            <div>
              <label className="label">メールアドレス</label>
              <input
                {...register("email")}
                type="email"
                placeholder="example@email.com"
                className="input-field"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="label">パスワード</label>
              <input
                {...register("password")}
                type="password"
                placeholder="8文字以上・英数字混在"
                className="input-field"
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.password.message}
                </p>
              )}
              <p className="text-gray-400 text-xs mt-1">
                ※ 英字と数字を含む8文字以上
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading ? "登録中..." : "アカウントを作成"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          すでにアカウントをお持ちの方は
          <Link href="/login" className="text-indigo-500 font-medium ml-1">
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}
