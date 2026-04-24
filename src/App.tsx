import { useTheme } from '@/hooks/useTheme'
import Home from '@/components/Home/Home'

const App = () => {
  const { theme, toggleTheme } = useTheme()
  return <Home theme={theme} onToggle={toggleTheme} />
}

export default App
