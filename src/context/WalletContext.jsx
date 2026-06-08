import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from './AuthContext'
import { supabase } from '../lib/supabase'

const WalletContext = createContext(null)
export const useWallet = () => useContext(WalletContext)

export function WalletProvider({ children }) {
  const { user } = useAuth()
  const [balance, setBalance] = useState(0)
  const balanceRef = useRef(0)

  const fetchProfile = useCallback(async () => {
    if (!user) { setBalance(0); balanceRef.current = 0; return }
    const { data } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', user.id)
      .single()
    if (data) { setBalance(data.balance); balanceRef.current = data.balance }
  }, [user])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  const updateBalance = useCallback(async (newBal) => {
    if (!user) return
    const rounded = Math.max(0, parseFloat(newBal.toFixed(2)))
    setBalance(rounded)
    balanceRef.current = rounded
    await supabase
      .from('profiles')
      .update({ balance: rounded })
      .eq('id', user.id)
  }, [user])

  const recordBet = useCallback(async ({ game, betAmount, payout, multiplier, result }) => {
    if (!user || betAmount <= 0) return
    const profit = payout - betAmount
    const newBal = balanceRef.current + profit
    await updateBalance(newBal)

    await supabase.from('bet_history').insert({
      user_id: user.id, game,
      bet_amount: betAmount, payout, profit, multiplier, result,
    })

    const { data: existing } = await supabase
      .from('game_stats')
      .select('*')
      .eq('user_id', user.id)
      .eq('game', game)
      .maybeSingle()

    if (existing) {
      await supabase.from('game_stats').update({
        total_bets: existing.total_bets + 1,
        total_wagered: existing.total_wagered + betAmount,
        total_won: existing.total_won + payout,
        net_profit: existing.net_profit + profit,
        biggest_win: Math.max(existing.biggest_win, result === 'win' ? profit : 0),
        biggest_loss: Math.min(existing.biggest_loss, result === 'loss' ? profit : 0),
        updated_at: new Date().toISOString(),
      }).eq('user_id', user.id).eq('game', game)
    } else {
      await supabase.from('game_stats').insert({
        user_id: user.id, game,
        total_bets: 1,
        total_wagered: betAmount,
        total_won: payout,
        net_profit: profit,
        biggest_win: result === 'win' ? profit : 0,
        biggest_loss: result === 'loss' ? profit : 0,
      })
    }
  }, [user, updateBalance])

  return (
    <WalletContext.Provider value={{ balance, fetchProfile, updateBalance, recordBet }}>
      {children}
    </WalletContext.Provider>
  )
}
