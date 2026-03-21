'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'

// --- 📅 헬퍼 함수 모음 ---
function parseLocalDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getNextDateString(dateStr: string) {
  const date = parseLocalDate(dateStr)
  date.setDate(date.getDate() + 1)
  return formatDate(date)
}

function applyRange(hours: boolean[], startHour: number, endHour: number) {
  const copied = [...hours]
  if (startHour < endHour) {
    for (let h = startHour; h < endHour; h++) copied[h] = true
  } else {
    for (let h = startHour; h < 24; h++) copied[h] = true
    for (let h = 0; h < endHour; h++) copied[h] = true
  }
  return copied
}

type ShiftType = 'D' | 'E' | 'N' | 'OFF'

export default function OnboardingPage() {
  const router = useRouter()

  // 1. 기본 정보 상태 (기존 기능 복구)
  const [hospital, setHospital] = useState('')
  const [department, setDepartment] = useState('')
  const [shiftType, setShiftType] = useState('3교대')

  // 2. 근무 시간 설정 상태 (0~24시 기준)
  const [shiftTimes, setShiftTimes] = useState({
    D: { start: 7, end: 15 },
    E: { start: 15, end: 23 },
    N: { start: 22, end: 8 },
  })

  // 3. 캘린더 및 스케줄 상태
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date())
  const [activeDate, setActiveDate] = useState<string | null>(null)
  const [assignedShifts, setAssignedShifts] = useState<Record<string, ShiftType>>({})

  // 🗓 캘린더 날짜 계산
  const calendarDays = useMemo(() => {
    const year = currentMonthDate.getFullYear()
    const month = currentMonthDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    const startingDayOfWeek = firstDay.getDay()
    const totalDays = lastDay.getDate()

    const days = []
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null)
    for (let i = 1; i <= totalDays; i++) {
      days.push(formatDate(new Date(year, month, i)))
    }
    return days
  }, [currentMonthDate])

  const prevMonth = () => {
    const newDate = new Date(currentMonthDate)
    newDate.setMonth(newDate.getMonth() - 1)
    setCurrentMonthDate(newDate)
  }

  const nextMonth = () => {
    const newDate = new Date(currentMonthDate)
    newDate.setMonth(newDate.getMonth() + 1)
    setCurrentMonthDate(newDate)
  }

  // ✍️ 연속 입력 로직
  const handleShiftClick = (shift: ShiftType) => {
    if (!activeDate) {
      alert('달력에서 입력을 시작할 날짜를 먼저 선택해주세요!')
      return
    }
    setAssignedShifts((prev) => ({ ...prev, [activeDate]: shift }))
    setActiveDate(getNextDateString(activeDate))
  }

  // 💾 저장 및 변환 로직
  const handleNext = () => {
    const finalSchedule: Record<string, boolean[]> = {}
    const sortedDates = Object.keys(assignedShifts).sort()

    if (sortedDates.length === 0) {
      alert('최소 하루 이상의 일정을 캘린더에 입력해주세요.')
      return
    }

    for (const date of sortedDates) {
      const shift = assignedShifts[date]
      if (!finalSchedule[date]) finalSchedule[date] = Array(24).fill(false)

      if (shift === 'D') {
        finalSchedule[date] = applyRange(finalSchedule[date], shiftTimes.D.start, shiftTimes.D.end)
      } else if (shift === 'E') {
        finalSchedule[date] = applyRange(finalSchedule[date], shiftTimes.E.start, shiftTimes.E.end)
      } else if (shift === 'N') {
        finalSchedule[date] = applyRange(finalSchedule[date], shiftTimes.N.start, 24)
        const nextDate = getNextDateString(date)
        if (!finalSchedule[nextDate]) finalSchedule[nextDate] = Array(24).fill(false)
        finalSchedule[nextDate] = applyRange(finalSchedule[nextDate], 0, shiftTimes.N.end)
      }
    }

    const payload = {
      hospital,
      department,
      shiftType,
      startDate: sortedDates[0],
      endDate: sortedDates[sortedDates.length - 1],
      schedule: finalSchedule,
      // ✅ 사용자 커스텀 시간대 정보 추가 저장
      shiftTimes: shiftTimes, 
    }

    localStorage.setItem('sleep-onboarding-schedule', JSON.stringify(payload))
    router.push('/sleep-plan') 
  }

  const updateShiftTime = (shift: 'D'|'E'|'N', type: 'start'|'end', value: number) => {
    setShiftTimes(prev => ({
      ...prev,
      [shift]: { ...prev[shift], [type]: value }
    }))
  }

  return (
    // 다크모드 대응: 전체 텍스트 색상을 text-slate-900으로 기본 세팅
    <main className="min-h-screen bg-slate-50 px-4 py-8 pb-40 text-slate-900">
      <div className="mx-auto max-w-lg space-y-6">
        
        {/* 1. 상단 정보 입력란 (복구됨 & 다크모드 대응 완료) */}
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <h1 className="text-2xl font-bold text-slate-900">시작하기</h1>
          <p className="mt-2 text-sm text-slate-600">
            소속과 근무 시간을 설정하고, 캘린더에 이번 달 듀티를 톡톡 입력해보세요.
          </p>

          <div className="mt-6 space-y-4">
            <input
              type="text"
              value={hospital}
              onChange={(e) => setHospital(e.target.value)}
              placeholder="병원 또는 기관명"
              // 다크모드 텍스트 반전 방지를 위해 bg-white, text-slate-900 명시
              className="w-full rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 px-4 py-3 outline-none focus:border-sky-400"
            />
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="부서명"
              className="w-full rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 border border-slate-200 px-4 py-3 outline-none focus:border-sky-400"
            />
            <select
              value={shiftType}
              onChange={(e) => setShiftType(e.target.value)}
              className="w-full rounded-2xl bg-white text-slate-900 border border-slate-200 px-4 py-3 outline-none focus:border-sky-400 appearance-none"
            >
              <option value="3교대" className="text-slate-900">3교대</option>
              <option value="고정 야간" className="text-slate-900">고정 야간</option>
              <option value="기타" className="text-slate-900">기타</option>
            </select>
          </div>
        </div>

        {/* 2. 근무 시간 커스텀 */}
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">나의 기본 근무 시간</h2>
          <div className="space-y-3">
            {(['D', 'E', 'N'] as const).map((shift) => (
              <div key={shift} className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl">
                <span className={`font-bold w-8 ${
                  shift === 'D' ? 'text-emerald-500' : shift === 'E' ? 'text-amber-500' : 'text-indigo-500'
                }`}>{shift}</span>
                <div className="flex items-center gap-2">
                  <select 
                    value={shiftTimes[shift].start} 
                    onChange={(e) => updateShiftTime(shift, 'start', Number(e.target.value))}
                    className="bg-white text-slate-900 border border-slate-200 rounded-lg px-2 py-1 text-sm outline-none"
                  >
                    {Array.from({length: 24}).map((_, i) => <option key={i} value={i} className="text-slate-900">{i}시</option>)}
                  </select>
                  <span className="text-slate-400">~</span>
                  <select 
                    value={shiftTimes[shift].end} 
                    onChange={(e) => updateShiftTime(shift, 'end', Number(e.target.value))}
                    className="bg-white text-slate-900 border border-slate-200 rounded-lg px-2 py-1 text-sm outline-none"
                  >
                    {Array.from({length: 24}).map((_, i) => <option key={i} value={i} className="text-slate-900">{i}시</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. 캘린더 입력 */}
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-2 text-slate-400 hover:text-sky-600"><span className="text-lg">◀</span></button>
            <h2 className="text-lg font-bold text-slate-800">{currentMonthDate.getFullYear()}년 {currentMonthDate.getMonth() + 1}월</h2>
            <button onClick={nextMonth} className="p-2 text-slate-400 hover:text-sky-600"><span className="text-lg">▶</span></button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['일', '월', '화', '수', '목', '금', '토'].map(day => (
              <div key={day} className={`text-center text-xs font-semibold ${day === '일' ? 'text-rose-500' : day === '토' ? 'text-sky-500' : 'text-slate-400'}`}>
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((dateStr, index) => {
              if (!dateStr) return <div key={`empty-${index}`} className="h-12" />
              
              const dayNum = new Date(dateStr).getDate()
              const shift = assignedShifts[dateStr]
              const isActive = activeDate === dateStr

              return (
                <div 
                  key={dateStr}
                  onClick={() => setActiveDate(dateStr)}
                  className={`relative flex flex-col items-center justify-center h-12 rounded-xl cursor-pointer transition-all border-2 ${
                    isActive ? 'border-sky-500 bg-sky-50 shadow-sm' : 'border-transparent bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <span className={`text-[11px] font-bold ${isActive ? 'text-sky-700' : 'text-slate-600'}`}>
                    {dayNum}
                  </span>
                  {shift && (
                    <span className={`mt-0.5 text-[10px] font-bold ${
                      shift === 'D' ? 'text-emerald-500' :
                      shift === 'E' ? 'text-amber-500' :
                      shift === 'N' ? 'text-indigo-500' : 'text-slate-400'
                    }`}>
                      {shift}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
          <p className="mt-4 text-center text-xs text-sky-600 font-medium">
            {activeDate ? `${new Date(activeDate).getDate()}일부터 순차 입력을 시작합니다.` : '달력에서 시작할 날짜를 눌러주세요.'}
          </p>
        </div>

      </div>

      {/* 🚀 4. 하단 고정: 빠른 입력 버튼 & 다음 단계 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 pb-safe shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] z-50">
        <div className="mx-auto max-w-lg">
          <div className="grid grid-cols-4 gap-2 mb-4">
            <button onClick={() => handleShiftClick('D')} className="py-3 rounded-2xl bg-emerald-50 text-emerald-600 font-bold hover:bg-emerald-100 transition shadow-sm border border-emerald-100">Day</button>
            <button onClick={() => handleShiftClick('E')} className="py-3 rounded-2xl bg-amber-50 text-amber-600 font-bold hover:bg-amber-100 transition shadow-sm border border-amber-100">Eve</button>
            <button onClick={() => handleShiftClick('N')} className="py-3 rounded-2xl bg-indigo-50 text-indigo-600 font-bold hover:bg-indigo-100 transition shadow-sm border border-indigo-100">Night</button>
            <button onClick={() => handleShiftClick('OFF')} className="py-3 rounded-2xl bg-slate-100 text-slate-500 font-bold hover:bg-slate-200 transition shadow-sm border border-slate-200">OFF</button>
          </div>
          
          <button
            onClick={handleNext}
            className="w-full rounded-2xl bg-slate-900 text-white px-4 py-4 font-bold transition hover:bg-slate-800 shadow-md"
          >
            수면 플랜 생성하기
          </button>
        </div>
      </div>
    </main>
  )
}