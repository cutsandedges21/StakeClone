import { createContext, useContext, useState } from 'react'
import { CREDENTIALS, loadSession, saveSession } from '../lib/store'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => loadSession())

  // Single hardcoded account. Returns { error } so callers can show a message.
  const logIn = (username, password) => {
    if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
      const u = { username: CREDENTIALS.username }
      setUser(u)
      saveSession(u)
      return { error: null }
    }
    return { error: 'Invalid username or password' }
  }

  const logOut = () => {
    setUser(null)
    saveSession(null)
  }

  return (
    <AuthContext.Provider value={{ user, logIn, logOut }}>
      {children}
    </AuthContext.Provider>
  )
}
