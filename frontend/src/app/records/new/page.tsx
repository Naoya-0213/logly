"use client";

import AppLayout from "@/components/layout/AppLayout";
import { createClient } from "@/lib/supabase";
import { Category } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

const schema = z.object({
  study_date: z.string().min(1, "日付を入力してください"),
  category_id: z.string().optional(),
  content: z.string().min(1, "勉強内容を入力してください"),
  duration_hours: z.number().min(0).max(23),
  duration_minutes: z.number().min(0).max(59),
  memo: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewRecordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoursInput, setHoursInput] = useState<string>("0");
  const [minutesInput, setMinutesInput] = useState<string>("30");

  const today = new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      study_date: today,
      duration_hours: 0,
      duration_minutes: 30,
    },
  });

  const hours = watch("duration_hours");
  const minutes = watch("duration_minutes");

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      setCategories(data || []);
    };
    fetchData();
  }, []);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);

    const totalMinutes = data.duration_hours * 60 + data.duration_minutes;
    if (totalMinutes === 0) {
      setError("勉強時間を入力してください");
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("study_records").insert({
      user_id: user.id,
      study_date: data.study_date,
      category_id: data.category_id ? Number(data.category_id) : null,
      content: data.content,
      duration_minutes: totalMinutes,
    });

    if (error) {
      setError("保存に失敗しました。もう一度試してください。");
      setLoading(false);
      return;
    }

    toast.success("記録を登録しました！📝", {
      duration: 3000,
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
    router.push("/records");
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/records" className="text-gray-400 hover:text-gray-600">
            <ChevronLeft size={20} />
          </Link>
          <h1 className="text-xl font-semibold text-gray-800">記録を追加</h1>
        </div>

        <div className="card">
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
              <label className="label">日付</label>
              <input
                {...register("study_date")}
                type="date"
                className="input-field"
                style={{ WebkitAppearance: "none" }}
              />
              {errors.study_date && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.study_date.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label">カテゴリー</label>
                <Link
                  href="/categories"
                  className="text-xs text-indigo-500 hover:text-indigo-600"
                >
                  ＋ カテゴリーを追加
                </Link>
              </div>
              <select {...register("category_id")} className="input-field">
                <option value="">カテゴリーなし</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">勉強内容</label>
              <input
                {...register("content")}
                type="text"
                placeholder="例：TOEIC単語100個"
                className="input-field"
              />
              {errors.content && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.content.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label">勉強時間</label>
                <span className="text-xs text-indigo-500 font-medium md:hidden">
                  合計 {hours * 60 + minutes}分
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl bg-white">
                {/* 時間 */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-400">時間</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const val = Math.max(0, hours - 1);
                        setValue("duration_hours", val);
                        setHoursInput(String(val));
                      }}
                      className="w-7 h-7 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 flex items-center justify-center hover:bg-gray-100"
                    >
                      −
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={hoursInput}
                      onFocus={() => setHoursInput("")}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, "");
                        setHoursInput(raw);
                        const val = Math.min(
                          23,
                          Math.max(0, parseInt(raw) || 0),
                        );
                        setValue("duration_hours", val);
                      }}
                      onBlur={() => {
                        const val = Math.min(
                          23,
                          Math.max(0, parseInt(hoursInput) || 0),
                        );
                        setValue("duration_hours", val);
                        setHoursInput(String(val));
                      }}
                      className="w-8 text-center text-base font-semibold text-gray-800 border border-indigo-300 rounded-lg bg-indigo-50 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = Math.min(23, hours + 1);
                        setValue("duration_hours", val);
                        setHoursInput(String(val));
                      }}
                      className="w-7 h-7 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 flex items-center justify-center hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                </div>

                <span className="text-gray-400 text-lg mt-4">:</span>

                {/* 分 */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-400">分</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const val = Math.max(0, minutes - 1);
                        setValue("duration_minutes", val);
                        setMinutesInput(String(val));
                      }}
                      className="w-7 h-7 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 flex items-center justify-center hover:bg-gray-100"
                    >
                      −
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={minutesInput}
                      onFocus={() => setMinutesInput("")}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, "");
                        setMinutesInput(raw);
                        const val = Math.min(
                          59,
                          Math.max(0, parseInt(raw) || 0),
                        );
                        setValue("duration_minutes", val);
                      }}
                      onBlur={() => {
                        const val = Math.min(
                          59,
                          Math.max(0, parseInt(minutesInput) || 0),
                        );
                        setValue("duration_minutes", val);
                        setMinutesInput(String(val));
                      }}
                      className="w-8 text-center text-base font-semibold text-gray-800 border border-indigo-300 rounded-lg bg-indigo-50 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const val = Math.min(59, minutes + 1);
                        setValue("duration_minutes", val);
                        setMinutesInput(String(val));
                      }}
                      className="w-7 h-7 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 flex items-center justify-center hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* PC：合計を右端に */}
                <span className="ml-auto text-sm text-indigo-500 font-medium hidden md:block pl-4 border-l border-gray-200">
                  合計 {hours * 60 + minutes}分
                </span>
              </div>
            </div>

            <div>
              <label className="label">メモ（任意）</label>
              <textarea
                {...register("memo")}
                placeholder="学習の感想や気づきを残しておきましょう…"
                className="input-field resize-none h-20"
              />
            </div>

            <div className="flex gap-3 mt-2">
              <Link
                href="/records"
                className="flex-1 btn-secondary text-center"
              >
                キャンセル
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary"
              >
                {loading ? "保存中..." : "記録を保存"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
