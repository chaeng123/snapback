export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-blue-50 px-6 py-8 text-slate-900">
      <div className="mx-auto max-w-md">
        <header className="mb-6">
          <p className="text-sm font-medium text-sky-600">나의 수면 대시보드</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">오늘의 회복 흐름</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            최근 수면, 피로도, 야간근무 패턴을 한눈에 확인해보세요.
          </p>
        </header>

        <section className="mb-6 rounded-[28px] bg-white/95 p-6 shadow-xl shadow-sky-100/70 ring-1 ring-slate-100">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">최근 7일 평균 수면</p>
              <h2 className="mt-2 text-4xl font-bold tracking-tight">6.1h</h2>
              <p className="mt-2 text-sm text-sky-700">지난주보다 0.4시간 증가</p>
            </div>
            <div className="rounded-2xl bg-sky-100 px-3 py-2 text-sm font-semibold text-sky-700">
              안정권
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-slate-50 p-3 text-center ring-1 ring-slate-100">
              <p className="text-xs text-slate-500">야간 근무</p>
              <p className="mt-1 text-lg font-semibold">2회</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3 text-center ring-1 ring-slate-100">
              <p className="text-xs text-slate-500">피로도</p>
              <p className="mt-1 text-lg font-semibold">7/10</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-3 text-center ring-1 ring-slate-100">
              <p className="text-xs text-slate-500">낮잠</p>
              <p className="mt-1 text-lg font-semibold">25분</p>
            </div>
          </div>
        </section>

        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold">최근 수면 추이</h3>
            <span className="text-xs text-slate-500">최근 7일</span>
          </div>

          <div className="rounded-3xl bg-white/95 p-5 shadow-sm ring-1 ring-slate-100">
            <div className="flex h-32 items-end justify-between gap-2">
              {[5.2, 6.4, 5.8, 7.1, 6.0, 4.9, 7.3].map((value, idx) => (
                <div key={idx} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t-2xl bg-sky-400/80"
                    style={{ height: `${value * 14}px` }}
                  />
                  <span className="text-xs text-slate-500">
                    {["월", "화", "수", "목", "금", "토", "일"][idx]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-6 space-y-3">
          <h3 className="text-base font-semibold">오늘의 추천</h3>

          <div className="rounded-2xl bg-white/95 p-4 shadow-sm ring-1 ring-slate-100">
            <p className="text-sm font-semibold text-slate-800">
              나이트 전날엔 취침 시각을 30분 앞당겨보세요
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              최근 기록상 야간근무 전 수면이 평균보다 짧았습니다.
            </p>
          </div>

          <div className="rounded-2xl bg-white/95 p-4 shadow-sm ring-1 ring-slate-100">
            <p className="text-sm font-semibold text-slate-800">
              낮잠은 20~30분 이내로 유지해보세요
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              피로도 회복에는 도움이 되지만, 너무 길면 밤수면에 영향을 줄 수 있어요.
            </p>
          </div>
        </section>

        <section className="mb-8">
          <h3 className="mb-3 text-base font-semibold">빠른 기록</h3>
          <div className="grid grid-cols-3 gap-3">
            <a
              href="/sleep"
              className="rounded-2xl bg-white/95 p-4 text-center text-sm font-semibold shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5"
            >
              수면 기록
            </a>
            <a
              href="/shifts"
              className="rounded-2xl bg-white/95 p-4 text-center text-sm font-semibold shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5"
            >
              근무 기록
            </a>
            <a
              href="/fatigue"
              className="rounded-2xl bg-white/95 p-4 text-center text-sm font-semibold shadow-sm ring-1 ring-slate-100 transition hover:-translate-y-0.5"
            >
              피로 기록
            </a>
          </div>
        </section>
      </div>
    </main>
  )
}