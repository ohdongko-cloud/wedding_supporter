export interface TourStep {
  selector: string | null
  title: string
  desc: string
}

export const TOUR_STEPS: TourStep[] = [
  {
    selector: null,
    title: '딸깍, 결혼비용 계산기 💍',
    desc: '주요 기능 빠르게 안내 드릴게요.',
  },
  {
    selector: '[data-tour="wedding-date"]',
    title: '결혼 예정일',
    desc: '날짜를 입력하세요.\n이번주 할 일을 알려드려요.',
  },
  {
    selector: '[data-tour="progress"]',
    title: '결혼 준비 진척률',
    desc: '완료 항목과 진척률입니다.',
  },
  {
    selector: '[data-tour="budget"]',
    title: '예산 현황',
    desc: '총 예산과 예상 비용 현황입니다.',
  },
  {
    selector: '[data-tour="nav-checklist"]',
    title: '빠른 이동',
    desc: '예상 비용을 계산하고 일정을 관리하세요.',
  },
]
