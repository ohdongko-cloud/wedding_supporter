/**
 * NativeAdCard
 * 신혼여행 페이지 DAY 섹션 사이에 인라인으로 삽입되는 네이티브 스타일 광고 카드.
 *
 * Capacitor AdMob 플러그인은 완전한 인라인 네이티브 광고를 지원하지 않으므로
 * 현재는 웹/네이티브 공통으로 동일한 카드 UI를 렌더링합니다.
 * 추후 실제 AdMob Native Advanced 광고로 교체 시 이 컴포넌트를 수정하세요.
 */
import { Capacitor } from '@capacitor/core'

export default function NativeAdCard() {
  // 웹에서는 미노출
  if (!Capacitor.isNativePlatform()) return null
  return (
    <div style={{
      background: '#fff',
      borderRadius: 14,
      margin: '6px 0 10px',
      border: '1.5px solid var(--pk4)',
      overflow: 'hidden',
      boxShadow: '0 4px 16px rgba(255,107,157,.08)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 14px',
      }}>
        {/* 광고 라벨 */}
        <span style={{
          background: '#e8f4ff',
          color: '#4a80ee',
          borderRadius: 4,
          padding: '2px 6px',
          fontSize: 10,
          fontWeight: 700,
          flexShrink: 0,
          letterSpacing: 0.3,
        }}>
          광고
        </span>

        {/* 광고 본문 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            신혼여행 특가 항공권 최대 30% 할인
          </div>
          <div style={{ fontSize: 11, color: 'var(--text2)' }}>
            Sponsored · 지금 바로 확인하세요
          </div>
        </div>

        {/* CTA 버튼 */}
        <button style={{
          background: 'linear-gradient(135deg, var(--pk), var(--mn))',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '7px 12px',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}>
          보기
        </button>
      </div>
    </div>
  )
}
