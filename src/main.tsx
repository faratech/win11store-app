import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ThemeProvider } from './contexts/ThemeContext.tsx'
import './index.css'

const rootElement = document.getElementById('win11-store-root') || document.getElementById('root')

if (rootElement) {
  // The XF controller stamps the routed section onto the root div; hydrating
  // from it is what makes /store/xbox/ open on Xbox instead of the landing view.
  const initialSection = rootElement.dataset.section ?? ''

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ThemeProvider>
        <App initialSection={initialSection} />
      </ThemeProvider>
    </React.StrictMode>,
  )
}
