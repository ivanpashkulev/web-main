import { useTheme } from '@/hooks/useTheme'
import Home from '@/components/Home/Home'
import { ToastContainer } from '@/components/common/Toast/ToastContainer'
import { ToastProvider } from '@/components/common/Toast/ToastProvider'

const App = () => {
  const { theme, toggleTheme } = useTheme()
  return (
    <ToastProvider>
      <Home theme={theme} onToggle={toggleTheme} />
      <ToastContainer />
    </ToastProvider>
  )
}

export default App
