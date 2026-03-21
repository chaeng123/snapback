'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface ShiftTimes {
  D: { start: number; end: number };
  E: { start: number; end: number };
  N: { start: number; end: number };
}

interface ScheduleData {
  hospital: string
  department: string
  shiftType: string
  startDate: string
  endDate: string
  schedule: Record<string, boolean[]>
  shiftTimes?: ShiftTimes
}

// 📅 헬퍼 함수들
function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function getNextDateString(dateStr: string) {
  const date = parseLocalDate(dateStr)
  date.setDate(date.getDate() + 1)
  return formatDate(date)
}

function getPrevDateString(dateStr: string) {
  const date = parseLocalDate(dateStr)
  date.setDate(date.getDate() - 1)
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

export default function MonthlySchedulePage() {
  const router = useRouter()
  const pathname = usePathname()
  
  const [data, setData] = useState<ScheduleData | null>(null)
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date())
  const [editingDate, setEditingDate] = useState<string | null>(null)

  const defaultTimes: ShiftTimes = {
    D: { start: 7, end: 15 },
    E: { start: 15, end: 23 },
    N: { start: 22, end: 8 },
  }

  useEffect(() => {
    const saved = localStorage.getItem('sleep-onboarding-schedule')
    if (saved) {
      setData(JSON.parse(saved))
    }
  }, [])

  // ✅ 수정된 판별 로직: 출근 시간이 아닌 '근무의 정중앙 코어 시간'을 기준으로 판별하여 N 퇴근시간과의 충돌 방지
  const getShiftTypeFromHours = (hours: boolean[] | undefined, times: ShiftTimes): 'D' | 'E' | 'N' | 'OFF' | '' => {
    if (!hours) return ''
    const activeHours = hours.map((v, i) => (v ? i : -1)).filter((v) => v !== -1)
    if (activeHours.length === 0) return 'OFF'

    const dayCore = Math.floor((times.D.start + times.D.end) / 2)
    const eveCore = Math.floor((times.E.start + times.E.end) / 2)
    const nightCore = times.N.start

    const isDay = activeHours.includes(dayCore) || activeHours.includes(dayCore + 1)
    const isEvening = activeHours.includes(eveCore) || activeHours.includes(eveCore + 1)
    const isNight = activeHours.includes(nightCore) || activeHours.includes(nightCore + 1)

    if (isDay) return 'D'
    if (isEvening) return 'E'
    if (isNight) return 'N'
    
    return 'OFF'
  }

  const calendarDays = useMemo(() => {
    const year = currentMonthDate.getFullYear()
    const month = currentMonthDate.getMonth()
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    
    const startingDayOfWeek = firstDayOfMonth.getDay()
    const totalDays = lastDayOfMonth.getDate()

    const days = []
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null)
    for (let i = 1; i <= totalDays; i++) days.push(formatDate(new Date(year, month, i)))
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

  // ✅ 수정된 일정 덮어쓰기 로직
  const handleShiftChange = (preset: 'D' | 'E' | 'N' | 'OFF') => {
    if (!editingDate || !data) return

    const date = editingDate
    const updatedSchedule = { ...data.schedule }
    const empty = Array(24).fill(false)
    const times = data.shiftTimes || defaultTimes

    const prevDate = getPrevDateString(date)
    const hasPrevNight = updatedSchedule[prevDate]?.[times.N.start] ?? false

    // 중요: 기존의 D, E 잔여 시간을 지우기 위해 무조건 '백지 상태(empty)'에서 시작합니다.
    // 단, 전날 N 근무의 여파(새벽 시간)는 보존해야 하므로 baseSchedule에 추가해둡니다.
    const baseSchedule = [...empty]
    if (hasPrevNight) {
      for (let h = 0; h < times.N.end; h++) baseSchedule[h] = true
    }

    if (preset === 'D') {
      updatedSchedule[date] = applyRange(baseSchedule, times.D.start, times.D.end)
    } 
    else if (preset === 'E') {
      updatedSchedule[date] = applyRange(baseSchedule, times.E.start, times.E.end)
    } 
    else if (preset === 'OFF') {
      updatedSchedule[date] = baseSchedule
    } 
    else if (preset === 'N') {
      updatedSchedule[date] = applyRange(baseSchedule, times.N.start, 24)

      // 익일 새벽 시간 추가 처리
      const nextDate = getNextDateString(date)
      if (!updatedSchedule[nextDate]) updatedSchedule[nextDate] = [...empty]
      for (let h = 0; h < times.N.end; h++) {
        updatedSchedule[nextDate][h] = true
      }
    }

    const newData = { ...data, schedule: updatedSchedule }
    setData(newData)
    localStorage.setItem('sleep-onboarding-schedule', JSON.stringify(newData))
    setEditingDate(null)
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 pt-8 pb-24 relative text-slate-900">
      <div className="mx-auto max-w-lg space-y-6">
        
        {/* 상단 월 이동 컨트롤 */}
        <div className="flex items-center justify-between bg-white p-4 rounded-3xl shadow-sm ring-1 ring-slate-100">
          <button onClick={prevMonth} className="p-2 text-slate-400 hover:text-sky-600 transition">
            <span className="text-xl">◀</span>
          </button>
          <h1 className="text-xl font-bold text-slate-800">
            {currentMonthDate.getFullYear()}년 {currentMonthDate.getMonth() + 1}월
          </h1>
          <button onClick={nextMonth} className="p-2 text-slate-400 hover:text-sky-600 transition">
            <span className="text-xl">▶</span>
          </button>
        </div>

        {/* 캘린더 그리드 */}
        <div className="bg-white p-4 rounded-3xl shadow-sm ring-1 ring-slate-100">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['일', '월', '화', '수', '목', '금', '토'].map(day => (
              <div key={day} className={`text-center text-xs font-semibold ${day === '일' ? 'text-rose-500' : day === '토' ? 'text-sky-500' : 'text-slate-400'}`}>
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((dateStr, index) => {
              if (!dateStr) return <div key={`empty-${index}`} className="h-16 rounded-xl bg-transparent" />
              
              const dayNum = new Date(dateStr).getDate()
              const isToday = dateStr === formatDate(new Date())
              const times = data?.shiftTimes || defaultTimes
              const shift = data ? getShiftTypeFromHours(data.schedule[dateStr], times) : ''

              return (
                <div 
                  key={dateStr}
                  onClick={() => setEditingDate(dateStr)}
                  className={`relative flex flex-col items-center justify-start h-16 pt-1 rounded-xl cursor-pointer transition-all border ${
                    isToday ? 'border-sky-300 bg-sky-50' : 'border-slate-100 bg-white hover:bg-slate-50'
                  }`}
                >
                  <span className={`text-[11px] font-bold ${isToday ? 'text-sky-700' : 'text-slate-600'}`}>
                    {dayNum}
                  </span>
                  
                  {shift && (
                    <span className={`mt-1 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold shadow-sm ${
                      shift === 'D' ? 'bg-emerald-100 text-emerald-700' :
                      shift === 'E' ? 'bg-amber-100 text-amber-700' :
                      shift === 'N' ? 'bg-indigo-100 text-indigo-700' :
                      shift === 'OFF' ? 'bg-slate-100 text-slate-500' : 'bg-transparent'
                    }`}>
                      {shift !== 'OFF' ? shift : '-'}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
          <p className="mt-4 text-center text-xs text-slate-400">날짜를 터치하면 근무를 수정할 수 있어요.</p>
        </div>
      </div>

      {/* 📝 근무 편집 모달 */}
      {editingDate && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">근무 변경</h3>
            <p className="text-sm text-slate-500 mb-5">{editingDate} 일정을 변경합니다.</p>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button onClick={() => handleShiftChange('D')} className="py-3 rounded-2xl bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 transition">Day</button>
              <button onClick={() => handleShiftChange('E')} className="py-3 rounded-2xl bg-amber-50 text-amber-700 font-bold hover:bg-amber-100 transition">Evening</button>
              <button onClick={() => handleShiftChange('N')} className="py-3 rounded-2xl bg-indigo-50 text-indigo-700 font-bold hover:bg-indigo-100 transition">Night</button>
              <button onClick={() => handleShiftChange('OFF')} className="py-3 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition">OFF</button>
            </div>

            <button 
              onClick={() => setEditingDate(null)}
              className="w-full py-3 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 📱 하단 네비게이션 바 */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe">
        <div className="mx-auto max-w-lg flex justify-around items-center h-16 px-4">
          <button onClick={() => router.push('/sleep-plan')} className={`flex flex-col items-center gap-1 w-16 transition-colors ${pathname === '/sleep-plan' ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <span className="text-xl leading-none">🏠</span><span className="text-[10px] font-medium">홈</span>
          </button>
          <button onClick={() => router.push('/monthlyschedule')} className={`flex flex-col items-center gap-1 w-16 transition-colors ${pathname === '/monthlyschedule' ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <span className="text-xl leading-none">📅</span><span className="text-[10px] font-medium">월간</span>
          </button>
          <button onClick={() => router.push('/alarms')} className={`flex flex-col items-center gap-1 w-16 transition-colors ${pathname === '/alarms' ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <span className="text-xl leading-none">⏰</span><span className="text-[10px] font-medium">알람</span>
          </button>
          <button onClick={() => router.push('/community')} className={`flex flex-col items-center gap-1 w-16 transition-colors ${pathname === '/community' ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <span className="text-xl leading-none">💬</span><span className="text-[10px] font-medium">커뮤니티</span>
          </button>
        </div>
      </nav>
    </main>
  )
}