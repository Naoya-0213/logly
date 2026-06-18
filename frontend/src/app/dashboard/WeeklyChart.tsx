import { WeekData } from "@/types";
import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type BarRectangleItem,
} from "recharts";

interface WeeklyChartProps {
  weeklyData: WeekData[];
  monthOffset: number;
  monthLabel: string;
  isMobile: boolean;
  onBarClick: (data: BarRectangleItem) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onTodayClick: () => void;
}

export default function WeeklyChart({
  weeklyData,
  monthOffset,
  monthLabel,
  isMobile,
  onBarClick,
  onPrevMonth,
  onNextMonth,
  onTodayClick,
}: WeeklyChartProps) {
  return (
    <>
      <div className="flex items-center gap-2">
        {monthOffset < 0 && (
          <button
            onClick={onTodayClick}
            className="text-xs font-medium text-indigo-500 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg transition-colors"
          >
            今月
          </button>
        )}
        <button
          onClick={onPrevMonth}
          className="p-1 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-400"
          aria-label="過去へ"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-xs text-gray-600 font-medium">{monthLabel}</span>
        <button
          onClick={onNextMonth}
          disabled={monthOffset >= 0}
          className="p-1 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-400 disabled:opacity-30"
          aria-label="未来へ"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <div onMouseDown={(e) => e.preventDefault()} className="mt-3">
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
                onClick={onBarClick}
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
                onClick={onBarClick}
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
    </>
  );
}