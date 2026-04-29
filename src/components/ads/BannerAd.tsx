import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { AdService } from '../../services/AdService'

const IS_NATIVE = Capacitor.isNativePlatform()

/**
 * BannerAd
 * - 네이티브(Android): 마운트 시 AdMob 배너를 화면 하단에 고정 표시,
 *   언마운트 시 제거. 콘텐츠가 배너 뒤로 가리지 않도록 60px 패딩 추가.
 * - 웹: 섹션 하단에 광고 영역 플레이스홀더 표시.
 */
export default function BannerAd() {
  useEffect(() => {
    AdService.showBanner()
    return () => {
      AdService.removeBanner()
    }
  }, [])

  if (!IS_NATIVE) {
    return (
      <div style={{
        width: '100%',
        height: 60,
        background: 'var(--gray1)',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '20px 0 8px',
        border: '1.5px dashed var(--gray2)',
      }}>
        <span style={{ fontSize: 11, color: 'var(--text2)' }}>광고 영역</span>
      </div>
    )
  }

  // 네이티브: AdMob 배너가 화면 하단을 가리므로 동일 높이만큼 여백 확보
  return <div style={{ height: 60 }} />
}
