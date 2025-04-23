import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './config/axiosConfig.js'
import { AuthProvider } from './context/AuthContext'
import { BusinessProvider } from './context/BusinessContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BusinessProvider>
        <App />
      </BusinessProvider>
    </AuthProvider>
  </React.StrictMode>,
)
