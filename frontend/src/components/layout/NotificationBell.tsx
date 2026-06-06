"use client";

import { createClient } from "@/lib/supabase";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function NotificationBell() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();

    const fetchPending = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { count: pendingCount } = await supabase
        .from("friendships")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("status", "pending");

      setCount(pendingCount || 0);
    };

    fetchPending();

    // 30秒ごとに更新
    const timer = setInterval(fetchPending, 30000);

    return () => clearInterval(timer);
  }, []);

  return (
    <Link
      href="/friends"
      className="relative p-2 text-gray-400 hover:text-indigo-500 transition-colors"
    >
      <Bell size={20} />
      {count > 0 && (
        <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
