import BottomTab from "./BottomTab";
import NotificationBell from "./NotificationBell";
import Sidebar from "./Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {/* モバイルヘッダー */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-40">
          <span className="text-lg font-semibold text-indigo-500">Logly</span>
          <NotificationBell />
        </header>
        <main className="flex-1 pb-20 md:pb-0 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
      <BottomTab />
    </div>
  );
}
