"use client";

import AppLayout from "@/components/layout/AppLayout";
import { createClient } from "@/lib/supabase";
import { Category } from "@/types";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const COLORS = [
  "#F87171", // レッド
  "#FCA5A5", // ライトレッド
  "#FB923C", // オレンジ
  "#FBBF24", // イエロー
  "#4ADE80", // グリーン
  "#34D399", // ミント
  "#2DD4BF", // ティール
  "#60A5FA", // ブルー
  "#93C5FD", // ライトブルー
  "#6366F1", // インディゴ
  "#A78BFA", // バイオレット
  "#E879F9", // フューシャ
  "#F472B6", // ピンク
];

export default function CategoriesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // 新規追加フォーム
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#F87171");
  const [adding, setAdding] = useState(false);

  // 編集
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
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
      setLoading(false);
    };

    fetchCategories();
  }, []);

  // カテゴリー追加
  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("categories")
      .insert({
        user_id: user.id,
        name: newName.trim(),
        color: newColor,
      })
      .select()
      .single();

    if (!error && data) {
      setCategories([...categories, data]);
      setNewName("");
      setNewColor(COLORS[0]);
      setShowAddForm(false);
    }
    setAdding(false);
  };

  // 編集開始
  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color);
  };

  // 編集保存
  const handleEdit = async (id: number) => {
    if (!editName.trim()) return;

    const { error } = await supabase
      .from("categories")
      .update({ name: editName.trim(), color: editColor })
      .eq("id", id);

    if (!error) {
      setCategories(
        categories.map((cat) =>
          cat.id === id
            ? { ...cat, name: editName.trim(), color: editColor }
            : cat,
        ),
      );
      setEditingId(null);
    }
  };

  // 削除
  const handleDelete = async (id: number) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-gray-700">
            このカテゴリーを削除しますか？
          </p>
          <p className="text-xs text-gray-400">
            ※記録はカテゴリーなしになります
          </p>
          <div className="flex gap-2 mt-1">
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                const { error } = await supabase
                  .from("categories")
                  .delete()
                  .eq("id", id);
                if (!error) {
                  setCategories((prev) => prev.filter((cat) => cat.id !== id));
                  toast.success("カテゴリーを削除しました");
                } else {
                  toast.error("削除に失敗しました");
                }
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
      <div className="p-4 md:p-6 max-w-lg mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">
              カテゴリー管理
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              自由に追加・編集できます
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={16} />
            追加
          </button>
        </div>

        {/* 新規追加フォーム */}
        {showAddForm && (
          <div className="card border-indigo-100 border-2 mb-4">
            <p className="text-sm font-medium text-indigo-500 mb-3">
              新しいカテゴリーを追加
            </p>
            <input
              type="text"
              placeholder="カテゴリー名（例：英語、数学）"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="input-field mb-3"
              autoFocus
            />
            <div className="flex flex-wrap gap-2 mb-3">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewColor(color)}
                  className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                  style={{
                    backgroundColor: color,
                    outline: newColor === color ? `2px solid ${color}` : "none",
                    outlineOffset: "2px",
                  }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={adding || !newName.trim()}
                className="btn-primary flex-1"
              >
                {adding ? "追加中..." : "保存"}
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewName("");
                }}
                className="btn-secondary flex-1"
              >
                キャンセル
              </button>
            </div>
          </div>
        )}

        {/* カテゴリー一覧 */}
        {categories.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm mb-4">
              カテゴリーがまだありません
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 bg-indigo-500 text-white text-sm px-4 py-2 rounded-xl"
            >
              <Plus size={16} />
              最初のカテゴリーを追加
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {categories.map((cat) => (
              <div key={cat.id} className="card">
                {editingId === cat.id ? (
                  // 編集モード
                  <div className="flex flex-col gap-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="input-field"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      {COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setEditColor(color)}
                          className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                          style={{
                            backgroundColor: color,
                            outline:
                              editColor === color
                                ? `2px solid ${color}`
                                : "none",
                            outlineOffset: "2px",
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(cat.id)}
                        className="flex items-center gap-1 bg-indigo-500 text-white text-sm px-3 py-1.5 rounded-lg"
                      >
                        <Check size={14} />
                        保存
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex items-center gap-1 bg-gray-100 text-gray-600 text-sm px-3 py-1.5 rounded-lg"
                      >
                        <X size={14} />
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  // 通常モード
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-sm font-medium text-gray-700 flex-1">
                      {cat.name}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(cat)}
                        className="p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                        aria-label="編集"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        aria-label="削除"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
