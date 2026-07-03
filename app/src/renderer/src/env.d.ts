import type { Api } from '../../preload'
import type React from 'react'

declare global {
  interface Window {
    api: Api
  }

  // React 19 moved the JSX namespace under React.JSX. Re-expose it globally so
  // `: JSX.Element` return annotations continue to work across the renderer.
  namespace JSX {
    type Element = React.JSX.Element
    type ElementClass = React.JSX.ElementClass
    type IntrinsicElements = React.JSX.IntrinsicElements
  }
}

export {}
