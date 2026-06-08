import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { WalletProvider } from './context/WalletContext'
import Layout from './components/Layout/Layout'
import Crash from './games/Crash/Crash'
import Mines from './games/Mines/Mines'
import Plinko from './games/Plinko/Plinko'
import Dice from './games/Dice/Dice'
import Limbo from './games/Limbo/Limbo'
import Keno from './games/Keno/Keno'
import DragonTower from './games/DragonTower/DragonTower'
import Chicken from './games/Chicken/Chicken'
import Stats from './pages/Stats'
import Settings from './pages/Settings'

export default function App() {
  return (
    <AuthProvider>
      <WalletProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/crash" replace />} />
            <Route path="/crash" element={<Crash />} />
            <Route path="/mines" element={<Mines />} />
            <Route path="/plinko" element={<Plinko />} />
            <Route path="/dice" element={<Dice />} />
            <Route path="/limbo" element={<Limbo />} />
            <Route path="/keno" element={<Keno />} />
            <Route path="/dragon-tower" element={<DragonTower />} />
            <Route path="/chicken" element={<Chicken />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </WalletProvider>
    </AuthProvider>
  )
}
