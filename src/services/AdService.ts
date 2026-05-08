import { Capacitor } from '@capacitor/core'
import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob'

const IS_NATIVE = Capacitor.isNativePlatform()

/**
 * 광고 ID 설정
 * ─────────────────────────────────────────────────────
 * 현재: Google 공식 테스트 ID (실제 광고 미노출)
 * 출시 전: AdMob 콘솔에서 발급받은 실제 ID로 교체 + isTesting: false
 * ─────────────────────────────────────────────────────
 * 광고 형태: 하단 고정 배너만 사용 (전면/팝업 광고 없음)
 */
const AD_IDS = {
  // TODO: 실제 AdMob App ID로 교체 (AndroidManifest.xml에도 등록 필요)
  banner: 'ca-app-pub-3940256099942544/6300978111',
}

const IS_TESTING = true // 출시 시 false로 변경

let initialized = false
let bannerShowing = false  // 중복 호출 방지용 플래그

export const AdService = {
  async init() {
    if (!IS_NATIVE || initialized) return
    try {
      await AdMob.initialize()
      initialized = true
    } catch (e) {
      console.warn('[AdService] init failed', e)
    }
  },

  async showBanner() {
    if (!IS_NATIVE || bannerShowing) return
    try {
      await AdService.init()
      await AdMob.showBanner({
        adId: AD_IDS.banner,
        adSize: BannerAdSize.BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: IS_TESTING,
      })
      bannerShowing = true
    } catch (e) {
      console.warn('[AdService] showBanner failed', e)
    }
  },

  async removeBanner() {
    if (!IS_NATIVE) return
    try {
      await AdMob.removeBanner()
      bannerShowing = false
    } catch (e) {
      console.warn('[AdService] removeBanner failed', e)
    }
  },

  /** 키보드가 올라올 때 배너를 숨김 (hideBanner만 하고 destroy하지 않음) */
  async hideBannerForKeyboard() {
    if (!IS_NATIVE || !bannerShowing) return
    try {
      await AdMob.hideBanner()
      bannerShowing = false
    } catch (e) {
      // hideBanner 미지원 시 removeBanner로 폴백
      await AdService.removeBanner()
    }
  },

  /** 키보드가 내려갈 때 배너를 다시 표시 */
  async resumeBannerAfterKeyboard() {
    if (!IS_NATIVE || bannerShowing) return
    try {
      await AdMob.resumeBanner()
      bannerShowing = true
    } catch (e) {
      // resumeBanner 미지원 시 showBanner로 폴백
      await AdService.showBanner()
    }
  },

}
