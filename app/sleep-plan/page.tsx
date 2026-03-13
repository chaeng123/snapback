'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

type SavedPayload = {
  hospital: string
  department: string
  shiftType: string
  startDate: string
  endDate: string
  schedule: Record<string, boolean[]>
}

type SleepRecommendation = {
  date: string
  workLabel: string
  sleepStart: string
  sleepEnd: string
  reason: string
}

type ConditionLevel = 1 | 2 | 3 | 4 | 5

type ConditionRecord = {
  score: ConditionLevel
  note: string
}

type ConditionMap = Record<string, ConditionRecord>

function parseLocalDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatDisplayDate(dateString: string) {
  const date = parseLocalDate(dateString)
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  return `${date.getMonth() + 1}/${date.getDate()} (${weekdays[date.getDay()]})`
}

function getActiveHours(hours: boolean[]) {
  return hours
    .map((v, i) => (v ? i : -1))
    .filter((v) => v !== -1)
}

function detectShift(hours: boolean[]) {
  const active = getActiveHours(hours)

  if (active.length === 0) {
    return {
      type: 'OFF',
      startHour: null,
      endHour: null,
      label: '휴무',
    }
  }

  const first = active[0]
  const hasMidnight = hours[23] && hours[0]

  if (hasMidnight) {
    let end = 0
    while (end < 24 && hours[end]) end++

    let start = 23
    while (start >= 0 && hours[start]) start--
    start += 1

    return {
      type: 'NIGHT',
      startHour: start,
      endHour: end,
      label: `${String(start).padStart(2, '0')}:00 - ${String(end).padStart(2, '0')}:00`,
    }
  }

  const last = active[active.length - 1] + 1

  if (first <= 8 && last <= 18) {
    return {
      type: 'DAY',
      startHour: first,
      endHour: last,
      label: `${String(first).padStart(2, '0')}:00 - ${String(last).padStart(2, '0')}:00`,
    }
  }

  if (first >= 12 && last <= 24) {
    return {
      type: 'EVENING',
      startHour: first,
      endHour: last,
      label: `${String(first).padStart(2, '0')}:00 - ${String(last % 24).padStart(2, '0')}:00`,
    }
  }

  return {
    type: 'CUSTOM',
    startHour: first,
    endHour: last % 24,
    label: `${String(first).padStart(2, '0')}:00 - ${String(last % 24).padStart(2, '0')}:00`,
  }
}

function recommendSleep(hours: boolean[]): Omit<SleepRecommendation, 'date'> {
  const shift = detectShift(hours)

  if (shift.type === 'OFF') {
    return {
      workLabel: shift.label,
      sleepStart: '23:00',
      sleepEnd: '07:00',
      reason: '휴무일 기준으로 야간 중심 수면 8시간을 추천해요.',
    }
  }

  if (shift.type === 'DAY') {
    return {
      workLabel: shift.label,
      sleepStart: '22:30',
      sleepEnd: '06:00',
      reason: '이른 출근을 고려해 근무 전 충분한 야간 수면을 추천해요.',
    }
  }

  if (shift.type === 'EVENING') {
    return {
      workLabel: shift.label,
      sleepStart: '00:30',
      sleepEnd: '08:30',
      reason: '늦은 퇴근 후 회복과 오전 수면 확보를 고려한 시간이에요.',
    }
  }

  if (shift.type === 'NIGHT') {
    return {
      workLabel: shift.label,
      sleepStart: '08:30',
      sleepEnd: '16:00',
      reason: '야간근무 직후 낮 수면으로 회복할 수 있도록 추천해요.',
    }
  }

  return {
    workLabel: shift.label,
    sleepStart: '23:30',
    sleepEnd: '07:00',
    reason: '불규칙 근무로 판단되어 우선 기본 회복 수면 시간을 제안해요.',
  }
}

function getConditionLabel(score?: number) {
  switch (score) {
    case 1:
      return '매우 나쁨'
    case 2:
      return '나쁨'
    case 3:
      return '보통'
    case 4:
      return '좋음'
    case 5:
      return '매우 좋음'
    default:
      return '미입력'
  }
}

export default function SleepPlanPage() {
  const router = useRouter()
  const [data, setData] = useState<SavedPayload | null>(null)
  const [conditions, setConditions] = useState<ConditionMap>({})

  useEffect(() => {
    const raw = localStorage.getItem('sleep-onboarding-schedule')
    if (!raw) {
      router.push('/onboarding')
      return
    }

    try {
      const parsed = JSON.parse(raw) as SavedPayload
      setData(parsed)
    } catch {
      router.push('/onboarding')
    }
  }, [router])

  useEffect(() => {
    const rawConditions = localStorage.getItem('sleep-condition-records')
    if (!rawConditions) return

    try {
      const parsed = JSON.parse(rawConditions) as ConditionMap
      setConditions(parsed)
    } catch {
      setConditions({})
    }
  }, [])

  const recommendations = useMemo(() => {
    if (!data) return []

    return Object.entries(data.schedule).map(([date, hours]) => {
      const rec = recommendSleep(hours)
      return {
        date,
        ...rec,
      }
    })
  }, [data])

  const averageSleepHours = useMemo(() => {
    if (recommendations.length === 0) return '0.0'

    const total = recommendations.reduce((sum, item) => {
      const [sh, sm] = item.sleepStart.split(':').map(Number)
      const [eh, em] = item.sleepEnd.split(':').map(Number)

      const start = sh + sm / 60
      let end = eh + em / 60
      if (end <= start) end += 24

      return sum + (end - start)
    }, 0)

    return (total / recommendations.length).toFixed(1)
  }, [recommendations])

  const averageCondition = useMemo(() => {
    const values = Object.values(conditions)
      .map((item) => item.score)
      .filter(Boolean)

    if (values.length === 0) return null

    const avg = values.reduce((a, b) => a + b, 0) / values.length
    return avg.toFixed(1)
  }, [conditions])

  function updateConditionScore(date: string, score: ConditionLevel) {
    setConditions((prev) => {
      const next = {
        ...prev,
        [date]: {
          score,
          note: prev[date]?.note ?? '',
        },
      }

      localStorage.setItem('sleep-condition-records', JSON.stringify(next))
      return next
    })
  }

  function updateConditionNote(date: string, note: string) {
    setConditions((prev) => {
      const next = {
        ...prev,
        [date]: {
          score: prev[date]?.score ?? 3,
          note,
        },
      }

      localStorage.setItem('sleep-condition-records', JSON.stringify(next))
      return next
    })
  }

  if (!data) return null

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
          <p className="text-sm font-medium text-sky-600">추천 수면 시간</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            입력한 근무표를 바탕으로 수면 시간을 추천했어요
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {data.hospital || '기관 미입력'} · {data.department || '부서 미입력'} · {data.shiftType}
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">등록 기간</p>
              <p className="text-lg font-bold text-slate-900">
                {data.startDate} ~ {data.endDate}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">평균 추천 수면 시간</p>
              <p className="text-lg font-bold text-slate-900">
                {averageSleepHours}시간
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">평균 컨디션</p>
              <p className="text-lg font-bold text-slate-900">
                {averageCondition ? `${averageCondition} / 5` : '아직 없음'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {recommendations.map((item) => {
            const condition = conditions[item.date]

            return (
              <div
                key={item.date}
                className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-lg font-bold text-slate-900">
                      {formatDisplayDate(item.date)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      근무시간: {item.workLabel}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-sky-50 px-4 py-3">
                    <p className="text-xs text-sky-700">추천 수면 시간</p>
                    <p className="text-xl font-bold text-sky-900">
                      {item.sleepStart} ~ {item.sleepEnd}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-sm text-slate-600">{item.reason}</p>

                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        오늘의 근무 컨디션
                      </p>
                      <p className="text-xs text-slate-500">
                        근무 후 느낀 컨디션을 기록해 보세요.
                      </p>
                    </div>

                    <p className="text-sm font-medium text-slate-700">
                      현재 상태: {getConditionLabel(condition?.score)}
                    </p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5].map((score) => {
                      const selected = condition?.score === score

                      return (
                        <button
                          key={score}
                          type="button"
                          onClick={() => updateConditionScore(item.date, score as ConditionLevel)}
                          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                            selected
                              ? 'bg-slate-900 text-white'
                              : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {score}점
                        </button>
                      )
                    })}
                  </div>

                  <textarea
                    value={condition?.note ?? ''}
                    onChange={(e) => updateConditionNote(item.date, e.target.value)}
                    placeholder="예: 야간근무 후 피로감 심함 / 낮잠 자서 괜찮았음"
                    className="mt-4 min-h-[96px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-slate-400"
                  />
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => router.push('/schedule')}
            className="rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white"
          >
            일정 다시 수정하기
          </button>
        </div>
      </div>
    </main>
  )
}