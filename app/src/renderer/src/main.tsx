import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles.css'

// Electron navigates the window when a file or link is dropped onto it, which
// would expose the privileged preload API to that document.
for (const event of ['dragover', 'drop']) {
  window.addEventListener(event, (e) => e.preventDefault())
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
