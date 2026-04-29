import { Capacitor } from '@capacitor/core'
import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob'

const IS_NATIVE = Capacitor.isNativePlatform()

/**
 * 광고 ID 설정
 * ─────────────────────────────────────────────────────
 * 현재: Google 공식 테스트 ID (실제 광고 미노출)
 * 출시 전: AdMob 콘솔에서 발급받은 실제 ID로 교체 + isTesting: false
 * ─────────────────────────────────────────────────────
 */
const AD_IDS = {
  // TODO: 실제 AdMob App ID로 교체 (AndroidManifest.xml에도 등록 필요)
  banner:       'ca-app-pub-3940256099942544/6300978111',
  interstitial: 'ca-app-pub-3940256099942544/1033173712',
}

const IS_TESTING = true // 출시 시 false로 변경

let initialized = false

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
    if (!IS_NATIVE) return
    try {
      await AdService.init()
      await AdMob.showBanner({
        adId: AD_IDS.banner,
        adSize: BannerAdSize.BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: IS_TESTING,
      })
    } catch (e) {
      console.warn('[AdService] showBanner failed', e)
    }
  },

  async removeBanner() {
    if (!IS_NATIVE) return
    try {
      await AdMob.removeBanner()
    } catch (e) {
      console.warn('[AdService] removeBanner failed', e)
    }
  },

  async showInterstitial() {
    if (!IS_NATIVE) return
    try {
      await AdService.init()
      await AdMob.prepareInterstitial({
        adId: AD_IDS.interstitial,
        isTesting: IS_TESTING,
      })
      await AdMob.showInterstitial()
    } catch (e) {
      console.warn('[AdService] showInterstitial failed', e)
    }
  },
}
