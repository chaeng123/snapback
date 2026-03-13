import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-blue-50 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-8">
        <header className="mb-10 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-sky-600">3교대 수면 분석</p>
            <h1 className="text-xl font-semibold tracking-tight">Nurse Sleep</h1>
          </div>
          <div className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-slate-200">
            Beta
          </div>
        </header>

        <main className="flex flex-1 flex-col justify-center">
          <section className="mb-8 rounded-[28px] bg-white/95 p-6 shadow-xl shadow-sky-100/70 ring-1 ring-slate-100 backdrop-blur-sm">
            <div className="mb-5 inline-flex rounded-2xl bg-sky-100 px-3 py-2 text-sm font-medium text-sky-700">
              Rest for Shift Workers
            </div>

            <h2 className="mb-3 text-3xl font-bold leading-tight tracking-tight">
              피로한 교대 근무 속에서도
              <br />
              나에게 맞는 수면 루틴 찾기
            </h2>

            <p className="mb-6 text-sm leading-6 text-slate-600">
              근무표, 수면시간, 피로도를 가볍게 기록하고
              내 패턴에 맞는 회복 흐름을 한눈에 확인해보세요.
            </p>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-slate-50 p-3 text-center ring-1 ring-slate-100">
                <p className="text-xs text-slate-500">최근 평균</p>
                <p className="mt-1 text-lg font-semibold">6.1h</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3 text-center ring-1 ring-slate-100">
                <p className="text-xs text-slate-500">야간 근무</p>
                <p className="mt-1 text-lg font-semibold">2회</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-3 text-center ring-1 ring-slate-100">
                <p className="text-xs text-slate-500">피로도</p>
                <p className="mt-1 text-lg font-semibold">7/10</p>
              </div>
            </div>
          </section>

          <section className="mb-8 space-y-3">
            <div className="rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-slate-100 backdrop-blur-sm">
              <p className="text-sm font-semibold text-slate-800">빠른 기록</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                수면, 근무, 피로도를 부담 없이 1분 안에 입력
              </p>
            </div>
            <div className="rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-slate-100 backdrop-blur-sm">
              <p className="text-sm font-semibold text-slate-800">패턴 분석</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                나이트 전후 수면 변화와 회복 흐름을 시각적으로 확인
              </p>
            </div>
            <div className="rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-slate-100 backdrop-blur-sm">
              <p className="text-sm font-semibold text-slate-800">개인화 추천</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                기록을 바탕으로 나에게 맞는 루틴 조정 포인트 제안
              </p>
            </div>
          </section>
        </main>

        <footer className="space-y-3 pb-2">
          <Link
            href="/onboarding"
            className="block w-full rounded-2xl bg-sky-600 px-4 py-3.5 text-center text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:-translate-y-0.5 hover:bg-sky-700"
          >
            시작하기
          </Link>
          <Link
            href="/login"
            className="block w-full rounded-2xl bg-white/95 px-4 py-3.5 text-center text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            로그인
          </Link>
          <p className="pt-1 text-center text-xs leading-5 text-slate-500">
            초기 버전은 기록과 패턴 분석 중심으로 제공됩니다.
          </p>
        </footer>
      </div>
    </div>
  )
}
