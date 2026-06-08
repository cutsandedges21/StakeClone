import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useWallet } from '../../context/WalletContext'
import BetControls from '../../components/common/BetControls'

function genLimbo() {
  const r = Math.random()
  if (r < 0.01) return 1.0
  return parseFloat((1 / (1 - r * 0.99)).toFixed(2))
}

export default function Limbo() {
  const { user } = useAuth()
  const { balance, recordBet } = useWallet()
  const [bet, setBet]     = useState(1)
  const [target, setTarget] = useState(2)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult]   = useState(null)
  const [display, setDisplay] = useState('1.00')
  const [history, setHistory] = useState([])

  const play = async () => {
    setSpinning(true)
    setResult(null)
    setDisplay('?')

    // Animate counting up
    const duration = 1200
    const start = Date.now()
    const final = genLimbo()
    await new Promise(resolve => {
      const tick = () => {
        const elapsed = Date.now() - start
        const p = Math.min(elapsed / duration, 1)
        const cur = parseFloat((1 + (final - 1) * Math.pow(p, 3)).toFixed(2))
        setDisplay(cur.toFixed(2))
        if (p < 1) requestAnimationFrame(tick)
        else resolve()
      }
      requestAnimationFrame(tick)
    })

    const win = final >= target
    const payout = win ? bet * target : 0
    setDisplay(final.toFixed(2))
    setResult({ value: final, win, payout })
    setHistory(h => [{ value: final, win }, ...h].slice(0, 15))
    if (user && bet > 0) {
      await recordBet({ game:'limbo', betAmount:bet, payout, multiplier:final, result:win?'win':'loss' })
    }
    setSpinning(false)
  }

  const winChance = Math.max(0.01, Math.min(99, 99 / target))

  return (
    <div className="game-page">
      <div className="game-controls-panel">
        <BetControls bet={bet} onBetChange={setBet} onPlay={play} playing={spinning}>
          <div>
            <div className="bet-label">Target Multiplier</div>
            <div className="bet-input-row">
              <input
                className="bet-input"
                type="number" min="1.01" step="0.1"
                value={target}
                onChange={e => setTarget(parseFloat(e.target.value) || 2)}
                disabled={spinning}
              />
            </div>
            <div style={{display:'flex',justifyContent:'space-between',marginTop:'8px',gap:'8px'}}>
              <div className="card" style={{flex:1,textAlign:'center',padding:'8px'}}>
                <div style={{fontSize:'11px',color:'var(--text-muted)'}}>Win Chance</div>
                <div style={{fontWeight:700,color:'var(--accent)'}}>{winChance.toFixed(2)}%</div>
              </div>
              <div className="card" style={{flex:1,textAlign:'center',padding:'8px'}}>
                <div style={{fontSize:'11px',color:'var(--text-muted)'}}>Payout</div>
                <div style={{fontWeight:700}}>${(bet * target).toFixed(2)}</div>
              </div>
            </div>
          </div>
        </BetControls>
        <div>
          <div className="bet-label">Recent</div>
          <div className="recent-chips">
            {history.map((h,i) => (
              <span key={i} className={`chip ${h.win?'win':'loss'}`}>{h.value.toFixed(2)}×</span>
            ))}
          </div>
        </div>
      </div>

      <div className="game-area">
        <div style={{textAlign:'center'}}>
          <div style={{
            fontSize:'11px',color:'var(--text-secondary)',textTransform:'uppercase',
            letterSpacing:'1.5px',marginBottom:'12px',
          }}>
            {spinning ? 'Rolling...' : result ? (result.win ? 'You won!' : 'Too low') : 'Place your bet'}
          </div>
          <div
            className={`multiplier-big ${result ? (result.win ? 'result-win animate-popin' : 'result-loss animate-shake') : ''}`}
            style={{
              fontSize:'80px',
              color: spinning ? 'var(--text-secondary)' : result?.win ? 'var(--accent)' : result ? 'var(--red)' : 'var(--text-primary)',
              transition:'color 0.3s',
            }}
          >
            {display}×
          </div>
          {result && (
            <div style={{marginTop:'16px',fontSize:'16px',fontWeight:600}}>
              {result.win
                ? <span className="result-win">+${(result.payout - bet).toFixed(2)} 🎉</span>
                : <span className="result-loss">-${bet.toFixed(2)}</span>
              }
            </div>
          )}
          <div style={{marginTop:'12px',fontSize:'13px',color:'var(--text-muted)'}}>
            Target: <span style={{color:'var(--text-primary)',fontWeight:600}}>{target}×</span>
          </div>
        </div>
      </div>
    </div>
  )
}
