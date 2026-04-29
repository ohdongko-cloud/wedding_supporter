export const CALC_TITLES: Record<string, string> = {
  wedding: '결혼식 비용 계산기',
  honeymoon: '신혼여행 비용 계산기',
  house: '신혼집 비용 계산기',
}

export const CALC_CAT_LABELS: Record<string, Record<string, string>> = {
  wedding: {
    wedding: '결혼식장 비용',
    studio: '스튜디오',
    dress: '드레스',
    makeup: '메이크업',
    etc: '기타',
  },
  honeymoon: {
    flight: '항공권',
    accommodation: '숙소',
    food: '식비',
    transport: '교통',
    activity: '액티비티',
    shopping: '쇼핑',
    insurance: '여행자보험',
    etc: '기타',
  },
  house: {
    deposit: '보증금/매매자금',
    loan: '대출 관련 비용',
    agent: '중개수수료',
    moving: '이사비',
    appliance: '가전',
    furniture: '가구',
    interior: '인테리어',
    supplies: '생활용품',
    etc: '기타',
  },
}

// [id, name, avgPrice(만원), defaultChecked?]
// defaultChecked: true(기본 체크) | false(기본 미체크) | undefined → true
export const CALC_SEEDS: Record<string, Record<string, [string, string, number, boolean?][]>> = {
  wedding: {
    wedding: [
      ['vi1',  '본식 촬영',        77,  true],   // 필수
      ['vi2',  '혼주 헤어/메이크업', 15, true],   // 필수
      ['vi3',  '사회자',           30,  true],   // 필수
      ['vi4',  '축가',             25,  false],  // 선택
      ['vi5',  '부케',             25,  true],   // 필수
      ['vi6',  '폐백 음식',        30,  false],  // 선택
      ['vi7',  '폐백 수모비',      11,  false],  // 선택
      ['vi8',  '주례비',           16,  false],  // 선택
      ['vi9',  '생화 장식',       280,  false],  // 선택 (고가)
      ['vi10', '본식 도우미',      30,  false],  // 선택
      ['vi11', '본식 원판 구매',   50,  false],  // 선택
      ['vi12', '플라워 샤워',      14,  false],  // 선택
      ['vi13', '축주비',           40,  false],  // 선택
      ['vi14', '드레스 도우미',    15,  false],  // 선택
      ['vi15', '한복 대여',        27,  false],  // 선택
      ['vi16', '포토 테이블',      37,  false],  // 선택
      ['vi17', '웨딩 케이크',      38,  false],  // 선택
    ],
    studio: [
      ['st1',  '웨딩촬영',        3,   true],   // 필수 (기본)
      ['st2',  '야간촬영',        11,  false],
      ['st3',  '드레스 추가',     11,  false],
      ['st4',  '클러리 촬영',      7,  false],
      ['st5',  '야외촬영',        15,  false],
      ['st6',  '담당자 지정',     20,  false],
      ['st7',  '액자 변경',       25,  false],
      ['st8',  '원본 구매',       30,  false],
      ['st9',  '수정본 구매',     17,  false],
      ['st10', '촬영시간 추가',   11,  false],
      ['st11', '출장비용',        20,  false],
      ['st12', '헬퍼비',           8,  false],
      ['st13', '수정비',           5,  false],
      ['st14', '스냅촬영',        26,  true],   // 필수
      ['st15', '스타일링비',       5,  false],
    ],
    dress: [
      ['dr1',  '촬영 헬퍼',       25,  false],
      ['dr2',  '본식 헬퍼',       25,  true],   // 필수
      ['dr3',  '추가 피팅비',      6,  false],
      ['dr4',  '기본 피팅비',      6,  false],
      ['dr5',  '디자인 추가',    115,  false],
      ['dr6',  '2부 드레스',      44,  false],
      ['dr7',  '베스트 웨딩',    110,  false],
      ['dr8',  '재가봉비',        10,  false],
      ['dr9',  '드레스 지정',     97,  true],   // 필수
      ['dr10', '야외 예식',       15,  false],
      ['dr11', '가봉 스냅',       75,  false],
      ['dr12', '웨딩슈즈 대여',    0,  false],
      ['dr13', '턱시도 대여',     20,  true],   // 필수
      ['dr14', '액세서리 대여',    0,  false],
    ],
    makeup: [
      ['mk1',  '여성 혼주 메이크업', 26, true],  // 필수
      ['mk2',  '남성 혼주 메이크업',  9, true],  // 필수
      ['mk3',  '헤어피스 구매',    16,  false],
      ['mk4',  '얼리스타트비',     11,  false],
      ['mk5',  '담당자 지정',       6,  false],
      ['mk6',  '헤어피스 변경',    10,  false],
      ['mk7',  '헤어 변경',        35,  false],
      ['mk8',  '가발비',           10,  false],
      ['mk9',  '헤어피스 시술',    11,  false],
      ['mk10', '커트',              7,  false],
      ['mk11', '출장비',           20,  false],
      ['mk12', '신랑 헤어',         5,  false],
      ['mk13', '신랑 메이크업',     5,  false],
      ['mk14', '레이트 스타트비',   8,  false],
      ['mk15', '혼복비',            3,  false],
      ['mk16', '휴무일 진행비',    17,  false],
    ],
    etc: [
      ['et1',  '청첩장',           10, true],   // 필수
      ['et2',  '결혼반지',          0, true],   // 필수 (직접 입력)
      ['et3',  '예물',              0, false],  // 선택
      ['et5',  '청첩장모임',      200, false],  // 선택 (고가)
      ['et6',  '답례품',           50, true],   // 필수
      ['et7',  '관리 (네일/마사지 등)', 0, false],
    ],
  },
  honeymoon: {
    flight:        [['h_flight', '항공권 (2인)', 200]],
    accommodation: [['h_hotel',  '숙소',         200]],
    food:          [['h_food',   '식비',           50]],
    transport:     [['h_trans',  '현지 교통',      30]],
    activity:      [['h_act',    '액티비티',       50]],
    shopping:      [['h_shop',   '쇼핑',           50]],
    insurance:     [['h_ins',    '여행자보험',      15]],
    etc:           [['h_etc',    '기타 비용',       30]],
  },
  house: {
    deposit:  [['ho_dep',    '보증금/매매자금',  20000]],
    loan:     [['ho_loan',   '대출 관련 비용',      50]],
    agent:    [['ho_agent',  '중개수수료',           100]],
    moving:   [['ho_move',   '이사비',             100]],
    appliance: [
      ['ho_fridge', '냉장고',  150],
      ['ho_washer', '세탁기',  100],
      ['ho_tv',     'TV',      100],
      ['ho_ac',     '에어컨',  100],
    ],
    furniture: [
      ['ho_bed',   '침대',      150],
      ['ho_sofa',  '소파',      100],
      ['ho_table', '식탁',       50],
      ['ho_desk',  '책상/서랍',  50],
    ],
    interior: [['ho_int', '인테리어 공사', 500]],
    supplies: [['ho_sup', '생활용품',       50]],
    etc:      [['ho_etc', '기타',           30]],
  },
}

export const MEAL_PRICE_OPTIONS = [
  { label: '7.7만원/인', value: 77000 },
  { label: '8.8만원/인', value: 88000 },
  { label: '9.9만원/인', value: 99000 },
  { label: '11만원/인',  value: 110000 },
]
