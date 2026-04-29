export interface TourStep {
  selector: string | null
  title: string
  desc: string
}

export const TOUR_STEPS: TourStep[] = [
  {
    selector: null,
    title: '딸깍, 결혼비용 계산기 💍',
    desc: '결혼 준비를 한 곳에서!\n주요 기능을 빠르게 안내해 드릴게요.',
  },
  {
    selector: '[data-tour="wedding-date"]',
    title: '결혼 예정일',
    desc: '날짜를 입력하세요.\nD-day와 체크리스트 마감일이 자동 계산돼요.',
  },
  {
    selector: '[data-tour="progress"]',
    title: '결혼 준비 진척률',
    desc: '완료 항목과 진척률이 보입니다.\n월별 타임라인으로 단계도 확인하세요.',
  },
  {
    selector: '[data-tour="budget"]',
    title: '예산 현황',
    desc: '총 예산·예상 비용·차액 칸입니다.\n각 계산기에서 입력하면 여기에 합산돼요.',
  },
  {
    selector: '[data-tour="nav-checklist"]',
    title: '빠른 이동',
    desc: '카드를 탭해 각 페이지로 이동하세요.',
  },
  {
    selector: '[data-tour="menu-button"]',
    title: '전체 메뉴',
    desc: '모든 페이지는 여기서 접근할 수 있어요.',
  },
]
