import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useWallet } from '../context/WalletContext'
import { supabase } from '../lib/supabase'

export default function Settings() {
  const { user } = useAuth()
  const { balance, updateBalance } = useWallet()
  const [amount, setAmount]         = useState('')
  const [saved, setSaved]           = useState(false)
  const [startingBal, setStartingBal] = useState(1000)

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('starting_balance').eq('id', user.id).single()
      .then(({ data }) => {
        if (data) { setStartingBal(data.starting_balance); setAmount(data.starting_balance) }
      })
  }, [user])

  const applyBalance = async () => {
    const v = parseFloat(amount)
    if (!v || v <= 0) return
    await supabase.from('profiles').update({ balance: v, starting_balance: v }).eq('id', user.id)
    await updateBalance(v)
    setStartingBal(v)
    flash()
  }

  const resetBalance = async () => {
    await updateBalance(startingBal)
    flash()
  }

  const flash = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  if (!user) return (
    <div style={{padding:'60px 24px',textAlign:'center',color:'var(--text-secondary)'}}>
      <div style={{fontSize:'52px',marginBottom:'16px'}}>⚙️</div>
      <div style={{fontSize:'18px',fontWeight:600,color:'var(--text-primary)'}}>Sign in to access settings</div>
    </div>
  )

  return (
    <div style={{padding:'24px',maxWidth:'560px'}}>
      <h1 style={{fontSize:'20px',fontWeight:700,marginBottom:'24px'}}>Settings</h1>

      <div className="settings-section">
        <div className="settings-title">Wallet</div>
        <div style={{display:'flex',flexDirection:'column',gap:'18px'}}>
          <div className="card" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontSize:'12px',color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.5px',marginBottom:'4px'}}>Current Balance</div>
              <div style={{fontSize:'26px',fontWeight:800,color:'var(--accent)'}}>${balance.toFixed(2)}</div>
            </div>
            <button className="btn btn-outline" onClick={resetBalance}>Reset to ${startingBal.toFixed(0)}</button>
          </div>
          <div>
            <div className="form-label">Set Starting Balance</div>
            <div style={{display:'flex',gap:'8px'}}>
              <input
                className="form-input"
                type="number" min="1" step="1"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="1000"
                style={{maxWidth:'180px'}}
              />
              <button className="btn btn-primary" onClick={applyBalance}>
                {saved ? '✓ Applied' : 'Apply & Set'}
              </button>
            </div>
            <div style={{fontSize:'12px',color:'var(--text-muted)',marginTop:'6px'}}>
              Sets your balance right now and saves it as your new starting balance.
            </div>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-title">Account</div>
        <div className="card" style={{display:'flex',flexDirection:'column',gap:'8px'}}>
          <div style={{display:'flex',justifyContent:'space-between'}}>
            <span style={{color:'var(--text-secondary)'}}>Email</span>
            <span style={{fontWeight:600}}>{user.email}</span>
          </div>
          <div style={{display:'flex',justifyContent:'space-between'}}>
            <span style={{color:'var(--text-secondary)'}}>User ID</span>
            <span style={{fontSize:'12px',color:'var(--text-muted)'}}>{user.id?.slice(0,8)}...</span>
          </div>
        </div>
      </div>
    </div>
  )
}
