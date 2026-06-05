"use client";

import clsx from "clsx";
import {
  CalendarDays,
  Clock,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabItems = [
  { href: "/dashboard", label: "ホーム", icon: LayoutDashboard },
  { href: "/records/new", label: "記録", icon: Clock },
  { href: "/records", label: "履歴", icon: CalendarDays },
  { href: "/friends", label: "フレンド", icon: Users },
  { href: "/settings", label: "設定", icon: Settings },
];

export default function BottomTab() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-2 z-50">
      {tabItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex flex-col items-center gap-1 px-3 py-1",
              isActive ? "text-indigo-500" : "text-gray-400",
            )}
          >
            <Icon size={20} />
            <span className="text-xs">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
