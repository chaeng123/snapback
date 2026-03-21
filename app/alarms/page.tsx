'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

// 임시 알람 데이터 (실제로는 로컬스토리지나 전역 상태에서 다음 근무를 읽어와 생성합니다)
const MOCK_ALARMS = [
  { id: 1, type: 'sleep', time: '22:30', label: '취침 시간', desc: '내일 데이 근무를 위해 잘 시간이에요 🌙', isActive: true },
  { id: 2, type: 'wake', time: '06:00', label: '기상 시간', desc: '상쾌한 아침이에요! 출근 준비를 시작해볼까요? ☀️', isActive: true },
  { id: 3, type: 'prep', time: '19:00', label: '나이트 앵커 수면', desc: '오늘 첫 나이트 출근이네요! 1시간 반 꿀잠 자고 가요 🛌', isActive: false },
]

export default function AlarmsPage() {
  const router = useRouter()
  const pathname = usePathname()
  const [alarms, setAlarms] = useState(MOCK_ALARMS)

  const toggleAlarm = (id: number) => {
    setAlarms(alarms.map(alarm => 
      alarm.id === id ? { ...alarm, isActive: !alarm.isActive } : alarm
    ))
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 pt-8 pb-24 relative">
      <div className="mx-auto max-w-lg space-y-6">
        
        {/* 헤더 */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">맞춤 수면 알람</h1>
          <p className="mt-1 text-slate-600">근무 스케줄에 맞춰 수면 리듬을 지켜드릴게요.</p>
        </div>

        {/* 다가오는 근무 요약 */}
        <section className="rounded-3xl bg-sky-600 p-5 shadow-md text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sky-200 text-sm font-medium">다음 근무</p>
              <p className="text-2xl font-bold mt-1">Day (07:00 출근)</p>
            </div>
            <div className="text-4xl opacity-80">🏥</div>
          </div>
        </section>

        {/* 알람 리스트 */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-800 px-1">설정된 알람</h2>
          
          {alarms.map((alarm) => (
            <div 
              key={alarm.id} 
              className={`rounded-3xl p-5 transition-all shadow-sm ring-1 ${
                alarm.isActive ? 'bg-white ring-sky-100' : 'bg-slate-100 ring-slate-200 opacity-60'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-3xl font-bold tracking-tight text-slate-900">{alarm.time}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-bold px-2 py-1 rounded-md bg-slate-100 text-slate-600">
                      {alarm.label}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{alarm.desc}</p>
                </div>

                {/* 토글 스위치 */}
                <button 
                  onClick={() => toggleAlarm(alarm.id)}
                  className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${
                    alarm.isActive ? 'bg-sky-500' : 'bg-slate-300'
                  }`}
                >
                  <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${
                    alarm.isActive ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          ))}
        </section>
        
        {/* 새 알람 추가 버튼 */}
        <button className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 py-4 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition">
          <span className="text-xl">+</span>
          <span className="font-semibold">수동 알람 추가하기</span>
        </button>

      </div>

      {/* 📱 하단 네비게이션 바 */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe">
        <div className="mx-auto max-w-lg flex justify-around items-center h-16 px-4">
          <button onClick={() => router.push('/sleep-plan')} className={`flex flex-col items-center gap-1 w-16 transition-colors ${pathname === '/sleep-plan' ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <span className="text-xl leading-none">🏠</span>
            <span className="text-[10px] font-medium">홈</span>
          </button>
          <button onClick={() => router.push('/monthlyschedule')} className={`flex flex-col items-center gap-1 w-16 transition-colors ${pathname === '/monthlyschedule' ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <span className="text-xl leading-none">📅</span>
            <span className="text-[10px] font-medium">월간</span>
          </button>
          <button onClick={() => router.push('/alarms')} className={`flex flex-col items-center gap-1 w-16 transition-colors ${pathname === '/alarms' ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <span className="text-xl leading-none">⏰</span>
            <span className="text-[10px] font-medium">알람</span>
          </button>
          <button onClick={() => router.push('/community')} className={`flex flex-col items-center gap-1 w-16 transition-colors ${pathname === '/community' ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <span className="text-xl leading-none">💬</span>
            <span className="text-[10px] font-medium">커뮤니티</span>
          </button>

        </div>
      </nav>

    </main>
  )
}