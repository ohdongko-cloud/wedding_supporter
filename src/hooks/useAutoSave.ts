import { useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'

const AUTO_SAVE_INTERVAL = 30_000 // 30초

export function useAutoSave() {
  useEffect(() => {
    const interval = setInterval(() => {
      const { isDirty, user, saveUserData } = useAuthStore.getState()
      if (isDirty && user && user.nick !== '게스트') {
        saveUserData()
      }
    }, AUTO_SAVE_INTERVAL)
    return () => clearInterval(interval)
  }, [])

  // 페이지 이탈 방지
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      const { isDirty, user } = useAuthStore.getState()
      if (isDirty && user && user.nick !== '게스트') {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])
}
