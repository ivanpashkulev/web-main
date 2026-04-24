import type { Theme } from '@/types'
import { SunIcon, MoonIcon } from '@/components/common/icons'
import './ThemeToggle.scss'

interface Props {
  theme: Theme
  onToggle: () => void
}

const ThemeToggle = ({ theme, onToggle }: Props) => (
  <button className="theme-toggle" onClick={onToggle} aria-label="Toggle theme">
    {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
  </button>
)

export default ThemeToggle
