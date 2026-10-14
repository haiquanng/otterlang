import { Outlet } from 'react-router'
import { BottomTabs } from '@/components/BottomTabs'
import { Sidebar } from '@/components/Sidebar'

export function AppShell() {
  return (
    <div className="min-h-dvh md:flex">
      <Sidebar />
      <main className="flex-1 px-4 pt-6 pb-28 md:px-10 md:pt-10 md:pb-10">
        <div className="mx-auto w-full max-w-3xl">
          <Outlet />
        </div>
      </main>
      <BottomTabs />
    </div>
  )
}
