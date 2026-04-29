import { supabase } from './supabaseClient'
import type { UserData, SharedSnapshot } from '../types'

export const ShareService = {
  async createShareLink(nick: string, userData: UserData): Promise<string | null> {
    if (!supabase) return null
    try {
      const token = crypto.randomUUID()
      const { error } = await supabase.from('shared_snapshots').insert({
        share_token: token,
        owner_nick: nick.toLowerCase(),
        snapshot: userData,
      })
      if (error) return null
      return token
    } catch { return null }
  },

  async getSnapshot(token: string): Promise<Pick<SharedSnapshot, 'snapshot' | 'owner_nick' | 'created_at'> | null> {
    if (!supabase) return null
    try {
      const { data, error } = await supabase
        .from('shared_snapshots')
        .select('snapshot, owner_nick, created_at')
        .eq('share_token', token)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error || !data) return null
      return data as Pick<SharedSnapshot, 'snapshot' | 'owner_nick' | 'created_at'>
    } catch { return null }
  },
}
