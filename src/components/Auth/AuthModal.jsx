import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function AuthModal({ onClose }) {
  const { logIn } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handle = (e) => {
    e.preventDefault()
    setError('')
    const { error } = logIn(username.trim(), password)
    if (error) setError(error)
    else onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal animate-fadein">
        <div style={{fontSize:'20px',fontWeight:800,marginBottom:'4px'}}>Log In</div>
        <div style={{color:'var(--text-secondary)',fontSize:'13px',marginBottom:'22px'}}>
          Sign in to your account to play.
        </div>
        <form onSubmit={handle}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input className="form-input" type="text" value={username} onChange={e => setUsername(e.target.value)} required placeholder="Username" autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Password" />
          </div>
          {error && <div className="form-error" style={{marginBottom:'12px'}}>{error}</div>}
          <button className="btn btn-primary" style={{width:'100%',padding:'12px',fontSize:'14px'}} type="submit">
            Log In
          </button>
        </form>
      </div>
    </div>
  )
}
