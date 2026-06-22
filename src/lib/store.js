// Local browser storage — replaces the previous Supabase backend.
// Everything (auth session, balance, stats, bet history) lives in localStorage.

const AUTH_KEY = 'stakeclone:auth'
const DATA_KEY = 'stakeclone:data'

// The single allowed account.
export const CREDENTIALS = { username: 'Moss', password: 'password08' }

const DEFAULT_DATA = {
  balance: 1000,
  startingBalance: 1000,
  stats: {},   // game -> { total_bets, total_wagered, total_won, net_profit, biggest_win, biggest_loss }
  history: [],  // most recent bets first
}

/* ---- Auth session ---- */
export function loadSession() {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveSession(user) {
  if (user) localStorage.setItem(AUTH_KEY, JSON.stringify(user))
  else localStorage.removeItem(AUTH_KEY)
}

/* ---- Wallet / stats data ---- */
export function loadData() {
  try {
    const raw = localStorage.getItem(DATA_KEY)
    return raw ? { ...DEFAULT_DATA, ...JSON.parse(raw) } : { ...DEFAULT_DATA }
  } catch {
    return { ...DEFAULT_DATA }
  }
}

export function saveData(data) {
  localStorage.setItem(DATA_KEY, JSON.stringify(data))
}
