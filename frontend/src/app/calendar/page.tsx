"use client";

import AppLayout from "@/components/layout/AppLayout";
import { createClient } from "@/lib/supabase";
import { getTodayJST } from "@/lib/utils";
import { Category, StudyRecord } from "@/types";
import clsx from "clsx";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  Pencil,
  Plus,
  Search,
  Trash2,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import ModalContent from "./ModalContent";

const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日（${DAY_LABELS[d.getDay()]}）`;
}

export default function CalendarPage() {
  const router = useRouter();
  const supabase = createClient();
  const [records, setRecords] = useState<StudyRecord[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const today = getTodayJST();
  const todayDate = new Date(today);
  const [calYear, setCalYear] = useState(todayDate.getFullYear());
  const [calMonth, setCalMonth] = useState(todayDate.getMonth());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const [recordsRes, categoriesRes] = await Promise.all([
        supabase
          .from("study_records")
          .select("*, categories(*)")
          .eq("user_id", user.id)
          .order("study_date", { ascending: false })
          .order("created_at", { ascending: false }),
        supabase.from("categories").select("*").eq("user_id", user.id),
      ]);
      setRecords(recordsRes.data || []);
      setCategories(categoriesRes.data || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-gray-700">
            この記録を削除しますか？
          </p>
          <div className="flex gap-2 mt-1">
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                const { error } = await supabase
                  .from("study_records")
                  .delete()
                  .eq("id", id);
                if (!error) {
                  setRecords((prev) => prev.filter((r) => r.id !== id));
                  toast.success("記録を削除しました");
                } else toast.error("削除に失敗しました");
              }}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs py-1.5 px-3 rounded-lg transition-colors"
            >
              削除する
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs py-1.5 px-3 rounded-lg transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      ),
      {
        duration: 10000,
        style: {
          background: "#fff",
          color: "#374151",
          borderRadius: "12px",
          border: "1px solid #F3F4F6",
          padding: "12px 16px",
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
        },
      },
    );
  };

  // カレンダー計算
  const firstDay = new Date(calYear, calMonth, 1);
  const lastDay = new Date(calYear, calMonth + 1, 0);
  const firstWeekDay = firstDay.getDay();
  const recordsByDate = records.reduce(
    (acc, r) => {
      if (!acc[r.study_date]) acc[r.study_date] = [];
      acc[r.study_date].push(r);
      return acc;
    },
    {} as Record<string, StudyRecord[]>,
  );

  const monthFirstStr = firstDay.toISOString().split("T")[0];
  const monthLastStr = lastDay.toISOString().split("T")[0];
  const monthRecords = records.filter(
    (r) => r.study_date >= monthFirstStr && r.study_date <= monthLastStr,
  );
  const monthTotalMins = monthRecords.reduce(
    (sum, r) => sum + r.duration_minutes,
    0,
  );

  const calDays: (number | null)[] = [];
  for (let i = 0; i < firstWeekDay; i++) calDays.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) calDays.push(d);

  const isCurrentMonth =
    calYear === todayDate.getFullYear() && calMonth === todayDate.getMonth();

  const prevMonth = () => {
    if (calMonth === 0) {
      setCalYear((y) => y - 1);
      setCalMonth(11);
    } else setCalMonth((m) => m - 1);
    setSelectedDate(null);
  };
  const nextMonth = () => {
    if (isCurrentMonth) return;
    if (calMonth === 11) {
      setCalYear((y) => y + 1);
      setCalMonth(0);
    } else setCalMonth((m) => m + 1);
    setSelectedDate(null);
  };

  const selectedRecords = selectedDate ? recordsByDate[selectedDate] || [] : [];
  const selectedTotal = selectedRecords.reduce(
    (sum, r) => sum + r.duration_minutes,
    0,
  );

  // リスト計算
  const filteredRecords = records.filter((r) => {
    const matchSearch =
      searchQuery === "" ||
      r.content?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat =
      selectedCategory === "" || r.category_id === Number(selectedCategory);
    return matchSearch && matchCat;
  });
  const groupedRecords = filteredRecords.reduce(
    (groups, record) => {
      const date = record.study_date;
      if (!groups[date]) groups[date] = [];
      groups[date].push(record);
      return groups;
    },
    {} as Record<string, StudyRecord[]>,
  );
  const filteredTotalMins = filteredRecords.reduce(
    (sum, r) => sum + r.duration_minutes,
    0,
  );
  const isFiltered = searchQuery !== "" || selectedCategory !== "";
  const filterLabel =
    selectedCategory !== ""
      ? (categories.find((c) => c.id === Number(selectedCategory))?.name ?? "")
      : searchQuery !== ""
        ? `「${searchQuery}」`
        : "";

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
      <div className="p-4 md:p-6 max-w-2xl mx-auto w-full">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">カレンダー</h1>
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

        {/* タブ */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-4">
          <button
            onClick={() => setViewMode("calendar")}
            className={clsx(
              "flex-1 text-xs py-1.5 rounded-lg transition-colors font-medium",
              viewMode === "calendar"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700",
            )}
          >
            カレンダー
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={clsx(
              "flex-1 text-xs py-1.5 rounded-lg transition-colors font-medium",
              viewMode === "list"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700",
            )}
          >
            リスト
          </button>
        </div>

        {viewMode === "calendar" ? (
          <>
            {/* サマリー */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="card">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={14} className="text-indigo-400" />
                  <span className="text-xs text-gray-400">合計</span>
                </div>
                <p className="text-xl font-semibold text-gray-800">
                  {Math.floor(monthTotalMins / 60)}
                  <span className="text-sm font-normal text-gray-400"> h </span>
                  {monthTotalMins % 60}
                  <span className="text-sm font-normal text-gray-400"> m</span>
                </p>
              </div>
              <div className="card">
                <div className="flex items-center gap-2 mb-2">
                  <Flame size={14} className="text-orange-400" />
                  <span className="text-xs text-gray-400">記録数</span>
                </div>
                <p className="text-xl font-semibold text-gray-800">
                  {monthRecords.length}
                  <span className="text-sm font-normal text-gray-400"> 件</span>
                </p>
              </div>
            </div>

            {/* カレンダー */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-400"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-sm font-semibold text-gray-700">
                  {calYear}年{calMonth + 1}月
                </span>
                <button
                  onClick={nextMonth}
                  disabled={isCurrentMonth}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-400 disabled:opacity-30"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-1">
                {DAY_LABELS.map((d, i) => (
                  <div
                    key={d}
                    className={clsx(
                      "text-center text-xs py-1",
                      i === 0
                        ? "text-red-400"
                        : i === 6
                          ? "text-indigo-400"
                          : "text-gray-400",
                    )}
                  >
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calDays.map((day, idx) => {
                  if (day === null) return <div key={`empty-${idx}`} />;
                  const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const hasRecord = !!recordsByDate[dateStr]?.length;
                  const isToday = dateStr === today;
                  const isSelected = dateStr === selectedDate;
                  const dayOfWeek = (firstWeekDay + day - 1) % 7;
                  return (
                    <button
                      key={day}
                      onClick={() =>
                        setSelectedDate(isSelected ? null : dateStr)
                      }
                      className="flex flex-col items-center justify-center aspect-square focus:outline-none"
                    >
                      <div
                        className={clsx(
                          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                          isToday
                            ? "bg-indigo-700 text-white ring-2 ring-indigo-400 ring-offset-1"
                            : hasRecord
                              ? "bg-indigo-500 text-white"
                              : isSelected
                                ? "bg-indigo-50 text-indigo-600"
                                : dayOfWeek === 0
                                  ? "text-red-400"
                                  : dayOfWeek === 6
                                    ? "text-indigo-400"
                                    : "text-gray-700",
                        )}
                      >
                        {day}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* モーダル：モバイル（下から）/ PC（中央） */}
            {selectedDate && (
              <div
                className="fixed inset-0 bg-black/40 z-50"
                onClick={() => setSelectedDate(null)}
              >
                {/* モバイル */}
                <div
                  className="md:hidden absolute bottom-16 left-0 right-0 bg-white rounded-t-2xl p-5 overflow-y-auto max-h-[60vh]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ModalContent
                    selectedDate={selectedDate}
                    selectedRecords={selectedRecords}
                    selectedTotal={selectedTotal}
                    onClose={() => setSelectedDate(null)}
                    onDelete={handleDelete}
                  />
                </div>
                {/* PC */}
                <div
                  className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl p-5 w-[480px] max-h-[70vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ModalContent
                    selectedDate={selectedDate}
                    selectedRecords={selectedRecords}
                    selectedTotal={selectedTotal}
                    onClose={() => setSelectedDate(null)}
                    onDelete={handleDelete}
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* 累計 */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-4 flex justify-between items-center">
              <span className="text-sm text-indigo-500 font-medium">
                累計合計時間
              </span>
              <span className="text-2xl font-semibold text-indigo-700">
                {Math.floor(
                  records.reduce((s, r) => s + r.duration_minutes, 0) / 60,
                )}
                <span className="text-sm font-normal"> h </span>
                {records.reduce((s, r) => s + r.duration_minutes, 0) % 60}
                <span className="text-sm font-normal"> m</span>
              </span>
            </div>

            {/* 検索 */}
            <div className="flex gap-2 mb-4 w-full min-w-0">
              <div className="flex-1 relative min-w-0">
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
                className="input-field w-28 flex-shrink-0"
              >
                <option value="">すべて</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {isFiltered && (
              <div className="flex items-center justify-between bg-indigo-50 rounded-xl px-3 py-2 mb-4">
                <span className="text-xs text-indigo-500">
                  {filterLabel}　{filteredRecords.length}件
                </span>
                <span className="text-sm font-semibold text-indigo-600">
                  {Math.floor(filteredTotalMins / 60)}h {filteredTotalMins % 60}
                  m
                </span>
              </div>
            )}

            {/* リスト */}
            {Object.keys(groupedRecords).length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-400 text-sm mb-4">
                  まだ記録がありません
                </p>
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
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-gray-400">
                        {formatDateLabel(date)}
                      </span>
                      <div className="flex-1 h-px bg-gray-100" />
                      <span className="text-xs text-indigo-500 font-medium flex items-center gap-1">
                        <Clock size={10} className="text-indigo-400" />
                        {(() => {
                          const t = dateRecords.reduce(
                            (s, r) => s + r.duration_minutes,
                            0,
                          );
                          return `${Math.floor(t / 60)}h ${t % 60}m`;
                        })()}
                      </span>
                    </div>
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
                                record.categories?.color || "#9CA3AF",
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
          </>
        )}
      </div>
    </AppLayout>
  );
}
