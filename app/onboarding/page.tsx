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

// 30분 단위 시간을 1시간 단위 배열(0~23) 인덱스로 근사치 변환하는 함수
// (현재 저장 구조가 24칸의 boolean 배열이므로, '07:30'이면 7시부터 칠하는 식으로 단순화합니다)
function timeStrToHour(timeStr: string) {
  const [hour] = timeStr.split(':').map(Number)
  return hour
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

// 30분 단위 타임 옵션 생성기
const generateTimeOptions = () => {
  const options = []
  for (let i = 0; i < 24; i++) {
    const hour = String(i).padStart(2, '0')
    options.push(`${hour}:00`)
    options.push(`${hour}:30`)
  }
  return options
}
const TIME_OPTIONS = generateTimeOptions()

export default function OnboardingPage() {
  const router = useRouter()

  // 1. 기본 정보 상태
  const [hospital, setHospital] = useState('')
  const [department, setDepartment] = useState('')
  const [shiftType, setShiftType] = useState('3교대')

  // 2. 근무 시간 설정 상태 (문자열 'HH:MM' 기반으로 변경, 동적 추가 가능)
  const [shiftTimes, setShiftTimes] = useState<Record<string, { start: string, end: string, color: string }>>({
    D: { start: '07:00', end: '15:00', color: 'emerald' },
    E: { start: '15:00', end: '23:00', color: 'amber' },
    N: { start: '22:00', end: '08:00', color: 'indigo' },
  })

  // 커스텀 근무 추가용 상태
  const [newShiftName, setNewShiftName] = useState('')
  
  // 3. 캘린더 및 스케줄 상태
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date())
  const [activeDate, setActiveDate] = useState<string | null>(null)
  const [assignedShifts, setAssignedShifts] = useState<Record<string, string>>({}) // ShiftType -> string으로 확장

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

  // ✍️ 커스텀 근무 추가 로직
  const handleAddCustomShift = () => {
    const name = newShiftName.trim().toUpperCase()
    if (!name) return
    if (name === 'OFF' || shiftTimes[name]) {
      alert('이미 존재하는 이름이거나 사용할 수 없는 이름(OFF)입니다.')
      return
    }
    if (name.length > 4) {
      alert('근무 이름은 4글자 이하로 입력해주세요.')
      return
    }

    setShiftTimes(prev => ({
      ...prev,
      [name]: { start: '09:00', end: '18:00', color: 'sky' } // 기본값: sky 색상
    }))
    setNewShiftName('')
  }

  // ✍️ 연속 입력 로직
  const handleShiftClick = (shift: string) => {
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

      if (shift !== 'OFF') {
        const times = shiftTimes[shift]
        const startH = timeStrToHour(times.start)
        const endH = timeStrToHour(times.end)

        // 나이트처럼 밤을 넘기는 교대근무인지 판별 (startH > endH)
        if (startH > endH) {
          finalSchedule[date] = applyRange(finalSchedule[date], startH, 24)
          const nextDate = getNextDateString(date)
          if (!finalSchedule[nextDate]) finalSchedule[nextDate] = Array(24).fill(false)
          finalSchedule[nextDate] = applyRange(finalSchedule[nextDate], 0, endH)
        } else {
          // 당일치기 근무
          finalSchedule[date] = applyRange(finalSchedule[date], startH, endH)
        }
      }
    }

    // shiftTimes 정보를 0~23 정수로 변환하여 저장 (기존 DashboardClient 호환용)
    const convertedShiftTimes: Record<string, { start: number, end: number }> = {}
    Object.keys(shiftTimes).forEach(key => {
      convertedShiftTimes[key] = {
        start: timeStrToHour(shiftTimes[key].start),
        end: timeStrToHour(shiftTimes[key].end)
      }
    })

    const payload = {
      hospital,
      department,
      shiftType,
      startDate: sortedDates[0],
      endDate: sortedDates[sortedDates.length - 1],
      schedule: finalSchedule,
      shiftTimes: convertedShiftTimes, 
    }

    localStorage.setItem('sleep-onboarding-schedule', JSON.stringify(payload))
    router.push('/sleep-plan') 
  }

  const updateShiftTime = (shift: string, type: 'start'|'end', value: string) => {
    setShiftTimes(prev => ({
      ...prev,
      [shift]: { ...prev[shift], [type]: value }
    }))
  }

  const removeCustomShift = (shift: string) => {
    if (['D', 'E', 'N'].includes(shift)) return // 기본 근무는 삭제 불가
    
    const newTimes = { ...shiftTimes }
    delete newTimes[shift]
    setShiftTimes(newTimes)

    // 이미 할당된 스케줄에서도 제거
    const newAssigned = { ...assignedShifts }
    Object.keys(newAssigned).forEach(date => {
      if (newAssigned[date] === shift) delete newAssigned[date]
    })
    setAssignedShifts(newAssigned)
  }

  // 색상 매핑을 위한 헬퍼 클래스 (Tailwind 동적 클래스 문제 방지)
  const colorMap: Record<string, { text: string, bg: string, ring: string, active: string }> = {
    emerald: { text: 'text-emerald-500', bg: 'bg-emerald-50', ring: 'border-emerald-200', active: 'hover:bg-emerald-100' },
    amber: { text: 'text-amber-500', bg: 'bg-amber-50', ring: 'border-amber-200', active: 'hover:bg-amber-100' },
    indigo: { text: 'text-indigo-500', bg: 'bg-indigo-50', ring: 'border-indigo-200', active: 'hover:bg-indigo-100' },
    sky: { text: 'text-sky-500', bg: 'bg-sky-50', ring: 'border-sky-200', active: 'hover:bg-sky-100' },
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 pb-48 text-slate-900">
      <div className="mx-auto max-w-lg space-y-6">
        
        {/* 1. 상단 정보 입력란 */}
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

        {/* 2. 근무 시간 커스텀 (30분 단위) */}
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">나의 기본 근무 시간</h2>
          <div className="space-y-3">
            {Object.entries(shiftTimes).map(([shift, times]) => {
               const colors = colorMap[times.color] || colorMap['sky']
               const isCustom = !['D', 'E', 'N'].includes(shift)

               return (
                <div key={shift} className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl relative group">
                  <div className="flex items-center gap-2">
                    {isCustom && (
                      <button onClick={() => removeCustomShift(shift)} className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 text-xs hover:bg-rose-100 hover:text-rose-500">
                        ×
                      </button>
                    )}
                    <span className={`font-bold w-10 text-center ${colors.text}`}>{shift}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <select 
                      value={times.start} 
                      onChange={(e) => updateShiftTime(shift, 'start', e.target.value)}
                      className="bg-white text-slate-900 border border-slate-200 rounded-lg px-2 py-1 text-sm outline-none w-20"
                    >
                      {TIME_OPTIONS.map(time => <option key={time} value={time} className="text-slate-900">{time}</option>)}
                    </select>
                    <span className="text-slate-400">~</span>
                    <select 
                      value={times.end} 
                      onChange={(e) => updateShiftTime(shift, 'end', e.target.value)}
                      className="bg-white text-slate-900 border border-slate-200 rounded-lg px-2 py-1 text-sm outline-none w-20"
                    >
                      {TIME_OPTIONS.map(time => <option key={time} value={time} className="text-slate-900">{time}</option>)}
                    </select>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 추가 기능: 나만의 근무 생성 */}
          <div className="mt-4 flex gap-2">
            <input 
              type="text" 
              value={newShiftName} 
              onChange={(e) => setNewShiftName(e.target.value)}
              placeholder="추가 근무명 (예: HD)"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-sky-400"
              maxLength={4}
            />
            <button onClick={handleAddCustomShift} className="bg-slate-800 text-white rounded-xl px-4 py-2 text-sm font-bold hover:bg-slate-700">추가</button>
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

              const shiftColor = shift && shift !== 'OFF' ? colorMap[shiftTimes[shift]?.color || 'sky'].text : 'text-slate-400'

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
                    <span className={`mt-0.5 text-[10px] font-bold ${shiftColor}`}>
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

      {/* 🚀 4. 하단 고정: 동적 빠른 입력 버튼 & 다음 단계 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 pb-safe shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] z-50">
        <div className="mx-auto max-w-lg">
          
          {/* 동적 버튼 생성 영역 (스크롤 가능하게 처리) */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide snap-x">
            {Object.keys(shiftTimes).map((shift) => {
              const colors = colorMap[shiftTimes[shift].color || 'sky']
              return (
                <button 
                  key={shift}
                  onClick={() => handleShiftClick(shift)} 
                  className={`min-w-[4rem] flex-1 py-3 rounded-2xl font-bold transition shadow-sm border ${colors.bg} ${colors.text} ${colors.ring} ${colors.active} snap-start`}
                >
                  {shift}
                </button>
              )
            })}
            <button 
              onClick={() => handleShiftClick('OFF')} 
              className="min-w-[4rem] flex-1 py-3 rounded-2xl bg-slate-100 text-slate-500 font-bold hover:bg-slate-200 transition shadow-sm border border-slate-200 snap-start"
            >
              OFF
            </button>
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