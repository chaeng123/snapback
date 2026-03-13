"use client"

import { useState } from "react"

export default function SleepPage() {
  const [bedtime, setBedtime] = useState("")
  const [wakeTime, setWakeTime] = useState("")
  const [quality, setQuality] = useState("3")
  const [nap, setNap] = useState("0")

  const handleSubmit = () => {
    console.log({ bedtime, wakeTime, quality, nap })
    alert("수면 기록이 저장되었다고 가정한 MVP 화면입니다.")
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-blue-50 px-6 py-8 text-slate-900">
      <div className="mx-auto max-w-md rounded-[28px] bg-white/95 p-6 shadow-xl shadow-sky-100/70 ring-1 ring-slate-100">
        <p className="text-sm font-medium text-sky-600">수면 기록</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">오늘의 수면 입력</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          취침, 기상, 수면 질을 기록해 패턴 분석에 활용합니다.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">취침 시각</label>
            <input
              type="datetime-local"
              value={bedtime}
              onChange={(e) => setBedtime(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">기상 시각</label>
            <input
              type="datetime-local"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">수면 질</label>
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-400"
            >
              <option value="1">1 - 매우 나쁨</option>
              <option value="2">2 - 나쁨</option>
              <option value="3">3 - 보통</option>
              <option value="4">4 - 좋음</option>
              <option value="5">5 - 매우 좋음</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">낮잠 시간(분)</label>
            <input
              type="number"
              value={nap}
              onChange={(e) => setNap(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-sky-400"
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full rounded-2xl bg-sky-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:bg-sky-700"
          >
            저장하기
          </button>
        </div>
      </div>
    </main>
  )
}