import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useWallet } from '../../context/WalletContext'
import BetControls from '../../components/common/BetControls'

function genCrash() {
  const r = Math.random()
  if (r < 0.01) return 1.0
  return Math.max(1.01, parseFloat((1 / (1 - r * 0.99)).toFixed(2)))
}

export default function Crash() {
  const { user } = useAuth()
  const { balance, recordBet } = useWallet()
  const [bet, setBet]           = useState(1)
  const [phase, setPhase]       = useState('idle')  // idle | playing | crashed
  const [mult, setMult]         = useState(1.0)
  const [history, setHistory]   = useState([2.43, 1.20, 8.71, 1.00, 3.14])
  const [hasBet, setHasBet]     = useState(false)
  const [cashedOut, setCashedOut] = useState(false)
  const [cashMult, setCashMult]  = useState(null)
  const [result, setResult]      = useState(null)

  const crashVal   = useRef(1)
  const timerRef   = useRef(null)
  const startRef   = useRef(0)
  const hasBetRef  = useRef(false)
  const cashedRef  = useRef(false)
  const betRef     = useRef(1)
  const canvasRef  = useRef(null)
  const pointsRef  = useRef([])

  useEffect(() => { betRef.current = bet }, [bet])
  useEffect(() => { hasBetRef.current = hasBet }, [hasBet])
  useEffect(() => { cashedRef.current = cashedOut }, [cashedOut])

  const drawGraph = useCallback((crashed) => {
    const canvas = canvasRef.current
    if (!canvas || pointsRef.current.length < 2) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0, 0, W, H)
    const pts = pointsRef.current
    const maxX = pts[pts.length - 1].x + 20
    const maxY = Math.max(2, pts[pts.length - 1].y + 0.2)
    const px = x => 10 + (x / maxX) * (W - 20)
    const py = y => H - 10 - ((y - 1) / (maxY - 1 || 1)) * (H - 30)

    // grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'
    ctx.lineWidth = 1
    for (let i = 1; i <= 4; i++) {
      const yy = 10 + ((i - 1) / 3) * (H - 20)
      ctx.beginPath(); ctx.moveTo(10, yy); ctx.lineTo(W - 10, yy); ctx.stroke()
    }

    const color = crashed ? '#e74c3c' : '#57b556'
    ctx.beginPath()
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.lineJoin = 'round'
    ctx.moveTo(px(pts[0].x), py(pts[0].y))
    for (const p of pts) ctx.lineTo(px(p.x), py(p.y))
    ctx.stroke()

    ctx.lineTo(px(pts[pts.length-1].x), H)
    ctx.lineTo(px(pts[0].x), H)
    ctx.closePath()
    ctx.fillStyle = crashed ? 'rgba(231,76,60,0.08)' : 'rgba(87,181,86,0.08)'
    ctx.fill()
  }, [])

  const startGame = () => {
    if (phase !== 'idle') return
    const cp = genCrash()
    crashVal.current = cp
    startRef.current = Date.now()
    pointsRef.current = [{ x: 0, y: 1 }]
    setPhase('playing')
    setMult(1.0)
    setCashedOut(false)
    setCashMult(null)
    setResult(null)
    if (user && betRef.current > 0 && betRef.current <= balance) {
      setHasBet(true)
    }

    timerRef.current = setInterval(() => {
      const t = (Date.now() - startRef.current) / 1000
      // Very gradual at the start, then accelerates: exp of a super-linear time term.
      const m = parseFloat(Math.exp(0.06 * Math.pow(t, 1.6)).toFixed(2))
      pointsRef.current.push({ x: t * 120, y: m })
      setMult(m)
      drawGraph(false)

      if (m >= crashVal.current) {
        clearInterval(timerRef.current)
        pointsRef.current.push({ x: t * 120 + 10, y: crashVal.current })
        drawGraph(true)
        setMult(crashVal.current)
        setPhase('crashed')
        setHistory(h => [crashVal.current, ...h].slice(0, 20))
        if (hasBetRef.current && !cashedRef.current) {
          recordBet({ game:'crash', betAmount: betRef.current, payout:0, multiplier: crashVal.current, result:'loss' })
          setResult({ win: false })
          setHasBet(false)
        }
        setTimeout(() => { setPhase('idle'); setHasBet(false) }, 3500)
      }
    }, 80)
  }

  const cashout = async () => {
    if (phase !== 'playing' || !hasBetRef.current || cashedRef.current) return
    setCashedOut(true)
    cashedRef.current = true
    const m = mult
    setCashMult(m)
    const payout = betRef.current * m
    await recordBet({ game:'crash', betAmount: betRef.current, payout, multiplier: m, result:'win' })
    setResult({ win: true, profit: payout - betRef.current })
    setHasBet(false)
  }

  useEffect(() => () => clearInterval(timerRef.current), [])

  const bgColor = phase === 'crashed' ? '#170a0a' : '#0f1923'
  const multColor = phase === 'crashed' ? 'var(--red)' : cashedOut ? 'var(--accent)' : 'var(--text-primary)'

  return (
    <div className="game-page">
      <div className="game-controls-panel">
        <BetControls
          bet={bet} onBetChange={setBet}
          onPlay={startGame}
          playing={phase === 'playing'}
          cashout={phase === 'playing' && hasBet && !cashedOut}
          onCashout={cashout}
          disabled={phase !== 'idle'}
          playLabel="Bet & Start"
        />
        {result && (
          <div className={`card animate-popin ${result.win ? 'result-win' : 'result-loss'}`} style={{textAlign:'center',fontWeight:700,fontSize:'16px'}}>
            {result.win ? `+$${result.profit.toFixed(2)} 🎉` : `-$${betRef.current.toFixed(2)}`}
          </div>
        )}
        <div>
          <div className="bet-label">Recent Crashes</div>
          <div className="recent-chips">
            {history.map((v, i) => (
              <span key={i} className={`chip ${v < 2 ? 'loss' : 'win'}`}>{v.toFixed(2)}×</span>
            ))}
          </div>
        </div>
      </div>

      <div className="game-area" style={{background:bgColor,transition:'background 0.8s',gap:'16px'}}>
        <canvas
          ref={canvasRef}
          width={600} height={280}
          style={{width:'100%',maxWidth:'600px',borderRadius:'8px',border:'1px solid var(--border)'}}
        />
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:'12px',color:'var(--text-secondary)',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'6px'}}>
            {phase === 'idle' ? 'Place your bet' : phase === 'crashed' ? 'CRASHED AT' : cashedOut ? 'Cashed out at' : 'Multiplier'}
          </div>
          <div className="multiplier-big animate-fadein" style={{color:multColor}}>
            {mult.toFixed(2)}×
          </div>
          {cashedOut && cashMult && phase === 'playing' && (
            <div style={{color:'var(--accent)',marginTop:'8px',fontWeight:600,fontSize:'15px'}}>
              Cashed out at {cashMult.toFixed(2)}×
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
