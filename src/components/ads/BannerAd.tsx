import { useEffect, useRef } from 'react'
import { Capacitor } from '@capacitor/core'
import { AdService } from '../../services/AdService'

const IS_NATIVE = Capacitor.isNativePlatform()

/**
 * BannerAd
 * - 네이티브(Android): 마운트 시 AdMob 배너를 화면 하단에 고정 표시,
 *   언마운트 시 제거.
 * - 키보드가 올라오면 배너를 숨겨 화면이 이중으로 가려지지 않도록 처리.
 * - 웹: 아무것도 렌더링하지 않음.
 */
export default function BannerAd() {
  const keyboardOpen = useRef(false)

  useEffect(() => {
    AdService.showBanner()

    if (!IS_NATIVE) return

    const vv = window.visualViewport
    if (!vv) return

    // 초기 높이 기준으로 키보드 감지 (75% 이하면 키보드 올라온 것으로 판단)
    const initialHeight = vv.height

    const onViewportResize = () => {
      const ratio = vv.height / initialHeight
      const isKeyboardNow = ratio < 0.75

      if (isKeyboardNow && !keyboardOpen.current) {
        // 키보드 올라옴 → 배너 숨김
        keyboardOpen.current = true
        AdService.hideBannerForKeyboard()
      } else if (!isKeyboardNow && keyboardOpen.current) {
        // 키보드 내려감 → 배너 복원
        keyboardOpen.current = false
        AdService.resumeBannerAfterKeyboard()
      }
    }

    vv.addEventListener('resize', onViewportResize)

    return () => {
      vv.removeEventListener('resize', onViewportResize)
      AdService.removeBanner()
    }
  }, [])

  // 네이티브가 아닐 때는 아무것도 렌더링하지 않음
  if (!IS_NATIVE) return null

  // 배너 높이만큼 콘텐츠 하단 여백 확보 (배너가 콘텐츠를 가리지 않도록)
  return <div style={{ height: 60 }} />
}
