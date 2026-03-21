'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface ScheduleData {
  hospital: string
  department: string
  shiftType: string
  startDate: string
  endDate: string
  schedule: Record<string, boolean[]>
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

function getShiftTypeFromHours(hours: boolean[] | undefined): 'D' | 'E' | 'N' | 'OFF' | '' {
  if (!hours) return ''
  
  const activeHours = hours.map((v, i) => (v ? i : -1)).filter((v) => v !== -1)
  if (activeHours.length === 0) return 'OFF'

  // 단순히 첫 시간만 보는 것이 아니라, 해당 날짜에 각 근무의 '시작 시간대'가 포함되어 있는지 확인합니다.
  const hasDayStart = activeHours.some(h => h >= 6 && h <= 11)      // D: 보통 7시 시작
  const hasEveningStart = activeHours.some(h => h >= 13 && h <= 18) // E: 보통 15시 시작
  const hasNightStart = activeHours.some(h => h >= 21)              // N: 보통 22시 시작

  // 우선순위에 따라 근무 타입을 반환합니다.
  if (hasDayStart) return 'D'
  if (hasEveningStart) return 'E'
  if (hasNightStart) return 'N'
  
  // 만약 위 시간대에 해당하는 근무가 없고 새벽(0~8시)만 칠해져 있다면,
  // 전날 나이트 근무의 퇴근 시간이므로 당일 뱃지는 'OFF'로 표시합니다.
  return 'OFF'
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
  
  // 수정할 날짜를 선택했을 때 띄울 모달 상태
  const [editingDate, setEditingDate] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('sleep-onboarding-schedule')
    if (saved) {
      setData(JSON.parse(saved))
    } else {
      // 데이터가 아예 없으면 기본 구조 생성 (선택 사항)
      setData({
        hospital: '', department: '', shiftType: '3교대', startDate: '', endDate: '', schedule: {}
      })
    }
  }, [])

  // 🗓 캘린더 렌더링용 날짜 배열 계산
  const calendarDays = useMemo(() => {
    const year = currentMonthDate.getFullYear()
    const month = currentMonthDate.getMonth()
    
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    
    const startingDayOfWeek = firstDayOfMonth.getDay() // 0(일) ~ 6(토)
    const totalDays = lastDayOfMonth.getDate()

    const days = []
    // 앞쪽 빈 칸 채우기
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    // 실제 날짜 채우기
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i)
      days.push(formatDate(d))
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

  // ✍️ 일정 변경 로직 (N 근무 새벽/오프 로직 포함)
  const handleShiftChange = (preset: 'D' | 'E' | 'N' | 'OFF') => {
    if (!editingDate || !data) return

    const date = editingDate
    const updatedSchedule = { ...data.schedule }
    const empty = Array(24).fill(false)

    const prevDate = getPrevDateString(date)
    const hasPrevNight = updatedSchedule[prevDate]?.[23] ?? false

    if (preset === 'D') updatedSchedule[date] = applyRange(empty, 7, 15)
    else if (preset === 'E') updatedSchedule[date] = applyRange(empty, 15, 23)
    else if (preset === 'OFF') {
      const offSchedule = [...empty]
      if (hasPrevNight) {
        for (let h = 0; h < 8; h++) offSchedule[h] = true
      }
      updatedSchedule[date] = offSchedule
    } 
    else if (preset === 'N') {
      const currentDaySchedule = updatedSchedule[date] ? [...updatedSchedule[date]] : [...empty]
      updatedSchedule[date] = applyRange(currentDaySchedule, 22, 24)

      const nextDate = getNextDateString(date)
      // 익일 일정이 아예 없더라도 새로 배열을 만들어 줍니다. (월간 달력이므로 범위를 넘어갈 수 있음)
      const nextDaySchedule = updatedSchedule[nextDate] ? [...updatedSchedule[nextDate]] : [...empty]
      for (let h = 0; h < 8; h++) {
        nextDaySchedule[h] = true
      }
      updatedSchedule[nextDate] = nextDaySchedule
    }

    const newData = { ...data, schedule: updatedSchedule }
    setData(newData)
    localStorage.setItem('sleep-onboarding-schedule', JSON.stringify(newData))
    setEditingDate(null) // 모달 닫기
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 pt-8 pb-24 relative">
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
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['일', '월', '화', '수', '목', '금', '토'].map(day => (
              <div key={day} className={`text-center text-xs font-semibold ${day === '일' ? 'text-rose-500' : day === '토' ? 'text-sky-500' : 'text-slate-400'}`}>
                {day}
              </div>
            ))}
          </div>

          {/* 날짜 셀 */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((dateStr, index) => {
              if (!dateStr) return <div key={`empty-${index}`} className="h-16 rounded-xl bg-transparent" />
              
              const dayNum = new Date(dateStr).getDate()
              const isToday = dateStr === formatDate(new Date())
              const shift = data ? getShiftTypeFromHours(data.schedule[dateStr]) : ''

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
                  
                  {/* 근무 뱃지 */}
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

      {/* 📝 근무 편집 모달 (선택한 날짜가 있을 때만 노출) */}
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