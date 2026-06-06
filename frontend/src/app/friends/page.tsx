"use client";

import AppLayout from "@/components/layout/AppLayout";
import { createClient } from "@/lib/supabase";
import { Friendship, User } from "@/types";
import clsx from "clsx";
import { Check, Clock, Search, Trophy, UserPlus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type FriendWithStats = {
  id: string;
  display_name: string | null;
  email: string;
  monthly_minutes: number;
};

export default function FriendsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [myMonthlyMinutes, setMyMonthlyMinutes] = useState(0);
  const [friends, setFriends] = useState<FriendWithStats[]>([]);
  const [pendingReceived, setPendingReceived] = useState<Friendship[]>([]);
  const [pendingSent, setPendingSent] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState("");
  const [searching, setSearching] = useState(false);
  const [tab, setTab] = useState<"friends" | "ranking">("friends");

  const fetchFriends = async (userId: string) => {
    // 承認済みフレンドを取得
    const { data: friendships } = await supabase
      .from("friendships")
      .select("*")
      .eq("status", "accepted")
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);

    // 申請中（受信）を取得
    const { data: received } = await supabase
      .from("friendships")
      .select("*, requester:requester_id(id, display_name, email)")
      .eq("receiver_id", userId)
      .eq("status", "pending");
    setPendingReceived(received || []);

    // 申請中（送信）を取得
    const { data: sent } = await supabase
      .from("friendships")
      .select("*, receiver:receiver_id(id, display_name, email)")
      .eq("requester_id", userId)
      .eq("status", "pending");
    setPendingSent(sent || []);

    if (!friendships || friendships.length === 0) {
      setFriends([]);
      return;
    }

    // フレンドのIDを取得
    const friendIds = friendships.map((f) =>
      f.requester_id === userId ? f.receiver_id : f.requester_id,
    );

    // フレンドのユーザー情報を取得
    const { data: friendUsers } = await supabase
      .from("users")
      .select("*")
      .in("id", friendIds);

    // 今月の学習時間を取得
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];

    const friendsWithStats = await Promise.all(
      (friendUsers || []).map(async (friend) => {
        const { data: records } = await supabase
          .from("study_records")
          .select("duration_minutes")
          .eq("user_id", friend.id)
          .gte("study_date", firstDay);

        const monthly_minutes = (records || []).reduce(
          (sum, r) => sum + r.duration_minutes,
          0,
        );

        return {
          ...friend,
          monthly_minutes,
        };
      }),
    );

    setFriends(
      friendsWithStats.sort((a, b) => b.monthly_minutes - a.monthly_minutes),
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // 現在のユーザー情報取得
      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();
      setCurrentUser(userData);

      // 自分の今月の学習時間を取得
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0];
      const { data: myRecords } = await supabase
        .from("study_records")
        .select("duration_minutes")
        .eq("user_id", userData.id)
        .gte("study_date", firstDay);
      const myMinutes = (myRecords || []).reduce(
        (sum: number, r: { duration_minutes: number }) =>
          sum + r.duration_minutes,
        0,
      );
      setMyMonthlyMinutes(myMinutes);

      await fetchFriends(user.id);
      setLoading(false);
    };
    fetchData();
  }, []);

  // フレンド申請
  const handleSearch = async () => {
    if (!searchEmail.trim()) return;
    if (!currentUser) return;
    setSearching(true);

    // メールアドレスでユーザーを検索
    const { data: targetUser } = await supabase
      .from("users")
      .select("*")
      .eq("email", searchEmail.trim())
      .single();

    if (!targetUser) {
      toast.error("ユーザーが見つかりませんでした");
      setSearching(false);
      return;
    }

    if (targetUser.id === currentUser.id) {
      toast.error("自分自身にはフレンド申請できません");
      setSearching(false);
      return;
    }

    // すでにフレンドか確認
    const { data: existing } = await supabase
      .from("friendships")
      .select("*")
      .or(
        `and(requester_id.eq.${currentUser.id},receiver_id.eq.${targetUser.id}),and(requester_id.eq.${targetUser.id},receiver_id.eq.${currentUser.id})`,
      )
      .single();

    if (existing) {
      if (existing.status === "accepted") {
        toast.error("すでにフレンドです");
      } else {
        toast.error("すでに申請済みです");
      }
      setSearching(false);
      return;
    }

    // フレンド申請を送信
    const { error } = await supabase.from("friendships").insert({
      requester_id: currentUser.id,
      receiver_id: targetUser.id,
      status: "pending",
    });

    if (error) {
      toast.error("申請に失敗しました");
    } else {
      toast.success(
        `${targetUser.display_name || targetUser.email} にフレンド申請を送りました！`,
      );
      setSearchEmail("");
      await fetchFriends(currentUser.id);
    }
    setSearching(false);
  };

  // フレンド申請を承認
  const handleAccept = async (friendshipId: number) => {
    if (!currentUser) return;

    const { error } = await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", friendshipId);

    if (!error) {
      toast.success("フレンド申請を承認しました！🎉");
      await fetchFriends(currentUser.id);
    }
  };

  // フレンド申請を拒否・削除
  const handleReject = async (friendshipId: number) => {
    if (!currentUser) return;

    const { error } = await supabase
      .from("friendships")
      .delete()
      .eq("id", friendshipId);

    if (!error) {
      toast.success("フレンド申請を拒否しました");
      await fetchFriends(currentUser.id);
    }
  };

  // フレンドを削除
  const handleRemoveFriend = async (friendId: string) => {
    if (!currentUser) return;

    toast(
      (t) => (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-gray-700">
            フレンドを削除しますか？
          </p>
          <div className="flex gap-2 mt-1">
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                const { error } = await supabase
                  .from("friendships")
                  .delete()
                  .or(
                    `and(requester_id.eq.${currentUser.id},receiver_id.eq.${friendId}),and(requester_id.eq.${friendId},receiver_id.eq.${currentUser.id})`,
                  );
                if (!error) {
                  setFriends((prev) => prev.filter((f) => f.id !== friendId));
                  toast.success("フレンドを削除しました");
                }
              }}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs py-1.5 px-3 rounded-lg"
            >
              削除する
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs py-1.5 px-3 rounded-lg"
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

  const formatTime = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  // 自分を含めたランキング
  const rankingList = currentUser
    ? [
        ...friends,
        {
          ...currentUser,
          monthly_minutes: myMonthlyMinutes,
          isMe: true,
        },
      ].sort((a, b) => b.monthly_minutes - a.monthly_minutes)
    : friends;

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
        <div className="mb-4">
          <h1 className="text-xl font-semibold text-gray-800">フレンド</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {friends.length}人のフレンド
          </p>
        </div>

        {/* フレンド申請フォーム */}
        <div className="card mb-4">
          <p className="text-sm font-medium text-gray-700 mb-3">
            フレンドを追加
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="メールアドレスで検索"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="input-field flex-1"
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors flex-shrink-0"
            >
              <UserPlus size={16} />
              {searching ? "検索中..." : "申請"}
            </button>
          </div>
        </div>

        {/* 受信した申請 */}
        {pendingReceived.length > 0 && (
          <div className="card mb-4 border-indigo-100 border-2">
            <p className="text-sm font-medium text-indigo-600 mb-3">
              📨 フレンド申請が届いています（{pendingReceived.length}件）
            </p>
            <div className="flex flex-col gap-2">
              {pendingReceived.map((f: Friendship) => (
                <div key={f.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-indigo-600">
                      {(f.requester?.display_name ||
                        f.requester?.email ||
                        "?")[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {f.requester?.display_name || f.requester?.email}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleAccept(f.id)}
                      className="p-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
                      aria-label="承認"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => handleReject(f.id)}
                      className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200"
                      aria-label="拒否"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 送信した申請 */}
        {pendingSent.length > 0 && (
          <div className="card mb-4 bg-gray-50">
            <p className="text-sm font-medium text-gray-500 mb-3">
              📤 申請中（{pendingSent.length}件）
            </p>
            <div className="flex flex-col gap-2">
              {pendingSent.map((f: Friendship) => (
                <div key={f.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-gray-500">
                      {(f.receiver?.display_name ||
                        f.receiver?.email ||
                        "?")[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-600 truncate">
                      {f.receiver?.display_name || f.receiver?.email}
                    </p>
                    <p className="text-xs text-gray-400">承認待ち</p>
                  </div>
                  <button
                    onClick={() => handleReject(f.id)}
                    className="text-xs text-gray-400 hover:text-red-500 flex-shrink-0"
                  >
                    キャンセル
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* タブ切り替え */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-4">
          <button
            onClick={() => setTab("friends")}
            className={clsx(
              "flex-1 flex items-center justify-center gap-2 text-xs py-1.5 rounded-lg transition-colors font-medium",
              tab === "friends"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700",
            )}
          >
            <Search size={12} />
            フレンド一覧
          </button>
          <button
            onClick={() => setTab("ranking")}
            className={clsx(
              "flex-1 flex items-center justify-center gap-2 text-xs py-1.5 rounded-lg transition-colors font-medium",
              tab === "ranking"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700",
            )}
          >
            <Trophy size={12} />
            今月のランキング
          </button>
        </div>

        {/* フレンド一覧 */}
        {tab === "friends" && (
          <div className="flex flex-col gap-2">
            {friends.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-400 text-sm mb-2">
                  まだフレンドがいません
                </p>
                <p className="text-gray-400 text-xs">
                  メールアドレスでフレンドを追加しましょう！
                </p>
              </div>
            ) : (
              friends.map((friend) => (
                <div key={friend.id} className="card flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-indigo-600">
                      {(friend.display_name || friend.email)[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {friend.display_name || friend.email}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock size={10} className="text-indigo-400" />
                      <p className="text-xs text-indigo-500 font-medium">
                        今月 {formatTime(friend.monthly_minutes)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveFriend(friend.id)}
                    className="text-xs text-gray-400 hover:text-red-500 flex-shrink-0 p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* ランキング */}
        {tab === "ranking" && (
          <div className="flex flex-col gap-2">
            {rankingList.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-400 text-sm">
                  フレンドを追加するとランキングが表示されます
                </p>
              </div>
            ) : (
              rankingList.map((friend, index) => (
                <div
                  key={friend.id}
                  className={`card flex items-center gap-3 ${"isMe" in friend && friend.isMe ? "border border-indigo-300 bg-indigo-50/50" : ""}`}
                >
                  <div
                    className={clsx(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold",
                      index === 0
                        ? "bg-yellow-100 text-yellow-600"
                        : index === 1
                          ? "bg-gray-100 text-gray-600"
                          : index === 2
                            ? "bg-orange-100 text-orange-600"
                            : "bg-gray-50 text-gray-400",
                    )}
                  >
                    {index === 0
                      ? "🥇"
                      : index === 1
                        ? "🥈"
                        : index === 2
                          ? "🥉"
                          : index + 1}
                  </div>
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-indigo-600">
                      {(friend.display_name || friend.email)[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {friend.display_name || friend.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Clock size={12} className="text-indigo-400" />
                    <span className="text-sm font-semibold text-indigo-600">
                      {formatTime(friend.monthly_minutes)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
