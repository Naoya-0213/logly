"use client";

import AppLayout from "@/components/layout/AppLayout";
import { createClient } from "@/lib/supabase";
import { Category, StudyRecord, WeekData } from "@/types";
import clsx from "clsx";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Flame,
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

function getWeekRange(weekOffset: number): {
  start: Date;
  end: Date;
  labelWithDay: string;
  startWithDay: string;
  endWithDay: string;
  startStr: string;
} {
  const now = new Date();
  const thisWeekStart = getWeekStart(now);
  const start = new Date(thisWeekStart);
  start.setDate(start.getDate() + weekOffset * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return {
    start,
    end,
    labelWithDay: `${formatDate(start, true)}〜${formatDate(end, true)}`,
    startWithDay: formatDate(start, true),
    endWithDay: formatDate(end, true),
    startStr: start.toISOString().split("T")[0],
  };
}

const MobileXAxisTick = ({
  x,
  y,
  payload,
}: {
  x?: number | string;
  y?: number | string;
  payload?: { value: string };
}) => {
  const xNum = Number(x);
  const yNum = Number(y);
  if (!payload || isNaN(xNum) || isNaN(yNum)) return null;
  const parts = payload.value.split("|");
  return (
    <g transform={`translate(${xNum},${yNum})`}>
      {parts.map((part, i) => (
        <text
          key={i}
          x={0}
          y={0}
          dy={i === 0 ? 12 : i === 1 ? 22 : 32}
          textAnchor="middle"
          fill={part === "｜" ? "#D1D5DB" : "#9CA3AF"}
          fontSize={9}
        >
          {part === "｜" ? "|" : part}
        </text>
      ))}
    </g>
  );
};

export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [records, setRecords] = useState<StudyRecord[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("thisMonth");
  const [weekPageOffset, setWeekPageOffset] = useState(0);
  const [selectedWeekStart, setSelectedWeekStart] = useState<string | null>(
    null,
  );
  const [isMobile, setIsMobile] = useState(false);

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
      const { data: recordsData } = await supabase
        .from("study_records")
        .select("*, categories(*)")
        .eq("user_id", user.id)
        .order("study_date", { ascending: false });
      const { data: categoriesData } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id);
      setRecords(recordsData || []);
      setCategories(categoriesData || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const weekCount = isMobile ? 4 : 5;

  const weeklyData: WeekData[] = Array.from({ length: weekCount }, (_, i) => {
    const weekOffset = weekPageOffset - i;
    const { start, end, startWithDay, endWithDay, startStr } =
      getWeekRange(weekOffset);
    const endStr = end.toISOString().split("T")[0];
    const mins = records
      .filter((r) => r.study_date >= startStr && r.study_date <= endStr)
      .reduce((sum, r) => sum + r.duration_minutes, 0);
    const label = isMobile
      ? `${startWithDay}|｜|${endWithDay}`
      : `${startWithDay}〜${endWithDay}`;
    return {
      label,
      hours: Math.round((mins / 60) * 10) / 10,
      minutes: mins,
      weekOffset,
      isSelected: selectedWeekStart === startStr,
      isCurrentWeek: weekOffset === 0,
    };
  });

  const newestWeek = getWeekRange(weekPageOffset);
  const oldestWeek = getWeekRange(weekPageOffset - (weekCount - 1));
  const periodNavLabel = `${newestWeek.endWithDay}〜${oldestWeek.startWithDay}`;

  const handleBarClick = (data: BarRectangleItem) => {
    const payload = data.payload as WeekData | undefined;
    if (!payload) return;
    const { startStr } = getWeekRange(payload.weekOffset);
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
    const now = new Date();
    if (period === "all") return records;
    if (period === "thisMonth") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0];
      return records.filter((r) => r.study_date >= firstDay);
    }
    if (period === "lastMonth") {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        .toISOString()
        .split("T")[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0)
        .toISOString()
        .split("T")[0];
      return records.filter(
        (r) => r.study_date >= firstDay && r.study_date <= lastDay,
      );
    }
    if (period === "last3Months") {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 2, 1)
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

  const today = new Date().toISOString().split("T")[0];
  const todayMinutes = records
    .filter((r) => r.study_date === today)
    .reduce((sum, r) => sum + r.duration_minutes, 0);

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
          return `${formatDate(start, true)}〜${formatDate(end, true)}`;
        })()
      : null;

  const sectionLabel = selectedWeekLabel ?? periodLabels[period];

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
              {new Date().toLocaleDateString("ja-JP", {
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          <div className="card">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} className="text-indigo-400" />
              <span className="text-xs text-gray-400">
                {sectionLabel}の合計
              </span>
            </div>
            <div className="text-2xl font-semibold text-gray-800">
              {totalHours}
              <span className="text-sm font-normal text-gray-400">h </span>
              {totalMins}
              <span className="text-sm font-normal text-gray-400">m</span>
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={14} className="text-indigo-400" />
              <span className="text-xs text-gray-400">今日の学習</span>
            </div>
            <div className="text-2xl font-semibold text-gray-800">
              {Math.floor(todayMinutes / 60)}
              <span className="text-sm font-normal text-gray-400">h </span>
              {todayMinutes % 60}
              <span className="text-sm font-normal text-gray-400">m</span>
            </div>
          </div>
          <div className="card col-span-2 md:col-span-1">
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
        </div>

        {/* 週次グラフ */}
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">
              週別学習時間
            </h2>
            <div className="flex items-center gap-2">
              {/* 左矢印＝過去へ */}
              <button
                onClick={() => {
                  setWeekPageOffset((p) => p + weekCount);
                  setSelectedWeekStart(null);
                }}
                className="p-1 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-400"
                aria-label="過去へ"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs text-gray-400">{periodNavLabel}</span>
              {/* 右矢印＝未来へ */}
              <button
                onClick={() => {
                  setWeekPageOffset((p) => p - weekCount);
                  setSelectedWeekStart(null);
                }}
                disabled={weekPageOffset < weekCount}
                className="p-1 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-400 disabled:opacity-30"
                aria-label="未来へ"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
          <div onMouseDown={(e) => e.preventDefault()}>
            <ResponsiveContainer width="100%" height={isMobile ? 190 : 160}>
              <BarChart
                data={weeklyData}
                barSize={isMobile ? 28 : 36}
                margin={{ bottom: isMobile ? 40 : 0 }}
              >
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
                  tick={
                    isMobile
                      ? (props) => <MobileXAxisTick {...props} />
                      : { fontSize: 9, fill: "#9CA3AF" }
                  }
                  height={isMobile ? 50 : 30}
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
                          : selectedWeekStart === null && entry.weekOffset === 0
                            ? "#6366F1"
                            : "#C7D2FE"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 円グラフ＋記録一覧 */}
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="card">
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
                      const minutes = Number(value) || 0;
                      return [
                        `${Math.floor(minutes / 60)}h ${minutes % 60}m`,
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
                      <span style={{ fontSize: "12px", color: "#6B7280" }}>
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
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
