import { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const close = () => setSidebarOpen(false)
  return (
    <div style={{minHeight:'100vh'}}>
      <Header onMenuClick={() => setSidebarOpen(o => !o)} />
      <div className="app-body">
        <Sidebar open={sidebarOpen} onClose={close} />
        {sidebarOpen && (
          <div
            onClick={close}
            style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:80,display:'none'}}
            id="sidebar-backdrop"
          />
        )}
        <main className="main-content">{children}</main>
      </div>
      <style>{`
        @media(max-width:900px){
          #sidebar-backdrop{display:block!important}
        }
      `}</style>
    </div>
  )
}
