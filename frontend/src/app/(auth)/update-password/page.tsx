"use client";

import { createClient } from "@/lib/supabase";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

const schema = z
  .object({
    password: z
      .string()
      .min(8, "パスワードは8文字以上で入力してください")
      .regex(/[a-zA-Z]/, "パスワードに英字を含めてください")
      .regex(/[0-9]/, "パスワードに数字を含めてください"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "パスワードが一致しません",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export default function UpdatePasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });

    if (error) {
      toast.error("パスワードの更新に失敗しました");
      setLoading(false);
      return;
    }

    toast.success("パスワードを更新しました！");
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-500">Logly</h1>
          <p className="text-gray-500 text-sm mt-2">学習記録をシンプルに</p>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            新しいパスワードを設定
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            新しいパスワードを入力してください。
          </p>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <div>
              <label className="label">新しいパスワード</label>
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

            <div>
              <label className="label">パスワード（確認）</label>
              <input
                {...register("confirmPassword")}
                type="password"
                placeholder="もう一度入力してください"
                className="input-field"
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? "更新中..." : "パスワードを更新する"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
