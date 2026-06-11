"use client";

import AppLayout from "@/components/layout/AppLayout";
import { createClient } from "@/lib/supabase";
import { getNowJST, getTodayJST } from "@/lib/utils";
import { Category, StudyRecord, WeekData } from "@/types";
import clsx from "clsx";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
  Pencil,
  Plus,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type BarRectangleItem,
} from "recharts";

type Period = "thisMonth" | "lastMonth" | "last3Months" | "all";
type ChartTab = "category" | "goal";

const periodLabels: Record<Period, string> = {
  thisMonth: "今月",
  lastMonth: "先月",
  last3Months: "過去3ヶ月",
  all: "全期間",
};

const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(date: Date, withDay = false): string {
  const base = `${date.getMonth() + 1}/${date.getDate()}`;
  return withDay ? `${base}(${DAY_LABELS[date.getDay()]})` : base;
}

function getMonthWeeks(monthOffset: number): {
  startStr: string;
  endStr: string;
  label: string;
  startDate: Date;
}[] {
  const now = getNowJST();
  const year = now.getFullYear();
  const month = now.getMonth() + monthOffset;
  const targetDate = new Date(year, month, 1);
  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth();
  const firstDay = new Date(targetYear, targetMonth, 1);
  const lastDay = new Date(targetYear, targetMonth + 1, 0);
  const weeks: {
    startStr: string;
    endStr: string;
    label: string;
    startDate: Date;
  }[] = [];
  let weekStart = getWeekStart(firstDay);
  while (weekStart <= lastDay) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const startStr = weekStart.toISOString().split("T")[0];
    const endStr = weekEnd.toISOString().split("T")[0];
    const label = `${formatDate(weekStart, true)}〜${formatDate(weekEnd, true)}`;
    weeks.push({ startStr, endStr, label, startDate: new Date(weekStart) });
    weekStart = new Date(weekStart);
    weekStart.setDate(weekStart.getDate() + 7);
  }
  return weeks;
}

function getCurrentWeekStartStr(): string {
  return getWeekStart(new Date()).toISOString().split("T")[0];
}

// 連続記録日数を計算
function calcStreak(records: StudyRecord[]): number {
  if (records.length === 0) return 0;
  const dates = new Set(records.map((r) => r.study_date));
  const today = getTodayJST();
  let streak = 0;
  const current = new Date(today);
  while (true) {
    const dateStr = current.toISOString().split("T")[0];
    if (dates.has(dateStr)) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

// 期間のyear/monthを取得
function getPeriodYearMonth(
  period: Period,
): { year: number; month: number } | null {
  const now = getNowJST();
  if (period === "thisMonth")
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  if (period === "lastMonth") {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  }
  return null;
}

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [records, setRecords] = useState<StudyRecord[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("thisMonth");
  const [chartTab, setChartTab] = useState<ChartTab>("category");
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedWeekStart, setSelectedWeekStart] = useState<string | null>(
    null,
  );
  const [isMobile, setIsMobile] = useState(false);

  // 目標関連
  const [goalMinutes, setGoalMinutes] = useState<number>(0);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState<string>("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);

      const [recordsRes, categoriesRes] = await Promise.all([
        supabase
          .from("study_records")
          .select("*, categories(*)")
          .eq("user_id", user.id)
          .order("study_date", { ascending: false }),
        supabase.from("categories").select("*").eq("user_id", user.id),
      ]);

      setRecords(recordsRes.data || []);
      setCategories(categoriesRes.data || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  // 期間が変わったら目標を取得
  useEffect(() => {
    const fetchGoal = async () => {
      if (!userId) return;
      const ym = getPeriodYearMonth(period);
      if (!ym) {
        setGoalMinutes(0);
        return;
      }
      const { data } = await supabase
        .from("monthly_goals")
        .select("goal_minutes")
        .eq("user_id", userId)
        .eq("year", ym.year)
        .eq("month", ym.month)
        .single();
      setGoalMinutes(data?.goal_minutes || 0);
    };
    fetchGoal();
  }, [userId, period]);

  const handleSaveGoal = async () => {
    if (!userId) return;
    const ym = getPeriodYearMonth(period);
    if (!ym) return;
    const mins = Math.max(0, Math.round(parseFloat(goalInput) * 60));
    await supabase.from("monthly_goals").upsert(
      {
        user_id: userId,
        year: ym.year,
        month: ym.month,
        goal_minutes: mins,
      },
      { onConflict: "user_id,year,month" },
    );
    setGoalMinutes(mins);
    setEditingGoal(false);
  };

  const now = getNowJST();
  const displayDate = new Date(
    now.getFullYear(),
    now.getMonth() + monthOffset,
    1,
  );
  const monthLabel = displayDate.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
  });
  const monthWeeks = getMonthWeeks(monthOffset);
  const currentWeekStartStr = getCurrentWeekStartStr();

  const weeklyData: WeekData[] = monthWeeks.map((week) => {
    const mins = records
      .filter(
        (r) => r.study_date >= week.startStr && r.study_date <= week.endStr,
      )
      .reduce((sum, r) => sum + r.duration_minutes, 0);
    return {
      label: week.label,
      hours: Math.round((mins / 60) * 10) / 10,
      minutes: mins,
      weekOffset: 0,
      isSelected: selectedWeekStart === week.startStr,
      isCurrentWeek: week.startStr === currentWeekStartStr,
    };
  });

  const handleBarClick = (data: BarRectangleItem) => {
    const payload = data.payload as WeekData | undefined;
    if (!payload) return;
    const idx = weeklyData.findIndex((w) => w.label === payload.label);
    if (idx === -1) return;
    const startStr = monthWeeks[idx]?.startStr;
    if (!startStr) return;
    setSelectedWeekStart((prev) => (prev === startStr ? null : startStr));
  };

  const getFilteredRecords = () => {
    if (selectedWeekStart !== null) {
      const start = new Date(selectedWeekStart);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      const endStr = end.toISOString().split("T")[0];
      return records.filter(
        (r) => r.study_date >= selectedWeekStart && r.study_date <= endStr,
      );
    }
    const n = getNowJST();
    if (period === "all") return records;
    if (period === "thisMonth") {
      const firstDay = new Date(n.getFullYear(), n.getMonth(), 1)
        .toISOString()
        .split("T")[0];
      return records.filter((r) => r.study_date >= firstDay);
    }
    if (period === "lastMonth") {
      const firstDay = new Date(n.getFullYear(), n.getMonth() - 1, 1)
        .toISOString()
        .split("T")[0];
      const lastDay = new Date(n.getFullYear(), n.getMonth(), 0)
        .toISOString()
        .split("T")[0];
      return records.filter(
        (r) => r.study_date >= firstDay && r.study_date <= lastDay,
      );
    }
    if (period === "last3Months") {
      const firstDay = new Date(n.getFullYear(), n.getMonth() - 2, 1)
        .toISOString()
        .split("T")[0];
      return records.filter((r) => r.study_date >= firstDay);
    }
    return records;
  };

  const filteredRecords = getFilteredRecords();
  const totalMinutes = filteredRecords.reduce(
    (sum, r) => sum + r.duration_minutes,
    0,
  );
  const totalHours = Math.floor(totalMinutes / 60);
  const totalMins = totalMinutes % 60;

  const today = getTodayJST();
  const todayMinutes = records
    .filter((r) => r.study_date === today)
    .reduce((sum, r) => sum + r.duration_minutes, 0);

  const streak = calcStreak(records);

  // 目標達成率
  const goalAchievePct =
    goalMinutes > 0
      ? Math.min(Math.round((totalMinutes / goalMinutes) * 100), 999)
      : 0;
  const goalAchievedMinutes = Math.min(totalMinutes, goalMinutes);
  const remainMinutes = Math.max(goalMinutes - totalMinutes, 0);
  const goalHours = Math.floor(goalMinutes / 60);

  // 残り日数
  const getRemainingDays = () => {
    if (period !== "thisMonth") return null;
    const n = getNowJST();
    const lastDay = new Date(n.getFullYear(), n.getMonth() + 1, 0);
    return lastDay.getDate() - n.getDate();
  };
  const remainingDays = getRemainingDays();

  const categoryStats = categories
    .map((cat) => {
      const mins = filteredRecords
        .filter((r) => r.category_id === cat.id)
        .reduce((sum, r) => sum + r.duration_minutes, 0);
      return {
        name: cat.name,
        minutes: mins,
        hours: Math.round((mins / 60) * 10) / 10,
        color: cat.color,
      };
    })
    .filter((c) => c.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes);

  const uncategorizedMins = filteredRecords
    .filter((r) => r.category_id === null)
    .reduce((sum, r) => sum + r.duration_minutes, 0);
  if (uncategorizedMins > 0) {
    categoryStats.push({
      name: "その他",
      minutes: uncategorizedMins,
      hours: Math.round((uncategorizedMins / 60) * 10) / 10,
      color: "#9CA3AF",
    });
  }

  const recentRecords = filteredRecords.slice(0, 5);
  const selectedWeekLabel =
    selectedWeekStart !== null
      ? (() => {
          const start = new Date(selectedWeekStart);
          const end = new Date(start);
          end.setDate(end.getDate() + 6);
          return `${formatDate(start)}〜${formatDate(end)}`;
        })()
      : null;
  const sectionLabel = selectedWeekLabel ?? periodLabels[period];
  const canShowGoal = period !== "all";

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
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">
              ダッシュボード
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {now.toLocaleDateString("ja-JP", {
                year: "numeric",
                month: "long",
              })}
            </p>
          </div>
          <Link
            href="/records/new"
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={16} />
            記録を追加
          </Link>
        </div>

        {/* 期間切り替えタブ */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-4">
          {(Object.keys(periodLabels) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => {
                setPeriod(p);
                setSelectedWeekStart(null);
                if (p === "all") setChartTab("category");
              }}
              className={clsx(
                "flex-1 text-xs py-1.5 rounded-lg transition-colors font-medium",
                period === p && selectedWeekStart === null
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700",
              )}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="card">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} className="text-indigo-400" />
              <span className="text-xs text-gray-400">
                {sectionLabel}の合計
              </span>
            </div>
            <div className="text-2xl font-semibold text-gray-800">
              {totalHours}
              <span className="text-sm font-normal text-gray-400"> h </span>
              {totalMins}
              <span className="text-sm font-normal text-gray-400"> m</span>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={14} className="text-indigo-400" />
              <span className="text-xs text-gray-400">今日の学習</span>
            </div>
            <div className="text-2xl font-semibold text-gray-800">
              {Math.floor(todayMinutes / 60)}
              <span className="text-sm font-normal text-gray-400"> h </span>
              {todayMinutes % 60}
              <span className="text-sm font-normal text-gray-400"> m</span>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-2 mb-2">
              <Flame size={14} className="text-orange-400" />
              <span className="text-xs text-gray-400">
                {sectionLabel}の記録数
              </span>
            </div>
            <div className="text-2xl font-semibold text-gray-800">
              {filteredRecords.length}
              <span className="text-sm font-normal text-gray-400"> 件</span>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-2 mb-2">
              <Flame size={14} className="text-orange-400" />
              <span className="text-xs text-gray-400">連続記録</span>
            </div>
            <div className="text-2xl font-semibold text-orange-500">
              {streak}
              <span className="text-sm font-normal text-gray-400"> 日</span>
            </div>
          </div>
        </div>

        {/* 週次グラフ */}
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">
              週別学習時間
            </h2>
            <div className="flex items-center gap-2">
              {monthOffset < 0 && (
                <button
                  onClick={() => {
                    setMonthOffset(0);
                    setSelectedWeekStart(null);
                  }}
                  className="text-xs font-medium text-indigo-500 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg transition-colors"
                >
                  今月
                </button>
              )}
              <button
                onClick={() => {
                  setMonthOffset((p) => p - 1);
                  setSelectedWeekStart(null);
                }}
                className="p-1 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-400"
                aria-label="過去へ"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs text-gray-600 font-medium">
                {monthLabel}
              </span>
              <button
                onClick={() => {
                  setMonthOffset((p) => p + 1);
                  setSelectedWeekStart(null);
                }}
                disabled={monthOffset >= 0}
                className="p-1 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-400 disabled:opacity-30"
                aria-label="未来へ"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
          <div onMouseDown={(e) => e.preventDefault()}>
            {isMobile ? (
              <ResponsiveContainer
                width="100%"
                height={Math.max(weeklyData.length * 44, 160)}
              >
                <BarChart
                  data={weeklyData}
                  layout="vertical"
                  barSize={20}
                  margin={{ top: 0, right: 8, bottom: 0, left: -20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#F3F4F6"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: "#9CA3AF" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `${v}h`}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    tick={{ fontSize: 9, fill: "#9CA3AF", textAnchor: "end" }}
                    axisLine={false}
                    tickLine={false}
                    width={110}
                  />
                  <Bar
                    dataKey="hours"
                    radius={[0, 4, 4, 0]}
                    onClick={handleBarClick}
                    activeBar={false}
                    style={{ cursor: "pointer" }}
                  >
                    {weeklyData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={
                          entry.isSelected
                            ? "#4F46E5"
                            : entry.isCurrentWeek && monthOffset === 0
                              ? "#6366F1"
                              : "#C7D2FE"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={weeklyData} barSize={32}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#F3F4F6"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    tick={{ fontSize: 9, fill: "#9CA3AF" }}
                    height={30}
                  />
                  <YAxis
                    width={30}
                    tick={{ fontSize: 10, fill: "#9CA3AF" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `${v}h`}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(99,102,241,0.05)" }}
                    formatter={(value) => [`${Number(value)}h`, "学習時間"]}
                    labelFormatter={() => ""}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #F3F4F6",
                      fontSize: "12px",
                    }}
                  />
                  <Bar
                    dataKey="hours"
                    radius={[4, 4, 0, 0]}
                    onClick={handleBarClick}
                    activeBar={false}
                    style={{ cursor: "pointer" }}
                  >
                    {weeklyData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={
                          entry.isSelected
                            ? "#4F46E5"
                            : entry.isCurrentWeek && monthOffset === 0
                              ? "#6366F1"
                              : "#C7D2FE"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* カテゴリー別 / 目標達成率 + 記録一覧 */}
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="card">
            {/* タブ */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-4">
              <button
                onClick={() => setChartTab("category")}
                className={clsx(
                  "flex-1 text-xs py-1.5 rounded-md transition-colors font-medium",
                  chartTab === "category"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-gray-500",
                )}
              >
                カテゴリー別
              </button>
              <button
                onClick={() => canShowGoal && setChartTab("goal")}
                className={clsx(
                  "flex-1 text-xs py-1.5 rounded-md transition-colors font-medium",
                  !canShowGoal
                    ? "text-gray-300 cursor-not-allowed"
                    : chartTab === "goal"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-gray-500",
                )}
                disabled={!canShowGoal}
              >
                目標達成率
              </button>
            </div>

            {chartTab === "category" ? (
              <>
                <div className="mb-4">
                  <h2 className="text-sm font-semibold text-gray-700">
                    カテゴリー別
                  </h2>
                  <p className="text-xs text-indigo-500 mt-0.5 font-medium">
                    {sectionLabel}
                  </p>
                </div>
                {categoryStats.length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">
                    まだ記録がありません
                  </p>
                ) : (
                  <div onMouseDown={(e) => e.preventDefault()}>
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={categoryStats}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="minutes"
                          startAngle={90}
                          endAngle={-270}
                        >
                          {categoryStats.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) => {
                            const m = Number(value) || 0;
                            return [
                              `${Math.floor(m / 60)}h ${m % 60}m`,
                              "学習時間",
                            ];
                          }}
                          contentStyle={{
                            borderRadius: "8px",
                            border: "1px solid #F3F4F6",
                            fontSize: "12px",
                          }}
                        />
                        <Legend
                          formatter={(value) => (
                            <span
                              style={{ fontSize: "12px", color: "#6B7280" }}
                            >
                              {value}
                            </span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-700">
                      目標達成率
                    </h2>
                    <p className="text-xs text-indigo-500 mt-0.5 font-medium">
                      {sectionLabel}
                    </p>
                  </div>
                  {!editingGoal && (
                    <button
                      onClick={() => {
                        setEditingGoal(true);
                        setGoalInput(String(goalHours));
                      }}
                      className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-600"
                    >
                      <Pencil size={12} />
                      変更
                    </button>
                  )}
                </div>

                {editingGoal && (
                  <div className="flex items-center gap-2 mb-4 mt-2">
                    <span className="text-xs text-gray-400">目標：</span>
                    <input
                      type="number"
                      value={goalInput}
                      onChange={(e) => setGoalInput(e.target.value)}
                      className="w-16 text-center border border-indigo-300 rounded-lg bg-indigo-50 py-1 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-400"
                    />
                    <span className="text-xs text-gray-400">時間</span>
                    <button
                      onClick={handleSaveGoal}
                      className="text-xs bg-indigo-500 text-white px-3 py-1 rounded-lg hover:bg-indigo-600"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => setEditingGoal(false)}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      キャンセル
                    </button>
                  </div>
                )}

                {goalMinutes === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400 text-sm mb-3">
                      目標時間が設定されていません
                    </p>
                    <button
                      onClick={() => {
                        setEditingGoal(true);
                        setGoalInput("");
                      }}
                      className="text-xs bg-indigo-500 text-white px-4 py-2 rounded-xl hover:bg-indigo-600"
                    >
                      目標を設定する
                    </button>
                  </div>
                ) : (
                  <>
                    <div
                      className="relative flex items-center justify-center my-2"
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={[
                              { value: Math.min(totalMinutes, goalMinutes) },
                              {
                                value: Math.max(goalMinutes - totalMinutes, 0),
                              },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={85}
                            startAngle={90}
                            endAngle={-270}
                            dataKey="value"
                            strokeWidth={0}
                          >
                            <Cell fill="#6366F1" />
                            <Cell fill="#F3F4F6" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute text-center pointer-events-none">
                        <div className="text-3xl font-semibold text-gray-800">
                          {goalAchievePct}%
                        </div>
                        <div className="text-xs text-gray-400 mt-1">達成</div>
                      </div>
                    </div>

                    <div className="flex justify-between mt-2 pt-3 border-t border-gray-100">
                      <div className="text-center">
                        <div className="text-sm font-semibold text-gray-800">
                          {Math.floor(goalAchievedMinutes / 60)}h{" "}
                          {goalAchievedMinutes % 60}m
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          達成済み
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-semibold text-gray-800">
                          {Math.floor(remainMinutes / 60)}h {remainMinutes % 60}
                          m
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">残り</div>
                      </div>
                      {remainingDays !== null && (
                        <div className="text-center">
                          <div className="text-sm font-semibold text-gray-800">
                            {remainingDays}日
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            残り日数
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          <div className="card">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-gray-700">
                {selectedWeekLabel
                  ? "週の記録"
                  : `${periodLabels[period]}の記録`}
              </h2>
              <p className="text-xs text-indigo-500 mt-0.5 font-medium">
                {sectionLabel}
              </p>
            </div>
            {recentRecords.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">
                まだ記録がありません
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {recentRecords.map((record) => (
                  <div key={record.id} className="flex items-center gap-3">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: record.categories?.color || "#9CA3AF",
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">
                        {record.content || "（メモなし）"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {record.categories?.name || "カテゴリーなし"}
                      </p>
                    </div>
                    <span className="text-sm text-gray-500 flex-shrink-0">
                      {record.duration_minutes}分
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
