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
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-4">📧</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            確認メールを送信しました
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            登録したメールアドレスに確認メールを送りました。
            メール内のリンクをクリックして登録を完了してください。
          </p>
          <Link href="/login" className="btn-primary">
            ログインページへ
          </Link>
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
