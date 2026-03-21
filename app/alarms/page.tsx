'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

// 임시 알람 데이터
const MOCK_ALARMS = [
  { id: 1, type: 'sleep', time: '22:30', label: '취침 시간', desc: '내일 데이 근무를 위해 잘 시간이에요 🌙', isActive: true },
  { id: 2, type: 'wake', time: '06:00', label: '기상 시간', desc: '상쾌한 아침이에요! 출근 준비를 시작해볼까요? ☀️', isActive: true },
  { id: 3, type: 'prep', time: '19:00', label: '나이트 앵커 수면', desc: '오늘 첫 나이트 출근이네요! 1시간 반 꿀잠 자고 가요 🛌', isActive: false },
]

export default function AlarmsPage() {
  const router = useRouter()
  const pathname = usePathname()
  
  const [alarms, setAlarms] = useState(MOCK_ALARMS)
  
  // 수동 알람 추가 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newTime, setNewTime] = useState('07:00')
  const [newLabel, setNewLabel] = useState('')
  const [newDesc, setNewDesc] = useState('')

  // 알람 ON/OFF 토글
  const toggleAlarm = (id: number) => {
    setAlarms(alarms.map(alarm => 
      alarm.id === id ? { ...alarm, isActive: !alarm.isActive } : alarm
    ))
  }

  // 새 알람 저장 로직
  const handleSaveAlarm = () => {
    if (!newTime || !newLabel.trim()) {
      alert('시간과 알람 이름을 입력해주세요.')
      return
    }

    const newAlarm = {
      id: Date.now(), // 고유 ID 생성
      type: 'manual',
      time: newTime,
      label: newLabel,
      desc: newDesc,
      isActive: true,
    }

    // 시간 순으로 정렬하기 위해 새 알람 추가 후 정렬 (선택 사항)
    const updatedAlarms = [...alarms, newAlarm].sort((a, b) => a.time.localeCompare(b.time))
    
    setAlarms(updatedAlarms)
    
    // 폼 초기화 및 모달 닫기
    setNewTime('07:00')
    setNewLabel('')
    setNewDesc('')
    setIsModalOpen(false)
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 pt-8 pb-24 relative text-slate-900">
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
                  <p className={`text-3xl font-bold tracking-tight ${alarm.isActive ? 'text-slate-900' : 'text-slate-500'}`}>
                    {alarm.time}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-bold px-2 py-1 rounded-md bg-slate-100 text-slate-600">
                      {alarm.label}
                    </span>
                  </div>
                  {alarm.desc && (
                    <p className={`mt-2 text-sm ${alarm.isActive ? 'text-slate-600' : 'text-slate-400'}`}>
                      {alarm.desc}
                    </p>
                  )}
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
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-transparent py-4 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
        >
          <span className="text-xl">+</span>
          <span className="font-semibold">수동 알람 추가하기</span>
        </button>

      </div>

      {/* 📝 알람 추가 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm sm:px-4">
          {/* 모바일에서는 바텀 시트처럼, PC에서는 중앙 팝업처럼 보이도록 스타일링 */}
          <div className="bg-white w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-xl animate-in slide-in-from-bottom-10 sm:zoom-in duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">새 알람 추가</h3>
            <p className="text-sm text-slate-500 mb-5">원하는 시간과 메모를 입력해주세요.</p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">시간</label>
                <input 
                  type="time" 
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full text-2xl font-bold bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-sky-500 focus:bg-white transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">알람 이름</label>
                <input 
                  type="text" 
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="예: 영양제 먹기, 스트레칭"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-sky-500 focus:bg-white transition placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">메모 (선택)</label>
                <textarea 
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="알람이 울릴 때 보여줄 메시지"
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-sky-500 focus:bg-white transition resize-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
              >
                취소
              </button>
              <button 
                onClick={handleSaveAlarm}
                className="flex-1 py-3 rounded-xl bg-sky-600 text-white font-bold hover:bg-sky-700 transition"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}

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