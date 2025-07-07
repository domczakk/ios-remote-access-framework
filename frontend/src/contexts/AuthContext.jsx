import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [requires2FA, setRequires2FA] = useState(false)
  const [twoFASetup, setTwoFASetup] = useState(null)

  useEffect(() => {
    const savedToken = localStorage.getItem('adminToken')
    if (savedToken) {
      setToken(savedToken)
      setIsAuthenticated(true)
      // Set default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`
    }
    setLoading(false)
  }, [])

  const login = async (username, password, totpToken = null) => {
    try {
      const response = await axios.post('/api/login', { 
        username, 
        password, 
        totpToken 
      })
      
      if (response.data.requires2FA) {
        setRequires2FA(true)
        return { success: false, requires2FA: true }
      }
      
      const { token } = response.data
      
      localStorage.setItem('adminToken', token)
      setToken(token)
      setIsAuthenticated(true)
      setRequires2FA(false)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      return { success: true }
    } catch (error) {
      if (error.response?.data?.requires2FA) {
        setRequires2FA(true)
        return { success: false, requires2FA: true }
      }
      
      return { 
        success: false, 
        error: error.response?.data?.error || 'Błąd logowania' 
      }
    }
  }

  const verify2FA = async (totpToken) => {
    try {
      const response = await axios.post('/api/2fa/verify', { token: totpToken })
      return { success: true, valid: response.data.valid }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Błąd weryfikacji 2FA' 
      }
    }
  }

  const get2FASetup = async () => {
    try {
      const response = await axios.get('/api/2fa/setup')
      setTwoFASetup(response.data)
      return { success: true, data: response.data }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Błąd pobierania konfiguracji 2FA' 
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('adminToken')
    setToken(null)
    setIsAuthenticated(false)
    setRequires2FA(false)
    setTwoFASetup(null)
    delete axios.defaults.headers.common['Authorization']
  }

  const value = {
    isAuthenticated,
    token,
    login,
    logout,
    loading,
    requires2FA,
    setRequires2FA,
    verify2FA,
    get2FASetup,
    twoFASetup
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
} 