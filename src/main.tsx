import { createRoot } from 'react-dom/client'
import './index.css'
import './locales/i18n'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <App />
)

const bootSplash = document.getElementById('boot-splash')
if (bootSplash) {
  requestAnimationFrame(() => {
    bootSplash.style.opacity = '0'
    setTimeout(() => {
      bootSplash.remove()
    }, 200)
  })
}
