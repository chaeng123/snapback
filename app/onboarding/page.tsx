'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function OnboardingPage() {
  const router = useRouter()

  const today = new Date()
  const twoWeeksLater = new Date()
  twoWeeksLater.setDate(today.getDate() + 13)

  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const [hospital, setHospital] = useState('')
  const [department, setDepartment] = useState('')
  const [shiftType, setShiftType] = useState('3교대')
  const [startDate, setStartDate] = useState(formatDate(today))
  const [endDate, setEndDate] = useState(formatDate(twoWeeksLater))

  const handleNext = () => {
  const params = new URLSearchParams({
    hospital,
    department,
    shiftType,
    startDate,
    endDate,
  })

  router.push(`schedule?${params.toString()}`)
}

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-md rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <h1 className="text-2xl font-bold text-slate-900">시작하기</h1>
        <p className="mt-2 text-sm text-slate-600">
          몇 가지 정보만 입력하면 나에게 맞는 수면 패턴 분석을 시작할 수 있어요.
        </p>

        <div className="mt-6 space-y-4">
          <input
            type="text"
            value={hospital}
            onChange={(e) => setHospital(e.target.value)}
            placeholder="병원 또는 기관"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-400"
          />

          <input
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="부서"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-400"
          />

          <select
            value={shiftType}
            onChange={(e) => setShiftType(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-400"
          >
            <option value="3교대">3교대</option>
            <option value="고정 야간">고정 야간</option>
            <option value="기타">기타</option>
          </select>

          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-800">일정표 등록 기간</p>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-slate-500">시작일</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-slate-500">종료일</label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-sky-400"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleNext}
            className="w-full rounded-2xl bg-sky-600 px-4 py-3 font-semibold text-white transition hover:bg-sky-700"
          >
            다음으로
          </button>
        </div>
      </div>
    </main>
  )
}