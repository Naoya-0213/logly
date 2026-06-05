"use client";

import { createClient } from "@/lib/supabase";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("正しいメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    console.log("onSubmit発火！", data);
    setLoading(true);
    setError(null);

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    console.log("authData:", authData);
    console.log("error:", error);

    if (error) {
      setError("メールアドレスまたはパスワードが正しくありません");
      setLoading(false);
      return;
    }

    // 初回ログインか判定
    const { data: userData } = await supabase
      .from("users")
      .select("created_at")
      .eq("id", authData.user.id)
      .single();

    if (userData) {
      const createdAt = new Date(userData.created_at);
      const now = new Date();
      const isFirstLogin =
        createdAt.getFullYear() === now.getFullYear() &&
        createdAt.getMonth() === now.getMonth() &&
        createdAt.getDate() === now.getDate();

      if (isFirstLogin) {
        toast.success("登録おめでとうございます！🎉 \n学習記録をつけよう！", {
          duration: 5000,
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
      } else {
        toast.success("おかえりなさい👋 \n今日もがんばりましょう！", {
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
      }
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-500">Logly</h1>
          <p className="text-gray-500 text-sm mt-2">学習記録をシンプルに</p>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">ログイン</h2>

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
                placeholder="8文字以上"
                className="input-field"
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {errors.password && (
              <p className="text-red-500 text-xs mt-1">
                {errors.password.message}
              </p>
            )}
            {/* 追加するリンク */}
            <div className="text-right mt-1">
              <Link
                href="/reset-password"
                className="text-xs text-indigo-400 hover:text-indigo-500"
              >
                パスワードをお忘れですか？
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading ? "ログイン中..." : "ログイン"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          アカウントをお持ちでない方は
          <Link href="/register" className="text-indigo-500 font-medium ml-1">
            新規登録
          </Link>
        </p>
      </div>
    </div>
  );
}
