"use client";

import AppLayout from "@/components/layout/AppLayout";
import { createClient } from "@/lib/supabase";
import { StudyRecord } from "@/types";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RecordsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [records, setRecords] = useState<StudyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState<{ id: number; name: string }[]>(
    [],
  );

  const fetchRecords = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data: recordsData } = await supabase
      .from("study_records")
      .select("*, categories(*)")
      .eq("user_id", user.id)
      .order("study_date", { ascending: false });

    const { data: categoriesData } = await supabase
      .from("categories")
      .select("id, name")
      .eq("user_id", user.id);

    setRecords(recordsData || []);
    setCategories(categoriesData || []);
    setLoading(false);
  };

  useEffect(() => {
    const fetchRecords = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: recordsData } = await supabase
        .from("study_records")
        .select("*, categories(*)")
        .eq("user_id", user.id)
        .order("study_date", { ascending: false });

      const { data: categoriesData } = await supabase
        .from("categories")
        .select("id, name")
        .eq("user_id", user.id);

      setRecords(recordsData || []);
      setCategories(categoriesData || []);
      setLoading(false);
    };

    fetchRecords();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("この記録を削除しますか？")) return;

    const { error } = await supabase
      .from("study_records")
      .delete()
      .eq("id", id);

    if (!error) {
      setRecords(records.filter((r) => r.id !== id));
    }
  };

  // 累計合計時間
  const totalMinutes = records.reduce((sum, r) => sum + r.duration_minutes, 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalMins = totalMinutes % 60;

  // 検索・絞り込み
  const filteredRecords = records.filter((r) => {
    const matchSearch =
      searchQuery === "" ||
      r.content?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory =
      selectedCategory === "" || r.category_id === Number(selectedCategory);
    return matchSearch && matchCategory;
  });

  // 日付ごとにグループ化
  const groupedRecords = filteredRecords.reduce(
    (groups, record) => {
      const date = record.study_date;
      if (!groups[date]) groups[date] = [];
      groups[date].push(record);
      return groups;
    },
    {} as Record<string, StudyRecord[]>,
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(now.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split("T")[0];

    if (dateStr === today)
      return `${date.toLocaleDateString("ja-JP", { month: "long", day: "numeric" })}（今日）`;
    if (dateStr === yesterday)
      return `${date.toLocaleDateString("ja-JP", { month: "long", day: "numeric" })}（昨日）`;
    return date.toLocaleDateString("ja-JP", { month: "long", day: "numeric" });
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <p className="text-gray-400">読み込み中...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6 max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">履歴一覧</h1>
            <p className="text-sm text-gray-400 mt-0.5">これまでの学習記録</p>
          </div>
          <Link
            href="/records/new"
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={16} />
            追加
          </Link>
        </div>

        {/* 累計合計時間 */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-4 flex justify-between items-center">
          <span className="text-sm text-indigo-500 font-medium">
            累計合計時間
          </span>
          <span className="text-2xl font-semibold text-indigo-700">
            {totalHours}
            <span className="text-sm font-normal">h </span>
            {totalMins}
            <span className="text-sm font-normal">m</span>
          </span>
        </div>

        {/* 検索・絞り込み */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="記録を検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-8"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-field w-36"
          >
            <option value="">すべて</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* 記録一覧 */}
        {Object.keys(groupedRecords).length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm mb-4">まだ記録がありません</p>
            <Link
              href="/records/new"
              className="inline-flex items-center gap-2 bg-indigo-500 text-white text-sm px-4 py-2 rounded-xl"
            >
              <Plus size={16} />
              最初の記録を追加
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {Object.entries(groupedRecords).map(([date, dateRecords]) => (
              <div key={date}>
                {/* 日付ラベル */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-gray-400">
                    {formatDate(date)}
                  </span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>

                {/* その日の記録 */}
                <div className="flex flex-col gap-2">
                  {dateRecords.map((record) => (
                    <div
                      key={record.id}
                      className="card flex items-center gap-3"
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor:
                            record.categories?.color || "#6366F1",
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">
                          {record.content || "（メモなし）"}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {record.categories?.name || "カテゴリーなし"}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-gray-600 flex-shrink-0">
                        {record.duration_minutes}分
                      </span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Link
                          href={`/records/${record.id}/edit`}
                          className="p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                          aria-label="編集"
                        >
                          <Pencil size={14} />
                        </Link>
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label="削除"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
