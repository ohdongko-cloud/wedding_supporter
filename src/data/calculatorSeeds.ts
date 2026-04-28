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

// [id, name, defaultAmount in won]
export const CALC_SEEDS: Record<string, Record<string, [string, string, number][]>> = {
  wedding: {
    wedding: [
      ['w_food', '식대 (100명 기준)', 9900000],
      ['w_venue', '대관료', 1000000],
    ],
    studio: [
      ['w_studio', '스튜디오 촬영', 2000000],
    ],
    dress: [
      ['w_dress_b', '신부 드레스', 2000000],
      ['w_dress_g', '신랑 예복', 1000000],
    ],
    makeup: [
      ['w_makeup', '헤어&메이크업', 1000000],
    ],
    etc: [
      ['w_snap', '본식 스냅/영상', 1500000],
      ['w_flower', '부케/꽃 장식', 500000],
      ['w_invitation', '청첩장', 300000],
      ['w_mc', '사회자/주례', 300000],
    ],
  },
  honeymoon: {
    flight: [['h_flight', '항공권 (2인)', 2000000]],
    accommodation: [['h_hotel', '숙소', 2000000]],
    food: [['h_food', '식비', 500000]],
    transport: [['h_trans', '현지 교통', 300000]],
    activity: [['h_act', '액티비티', 500000]],
    shopping: [['h_shop', '쇼핑', 500000]],
    insurance: [['h_ins', '여행자보험', 150000]],
    etc: [['h_etc', '기타 비용', 300000]],
  },
  house: {
    deposit: [['ho_dep', '보증금/매매자금', 200000000]],
    loan: [['ho_loan', '대출 관련 비용', 500000]],
    agent: [['ho_agent', '중개수수료', 1000000]],
    moving: [['ho_move', '이사비', 1000000]],
    appliance: [
      ['ho_fridge', '냉장고', 1500000],
      ['ho_washer', '세탁기', 1000000],
      ['ho_tv', 'TV', 1000000],
      ['ho_ac', '에어컨', 1000000],
    ],
    furniture: [
      ['ho_bed', '침대', 1500000],
      ['ho_sofa', '소파', 1000000],
      ['ho_table', '식탁', 500000],
      ['ho_desk', '책상/서랍', 500000],
    ],
    interior: [['ho_int', '인테리어 공사', 5000000]],
    supplies: [['ho_sup', '생활용품', 500000]],
    etc: [['ho_etc', '기타', 300000]],
  },
}
