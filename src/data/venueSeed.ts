export interface VenueHall {
  name: string
  type: string
  minSeat: number
  maxSeat: number
  price: number // 만원 단위, 0 = 미공개
}

export interface Venue {
  name: string
  halls: VenueHall[]
}

export const VENUE_LIST: Venue[] = [
  { name: "빌라드지디 청담", halls: [{ name: "앙피레홀", type: "하우스", minSeat: 198, maxSeat: 380, price: 0 }] },
  { name: "빌라드지디 서서", halls: [{ name: "르씨엘홀", type: "하우스/야외", minSeat: 300, maxSeat: 500, price: 880 }] },
  { name: "빌라드지디 논현", halls: [{ name: "가든홀", type: "하우스/야외", minSeat: 200, maxSeat: 350, price: 400 }] },
  { name: "라루체", halls: [
    { name: "루아르홀", type: "야외/하우스", minSeat: 200, maxSeat: 1500, price: 1500 },
    { name: "아이리스홀", type: "일반홀", minSeat: 180, maxSeat: 1500, price: 1500 },
    { name: "일반홀", type: "일반홀", minSeat: 250, maxSeat: 1500, price: 1500 },
  ]},
  { name: "보테가마지오", halls: [{ name: "로스타뇨홀", type: "일반홀/채플풍", minSeat: 300, maxSeat: 600, price: 0 }] },
  { name: "소노펠리체컨벤션", halls: [{ name: "다이아몬드홀", type: "컨벤션", minSeat: 350, maxSeat: 700, price: 800 }] },
  { name: "그랜드컨벤션센터", halls: [
    { name: "그랜드홀", type: "컨벤션", minSeat: 250, maxSeat: 1200, price: 700 },
    { name: "리젠시홀", type: "채플/컨벤션", minSeat: 250, maxSeat: 1200, price: 770 },
  ]},
  { name: "웨스턴베니비스 신도림", halls: [
    { name: "그레이스홀", type: "컨벤션", minSeat: 250, maxSeat: 700, price: 750 },
    { name: "아스타홀", type: "컨벤션", minSeat: 250, maxSeat: 700, price: 750 },
    { name: "유니버스티홀", type: "컨벤션", minSeat: 250, maxSeat: 700, price: 750 },
  ]},
  { name: "세인트메리앨", halls: [
    { name: "메리앨홀", type: "일반홀", minSeat: 250, maxSeat: 500, price: 980 },
    { name: "세인트홀", type: "일반홀", minSeat: 250, maxSeat: 500, price: 980 },
  ]},
  { name: "노블발렌티 삼성", halls: [{ name: "The Classic", type: "채플/하우스", minSeat: 300, maxSeat: 500, price: 1300 }] },
  { name: "노블발렌티 대치", halls: [{ name: "Chapel Hall", type: "채플", minSeat: 300, maxSeat: 600, price: 1300 }] },
  { name: "더컨벤션 반포", halls: [{ name: "단독홀", type: "일반홀", minSeat: 250, maxSeat: 650, price: 1200 }] },
  { name: "더컨벤션 영등포", halls: [
    { name: "그랜드볼룸홀", type: "컨벤션", minSeat: 300, maxSeat: 550, price: 0 },
    { name: "다이너스티홀", type: "컨벤션", minSeat: 300, maxSeat: 550, price: 0 },
  ]},
  { name: "더컨벤션 잠실", halls: [
    { name: "그랜드볼룸", type: "컨벤션", minSeat: 300, maxSeat: 1000, price: 1100 },
    { name: "아모르홀", type: "컨벤션", minSeat: 300, maxSeat: 1000, price: 1200 },
    { name: "비스타홀", type: "컨벤션", minSeat: 220, maxSeat: 1000, price: 760 },
  ]},
  { name: "더컨벤션 신사", halls: [{ name: "그랜드볼룸", type: "일반홀/컨벤션", minSeat: 300, maxSeat: 550, price: 0 }] },
  { name: "JK아트컨벤션", halls: [
    { name: "그랜드홀", type: "컨벤션", minSeat: 300, maxSeat: 800, price: 1000 },
    { name: "아트리움홀", type: "컨벤션", minSeat: 200, maxSeat: 750, price: 1000 },
    { name: "앰버루체홀", type: "컨벤션", minSeat: 200, maxSeat: 650, price: 1200 },
  ]},
  { name: "상록아트홀", halls: [
    { name: "그랜드볼룸", type: "컨벤션", minSeat: 300, maxSeat: 500, price: 980 },
    { name: "아트홀", type: "일반홀", minSeat: 250, maxSeat: 500, price: 980 },
  ]},
  { name: "아펠가모 선릉", halls: [{ name: "단독홀", type: "일반홀", minSeat: 300, maxSeat: 500, price: 1100 }] },
  { name: "아펠가모 공덕", halls: [
    { name: "라로브홀", type: "채플", minSeat: 300, maxSeat: 500, price: 1100 },
    { name: "마리에홀", type: "채플", minSeat: 300, maxSeat: 500, price: 0 },
  ]},
  { name: "아펠가모 잠실", halls: [{ name: "단독홀", type: "컨벤션", minSeat: 300, maxSeat: 500, price: 1100 }] },
  { name: "더라움", halls: [
    { name: "마제스틱볼룸", type: "채플/야외/가든", minSeat: 350, maxSeat: 800, price: 550 },
    { name: "채임버", type: "채플/야외/가든", minSeat: 300, maxSeat: 400, price: 550 },
    { name: "그라스가든", type: "야외/가든", minSeat: 350, maxSeat: 800, price: 550 },
  ]},
  { name: "ELTOWER", halls: [
    { name: "그랜드홀", type: "컨벤션/호텔형", minSeat: 300, maxSeat: 780, price: 2100 },
    { name: "그레이스홀", type: "컨벤션/호텔형", minSeat: 300, maxSeat: 800, price: 2100 },
    { name: "오르체홀", type: "컨벤션/호텔형", minSeat: 250, maxSeat: 400, price: 2100 },
  ]},
  { name: "더화이트베일", halls: [
    { name: "화이트베일홀", type: "컨벤션", minSeat: 250, maxSeat: 950, price: 950 },
    { name: "V홀", type: "컨벤션", minSeat: 250, maxSeat: 950, price: 950 },
    { name: "W홀", type: "컨벤션", minSeat: 250, maxSeat: 500, price: 950 },
  ]},
  { name: "스타시티아트홀", halls: [{ name: "단독홀", type: "일반홀", minSeat: 300, maxSeat: 700, price: 0 }] },
  { name: "보타닉파크웨딩", halls: [
    { name: "오키드홀", type: "하우스/채플/컨벤션", minSeat: 250, maxSeat: 500, price: 700 },
    { name: "카라홀", type: "하우스/채플/컨벤션", minSeat: 250, maxSeat: 500, price: 700 },
  ]},
  { name: "더뉴컨벤션웨딩", halls: [
    { name: "르노브홀", type: "컨벤션/가든풍", minSeat: 200, maxSeat: 600, price: 0 },
    { name: "더뉴홀", type: "컨벤션", minSeat: 200, maxSeat: 600, price: 0 },
  ]},
  { name: "PJ호텔", halls: [
    { name: "헤스티아", type: "호텔", minSeat: 250, maxSeat: 500, price: 980 },
    { name: "뮤즈홀", type: "호텔/하우스", minSeat: 200, maxSeat: 200, price: 980 },
  ]},
  { name: "DMC타워웨딩", halls: [
    { name: "팰리체홀", type: "일반홀", minSeat: 250, maxSeat: 500, price: 1700 },
    { name: "그랜드볼룸", type: "일반홀", minSeat: 250, maxSeat: 950, price: 900 },
    { name: "라피네홀", type: "일반홀", minSeat: 150, maxSeat: 650, price: 550 },
  ]},
  { name: "케이티들", halls: [
    { name: "컨벤션홀", type: "컨벤션/호텔형", minSeat: 200, maxSeat: 0, price: 800 },
    { name: "라 페네트레홀", type: "하우스/가든풍", minSeat: 200, maxSeat: 0, price: 0 },
  ]},
  { name: "구로명품웨딩프로포즈", halls: [{ name: "더드림홀", type: "일반홀", minSeat: 150, maxSeat: 900, price: 550 }] },
  { name: "그래머시코엑스", halls: [
    { name: "그랜드볼룸", type: "컨벤션/호텔형", minSeat: 500, maxSeat: 1000, price: 0 },
    { name: "아셈볼룸", type: "컨벤션/호텔형", minSeat: 300, maxSeat: 500, price: 0 },
  ]},
  { name: "더채플앳청담", halls: [
    { name: "채플홀", type: "채플", minSeat: 300, maxSeat: 500, price: 1200 },
    { name: "커티지홀", type: "채플", minSeat: 300, maxSeat: 500, price: 1200 },
  ]},
  { name: "더채플앳논현", halls: [
    { name: "라포레홀", type: "일반홀/채플풍", minSeat: 330, maxSeat: 550, price: 1300 },
    { name: "라메르홀", type: "일반홀/채플풍", minSeat: 300, maxSeat: 550, price: 1300 },
  ]},
  { name: "베네치아", halls: [{ name: "베네치아홀", type: "일반홀", minSeat: 200, maxSeat: 800, price: 690 }] },
  { name: "여의도웨딩컨벤션", halls: [{ name: "그랜드볼룸", type: "컨벤션", minSeat: 300, maxSeat: 1150, price: 900 }] },
  { name: "포시즌스호텔서울", halls: [{ name: "그랜드볼룸", type: "호텔", minSeat: 250, maxSeat: 400, price: 0 }] },
  { name: "누보름홀", halls: [{ name: "누보름홀", type: "호텔", minSeat: 0, maxSeat: 0, price: 0 }] },
  { name: "포시즌스호텔서울 가든테라스", halls: [{ name: "가든테라스", type: "야외/호텔", minSeat: 0, maxSeat: 0, price: 0 }] },
  { name: "그랜드인터컨티넨탈서울파르나스", halls: [
    { name: "그랜드볼룸", type: "호텔", minSeat: 300, maxSeat: 940, price: 880 },
    { name: "오키드", type: "호텔/소규모", minSeat: 80, maxSeat: 220, price: 330 },
    { name: "로즈", type: "호텔/소규모", minSeat: 40, maxSeat: 80, price: 900 },
  ]},
  { name: "시그니엘서울", halls: [{ name: "그랜드볼룸", type: "호텔/하우스", minSeat: 150, maxSeat: 300, price: 650 }] },
  { name: "페어몬트앰배서더서울", halls: [{ name: "그랜드볼룸", type: "호텔", minSeat: 200, maxSeat: 340, price: 0 }] },
  { name: "더링크호텔", halls: [
    { name: "링크홀", type: "호텔", minSeat: 300, maxSeat: 500, price: 1650 },
    { name: "베일리홀", type: "호텔", minSeat: 300, maxSeat: 500, price: 1650 },
    { name: "플라자홀", type: "호텔", minSeat: 300, maxSeat: 500, price: 1650 },
    { name: "가든홀", type: "호텔/가든풍", minSeat: 300, maxSeat: 500, price: 1650 },
    { name: "화이트홀", type: "호텔", minSeat: 300, maxSeat: 500, price: 1650 },
  ]},
  { name: "웨딩그룹위더스 안양", halls: [
    { name: "메리앨홀", type: "일반홀", minSeat: 300, maxSeat: 800, price: 1000 },
    { name: "벨라홀", type: "일반홀", minSeat: 300, maxSeat: 800, price: 1050 },
  ]},
  { name: "가천컨벤션센터", halls: [{ name: "단독홀", type: "컨벤션", minSeat: 300, maxSeat: 800, price: 990 }] },
  { name: "광명아이벡스컨벤션", halls: [{ name: "단독홀", type: "컨벤션", minSeat: 300, maxSeat: 800, price: 1650 }] },
  { name: "수원WI컨벤션", halls: [{ name: "더블유홀", type: "컨벤션", minSeat: 400, maxSeat: 1300, price: 700 }] },
  { name: "수원WI컨벤션 아이홀", halls: [{ name: "아이홀", type: "일반홀", minSeat: 300, maxSeat: 1300, price: 650 }] },
  { name: "안산AW컨벤션", halls: [
    { name: "그랜드볼룸", type: "일반홀", minSeat: 150, maxSeat: 2000, price: 990 },
    { name: "파티오볼룸", type: "일반홀", minSeat: 250, maxSeat: 2000, price: 990 },
    { name: "테라스볼룸", type: "일반홀/테라스", minSeat: 0, maxSeat: 0, price: 0 },
  ]},
  { name: "페이지웨딩&파티", halls: [
    { name: "클래식홀", type: "일반홀/가든풍", minSeat: 250, maxSeat: 900, price: 650 },
    { name: "모던홀", type: "일반홀", minSeat: 250, maxSeat: 900, price: 650 },
    { name: "루프탑가든홀", type: "소규모 하우스/야외", minSeat: 100, maxSeat: 300, price: 600 },
  ]},
  { name: "평대웨딩홀", halls: [{ name: "투게더홀", type: "일반홀", minSeat: 200, maxSeat: 650, price: 420 }] },
  { name: "평택T웨딩홀", halls: [{ name: "투데이홀", type: "일반홀/숙목홀", minSeat: 200, maxSeat: 650, price: 420 }] },
  { name: "명동성당", halls: [
    { name: "대성전", type: "성당", minSeat: 400, maxSeat: 400, price: 400 },
    { name: "파밀리아홀", type: "성당", minSeat: 200, maxSeat: 200, price: 200 },
  ]},
  { name: "가회동성당", halls: [{ name: "대성전", type: "성당", minSeat: 0, maxSeat: 0, price: 0 }] },
  { name: "약현성당", halls: [{ name: "대성전", type: "성당", minSeat: 0, maxSeat: 0, price: 150 }] },
]

export function fmtHallLabel(hall: VenueHall): string {
  const seat = hall.minSeat === 0 && hall.maxSeat === 0
    ? '미공개'
    : hall.minSeat === hall.maxSeat
      ? `${hall.minSeat}석`
      : `최소${hall.minSeat}~최대${hall.maxSeat}석`
  return `${hall.name} (${hall.type}, ${seat})`
}

export function fmtVenuePrice(price: number): string {
  return price === 0 ? '별도 문의' : `${price.toLocaleString()}만원`
}
