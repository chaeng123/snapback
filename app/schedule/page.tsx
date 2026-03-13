import { Suspense } from 'react'
import ScheduleSetupClient from './ScheduleSetupClient'

function LoadingFallback() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-7xl rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        불러오는 중...
      </div>
    </main>
  )
}

export default function SchedulePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ScheduleSetupClient />
    </Suspense>
  )
}