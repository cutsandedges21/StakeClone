import { useState, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useWallet } from '../../context/WalletContext'
import BetControls from '../../components/common/BetControls'

const DIFFICULTIES = {
  easy:   { cols:4, eggs:3, label:'Easy' },
  medium: { cols:3, eggs:2, label:'Medium' },
  hard:   { cols:2, eggs:1, label:'Hard' },
  expert: { cols:4, eggs:2, label:'Expert' },
}
const ROWS = 9

function buildRow(cols, eggs) {
  const row = Array(cols).fill('dragon')
  const positions = []
  while (positions.length < eggs) {
    const p = Math.floor(Math.random() * cols)
    if (!positions.includes(p)) positions.push(p)
  }
  positions.forEach(p => row[p] = 'egg')
  return row
}

function calcMult(row, cfg) {
  const safeChance = cfg.eggs / cfg.cols
  let m = 1
  for (let i = 0; i <= row; i++) m *= (1 / safeChance) * 0.97
  return parseFloat(m.toFixed(2))
}

export default function DragonTower() {
  const { user } = useAuth()
  const { balance, recordBet } = useWallet()
  const [bet, setBet]     = useState(1)
  const [diff, setDiff]   = useState('medium')
  const [phase, setPhase] = useState('idle')
  const [board, setBoard] = useState([])
  const [currentRow, setCurrentRow] = useState(0)
  const [revealed, setRevealed] = useState([])
  const [result, setResult] = useState(null)

  const cfg = DIFFICULTIES[diff]

  const start = useCallback(() => {
    const rows = Array.from({length:ROWS}, () => buildRow(cfg.cols, cfg.eggs))
    setBoard(rows)
    setCurrentRow(0)
    setRevealed(Array.from({length:ROWS}, () => Array(cfg.cols).fill(null)))
    setPhase('playing')
    setResult(null)
  }, [cfg])

  const pick = useCallback(async (rowIdx, colIdx) => {
    if (phase !== 'playing' || rowIdx !== currentRow) return
    const cell = board[rowIdx][colIdx]
    const newRevealed = revealed.map((r,ri) => ri===rowIdx ? r.map((c,ci) => ci===colIdx ? cell : c) : r)
    setRevealed(newRevealed)

    if (cell === 'dragon') {
      // Reveal all dragons in current row
      const finalRev = newRevealed.map((r,ri) => ri===rowIdx
        ? board[rowIdx].map((c,ci) => ci===colIdx ? 'dragon' : (c==='dragon' ? 'dragon-hidden' : null))
        : r)
      setRevealed(finalRev)
      setPhase('ended')
      setResult({ win:false })
      if (user && bet > 0) {
        await recordBet({ game:'dragon-tower', betAmount:bet, payout:0, multiplier:0, result:'loss' })
      }
    } else {
      const nextRow = currentRow + 1
      if (nextRow >= ROWS) {
        const mult = calcMult(ROWS - 1, cfg)
        const payout = bet * mult
        setPhase('ended')
        setResult({ win:true, mult, payout })
        if (user && bet > 0) {
          await recordBet({ game:'dragon-tower', betAmount:bet, payout, multiplier:mult, result:'win' })
        }
      } else {
        setCurrentRow(nextRow)
      }
    }
  }, [phase, currentRow, board, revealed, cfg, bet, user, recordBet])

  const cashout = async () => {
    if (phase !== 'playing' || currentRow === 0) return
    const mult = calcMult(currentRow - 1, cfg)
    const payout = bet * mult
    setPhase('ended')
    setResult({ win:true, mult, payout })
    if (user && bet > 0) {
      await recordBet({ game:'dragon-tower', betAmount:bet, payout, multiplier:mult, result:'win' })
    }
  }

  const currentMult = phase === 'playing' && currentRow > 0 ? calcMult(currentRow - 1, cfg) : null

  return (
    <div className="game-page">
      <div className="game-controls-panel">
        <BetControls
          bet={bet} onBetChange={setBet}
          onPlay={start}
          playing={phase === 'playing'}
          cashout={phase === 'playing' && currentRow > 0}
          onCashout={cashout}
          disabled={phase === 'playing'}
        >
          <div>
            <div className="bet-label">Difficulty</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'5px'}}>
              {Object.entries(DIFFICULTIES).map(([k,v]) => (
                <button key={k} onClick={() => setDiff(k)} disabled={phase==='playing'}
                  style={{
                    padding:'7px 4px',borderRadius:'6px',fontSize:'12px',fontWeight:600,
                    background: diff===k ? 'var(--accent)' : 'var(--bg-hover)',
                    color: diff===k ? '#fff' : 'var(--text-secondary)',
                    border:`1px solid ${diff===k?'var(--accent)':'var(--border)'}`,
                  }}>{v.label}</button>
              ))}
            </div>
          </div>
          {currentMult && (
            <div className="card" style={{textAlign:'center'}}>
              <div style={{fontSize:'11px',color:'var(--text-muted)'}}>Cashout now</div>
              <div style={{fontSize:'22px',fontWeight:800,color:'var(--accent)'}}>{currentMult}×</div>
            </div>
          )}
        </BetControls>
        {result && (
          <div className={`card animate-popin ${result.win?'result-win':'result-loss'}`} style={{textAlign:'center'}}>
            {result.win
              ? <><div style={{fontSize:'20px',fontWeight:800}}>{result.mult}× 🎉</div><div>+${(result.payout-bet).toFixed(2)}</div></>
              : <><div style={{fontSize:'24px'}}>🐉</div><div style={{fontWeight:700}}>-${bet.toFixed(2)}</div></>
            }
          </div>
        )}
      </div>

      <div className="game-area" style={{justifyContent:'center',padding:'16px',overflowY:'auto'}}>
        <div style={{display:'flex',flexDirection:'column-reverse',gap:'6px',width:'100%',maxWidth:'360px'}}>
          {Array.from({length:ROWS}).map((_,rowIdx) => {
            const isActive = phase === 'playing' && rowIdx === currentRow
            const isPast   = currentRow > rowIdx && phase === 'playing'
            const revRow   = revealed[rowIdx] || Array(cfg.cols).fill(null)
            const rowMult  = calcMult(rowIdx, cfg)
            return (
              <div key={rowIdx} style={{display:'flex',gap:'6px',alignItems:'center'}}>
                <div style={{
                  fontSize:'11px',fontWeight:700,color: isActive?'var(--accent)':'var(--text-muted)',
                  width:'36px',textAlign:'right',flexShrink:0,
                }}>{rowMult}×</div>
                {Array.from({length:cfg.cols}).map((_,colIdx) => {
                  const rev = revRow[colIdx]
                  const isEgg    = rev === 'egg'
                  const isDragon = rev === 'dragon' || rev === 'dragon-hidden'
                  return (
                    <div
                      key={colIdx}
                      onClick={() => pick(rowIdx, colIdx)}
                      style={{
                        flex:1,aspectRatio:'1.6',borderRadius:'8px',
                        display:'flex',alignItems:'center',justifyContent:'center',
                        fontSize:'20px',
                        cursor: isActive && !rev ? 'pointer' : 'default',
                        background: isEgg ? 'rgba(87,181,86,0.2)' : isDragon ? 'rgba(231,76,60,0.2)' : isActive ? 'var(--bg-hover)' : isPast ? 'rgba(87,181,86,0.08)' : 'var(--bg-card)',
                        border: `2px solid ${isActive&&!rev?'var(--border)':isEgg?'var(--accent)':isDragon?'var(--red)':'transparent'}`,
                        transform: isActive && !rev ? 'scale(1)' : 'scale(0.96)',
                        transition:'all 0.15s',
                        opacity: phase==='ended' && rowIdx > currentRow && !isEgg && !isDragon ? 0.3 : 1,
                      }}
                    >
                      {isEgg ? '🥚' : isDragon ? '🐉' : isActive ? '' : ''}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
