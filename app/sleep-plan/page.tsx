'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'

// 로컬스토리지에서 불러올 데이터 타입 정의
interface ScheduleData {
  hospital: string
  department: string
  shiftType: string
  startDate: string
  endDate: string
  schedule: Record<string, boolean[]>
}

// 날짜 포맷 헬퍼 함수 (YYYY-MM-DD)
function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 하루의 근무 배열(boolean[24])을 바탕으로 근무 종류(D, E, N)를 유추하는 함수
function getShiftTypeFromHours(hours: boolean[] | undefined): 'D' | 'E' | 'N' | 'OFF' {
  if (!hours) return 'OFF'
  
  const activeHours = hours.map((v, i) => (v ? i : -1)).filter((v) => v !== -1)
  if (activeHours.length === 0) return 'OFF'

  const firstHour = activeHours[0]

  // 시작 시간에 따른 단순 분류 (필요에 따라 로직 수정 가능)
  if (firstHour >= 5 && firstHour <= 10) return 'D'
  if (firstHour >= 13 && firstHour <= 17) return 'E'
  if (firstHour >= 21 || firstHour <= 2) return 'N'
  
  return 'OFF' // 애매한 경우 일단 OFF 처리 (또는 커스텀 표시)
}

export default function DashboardClient() {
  const router = useRouter()
  const [data, setData] = useState<ScheduleData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 오늘 날짜 및 이번 주 날짜 계산
  const { todayStr, weekDates } = useMemo(() => {
    const today = new Date()
    const currentDayOfWeek = today.getDay() // 0(일) ~ 6(토)
    
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
          onClick={() => router.push('/schedule-setup')} // 스케줄 설정 페이지 경로로 변경하세요
          className="rounded-2xl bg-sky-600 px-5 py-3 font-semibold text-white hover:bg-sky-700"
        >
          일정 등록하러 가기
        </button>
      </div>
    )
  }

  // 다음 근무 찾기 로직 (오늘 포함, 이후 날짜 중 근무가 있는 첫 날)
  const sortedDates = Object.keys(data.schedule).sort()
  let nextShiftDate = ''
  let nextShiftHours: boolean[] = []
  
  for (const date of sortedDates) {
    if (date >= todayStr) {
      const hours = data.schedule[date]
      if (hours.some((h) => h === true)) {
        nextShiftDate = date
        nextShiftHours = hours
        break
      }
    }
  }

  const nextShiftType = getShiftTypeFromHours(nextShiftHours)
  
  // 수면 추천 로직 (다음 근무 타입에 따른 단순화된 예시)
  const getSleepRecommendation = (shift: 'D' | 'E' | 'N' | 'OFF') => {
    switch (shift) {
      case 'D':
        return {
          time: '22:30 - 06:00',
          reason: '데이 근무는 이른 기상이 필요해요. 전날 밤 깊은 수면을 통해 아침 피로를 최소화하는 것이 가장 중요합니다.',
        }
      case 'E':
        return {
          time: '01:00 - 08:30',
          reason: '이브닝 근무 후에는 뇌가 각성되어 있을 수 있어요. 퇴근 후 가벼운 스트레칭으로 긴장을 풀고 취침하는 것을 추천합니다.',
        }
      case 'N':
        return {
          time: '09:00 - 15:30',
          reason: '나이트 근무를 앞두고 있다면, 근무 전 낮에 빛을 차단하고 수면을 취해 생체 리듬을 밤에 맞추는 앵커 수면(Anchor Sleep)이 필요해요.',
        }
      default:
        return {
          time: '23:00 - 07:00',
          reason: '오늘은 오프입니다! 밀린 수면 부채를 해결하고 규칙적인 생체 리듬을 회복하기 좋은 날이에요.',
        }
    }
  }

  const sleepRec = getSleepRecommendation(nextShiftType)
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-lg space-y-6">
        
        {/* 헤더 섹션 */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">오늘도 수고 많으셨어요!</h1>
          <p className="mt-1 text-slate-600">최상의 컨디션을 위한 수면 플랜을 준비했습니다.</p>
        </div>

        {/* 이번 주 근무 캘린더 */}
        <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">이번 주 근무</h2>
          <div className="flex justify-between">
            {weekDates.map((dateStr, index) => {
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

        {/* 다음 근무 정보 */}
        <section className="flex gap-4">
          <div className="flex-1 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <h2 className="text-sm font-semibold text-slate-500">다음 근무</h2>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {nextShiftType === 'OFF' ? '휴일' : `${nextShiftType} (Day)`}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {nextShiftDate ? new Date(nextShiftDate).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' }) : '일정 없음'}
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

        {/* 수면 추천 카드 */}
        <section className="rounded-3xl bg-sky-50 p-6 shadow-sm ring-1 ring-sky-100/50">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🌙</span>
            <h2 className="text-base font-bold text-sky-900">추천 수면 스케줄</h2>
          </div>
          <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-center text-xl font-bold text-slate-800 tracking-wide">
              {sleepRec.time}
            </p>
          </div>
          <div className="mt-4">
            <p className="text-sm leading-relaxed text-sky-800">
              {sleepRec.reason}
            </p>
          </div>
        </section>
        
      </div>
    </main>
  )
}