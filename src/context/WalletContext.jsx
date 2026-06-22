import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from './AuthContext'
import { loadData, saveData } from '../lib/store'

const WalletContext = createContext(null)
export const useWallet = () => useContext(WalletContext)

const blankStat = () => ({
  total_bets: 0, total_wagered: 0, total_won: 0,
  net_profit: 0, biggest_win: 0, biggest_loss: 0,
})

export function WalletProvider({ children }) {
  const { user } = useAuth()
  const [balance, setBalance] = useState(0)
  const balanceRef = useRef(0)

  const fetchProfile = useCallback(() => {
    if (!user) { setBalance(0); balanceRef.current = 0; return }
    const data = loadData()
    setBalance(data.balance)
    balanceRef.current = data.balance
  }, [user])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  const updateBalance = useCallback((newBal) => {
    if (!user) return
    const rounded = Math.max(0, parseFloat(newBal.toFixed(2)))
    setBalance(rounded)
    balanceRef.current = rounded
    const data = loadData()
    data.balance = rounded
    saveData(data)
  }, [user])

  const recordBet = useCallback(({ game, betAmount, payout, multiplier, result }) => {
    if (!user || betAmount <= 0) return
    const profit = payout - betAmount
    const newBal = balanceRef.current + profit

    const rounded = Math.max(0, parseFloat(newBal.toFixed(2)))
    setBalance(rounded)
    balanceRef.current = rounded

    const data = loadData()
    data.balance = rounded

    const s = data.stats[game] || blankStat()
    s.total_bets += 1
    s.total_wagered += betAmount
    s.total_won += payout
    s.net_profit += profit
    s.biggest_win = Math.max(s.biggest_win, result === 'win' ? profit : 0)
    s.biggest_loss = Math.min(s.biggest_loss, result === 'loss' ? profit : 0)
    data.stats[game] = s

    data.history = [
      { game, betAmount, payout, profit, multiplier, result },
      ...data.history,
    ].slice(0, 100)

    saveData(data)
  }, [user])

  return (
    <WalletContext.Provider value={{ balance, fetchProfile, updateBalance, recordBet }}>
      {children}
    </WalletContext.Provider>
  )
}
