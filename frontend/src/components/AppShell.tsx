import { Outlet } from 'react-router'
import { BottomTabs } from '@/components/BottomTabs'
import { Sidebar } from '@/components/Sidebar'

export function AppShell() {
  return (
    <div className="min-h-dvh md:flex">
      <Sidebar />
      <main className="min-w-0 flex-1 px-4 pt-6 pb-28 md:px-8 md:pt-10 md:pb-10 xl:px-12">
        {/* Wide enough for grids on desktop; pages that hold prose narrow themselves. */}
        <div className="mx-auto w-full max-w-6xl">
          <Outlet />
        </div>
      </main>
      <BottomTabs />
    </div>
  )
}
