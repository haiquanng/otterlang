import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { AppShell } from '@/components/AppShell'
import { RequireAuth } from '@/components/RequireAuth'
import { RouteError } from '@/components/RouteError'
import { SessionGate } from '@/components/SessionGate'
import { AddPage } from '@/pages/AddPage'
import { DocumentPage } from '@/pages/DocumentPage'
import { DocumentsPage } from '@/pages/DocumentsPage'
import { ItemPage } from '@/pages/ItemPage'
import { LibraryPage } from '@/pages/LibraryPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { PickWordsPage } from '@/pages/PickWordsPage'
import { ReviewPage } from '@/pages/ReviewPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { SignInPage } from '@/pages/SignInPage'
import { TodayPage } from '@/pages/TodayPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

const router = createBrowserRouter([
  {
    element: <SessionGate />,
    errorElement: <RouteError />,
    children: [
      { path: 'sign-in', element: <SignInPage /> },
      {
        element: <RequireAuth />,
        children: [
          { path: 'review', element: <ReviewPage /> },
          {
            element: <AppShell />,
            children: [
              { index: true, element: <TodayPage /> },
              { path: 'library', element: <LibraryPage /> },
              { path: 'library/:id', element: <ItemPage /> },
              { path: 'add', element: <AddPage /> },
              { path: 'documents', element: <DocumentsPage /> },
              { path: 'documents/:id', element: <DocumentPage /> },
              { path: 'documents/:id/words', element: <PickWordsPage /> },
              { path: 'settings', element: <SettingsPage /> },
              { path: '*', element: <NotFoundPage /> },
            ],
          },
        ],
      },
    ],
  },
])

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
