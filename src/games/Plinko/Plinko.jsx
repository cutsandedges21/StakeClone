import { useState, useRef, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useWallet } from '../../context/WalletContext'
import BetControls from '../../components/common/BetControls'

const CONFIGS = {
  low:    { rows:8,  buckets:[5.6,2.1,1.1,1.0,0.5,1.0,1.1,2.1,5.6] },
  medium: { rows:12, buckets:[13,3,1.3,0.7,0.4,0.3,0.2,0.3,0.4,0.7,1.3,3,13] },
  high:   { rows:16, buckets:[1000,130,26,9,4,2,0.2,0.2,0.2,0.2,0.2,2,4,9,26,130,1000] },
}
const BUCKET_COLORS = ['#e74c3c','#e67e22','#f39c12','#f1c40f','#2ecc71','#f1c40f','#f39c12','#e67e22','#e74c3c']

function getBucketColor(i, total) {
  const mid = (total - 1) / 2
  const dist = Math.abs(i - mid) / mid
  const r = Math.round(dist * 200 + 50)
  const g = Math.round((1 - dist) * 180 + 50)
  return `rgb(${r},${g},50)`
}

export default function Plinko() {
  const { user } = useAuth()
  const { balance, recordBet } = useWallet()
  const [bet, setBet]      = useState(1)
  const [risk, setRisk]    = useState('low')
  const [playing, setPlaying] = useState(false)
  const [balls, setBalls]  = useState([])
  const [lastResult, setLastResult] = useState(null)
  const [history, setHistory] = useState([])
  const ballId = useRef(0)

  const cfg = CONFIGS[risk]

  const dropBall = useCallback(async () => {
    if (playing) return
    setPlaying(true)
    setLastResult(null)

    let col = 0
    const steps = []
    for (let r = 0; r < cfg.rows; r++) {
      col += Math.random() < 0.5 ? 0 : 1
      steps.push(col)
    }
    const bucket = col
    const mult = cfg.buckets[bucket]

    const id = ++ballId.current
    setBalls(prev => [...prev, { id, bucket, steps, row: 0, col: 0 }])

    for (let r = 0; r <= cfg.rows; r++) {
      await new Promise(res => setTimeout(res, 80))
      setBalls(prev => prev.map(b => b.id === id ? { ...b, row: r, col: steps[r] ?? steps[cfg.rows - 1] } : b))
    }

    await new Promise(res => setTimeout(res, 200))
    setBalls(prev => prev.filter(b => b.id !== id))
    const payout = bet * mult
    const win = mult >= 1
    setLastResult({ mult, payout, win, bucket })
    setHistory(h => [{ mult, win }, ...h].slice(0, 15))
    if (user && bet > 0) {
      await recordBet({ game:'plinko', betAmount:bet, payout, multiplier:mult, result: win ? 'win':'loss' })
    }
    setPlaying(false)
  }, [playing, bet, risk, user, recordBet, cfg])

  const pegSize = Math.max(6, 12 - cfg.rows / 2)

  return (
    <div className="game-page">
      <div className="game-controls-panel">
        <BetControls bet={bet} onBetChange={setBet} onPlay={dropBall} playing={playing}>
          <div>
            <div className="bet-label">Risk</div>
            <div style={{display:'flex',gap:'6px'}}>
              {Object.keys(CONFIGS).map(r => (
                <button
                  key={r}
                  onClick={() => setRisk(r)}
                  disabled={playing}
                  style={{
                    flex:1,padding:'7px',borderRadius:'6px',fontSize:'12px',fontWeight:600,
                    background: risk===r ? 'var(--accent)' : 'var(--bg-hover)',
                    color: risk===r ? '#fff' : 'var(--text-secondary)',
                    border: `1px solid ${risk===r ? 'var(--accent)' : 'var(--border)'}`,
                    textTransform:'capitalize',
                  }}
                >{r}</button>
              ))}
            </div>
          </div>
        </BetControls>
        {lastResult && (
          <div className={`card animate-popin ${lastResult.win?'result-win':'result-loss'}`} style={{textAlign:'center'}}>
            <div style={{fontSize:'22px',fontWeight:800}}>{lastResult.mult}×</div>
            <div style={{fontWeight:600}}>{lastResult.win?'+':'−'}${Math.abs(lastResult.payout - bet).toFixed(2)}</div>
          </div>
        )}
        <div>
          <div className="bet-label">Recent</div>
          <div className="recent-chips">
            {history.map((h,i) => (
              <span key={i} className={`chip ${h.win?'win':'loss'}`}>{h.mult}×</span>
            ))}
          </div>
        </div>
      </div>

      <div className="game-area" style={{gap:'0',justifyContent:'center',alignItems:'center',overflow:'hidden'}}>
        <div style={{position:'relative',width:'100%',maxWidth:'420px'}}>
          {/* Pegs */}
          {Array.from({length: cfg.rows}).map((_, row) => (
            <div key={row} style={{display:'flex',justifyContent:'center',gap:`${pegSize * 2}px`,marginBottom:`${pegSize}px`,paddingLeft:`${row * pegSize}px`}}>
              {Array.from({length: row + 1}).map((_, col) => (
                <div key={col} style={{
                  width:pegSize,height:pegSize,borderRadius:'50%',
                  background:'var(--text-secondary)',opacity:0.6,flexShrink:0,
                }} />
              ))}
            </div>
          ))}
          {/* Buckets */}
          <div style={{display:'flex',gap:'3px',marginTop:'4px'}}>
            {cfg.buckets.map((v, i) => (
              <div key={i} style={{
                flex:1,padding:'6px 2px',borderRadius:'5px',textAlign:'center',
                background: getBucketColor(i, cfg.buckets.length),
                fontSize:Math.min(11, 120/cfg.buckets.length),fontWeight:700,color:'#fff',
              }}>
                {v}×
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
