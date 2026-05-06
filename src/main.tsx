import { createRoot } from 'react-dom/client'
import './index.css'
import './locales/i18n'
import App from './App.tsx'

// Xử lý lỗi chunk caching khi deploy bản mới (Failed to fetch dynamically imported module)
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Vite preload error (chunk missing). Reloading the page...');
  window.location.reload();
});

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
