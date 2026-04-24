import Chat from '@/components/Chat/Chat'
import ThemeToggle from '@/components/common/ThemeToggle/ThemeToggle'
import type { Theme } from '@/types'
import './Home.scss'

interface Props {
  theme: Theme
  onToggle: () => void
}

const Home = ({ theme, onToggle }: Props) => (
  <div className="home">
    <header className="home__header">
      <div className="home__identity">
        <div className="home__avatar" />
        <div className="home__bio">
          <h1 className="home__name">Ivan Pashkulev</h1>
          <p className="home__title">Software Engineer · AI &amp; Full-Stack</p>
          <p className="home__description">
            Building intelligent systems and modern web applications.
            Ask me anything about my work, skills, or experience.
          </p>
        </div>
      </div>
      <ThemeToggle theme={theme} onToggle={onToggle} />
    </header>
    <main className="home__chat">
      <Chat />
    </main>
  </div>
)

export default Home
