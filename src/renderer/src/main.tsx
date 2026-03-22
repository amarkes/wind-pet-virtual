import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import FloatApp from './FloatApp'
import './styles/globals.css'

const isFloat = new URLSearchParams(window.location.search).get('window') === 'float'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    {isFloat ? <FloatApp /> : <App />}
  </React.StrictMode>
)
