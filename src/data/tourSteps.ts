export interface TourStep {
  selector: string | null
  title: string
  desc: string
}

export const TOUR_STEPS: TourStep[] = [
  {
    selector: null,
    title: '딸깍, 결혼비용 계산기에 오신 것을 환영해요! 💍',
    desc: '결혼 준비의 모든 것을 한 곳에서 관리하세요.\n예산 계산, 체크리스트, 신혼여행 계획까지!\n간단한 투어로 주요 기능을 알아볼게요.',
  },
  {
    selector: '[data-tour="wedding-date"]',
    title: '결혼 예정일 설정',
    desc: '결혼식 날짜를 입력하면 D-day 카운터와\n체크리스트 마감일이 자동으로 계산돼요.',
  },
  {
    selector: '[data-tour="progress"]',
    title: '결혼 준비 진척률',
    desc: '체크리스트 완료 현황을 한눈에 볼 수 있어요.\n타임라인으로 단계별 진행 상황도 확인하세요.',
  },
  {
    selector: '[data-tour="budget"]',
    title: '예산 현황',
    desc: '결혼식·신혼여행·신혼집 예산을 합산해\n총 예상 비용과 차액을 실시간으로 보여줘요.',
  },
  {
    selector: '[data-tour="nav-checklist"]',
    title: '빠른 이동',
    desc: '각 카드를 탭하면 해당 페이지로 바로 이동해요.\n체크리스트, 비용 계산기, 신혼여행 계획을 쉽게 오갈 수 있어요.',
  },
  {
    selector: '[data-tour="menu-button"]',
    title: '메뉴',
    desc: '왼쪽 상단 메뉴 버튼으로 모든 페이지에 접근하고\n개발 요청이나 로그아웃도 할 수 있어요.\n이제 본격적으로 결혼 준비를 시작해볼까요? 🎉',
  },
]
