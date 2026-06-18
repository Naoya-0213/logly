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

interface MonthlyDataItem {
  label: string;
  hours: number;
  isFuture: boolean;
  isCurrentMonth: boolean;
}

interface MonthlyChartProps {
  monthlyData: MonthlyDataItem[];
  selectedMonth: number | null;
  yearLabel: string;
  yearOffset: number;
  isCurrentYear: boolean;
  isMobile: boolean;
  onBarClick: (data: BarRectangleItem) => void;
  onPrevYear: () => void;
  onNextYear: () => void;
  onTodayClick: () => void;
}

export default function MonthlyChart({
  monthlyData,
  selectedMonth,
  yearLabel,
  yearOffset,
  isCurrentYear,
  isMobile,
  onBarClick,
  onPrevYear,
  onNextYear,
  onTodayClick,
}: MonthlyChartProps) {
  return (
    <>
      <div className="flex items-center gap-2">
        {yearOffset < 0 && (
          <button
            onClick={onTodayClick}
            className="text-xs font-medium text-indigo-500 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg transition-colors"
          >
            今年
          </button>
        )}
        <button
          onClick={onPrevYear}
          className="p-1 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-400"
          aria-label="前年"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-xs text-gray-600 font-medium">{yearLabel}</span>
        <button
          onClick={onNextYear}
          disabled={isCurrentYear}
          className="p-1 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-400 disabled:opacity-30"
          aria-label="次年"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <div onMouseDown={(e) => e.preventDefault()} className="mt-3">
        {isMobile ? (
          <ResponsiveContainer
            width="100%"
            height={Math.max(monthlyData.length * 36, 200)}
          >
            <BarChart
              data={monthlyData}
              layout="vertical"
              barSize={18}
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
                tick={{ fontSize: 10, fill: "#9CA3AF", textAnchor: "end" }}
                axisLine={false}
                tickLine={false}
                width={60}
              />
              <Tooltip
                cursor={{ fill: "rgba(99,102,241,0.05)" }}
                formatter={(value) => [
                  Number(value) > 0 ? `${Number(value)}h` : "記録なし",
                  "学習時間",
                ]}
                labelFormatter={() => ""}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #F3F4F6",
                  fontSize: "12px",
                }}
              />
              <Bar
                dataKey="hours"
                radius={[0, 4, 4, 0]}
                activeBar={false}
                onClick={onBarClick}
                style={{ cursor: "pointer" }}
              >
                {monthlyData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={
                      entry.isFuture
                        ? "#E5E7EB"
                        : selectedMonth === index
                          ? "#4F46E5"
                          : entry.isCurrentMonth
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
            <BarChart data={monthlyData} barSize={20}>
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
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                height={24}
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
                formatter={(value) => [
                  Number(value) > 0 ? `${Number(value)}h` : "記録なし",
                  "学習時間",
                ]}
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
                activeBar={false}
                onClick={onBarClick}
                style={{ cursor: "pointer" }}
              >
                {monthlyData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={
                      entry.isFuture
                        ? "#E5E7EB"
                        : selectedMonth === index
                          ? "#4F46E5"
                          : entry.isCurrentMonth
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