import { Pencil } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

interface GoalContentProps {
  sectionLabel: string;
  editingGoal: boolean;
  setEditingGoal: (v: boolean) => void;
  goalInput: string;
  setGoalInput: (v: string) => void;
  handleSaveGoal: () => void;
  goalMinutes: number;
  goalAchievePct: number;
  goalAchievedMinutes: number;
  remainMinutes: number;
  remainingDays: number | null;
  totalMinutes: number;
}

export default function GoalContent({
  sectionLabel,
  editingGoal,
  setEditingGoal,
  goalInput,
  setGoalInput,
  handleSaveGoal,
  goalMinutes,
  goalAchievePct,
  goalAchievedMinutes,
  remainMinutes,
  remainingDays,
  totalMinutes,
}: GoalContentProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 className="text-sm font-semibold text-gray-700">目標達成率</h2>
          <p className="text-xs text-indigo-500 mt-0.5 font-medium">
            {sectionLabel}　目標：{Math.floor(goalMinutes / 60)}時間
          </p>
        </div>
        {!editingGoal && (
          <button
            onClick={() => {
              setEditingGoal(true);
              setGoalInput(
                goalMinutes > 0 ? String(Math.floor(goalMinutes / 60)) : "",
              );
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
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={[
                    { value: Math.min(totalMinutes, goalMinutes) },
                    { value: Math.max(goalMinutes - totalMinutes, 0) },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
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
              <div className="text-xl font-semibold text-gray-800">
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
              <div className="text-xs text-gray-400 mt-0.5">達成済み</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-800">
                {Math.floor(remainMinutes / 60)}h {remainMinutes % 60}m
              </div>
              <div className="text-xs text-gray-400 mt-0.5">残り</div>
            </div>
            {remainingDays !== null && (
              <div className="text-center">
                <div className="text-sm font-semibold text-gray-800">
                  {remainingDays}日
                </div>
                <div className="text-xs text-gray-400 mt-0.5">残り日数</div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
