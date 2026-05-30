import Sidebar from './Sidebar'
import BottomTab from './BottomTab'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>
      <BottomTab />
    </div>
  )
}