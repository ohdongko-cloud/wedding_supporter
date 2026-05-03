import { useState } from 'react'

function RevealEmail() {
  const [show, setShow] = useState(false)
  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        style={{ background: '#fdf0f5', border: '1px solid #ffb3cc', borderRadius: 6, padding: '6px 16px', fontSize: 14, color: '#ff6b9d', cursor: 'pointer', fontWeight: 600 }}
      >
        📧 이메일 확인하기
      </button>
    )
  }
  const addr = 'ohdongko' + String.fromCharCode(64) + 'gmail' + String.fromCharCode(46) + 'com'
  return <a href={`mailto:${addr}?subject=계정 삭제 요청`} style={{ color: '#ff6b9d', fontWeight: 700, fontSize: 15 }}>{addr}</a>
}

export default function DeleteAccountPage() {
  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '48px 24px', fontFamily: 'sans-serif', color: '#333', lineHeight: 1.8 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>계정 및 데이터 삭제 요청</h1>
      <p style={{ color: '#888', fontSize: 13, marginBottom: 32 }}>딸깍 결혼비용 계산기</p>

      <div style={{ background: '#fdf0f5', borderRadius: 14, padding: '20px 24px', marginBottom: 28, border: '1.5px solid #ffb3cc' }}>
        <div style={{ fontSize: 22, marginBottom: 8 }}>🗑️</div>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
          계정 또는 데이터 삭제를 원하시면 아래 이메일로 요청해 주세요.<br />
          <b>접수 후 7일 이내</b>에 처리해 드립니다.
        </p>
      </div>

      <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>삭제 요청 방법</h2>
      <ol style={{ paddingLeft: 22, lineHeight: 2.4 }}>
        <li>아래 이메일로 <b>"계정 삭제 요청"</b> 제목으로 메일을 보내주세요.</li>
        <li>메일 본문에 <b>앱에서 사용한 닉네임</b>을 적어주세요.</li>
        <li>삭제 범위를 선택해 주세요:<br />
          <span style={{ fontSize: 13, color: '#666' }}>· 계정 전체 삭제 &nbsp;/&nbsp; 특정 데이터만 삭제</span>
        </li>
      </ol>

      <div style={{ background: '#f8f8f8', borderRadius: 10, padding: '16px 20px', margin: '24px 0' }}>
        <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 14 }}>📧 삭제 요청 이메일</div>
        <RevealEmail />
      </div>

      <h2 style={{ fontSize: 17, fontWeight: 700, marginTop: 28, marginBottom: 10 }}>삭제되는 데이터</h2>
      <ul style={{ paddingLeft: 22, lineHeight: 2.2 }}>
        <li>닉네임 및 계정 정보</li>
        <li>결혼 준비 계산기 데이터</li>
        <li>체크리스트 기록</li>
        <li>신혼여행 일정 플랜</li>
        <li>메모 및 기타 입력 데이터</li>
      </ul>

      <p style={{ marginTop: 12, fontSize: 13, color: '#e03060' }}>
        ※ 삭제 후에는 데이터를 복구할 수 없습니다.
      </p>

      <p style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid #eee', color: '#aaa', fontSize: 12 }}>
        © 2026 딸깍. All rights reserved.
      </p>
    </div>
  )
}
