import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/auth.store'
import Login from './routes/Login'
import Inbox from './routes/Inbox'
import Compose from './routes/Compose'
import Settings from './routes/Settings'
import Chat from './routes/Chat'
import Tags from './routes/Tags'
import Layout from './components/Layout'

function App() {
  const { isConnected } = useAuthStore()

  return (
    <Routes>
      <Route
        path="/"
        element={
          isConnected ? <Navigate to="/inbox" replace /> : <Login />
        }
      />
      {/* 允许游客模式访问 - 不需要钱包连接 */}
      <Route element={<Layout />}>
        <Route path="/inbox" element={<Inbox />} />
        <Route path="/compose" element={<Compose />} />
        <Route path="/compose/:replyTo" element={<Compose />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/chat/:address" element={<Chat />} />
        <Route path="/tags" element={<Tags />} />
        <Route path="/tags/:id" element={<Tags />} />
      </Route>
    </Routes>
  )
}

export default App
