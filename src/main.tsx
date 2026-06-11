import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AppProviders } from './app/providers.tsx'
import { RootErrorBoundary } from './components/error/RootErrorBoundary.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootErrorBoundary>
      <AppProviders>
        <App />
      </AppProviders>
    </RootErrorBoundary>
  </StrictMode>,
)
