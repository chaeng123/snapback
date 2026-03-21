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

function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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

export default function DashboardClient() {
  const router = useRouter()
  // 현재 경로를 가져와서 하단 바 활성화 상태 표시에 사용합니다.
  const pathname = usePathname()
  
  const [data, setData] = useState<ScheduleData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  const [daySleepOption, setDaySleepOption] = useState<1 | 2>(1)
  const [isDayOptionSelected, setIsDayOptionSelected] = useState(false)

  const [conditionScore, setConditionScore] = useState<number>(0)
  const [conditionMemo, setConditionMemo] = useState<string>('')

  const { todayStr, weekDates } = useMemo(() => {
    const today = new Date()
    const currentDayOfWeek = today.getDay()
    
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - currentDayOfWeek)

    const dates = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      dates.push(formatDate(d))
    }

    return { todayStr: formatDate(today), weekDates: dates }
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('sleep-onboarding-schedule')
    if (saved) {
      setData(JSON.parse(saved))
    }
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">불러오는 중...</div>
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <p className="text-slate-600">등록된 일정 데이터가 없습니다.</p>
        <button 
          onClick={() => router.push('/schedule-setup')}
          className="rounded-2xl bg-sky-600 px-5 py-3 font-semibold text-white hover:bg-sky-700"
        >
          일정 등록하러 가기
        </button>
      </div>
    )
  }

  const todayHours = data.schedule[todayStr]
  const todayShift = getShiftTypeFromHours(todayHours)

  const yesterdayObj = new Date(todayStr)
  yesterdayObj.setDate(yesterdayObj.getDate() - 1)
  const yesterdayStr = formatDate(yesterdayObj)
  const yesterdayShift = getShiftTypeFromHours(data.schedule[yesterdayStr])

  const getSleepRecommendation = () => {
    if (todayShift === 'D') {
      return {
        type: 'Day',
        options: [
          { id: 1, time: '낮잠 1.5시간 + 23:00 - 05:00', desc: '근무 끝나고 1시간 반 낮잠 후 밤에 취침' },
          { id: 2, time: '21:30 - 05:00', desc: '근무 끝나고 활동 후 일찍 취침' }
        ],
        reason: '데이 근무 후 본인의 피로도에 맞는 수면 패턴을 선택해 보세요.',
      }
    } 
    
    if (todayShift === 'N') {
      if (yesterdayShift !== 'N') {
        return {
          type: 'Night_First',
          time: '19:00 - 20:30',
          reason: '첫 번째 나이트 근무입니다. 출근 전 1시간 30분 정도 취침하여 야간 근무를 위한 에너지를 비축하세요.',
        }
      } else {
        return {
          type: 'Night_Continuous',
          time: '10:00 - 18:00',
          reason: '연속된 나이트 근무입니다. 퇴근 후 빛을 차단하고 10시부터 18시까지 충분한 수면을 취하세요.',
        }
      }
    }

    if (yesterdayShift === 'N' && todayShift === 'OFF') {
      return {
        type: 'Post_Night',
        time: '09:00 - 12:00 / 익일 01:00 - 05:00',
        reason: '나이트 근무가 끝났습니다. 오전 9시부터 12시까지 짧게 취침 후, 밤에 다시 자면서 생체 리듬을 되돌려보세요.',
      }
    }

    if (todayShift === 'E') {
      return {
        type: 'Evening',
        time: '01:00 - 08:30',
        reason: '이브닝 근무 후 뇌가 각성되어 있을 수 있습니다. 가벼운 스트레칭으로 긴장을 풀고 취침하세요.',
      }
    }

    return {
      type: 'Off',
      time: '23:00 - 07:00',
      reason: '오늘은 오프입니다! 밀린 수면 부채를 해결하고 규칙적인 생체 리듬을 회복하세요.',
    }
  }

  const sleepRec = getSleepRecommendation()
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']

  const selectedDayOption = sleepRec.options?.find(opt => opt.id === daySleepOption)

  const handleConditionSubmit = () => {
    console.log('저장된 컨디션:', { score: conditionScore, memo: conditionMemo })
    alert('컨디션 기록이 저장되었습니다!')
  }

  return (
    // 하단 바 공간 확보를 위해 pb-24 추가
    <main className="min-h-screen bg-slate-50 px-4 pt-8 pb-24 relative">
      <div className="mx-auto max-w-lg space-y-6">
        
        {/* 헤더 */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">오늘도 수고 많으셨어요!</h1>
          <p className="mt-1 text-slate-600">최상의 컨디션을 위한 수면 플랜을 준비했습니다.</p>
        </div>

        {/* 이번 주 근무 */}
        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">이번 주 근무</h2>
          <div className="flex justify-between">
            {weekDates.map((dateStr) => {
              const dateObj = new Date(dateStr)
              const isToday = dateStr === todayStr
              const shiftType = getShiftTypeFromHours(data.schedule[dateStr])
              
              return (
                <div key={dateStr} className="flex flex-col items-center gap-2">
                  <span className={`text-xs font-medium ${isToday ? 'text-sky-600' : 'text-slate-400'}`}>
                    {weekdays[dateObj.getDay()]}
                  </span>
                  <div className={`flex h-10 w-10 flex-col items-center justify-center rounded-full ${
                    isToday ? 'bg-sky-600 text-white shadow-md' : 'bg-slate-50 text-slate-700'
                  }`}>
                    <span className="text-sm font-bold">{dateObj.getDate()}</span>
                  </div>
                  <span className={`text-[11px] font-bold ${
                    shiftType === 'D' ? 'text-emerald-500' :
                    shiftType === 'E' ? 'text-amber-500' :
                    shiftType === 'N' ? 'text-indigo-500' : 'text-slate-300'
                  }`}>
                    {shiftType}
                  </span>
                </div>
              )
            })}
          </div>
        </section>

        {/* 오늘의 근무 요약 */}
        <section className="flex gap-4">
          <div className="flex-1 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <h2 className="text-sm font-semibold text-slate-500">오늘의 근무</h2>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {todayShift === 'OFF' ? '휴일' : `${todayShift} 근무`}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {new Date(todayStr).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
            </p>
          </div>

          <div className="flex-1 rounded-3xl bg-slate-800 p-5 shadow-sm text-white">
            <h2 className="text-sm font-semibold text-slate-400">목표 수면 시간</h2>
            <div className="mt-2">
              <span className="text-2xl font-bold text-sky-400">7.5</span>
              <span className="ml-1 text-sm text-slate-300">시간</span>
            </div>
          </div>
        </section>

        {/* 🌙 추천 수면 스케줄 */}
        <section className="rounded-3xl bg-sky-50 p-6 shadow-sm ring-1 ring-sky-100/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🌙</span>
              <h2 className="text-base font-bold text-sky-900">추천 수면 스케줄</h2>
            </div>
            {sleepRec.type === 'Day' && isDayOptionSelected && (
              <button 
                onClick={() => setIsDayOptionSelected(false)}
                className="text-xs font-semibold text-sky-600 hover:text-sky-800"
              >
                변경하기
              </button>
            )}
          </div>

          {sleepRec.type === 'Day' && !isDayOptionSelected ? (
            <div className="space-y-3 mb-4">
              <p className="text-sm text-sky-800 mb-2 font-medium">원하는 수면 패턴을 선택해주세요.</p>
              {sleepRec.options?.map((opt) => (
                <div 
                  key={opt.id}
                  onClick={() => setDaySleepOption(opt.id as 1 | 2)}
                  className={`cursor-pointer rounded-2xl p-4 transition-all ${
                    daySleepOption === opt.id 
                      ? 'bg-white ring-2 ring-sky-500 shadow-md' 
                      : 'bg-white/60 hover:bg-white ring-1 ring-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className={`font-bold ${daySleepOption === opt.id ? 'text-sky-700' : 'text-slate-700'}`}>
                      {opt.time}
                    </p>
                    <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                      daySleepOption === opt.id ? 'border-sky-500' : 'border-slate-300'
                    }`}>
                      {daySleepOption === opt.id && <div className="h-2 w-2 rounded-full bg-sky-500" />}
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{opt.desc}</p>
                </div>
              ))}
              <button 
                onClick={() => setIsDayOptionSelected(true)}
                className="w-full mt-2 rounded-xl bg-sky-600 py-3 font-semibold text-white hover:bg-sky-700 transition"
              >
                이 스케줄로 선택하기
              </button>
            </div>
          ) : (
            <>
              <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm mb-4 border border-sky-100">
                <p className="text-center text-xl font-bold text-slate-800 tracking-wide">
                  {sleepRec.type === 'Day' ? selectedDayOption?.time : sleepRec.time}
                </p>
                {sleepRec.type === 'Day' && (
                  <p className="mt-1 text-center text-xs text-slate-500">{selectedDayOption?.desc}</p>
                )}
              </div>
              <div>
                <p className="text-sm leading-relaxed text-sky-800">
                  {sleepRec.reason}
                </p>
              </div>
            </>
          )}
        </section>

        {/* 📝 컨디션 회고 폼 */}
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-base font-bold text-slate-800 mb-2">어제 근무 컨디션은 어떠셨나요?</h2>
          <p className="text-xs text-slate-500 mb-5">컨디션을 기록하면 더 정확한 수면 플랜을 세울 수 있어요.</p>

          <div className="flex justify-between items-center mb-6 px-2">
            {[1, 2, 3, 4, 5].map((score) => (
              <button
                key={score}
                onClick={() => setConditionScore(score)}
                className={`flex h-12 w-12 flex-col items-center justify-center rounded-full transition-all ${
                  conditionScore === score 
                    ? 'bg-amber-100 text-amber-600 ring-2 ring-amber-400 scale-110 shadow-sm' 
                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                }`}
              >
                <span className="text-lg">
                  {score === 1 && '😫'}
                  {score === 2 && '🙁'}
                  {score === 3 && '😐'}
                  {score === 4 && '🙂'}
                  {score === 5 && '🤩'}
                </span>
              </button>
            ))}
          </div>

          <div className="mb-4">
            <textarea 
              value={conditionMemo}
              onChange={(e) => setConditionMemo(e.target.value)}
              placeholder="특별히 피곤했던 시간이나 이유가 있다면 적어주세요. (선택)"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 outline-none focus:border-sky-500 focus:bg-white focus:ring-1 focus:ring-sky-500 resize-none"
              rows={3}
            />
          </div>

          <button 
            onClick={handleConditionSubmit}
            disabled={conditionScore === 0}
            className={`w-full rounded-xl py-3 font-semibold transition ${
              conditionScore === 0 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-slate-800 text-white hover:bg-slate-900'
            }`}
          >
            기록 저장하기
          </button>
        </section>
        
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