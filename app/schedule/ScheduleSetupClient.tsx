'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type PaintMode = 'add' | 'remove' | null

function parseLocalDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function isValidDateString(value: string | null) {
  if (!value) return false
  const parts = value.split('-')
  if (parts.length !== 3) return false
  const date = parseLocalDate(value)
  return !Number.isNaN(date.getTime())
}

function getDateRange(start: string, end: string) {
  if (!isValidDateString(start) || !isValidDateString(end)) return []

  const startDate = parseLocalDate(start)
  const endDate = parseLocalDate(end)

  if (startDate > endDate) return []

  const dates: string[] = []
  const current = new Date(startDate)

  while (current <= endDate) {
    const year = current.getFullYear()
    const month = String(current.getMonth() + 1).padStart(2, '0')
    const day = String(current.getDate()).padStart(2, '0')
    dates.push(`${year}-${month}-${day}`)
    current.setDate(current.getDate() + 1)
  }

  return dates
}

function getNextDateString(dateStr: string) {
  const date = parseLocalDate(dateStr)
  date.setDate(date.getDate() + 1)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDisplayDate(dateString: string) {
  const date = parseLocalDate(dateString)
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  return `${date.getMonth() + 1}/${date.getDate()} (${weekdays[date.getDay()]})`
}

function createEmptySchedule(dates: string[]) {
  const result: Record<string, boolean[]> = {}
  for (const date of dates) {
    result[date] = Array(24).fill(false)
  }
  return result
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

function getSummaryLabel(hours: boolean[]) {
  const activeIndices = hours
    .map((v, i) => (v ? i : -1))
    .filter((v) => v !== -1)

  if (activeIndices.length === 0) return 'OFF'

  const first = activeIndices[0]
  const last = activeIndices[activeIndices.length - 1] + 1

  if (first === 0 && last <= 9) return `~ ${String(last).padStart(2, '0')}:00`
  if (last === 24 && first >= 20) return `${String(first).padStart(2, '0')}:00 -`

  return `${String(first).padStart(2, '0')}:00 - ${String(last % 24).padStart(2, '0')}:00`
}

export default function ScheduleSetupClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const hospital = searchParams.get('hospital') ?? ''
  const department = searchParams.get('department') ?? ''
  const shiftType = searchParams.get('shiftType') ?? '3교대'
  const startDate = searchParams.get('startDate') ?? ''
  const endDate = searchParams.get('endDate') ?? ''

  const dates = useMemo(() => getDateRange(startDate, endDate), [startDate, endDate])

  const [schedule, setSchedule] = useState<Record<string, boolean[]>>({})
  const [isDragging, setIsDragging] = useState(false)
  const [paintMode, setPaintMode] = useState<PaintMode>(null)

  useEffect(() => {
    setSchedule(createEmptySchedule(dates))
  }, [dates])

  const handleCellStart = (date: string, hour: number) => {
    const currentValue = schedule[date]?.[hour] ?? false
    const nextMode: PaintMode = currentValue ? 'remove' : 'add'

    setIsDragging(true)
    setPaintMode(nextMode)

    setSchedule((prev) => {
      const copied = { ...prev }
      copied[date] = [...(copied[date] ?? Array(24).fill(false))]
      copied[date][hour] = nextMode === 'add'
      return copied
    })
  }

  const handleCellEnter = (date: string, hour: number) => {
    if (!isDragging || !paintMode) return

    setSchedule((prev) => {
      const copied = { ...prev }
      copied[date] = [...(copied[date] ?? Array(24).fill(false))]
      copied[date][hour] = paintMode === 'add'
      return copied
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setPaintMode(null)
  }

  const applyPreset = (date: string, preset: 'D' | 'E' | 'N' | 'OFF') => {
    setSchedule((prev) => {
      const copied = { ...prev }
      const empty = Array(24).fill(false)

      if (preset === 'D') copied[date] = applyRange(empty, 7, 15)
      else if (preset === 'E') copied[date] = applyRange(empty, 15, 23)
      else if (preset === 'OFF') copied[date] = empty
      else if (preset === 'N') {
        console.log(`[디버그] N 근무 클릭됨 - 당일: ${date}`)
        
        // 1. 당일 22:00 ~ 24:00 설정
        copied[date] = applyRange(empty, 23, 24)

        // 2. 익일 날짜 계산 및 적용
        const nextDate = getNextDateString(date)
        console.log(`[디버그] 익일 날짜 계산됨: ${nextDate}`)

        if (copied[nextDate] !== undefined) {
          console.log(`[디버그] 익일 데이터가 존재하여 새벽 0~8시를 칠합니다.`)
          const nextDaySchedule = [...copied[nextDate]]
          for (let h = 0; h < 8; h++) {
            nextDaySchedule[h] = true
          }
          copied[nextDate] = nextDaySchedule
        } else {
          console.log(`[디버그] 주의: ${nextDate}가 캘린더 범위에 없어 새벽 근무를 표시할 수 없습니다.`)
        }
      }

      return copied
    })
  }

  const totalWorkedHours = Object.values(schedule).reduce((sum, hours) => {
    return sum + hours.filter(Boolean).length
  }, 0)

  const handleComplete = () => {
    const payload = {
      hospital,
      department,
      shiftType,
      startDate,
      endDate,
      schedule,
    }

    localStorage.setItem('sleep-onboarding-schedule', JSON.stringify(payload))
    router.push('/sleep-plan')
  }

  return (
    <main
      className="min-h-screen bg-slate-50 px-4 py-6"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="mx-auto max-w-7xl">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium text-sky-600">근무 일정 등록</p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">
                실제 근무 시간을 드래그해서 입력해주세요
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                선택 기간: {startDate || '-'} ~ {endDate || '-'}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {hospital || '기관 미입력'} · {department || '부서 미입력'} · {shiftType}
              </p>
              <p className="mt-1 text-xs text-slate-400">생성된 날짜 수: {dates.length}</p>
            </div>

            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-500">총 등록 근무시간</p>
              <p className="text-xl font-bold text-slate-900">{totalWorkedHours}시간</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            칸을 클릭한 뒤 드래그하면 근무시간을 연속으로 칠할 수 있어요.
            이미 칠해진 칸에서 드래그하면 지울 수도 있습니다.
            D / E / N / OFF 버튼으로 빠르게 입력할 수도 있어요.
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <div
            className="grid gap-px"
            style={{
              gridTemplateColumns: `80px repeat(${dates.length}, minmax(110px, 1fr))`,
            }}
          >
            <div className="sticky left-0 z-10 rounded-tl-2xl bg-slate-100 p-3 text-center text-xs font-semibold text-slate-500">
              시간
            </div>

            {dates.map((date) => (
              <div key={date} className="bg-slate-100 p-2 text-center">
                <p className="text-sm font-semibold text-slate-800">
                  {formatDisplayDate(date)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {getSummaryLabel(schedule[date] ?? Array(24).fill(false))}
                </p>

                <div className="mt-2 flex flex-wrap justify-center gap-1">
                  {(['D', 'E', 'N', 'OFF'] as const).map((preset) => (
                    <button
                      key={preset}
                      onClick={() => applyPreset(date, preset)}
                      className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 hover:border-sky-300 hover:text-sky-700"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {Array.from({ length: 24 }).map((_, hour) => (
              <div key={hour} className="contents">
                <div className="sticky left-0 z-10 border-t border-slate-100 bg-white p-3 text-center text-sm font-medium text-slate-600">
                  {String(hour).padStart(2, '0')}:00
                </div>

                {dates.map((date) => {
                  const active = schedule[date]?.[hour] ?? false

                  return (
                    <div
                      key={`${date}-${hour}`}
                      onMouseDown={() => handleCellStart(date, hour)}
                      onMouseEnter={() => handleCellEnter(date, hour)}
                      className={[
                        'h-10 cursor-crosshair border-t border-l border-slate-100 transition',
                        active ? 'bg-sky-500/90' : 'bg-white hover:bg-sky-50',
                      ].join(' ')}
                      title={`${date} ${String(hour).padStart(2, '0')}:00`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            onClick={() => router.back()}
            className="rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700"
          >
            이전으로
          </button>
          <button
            onClick={handleComplete}
            className="rounded-2xl bg-sky-600 px-5 py-3 font-semibold text-white hover:bg-sky-700"
          >
            일정 저장하고 시작하기
          </button>
        </div>
      </div>
    </main>
  )
}