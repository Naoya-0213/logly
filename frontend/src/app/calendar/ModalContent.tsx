import { StudyRecord } from "@/types";
import { Clock, Pencil, Plus, Trash2, X } from "lucide-react";
import Link from "next/link";

const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}月${d.getDate()}日（${DAY_LABELS[d.getDay()]}）`;
}

export default function ModalContent({
  selectedDate,
  selectedRecords,
  selectedTotal,
  onClose,
  onDelete,
}: {
  selectedDate: string;
  selectedRecords: StudyRecord[];
  selectedTotal: number;
  onClose: () => void;
  onDelete: (id: number) => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50"
          >
            <X size={14} />
          </button>
          <h2 className="text-sm font-semibold text-gray-700">
            {formatDateLabel(selectedDate)}の記録
          </h2>
        </div>
        <Link
          href={`/records/new?date=${selectedDate}`}
          className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-600"
        >
          <Plus size={12} />
          追加
        </Link>
      </div>

      {selectedRecords.length === 0 ? (
        <div className="flex items-center justify-center py-10">
          <p className="text-gray-400 text-sm">この日の記録はありません</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1 mb-4">
            {selectedRecords.map((record) => (
              <div
                key={record.id}
                className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0"
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: record.categories?.color || "#9CA3AF" }}
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
                <div className="flex items-center gap-1">
                  <Link
                    href={`/records/${record.id}/edit`}
                    className="p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <Pencil size={13} />
                  </Link>
                  <button
                    onClick={() => onDelete(record.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-2 border-t border-gray-100">
            <span className="text-xs text-indigo-500 font-medium flex items-center gap-1">
              <Clock size={11} />
              合計 {Math.floor(selectedTotal / 60)}h {selectedTotal % 60}m
            </span>
          </div>
        </>
      )}
    </>
  );
}