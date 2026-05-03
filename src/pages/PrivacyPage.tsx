import { useState } from 'react'

// 이메일을 JS 런타임에서만 조합 → 봇/크롤러가 소스에서 읽지 못함
function EmailReveal() {
  const [revealed, setRevealed] = useState(false)
  if (!revealed) {
    return (
      <button
        onClick={() => setRevealed(true)}
        style={{ background: '#fdf0f5', border: '1px solid #ffb3cc', borderRadius: 6, padding: '4px 12px', fontSize: 14, color: '#ff6b9d', cursor: 'pointer', fontWeight: 600 }}
      >
        📧 이메일 확인하기
      </button>
    )
  }
  // JS 런타임에서만 조합 → 소스코드/봇이 읽지 못함
  const addr = 'ohdongko' + String.fromCharCode(64) + 'gmail' + String.fromCharCode(46) + 'com'
  return <a href={`mailto:${addr}`} style={{ color: '#ff6b9d' }}>{addr}</a>
}

export default function PrivacyPage() {
  const S: React.CSSProperties = { maxWidth: 720, margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#333', lineHeight: 1.9, fontSize: 15 }
  const H2: React.CSSProperties = { fontSize: 17, fontWeight: 700, marginTop: 36, marginBottom: 10, borderLeft: '4px solid #ff6b9d', paddingLeft: 12 }
  const H3: React.CSSProperties = { fontSize: 15, fontWeight: 700, marginTop: 20, marginBottom: 6 }
  const UL: React.CSSProperties = { paddingLeft: 22, marginTop: 4 }
  const TABLE: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: 14, marginTop: 8 }
  const TH: React.CSSProperties = { background: '#fdf0f5', padding: '8px 10px', border: '1px solid #eee', fontWeight: 700, textAlign: 'left' }
  const TD: React.CSSProperties = { padding: '8px 10px', border: '1px solid #eee', verticalAlign: 'top' }

  return (
    <div style={S}>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6 }}>개인정보처리방침</h1>
      <p style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>시행일: 2026년 5월 1일 &nbsp;|&nbsp; 버전: 1.0</p>
      <p style={{ color: '#888', fontSize: 13, marginBottom: 32 }}>
        딸깍 결혼비용 계산기(이하 "서비스")는 「개인정보 보호법」을 준수하며,<br />
        이용자의 개인정보를 아래와 같이 처리합니다.
      </p>

      {/* 1 */}
      <h2 style={H2}>1. 수집하는 개인정보 항목 및 수집 방법</h2>
      <table style={TABLE}>
        <thead>
          <tr>
            <th style={TH}>항목</th>
            <th style={TH}>수집 목적</th>
            <th style={TH}>수집 방법</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={TD}>닉네임</td>
            <td style={TD}>계정 식별 및 파트너 공유 기능</td>
            <td style={TD}>이용자 직접 입력</td>
          </tr>
          <tr>
            <td style={TD}>결혼 준비 데이터<br />(계산기 입력값, 체크리스트,<br />신혼여행 일정 등)</td>
            <td style={TD}>서비스 제공 및 데이터 동기화</td>
            <td style={TD}>이용자 직접 입력</td>
          </tr>
          <tr>
            <td style={TD}>기기 식별자(UUID), 앱 사용 기록</td>
            <td style={TD}>서비스 오류 분석 및 개선</td>
            <td style={TD}>자동 수집</td>
          </tr>
        </tbody>
      </table>
      <p style={{ fontSize: 13, color: '#888', marginTop: 6 }}>
        ※ 이메일 주소, 전화번호, 실명 등 민감한 개인정보는 수집하지 않습니다.<br />
        ※ 만 14세 미만 아동의 개인정보는 수집하지 않습니다.
      </p>

      {/* 2 */}
      <h2 style={H2}>2. 개인정보 수집·이용 목적</h2>
      <ul style={UL}>
        <li>서비스 제공, 데이터 저장 및 기기 간 동기화</li>
        <li>파트너 공유 기능 (닉네임 기반)</li>
        <li>서비스 개선, 오류 분석 및 통계</li>
      </ul>

      {/* 3 */}
      <h2 style={H2}>3. 개인정보 보유·이용 기간 및 파기</h2>
      <h3 style={H3}>보유 기간</h3>
      <p>이용자가 직접 삭제하거나 서비스 이용을 중단할 때까지 보관합니다.<br />
        관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.</p>
      <h3 style={H3}>파기 절차 및 방법</h3>
      <ul style={UL}>
        <li><b>전자적 파일 형태</b>: 복구 및 재생이 불가능한 방법으로 영구 삭제</li>
        <li><b>기기 내 저장 데이터 (localStorage 등)</b>: 앱 삭제 또는 브라우저 데이터 초기화 시 삭제</li>
        <li>파기는 이용자 요청일로부터 7일 이내 처리합니다.</li>
      </ul>

      {/* 4 */}
      <h2 style={H2}>4. 개인정보의 제3자 제공</h2>
      <p>이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다.<br />
        단, 아래의 경우는 예외입니다.</p>
      <ul style={UL}>
        <li>이용자가 파트너 공유 기능을 직접 사용하는 경우 (닉네임 한정)</li>
        <li>법령에 따라 수사기관 등이 요청하는 경우</li>
      </ul>

      {/* 5 */}
      <h2 style={H2}>5. 개인정보 처리 위탁</h2>
      <table style={TABLE}>
        <thead>
          <tr>
            <th style={TH}>수탁업체</th>
            <th style={TH}>위탁 업무</th>
            <th style={TH}>보유 기간</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={TD}>Supabase Inc. (미국)</td>
            <td style={TD}>데이터베이스 저장, 인증 처리</td>
            <td style={TD}>서비스 이용 기간</td>
          </tr>
          <tr>
            <td style={TD}>Vercel Inc. (미국)</td>
            <td style={TD}>웹 서비스 호스팅</td>
            <td style={TD}>서비스 이용 기간</td>
          </tr>
        </tbody>
      </table>
      <p style={{ fontSize: 13, color: '#888', marginTop: 6 }}>
        ※ 해외 위탁에 따른 개인정보 국외 이전이 발생하며, 각 업체는 국제 수준의 보안 정책을 준수합니다.
      </p>

      {/* 6 */}
      <h2 style={H2}>6. 자동 수집 장치 (로컬 저장소)</h2>
      <p>서비스는 원활한 이용을 위해 기기의 <b>로컬 저장소(localStorage)</b>를 사용합니다.</p>
      <ul style={UL}>
        <li>사용 목적: 로그인 상태 유지, 임시 데이터 보관</li>
        <li>거부 방법: 브라우저 설정 또는 앱 데이터 초기화</li>
        <li>거부 시 일부 기능(자동 로그인 등)이 제한될 수 있습니다.</li>
      </ul>

      {/* 7 */}
      <h2 style={H2}>7. 개인정보의 안전성 확보 조치</h2>
      <ul style={UL}>
        <li><b>전송 구간 암호화</b>: HTTPS(TLS) 적용으로 데이터 전송 시 암호화</li>
        <li><b>접근 제한</b>: 개인정보에 대한 접근 권한을 최소한의 인원으로 제한</li>
        <li><b>데이터 분리</b>: 이용자별 데이터를 논리적으로 분리하여 저장</li>
        <li><b>외부 위탁 보안</b>: Supabase의 행 단위 보안(Row Level Security) 정책 적용</li>
      </ul>

      {/* 8 */}
      <h2 style={H2}>8. 이용자의 권리 및 행사 방법</h2>
      <p>이용자는 언제든지 아래 권리를 행사할 수 있습니다.</p>
      <ul style={UL}>
        <li>개인정보 열람·수정·삭제 요청</li>
        <li>개인정보 처리 정지 요청</li>
        <li>동의 철회</li>
      </ul>
      <p>앱 내 데이터 삭제 기능을 이용하거나, 아래 개인정보 보호책임자에게 서면·이메일로 요청하시면 지체 없이 처리합니다.</p>

      {/* 9 */}
      <h2 style={H2}>9. 개인정보 보호책임자</h2>
      <table style={TABLE}>
        <tbody>
          <tr>
            <td style={{ ...TD, fontWeight: 700, width: 140 }}>서비스명</td>
            <td style={TD}>딸깍 결혼비용 계산기</td>
          </tr>
          <tr>
            <td style={{ ...TD, fontWeight: 700 }}>이메일</td>
            <td style={TD}><EmailReveal /></td>
          </tr>
          <tr>
            <td style={{ ...TD, fontWeight: 700 }}>처리 기간</td>
            <td style={TD}>접수 후 10일 이내</td>
          </tr>
        </tbody>
      </table>

      {/* 10 */}
      <h2 style={H2}>10. 개인정보처리방침 변경</h2>
      <p>본 방침이 변경되는 경우 변경 사항을 앱 내 공지 및 이 페이지를 통해 사전 안내합니다.<br />
        변경된 방침은 공지 후 7일이 경과한 날부터 효력이 발생합니다.</p>

      {/* 11 */}
      <h2 style={H2}>11. 권익 침해 구제 방법</h2>
      <p>개인정보 침해로 인한 피해를 구제받기 위해 아래 기관에 문의하실 수 있습니다.</p>
      <ul style={UL}>
        <li>개인정보 침해신고센터: <a href="https://privacy.kisa.or.kr" target="_blank" rel="noreferrer" style={{ color: '#ff6b9d' }}>privacy.kisa.or.kr</a> (국번 없이 118)</li>
        <li>개인정보 분쟁조정위원회: <a href="https://www.kopico.go.kr" target="_blank" rel="noreferrer" style={{ color: '#ff6b9d' }}>www.kopico.go.kr</a></li>
        <li>대검찰청 사이버수사과: <a href="https://www.spo.go.kr" target="_blank" rel="noreferrer" style={{ color: '#ff6b9d' }}>www.spo.go.kr</a> (02-3480-3573)</li>
      </ul>

      <p style={{ marginTop: 48, paddingTop: 20, borderTop: '1px solid #eee', color: '#aaa', fontSize: 12 }}>
        © 2026 딸깍. All rights reserved. &nbsp;|&nbsp; 시행일: 2026년 5월 1일
      </p>
    </div>
  )
}
