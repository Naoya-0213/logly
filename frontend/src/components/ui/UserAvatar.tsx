"use client";

import Image from "next/image";

type UserAvatarProps = {
  avatarUrl?: string | null;
  displayName?: string | null;
  email?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
};

const sizeMap = {
  xs: { outer: "w-7 h-7", text: "text-xs", px: 28 },
  sm: { outer: "w-8 h-8", text: "text-xs", px: 32 },
  md: { outer: "w-10 h-10", text: "text-sm", px: 40 },
  lg: { outer: "w-16 h-16", text: "text-xl", px: 64 },
};

export default function UserAvatar({
  avatarUrl,
  displayName,
  email,
  size = "md",
  className = "",
}: UserAvatarProps) {
  const { outer, text, px } = sizeMap[size];
  const initial = (displayName || email || "?")[0].toUpperCase();

  if (avatarUrl) {
    return (
      <div
        className={`${outer} rounded-full overflow-hidden flex-shrink-0 bg-indigo-100 ${className}`}
      >
        <Image
          src={avatarUrl}
          alt={displayName || email || "avatar"}
          width={px}
          height={px}
          className="w-full h-full object-cover"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className={`${outer} bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 ${className}`}
    >
      <span className={`${text} font-semibold text-indigo-600`}>{initial}</span>
    </div>
  );
}