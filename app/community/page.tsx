'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

const CATEGORIES = ['전체', '🌙 나이트 꿀팁', '☕️ 데이 생존기', '🥲 고민상담']

const MOCK_POSTS = [
  {
    id: 1,
    author: '3년차 널스',
    category: '🌙 나이트 꿀팁',
    timeAgo: '10분 전',
    title: '나이트 오프때 다들 어떻게 주무시나요?',
    content: '나이트 끝나고 아침 9시쯤 자면 꼭 오후 1시에 눈이 떠져요. 암막 커튼 치고 수면 안대도 하는데 다시 잠들기가 너무 힘드네요. 저녁에 일찍 자려고 노력은 하는데 좋은 방법 있을까요?',
    likes: 12,
    comments: 5
  },
  {
    id: 2,
    author: 'ICU 병아리',
    category: '🥲 고민상담',
    timeAgo: '1시간 전',
    title: '연속 쓰이나이트 너무 힘드네요',
    content: '오늘이 마지막 쓰이나이트인데 진짜 출근하기 전부터 멘탈이 바사삭... 커피를 몇 잔을 마셔야 버틸 수 있을까요 다들 화이팅입니다 ㅠㅠ',
    likes: 45,
    comments: 18
  },
  {
    id: 3,
    author: '건강최고',
    category: '☕️ 데이 생존기',
    timeAgo: '3시간 전',
    title: '데이 출근 전 수면유도제 드시는 분?',
    content: '이브-데이 스케줄일 때 잠이 너무 안 와서 가끔 약국에서 수면유도제 사먹는데, 다음날 좀 몽롱하더라고요. 부작용 덜한 영양제나 루틴 추천 부탁드려요!',
    likes: 8,
    comments: 11
  }
]

export default function CommunityPage() {
  const router = useRouter()
  const pathname = usePathname()
  const [activeCategory, setActiveCategory] = useState('전체')

  return (
    <main className="min-h-screen bg-slate-50 px-4 pt-8 pb-24 relative">
      <div className="mx-auto max-w-lg space-y-6">
        
        {/* 헤더 */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">간호사 라운지</h1>
            <p className="mt-1 text-slate-600">동료들과 고민을 나누고 꿀팁을 공유해요.</p>
          </div>
          {/* 글쓰기 버튼 (플로팅 대신 상단 배치) */}
          <button className="bg-sky-600 hover:bg-sky-700 text-white p-3 rounded-full shadow-md transition">
            ✍️
          </button>
        </div>

        {/* 카테고리 필터 */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                activeCategory === cat 
                  ? 'bg-slate-800 text-white shadow-sm' 
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 피드 리스트 */}
        <section className="space-y-4">
          {MOCK_POSTS.filter(post => activeCategory === '전체' || post.category === activeCategory).map((post) => (
            <div key={post.id} className="bg-white rounded-3xl p-5 shadow-sm ring-1 ring-slate-100 cursor-pointer hover:shadow-md transition">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-bold text-xs">
                    {post.author.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{post.author}</p>
                    <p className="text-[10px] text-slate-400">{post.timeAgo} · {post.category}</p>
                  </div>
                </div>
              </div>
              
              <h3 className="font-bold text-slate-900 text-lg mb-2">{post.title}</h3>
              <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed mb-4">
                {post.content}
              </p>

              <div className="flex gap-4 border-t border-slate-50 pt-3">
                <button className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-rose-500 transition">
                  ❤️ <span>{post.likes}</span>
                </button>
                <button className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-sky-500 transition">
                  💬 <span>{post.comments}</span>
                </button>
              </div>
            </div>
          ))}
        </section>

      </div>

      {/* 📱 하단 네비게이션 바 */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe">
        <div className="mx-auto max-w-lg flex justify-around items-center h-16 px-4">
          <button onClick={() => router.push('/sleep-plan')} className={`flex flex-col items-center gap-1 w-16 transition-colors ${pathname === '/sleep-plan' ? 'text-sky-600' : 'text-slate-400 hover:text-slate-600'}`}>
            <span className="text-xl leading-none">🏠</span>
            <span className="text-[10px] font-medium">홈</span>
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