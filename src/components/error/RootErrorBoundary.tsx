import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import styles from './RootErrorBoundary.module.css'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

/**
 * Catches render-time errors anywhere below it so an uncaught throw shows a
 * recoverable fallback instead of a blank white screen. (React Query already
 * handles async/data errors; this is the last line for synchronous render
 * failures.)
 */
export class RootErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In production this is where an error-reporting service would be called.
    console.error('Uncaught render error:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.container} role="alert">
          <div className={styles.card}>
            <h1 className={styles.title}>Something went wrong</h1>
            <p className={styles.message}>
              The app ran into an unexpected error. Reloading usually fixes it.
            </p>
            <button
              type="button"
              className={styles.button}
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
