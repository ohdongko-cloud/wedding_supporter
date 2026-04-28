import type { ChecklistSeedStage } from '../types'

export const CHECKLIST_STAGES: ChecklistSeedStage[] = [
  {
    id: 's1', name: '결혼 의사 확인', icon: '',
    items: [
      { id: 'i1',  title: '프로포즈',              req: '선택', pri: '중',  cost: '30~200만',    time: 'D-300',  note: '방식/장소/예산 결정' },
      { id: 'i2',  title: '양가 부모님께 결혼 의사 공유', req: '필수', pri: '상',  cost: '0',           time: 'D-300',  note: '어느 쪽에 먼저 말씀드릴지' },
      { id: 'i3',  title: '결혼 시기 대략 설정',   req: '필수', pri: '상',  cost: '0',           time: 'D-365',  note: '성수기/비수기, 토요일/일요일' },
      { id: 'i4',  title: '결혼식장 대략 알아보기', req: '필수', pri: '상',  cost: '0',           time: 'D-365',  note: '지역/하객 수(대략)/예산 기준' },
    ],
  },
  {
    id: 's2', name: '상견례 & 결혼 확정', icon: '',
    items: [
      { id: 'i5',  title: '상견례 일정 조율',      req: '필수', pri: '상',  cost: '0',           time: 'D-240',  note: '양가 일정 우선순위' },
      { id: 'i6',  title: '장소 예약',             req: '필수', pri: '상',  cost: '10~30만',     time: 'D-240',  note: '룸 여부, 주차, 음식 취향' },
      { id: 'i7',  title: '예단/예물 방향 협의',   req: '선택', pri: '중',  cost: '0~2,000만+',  time: 'D-220',  note: '생략/간소화/진행 여부' },
      { id: 'i8',  title: '상견례 진행',           req: '필수', pri: '최상', cost: '10~50만',     time: 'D-240',  note: '복장, 대화주제 준비' },
      { id: 'i9',  title: '결혼 날짜 확정',        req: '필수', pri: '최상', cost: '0',           time: 'D-230',  note: '양가 가능일, 식장 가능일' },
    ],
  },
  {
    id: 's3', name: '예산 & 계획', icon: '',
    items: [
      { id: 'i10', title: '전체 예산 설정',        req: '필수', pri: '최상', cost: '0',           time: 'D-230',  note: '총액 상한선 결정' },
      { id: 'i11', title: '항목별 예산 배분',      req: '필수', pri: '상',  cost: '0',           time: 'D-220',  note: '식장/신혼집/여행 비중' },
      { id: 'i12', title: '결혼 준비 일정표 작성', req: '필수', pri: '상',  cost: '0',           time: 'D-220',  note: '준비 기간 기준' },
      { id: 'i55', title: '역할 분담',             req: '필수', pri: '상',  cost: '0',           time: 'D-220',  note: '신랑/신부/부모님 담당' },
    ],
  },
  {
    id: 's4', name: '결혼식 준비', icon: '',
    items: [
      { id: 'i56', title: '웨딩플래너 선택',       req: '선택', pri: '중',  cost: '0~300만',     time: 'D-210',  note: '동행/비동행/위킹' },
      { id: 'i40', title: '웨딩박람회 방문',       req: '선택', pri: '하',  cost: '0',           time: 'D-210',  note: '계약 압박 주의' },
      { id: 'i15', title: '결혼식장 투어',         req: '필수', pri: '최상', cost: '0',           time: 'D-200',  note: '위치, 주차, 식사, 홀 분위기' },
      { id: 'i16', title: '식장 예약',             req: '필수', pri: '최상', cost: '500~3,000만+', time: 'D-200', note: '보증인원, 식대, 대관료' },
      { id: 'i41', title: '스튜디오 선택',         req: '선택', pri: '중',  cost: '100~300만',   time: 'D-150',  note: '촬영 스타일, 셀프촬영' },
      { id: 'i42', title: '드레스샵 투어',         req: '필수', pri: '상',  cost: '100~300만',   time: 'D-150',  note: '추가금 구조 확인' },
      { id: 'i43', title: '메이크업샵 선택',       req: '필수', pri: '상',  cost: '50~150만',    time: 'D-150',  note: '원장/실장 지정 여부' },
      { id: 'i17', title: '스드메 계약',           req: '필수', pri: '최상', cost: '200~500만',   time: 'D-150',  note: '패키지 vs 개별 계약' },
      { id: 'i18', title: '본식 스냅/영상 계약',   req: '필수', pri: '상',  cost: '100~300만',   time: 'D-120',  note: '1인/2인 촬영, 원본 제공' },
      { id: 'i57', title: '웨딩링 준비',           req: '필수', pri: '상',  cost: '10~500만',    time: 'D-120',  note: '브랜드/예산/착용감' },
      { id: 'i58', title: '예물/예단 준비',        req: '선택', pri: '중',  cost: '100~2,000만+', time: 'D-120', note: '양가 합의 수준' },
      { id: 'i59', title: '한복/예복 준비',        req: '선택', pri: '중',  cost: '50~300만',    time: 'D-90',   note: '대여/맞춤/구매' },
      { id: 'i19', title: '사회자/주례/축가 섭외', req: '선택', pri: '중',  cost: '0~100만',     time: 'D-60',   note: '지인/전문가 여부, 사례금' },
      { id: 'i60', title: '부케 받을 친구 섭외',  req: '선택', pri: '하',  cost: '0',           time: 'D-60',   note: '부담 없는 사람, 결혼 앞두고 있는 친구' },
      { id: 'i61', title: '스냅촬영 예약',         req: '선택', pri: '중',  cost: '50~200만',    time: 'D-90',   note: '데이트스냅/야외촬영 여부' },
    ],
  },
  {
    id: 's5', name: '신혼집 준비', icon: '',
    items: [
      { id: 'i20', title: '지역 선정',             req: '필수', pri: '최상', cost: '0',            time: 'D-210', note: '출퇴근, 양가 거리' },
      { id: 'i21', title: '임장',                  req: '필수', pri: '상',  cost: '0',            time: 'D-200', note: '교통, 소음, 채광, 관리비' },
      { id: 'i22', title: '매매/전세/월세 결정',   req: '필수', pri: '최상', cost: '수천만~수억',  time: 'D-180', note: '자금계획, 대출, 안정성' },
      { id: 'i23', title: '계약 진행',             req: '필수', pri: '최상', cost: '보증금/매매가', time: 'D-180', note: '등기/권리관계 확인' },
      { id: 'i44', title: '대출 상담',             req: '선택', pri: '상',  cost: '이자비용',     time: 'D-170', note: '한도, 금리, 상환방식' },
      { id: 'i45', title: '인테리어 계획',         req: '선택', pri: '중',  cost: '100~2,000만',  time: 'D-90',  note: '부분/전체 공사' },
      { id: 'i24', title: '가전/가구 구매',        req: '필수', pri: '상',  cost: '300~1,500만',  time: 'D-60',  note: '필수 구매 vs 단계적 구매' },
    ],
  },
  {
    id: 's6', name: '신혼여행 준비', icon: '',
    items: [
      { id: 'i25', title: '여행지 선정',           req: '필수', pri: '상',  cost: '0',           time: 'D-150', note: '휴양/관광/복합' },
      { id: 'i46', title: '일정 확정',             req: '필수', pri: '상',  cost: '0',           time: 'D-120', note: '결혼식 직후 출발 여부' },
      { id: 'i26', title: '항공권 예약',           req: '필수', pri: '최상', cost: '100~400만',   time: 'D-120', note: '직항/경유, 수하물' },
      { id: 'i27', title: '숙소 예약',             req: '필수', pri: '최상', cost: '100~500만',   time: 'D-120', note: '위치, 조식, 취소 가능' },
      { id: 'i47', title: '여행 일정 계획',        req: '선택', pri: '중',  cost: '0',           time: 'D-90',  note: '빡빡한 일정 vs 여유' },
      { id: 'i62', title: '국제 운전면허 신청',    req: '선택', pri: '중',  cost: '1만 내외',    time: 'D-30',  note: '렌터카 이용 시' },
      { id: 'i28', title: '환전/보험 준비',        req: '필수', pri: '중',  cost: '10~50만',     time: 'D-30',  note: '여행자보험 필수 여부' },
      { id: 'i48', title: '차량대여',              req: '선택', pri: '중',  cost: '20~150만',    time: 'D-30',  note: '국제운전면허/보험' },
      { id: 'i63', title: '여행지 스냅촬영 예약',  req: '선택', pri: '하',  cost: '20~100만',    time: 'D-60',  note: '여행지 스냅 여부' },
    ],
  },
  {
    id: 's7', name: '결혼 전 이벤트', icon: '',
    items: [
      { id: 'i31', title: '웨딩촬영',              req: '선택', pri: '중',  cost: '스드메 포함/별도', time: 'D-120', note: '촬영 콘셉트 결정' },
      { id: 'i29', title: '청첩장 제작',           req: '필수', pri: '상',  cost: '10~50만',     time: 'D-90',  note: '종이/모바일 병행' },
      { id: 'i30', title: '청첩장 모임',           req: '선택', pri: '중',  cost: '50~300만',    time: 'D-60',  note: '어디까지 만날지' },
      { id: 'i49', title: '브라이덜샤워',          req: '선택', pri: '하',  cost: '10~100만',    time: 'D-60',  note: '진행 여부' },
      { id: 'i50', title: '식전 영상 제작',        req: '선택', pri: '중',  cost: '0~50만',      time: 'D-30',  note: '직접 제작/외주' },
    ],
  },
  {
    id: 's8', name: '결혼식 실행', icon: '',
    items: [
      { id: 'i32', title: '최종 인원 확정',        req: '필수', pri: '최상', cost: '0',           time: 'D-30',  note: '보증인원 조정' },
      { id: 'i51', title: '식순 구성',             req: '필수', pri: '상',  cost: '0',           time: 'D-14',  note: '주례/혼인서약/축가 순서' },
      { id: 'i33', title: '좌석 배치',             req: '필수', pri: '상',  cost: '0',           time: 'D-10',  note: '가족/직장/친구 동선' },
      { id: 'i34', title: '리허설 진행',           req: '필수', pri: '상',  cost: '0',           time: 'D-3',   note: '입장/퇴장/동선' },
      { id: 'i35', title: '예식 진행',             req: '필수', pri: '최상', cost: '식장 비용 포함', time: 'D-day', note: '현장 담당자 확인' },
    ],
  },
  {
    id: 's9', name: '사후 정리', icon: '',
    items: [
      { id: 'i52', title: '신혼여행 출발',         req: '필수', pri: '상',  cost: '여행비 포함',  time: 'D+1',   note: '짐/여권/항공권 시간 확인' },
      { id: 'i64', title: '여행 진행',             req: '필수', pri: '상',  cost: '여행비 포함',  time: 'D+1',   note: '무리한 일정 조정' },
      { id: 'i36', title: '축의금 정리',           req: '필수', pri: '상',  cost: '0',           time: 'D+3',   note: '엑셀 정리, 부모님 공유' },
      { id: 'i38', title: '답례품 전달',           req: '선택', pri: '중',  cost: '50~200만',    time: 'D+7',   note: '회사/친척/도움 준 사람' },
      { id: 'i37', title: '감사 인사 연락',        req: '필수', pri: '상',  cost: '0',           time: 'D+7',   note: '문자/전화/방문 구분' },
      { id: 'i54', title: '부모님 및 친척 인사',  req: '필수', pri: '상',  cost: '0~50만',      time: 'D+14',  note: '방문 순서 결정' },
      { id: 'i39', title: '집들이',                req: '선택', pri: '중',  cost: '10~100만',    time: 'D+30',  note: '가족/친구/직장 구분' },
    ],
  },
]
