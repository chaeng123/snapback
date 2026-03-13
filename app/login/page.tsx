export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <h1 className="text-2xl font-bold text-slate-900">로그인</h1>
        <p className="mt-2 text-sm text-slate-600">
          이메일로 로그인해서 내 수면 기록을 이어서 확인하세요.
        </p>

        <div className="mt-6 space-y-4">
          <input
            type="email"
            placeholder="이메일"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-400"
          />
          <input
            type="password"
            placeholder="비밀번호"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-400"
          />
          <button className="w-full rounded-2xl bg-sky-600 px-4 py-3 font-semibold text-white">
            로그인
          </button>
        </div>
      </div>
    </main>
  )
}