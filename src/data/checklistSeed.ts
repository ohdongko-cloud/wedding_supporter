import type { ChecklistSeedStage } from '../types'

export const CHECKLIST_STAGES: ChecklistSeedStage[] = [
  {
    id: "s1",
    name: "결혼 의사 확인",
    icon: "💑",
    items: [
      {
        id: "i1",
        title: "프로포즈",
        req: '선택' as const,
        pri: '중' as const,
        cost: "30~200만",
        time: "D-300~240일",
        note: "장소/예산/선물 방식 결정"
      },
      {
        id: "i2",
        title: "양가 부모님께 결혼 의사 공유",
        req: '필수' as const,
        pri: '상' as const,
        cost: "0",
        time: "D-300~240일",
        note: "어느 쪽에 먼저 말할지 결정"
      },
      {
        id: "i3",
        title: "결혼 시기 대략 설정",
        req: '필수' as const,
        pri: '상' as const,
        cost: "0",
        time: "D-365일",
        note: "성수기/비수기, 요일 결정"
      }
    ]
  },
  {
    id: "s2",
    name: "상견례 & 결혼 확정",
    icon: "🤝",
    items: [
      {
        id: "i4",
        title: "결혼식장 대략 알아보기",
        req: '필수' as const,
        pri: '상' as const,
        cost: "0",
        time: "D-365일",
        note: "지역/예산 기준 확인"
      },
      {
        id: "i5",
        title: "상견례 일정 조율",
        req: '필수' as const,
        pri: '상' as const,
        cost: "0",
        time: "D-240일",
        note: "양가 일정 우선순위 확인"
      },
      {
        id: "i6",
        title: "장소 예약",
        req: '필수' as const,
        pri: '상' as const,
        cost: "10~30만",
        time: "D-240일",
        note: "룸 여부, 주차, 음식 취향 확인"
      },
      {
        id: "i7",
        title: "예단/예물 방향 협의",
        req: '선택' as const,
        pri: '중' as const,
        cost: "0~2,000만+",
        time: "D-220일",
        note: "생략/간소화/진행 여부 결정"
      }
    ]
  },
  {
    id: "s3",
    name: "예산 & 계획",
    icon: "📊",
    items: [
      {
        id: "i8",
        title: "상견례 진행",
        req: '필수' as const,
        pri: '최상' as const,
        cost: "10~50만",
        time: "D-240일",
        note: "복장, 대화 주제 준비"
      },
      {
        id: "i9",
        title: "결혼 날짜 확정",
        req: '필수' as const,
        pri: '최상' as const,
        cost: "0",
        time: "D-230일",
        note: "가능한 날짜 후보 확정"
      },
      {
        id: "i10",
        title: "전체 예산 설정",
        req: '필수' as const,
        pri: '최상' as const,
        cost: "0",
        time: "D-230일",
        note: "상한선 결정"
      },
      {
        id: "i11",
        title: "항목별 예산 배분",
        req: '필수' as const,
        pri: '상' as const,
        cost: "0",
        time: "D-220일",
        note: "식장/혼수/여행 비중 결정"
      },
      {
        id: "i12",
        title: "결혼 준비 일정표 작성",
        req: '필수' as const,
        pri: '상' as const,
        cost: "0",
        time: "D-220일",
        note: "준비 기간 기준"
      }
    ]
  },
  {
    id: "s4",
    name: "결혼식 준비",
    icon: "💒",
    items: [
      {
        id: "i13",
        title: "웨딩홀 탐색",
        req: '필수' as const,
        pri: '상' as const,
        cost: "0",
        time: "D-220일",
        note: "식사/교통/수용 인원 기준"
      },
      {
        id: "i14",
        title: "웨딩홀 예약",
        req: '필수' as const,
        pri: '최상' as const,
        cost: "0~300만",
        time: "D-210일",
        note: "보증 인원, 날짜, 시간 확인"
      },
      {
        id: "i15",
        title: "결혼식장 투어",
        req: '필수' as const,
        pri: '최상' as const,
        cost: "0",
        time: "D-200일",
        note: "주차, 식사, 홀 분위기 확인"
      },
      {
        id: "i16",
        title: "식장 예약",
        req: '필수' as const,
        pri: '최상' as const,
        cost: "500~3,000만+",
        time: "D-200일",
        note: "보증 인원, 식대, 대관료 확인"
      },
      {
        id: "i17",
        title: "스드메 계약",
        req: '필수' as const,
        pri: '최상' as const,
        cost: "200~500만",
        time: "D-150일",
        note: "패키지 vs 개별 계약"
      },
      {
        id: "i18",
        title: "본식 스냅/영상 계약",
        req: '필수' as const,
        pri: '상' as const,
        cost: "100~300만",
        time: "D-120일",
        note: "2인 촬영, 원본 제공 여부"
      },
      {
        id: "i19",
        title: "사회자/주례/축가 섭외",
        req: '선택' as const,
        pri: '중' as const,
        cost: "0~100만",
        time: "D-60일",
        note: "친구/전문가 여부 결정"
      }
    ]
  },
  {
    id: "s5",
    name: "신혼집 준비",
    icon: "🏠",
    items: [
      {
        id: "i20",
        title: "지역 선정",
        req: '필수' as const,
        pri: '최상' as const,
        cost: "0",
        time: "D-210일",
        note: "출퇴근/양가 거리"
      },
      {
        id: "i21",
        title: "임장",
        req: '필수' as const,
        pri: '상' as const,
        cost: "0",
        time: "D-200일",
        note: "교통, 소음, 채광, 관리비 확인"
      },
      {
        id: "i22",
        title: "매매/전세/월세 결정",
        req: '필수' as const,
        pri: '최상' as const,
        cost: "수천만~수억",
        time: "D-180일",
        note: "자금계획, 대출 가능성 확인"
      },
      {
        id: "i23",
        title: "계약 진행",
        req: '필수' as const,
        pri: '최상' as const,
        cost: "보증금/매매가",
        time: "D-180일",
        note: "등기/권리관계 확인"
      },
      {
        id: "i24",
        title: "가전/가구 구매",
        req: '필수' as const,
        pri: '상' as const,
        cost: "300~1,500만",
        time: "D-60일",
        note: "필수 품목부터 단계 구매"
      }
    ]
  },
  {
    id: "s6",
    name: "신혼여행 준비",
    icon: "✈️",
    items: [
      {
        id: "i25",
        title: "여행지 선정",
        req: '필수' as const,
        pri: '상' as const,
        cost: "0",
        time: "D-150일",
        note: "휴양/관광/혼합 선택"
      },
      {
        id: "i26",
        title: "항공권 예약",
        req: '필수' as const,
        pri: '최상' as const,
        cost: "100~400만",
        time: "D-120일",
        note: "직항/경유/수하물 확인"
      },
      {
        id: "i27",
        title: "숙소 예약",
        req: '필수' as const,
        pri: '최상' as const,
        cost: "100~500만",
        time: "D-120일",
        note: "조식, 위치, 취소 가능 여부"
      },
      {
        id: "i28",
        title: "환전/보험 준비",
        req: '필수' as const,
        pri: '중' as const,
        cost: "10~50만",
        time: "D-30일",
        note: "여행자보험 필수 여부 확인"
      }
    ]
  },
  {
    id: "s7",
    name: "결혼 전 이벤트",
    icon: "🎉",
    items: [
      {
        id: "i29",
        title: "청첩장 제작",
        req: '필수' as const,
        pri: '상' as const,
        cost: "10~50만",
        time: "D-90일",
        note: "모바일/종이 병행 여부"
      },
      {
        id: "i30",
        title: "청첩장 모임",
        req: '선택' as const,
        pri: '중' as const,
        cost: "50~300만",
        time: "D-60일",
        note: "식사/카페/시간대 결정"
      },
      {
        id: "i31",
        title: "웨딩촬영",
        req: '선택' as const,
        pri: '중' as const,
        cost: "스드메 포함/별도",
        time: "D-120일",
        note: "촬영 콘셉트 결정"
      }
    ]
  },
  {
    id: "s8",
    name: "결혼식 실행",
    icon: "🎊",
    items: [
      {
        id: "i32",
        title: "최종 인원 확정",
        req: '필수' as const,
        pri: '최상' as const,
        cost: "0",
        time: "D-30일",
        note: "보증 인원 조정"
      },
      {
        id: "i33",
        title: "좌석 배치",
        req: '필수' as const,
        pri: '상' as const,
        cost: "0",
        time: "D-10일",
        note: "가족/직장/친구 동선 고려"
      },
      {
        id: "i34",
        title: "리허설 진행",
        req: '필수' as const,
        pri: '상' as const,
        cost: "0",
        time: "D-3일",
        note: "동선 최종 확인"
      },
      {
        id: "i35",
        title: "예식 진행",
        req: '필수' as const,
        pri: '최상' as const,
        cost: "식장 비용 포함",
        time: "D-day",
        note: "현장 담당자 확인"
      }
    ]
  },
  {
    id: "s9",
    name: "사후 정리",
    icon: "🌸",
    items: [
      {
        id: "i36",
        title: "축의금 정리",
        req: '필수' as const,
        pri: '상' as const,
        cost: "0",
        time: "D+3",
        note: "엑셀 정리, 부모님 공유"
      },
      {
        id: "i37",
        title: "감사 인사 연락",
        req: '필수' as const,
        pri: '상' as const,
        cost: "0",
        time: "D+7",
        note: "문자/전화 구분"
      },
      {
        id: "i38",
        title: "답례품 전달",
        req: '선택' as const,
        pri: '중' as const,
        cost: "50~200만",
        time: "D+7",
        note: "회사/친척/도움 준 사람 구분"
      },
      {
        id: "i39",
        title: "집들이",
        req: '선택' as const,
        pri: '중' as const,
        cost: "10~100만",
        time: "D+30",
        note: "가족/친구/직장 구분"
      }
    ]
  }
]