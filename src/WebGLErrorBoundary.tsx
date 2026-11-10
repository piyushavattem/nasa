import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode; fallback?: ReactNode }
type State = { failed: boolean }

/** Keeps the app usable when the browser refuses to create a WebGL context. */
export default class WebGLErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State { return { failed: true } }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    console.warn('WebGL visualization disabled; showing the page fallback.', error.message)
  }

  render() { return this.state.failed ? this.props.fallback ?? null : this.props.children }
}
