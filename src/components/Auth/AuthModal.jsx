import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

export default function AuthModal({ mode, onClose }) {
  const { signIn, signUp } = useAuth()
  const [tab, setTab] = useState(mode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handle = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    if (tab === 'login') {
      const { error } = await signIn(email, password)
      if (error) setError(error.message)
      else onClose()
    } else {
      const { data, error } = await signUp(email, password)
      if (error) { setError(error.message) }
      else {
        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id, balance: 1000, starting_balance: 1000,
          })
        }
        setDone(true)
      }
    }
    setLoading(false)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-fadein">
        <div className="modal-tabs">
          <button className={`modal-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>Sign In</button>
          <button className={`modal-tab ${tab === 'signup' ? 'active' : ''}`} onClick={() => setTab('signup')}>Sign Up</button>
        </div>
        {done ? (
          <div style={{textAlign:'center',padding:'12px 0'}}>
            <div style={{fontSize:'40px',marginBottom:'12px'}}>✅</div>
            <div style={{fontWeight:600,marginBottom:'6px'}}>Account created!</div>
            <div style={{color:'var(--text-secondary)',fontSize:'13px',marginBottom:'20px'}}>Check your email to confirm, then sign in.</div>
            <button className="btn btn-primary" style={{width:'100%',padding:'11px'}} onClick={() => setTab('login') || setDone(false)}>Go to Sign In</button>
          </div>
        ) : (
          <form onSubmit={handle}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} placeholder="Min 6 characters" />
            </div>
            {error && <div className="form-error" style={{marginBottom:'12px'}}>{error}</div>}
            <button className="btn btn-primary" style={{width:'100%',padding:'12px',fontSize:'14px'}} type="submit" disabled={loading}>
              {loading ? 'Loading...' : tab === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
