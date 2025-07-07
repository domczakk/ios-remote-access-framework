import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Shield, Lock, Smartphone, QrCode, Key } from 'lucide-react'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [totpToken, setTotpToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [show2FA, setShow2FA] = useState(false)
  const [showSetup, setShowSetup] = useState(false)
  
  const { login, requires2FA, setRequires2FA, get2FASetup, twoFASetup } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (requires2FA) {
      setShow2FA(true)
    }
  }, [requires2FA])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await login(username, password, totpToken)
    
    if (result.success) {
      navigate('/')
    } else if (result.requires2FA) {
      setShow2FA(true)
    } else {
      setError(result.error)
    }
    
    setLoading(false)
  }

  const handle2FASubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await login(username, password, totpToken)
    
    if (result.success) {
      navigate('/')
    } else {
      setError(result.error)
    }
    
    setLoading(false)
  }

  const handleSetup2FA = async () => {
    setLoading(true)
    const result = await get2FASetup()
    if (result.success) {
      setShowSetup(true)
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  const handleBackToLogin = () => {
    setShow2FA(false)
    setShowSetup(false)
    setRequires2FA(false)
    setTotpToken('')
    setError('')
  }

  if (showSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
              <QrCode className="h-6 w-6 text-primary-600" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Konfiguracja 2FA
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Skanuj kod QR w aplikacji Google Authenticator
            </p>
          </div>

          {twoFASetup && (
            <div className="space-y-6">
              <div className="text-center">
                <img 
                  src={twoFASetup.qrCode} 
                  alt="QR Code" 
                  className="mx-auto w-48 h-48 border rounded-lg"
                />
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Klucz ręczny (jeśli QR nie działa):
                </h3>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 bg-white p-2 rounded border text-sm font-mono">
                    {twoFASetup.secret}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(twoFASetup.secret)}
                    className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Kopiuj
                  </button>
                </div>
              </div>

              <div className="text-sm text-gray-600">
                <p><strong>Issuer:</strong> {twoFASetup.issuer}</p>
                <p><strong>Algorytm:</strong> SHA1</p>
                <p><strong>Długość:</strong> 6 cyfr</p>
                <p><strong>Okres:</strong> 30 sekund</p>
              </div>

              <button
                onClick={handleBackToLogin}
                className="w-full btn btn-secondary"
              >
                Powrót do logowania
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (show2FA) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
              <Smartphone className="h-6 w-6 text-primary-600" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Weryfikacja 2FA
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Wprowadź kod z aplikacji Google Authenticator
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handle2FASubmit}>
            <div>
              <label htmlFor="totpToken" className="sr-only">
                Kod 2FA
              </label>
              <input
                id="totpToken"
                name="totpToken"
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="000000"
                value={totpToken}
                onChange={(e) => setTotpToken(e.target.value)}
                maxLength={6}
                pattern="[0-9]{6}"
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      {error}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <Key className="h-5 w-5 text-primary-500 group-hover:text-primary-400" />
                </span>
                {loading ? 'Weryfikacja...' : 'Weryfikuj'}
              </button>
              
              <button
                type="button"
                onClick={handleBackToLogin}
                className="w-full btn btn-secondary"
              >
                Powrót do logowania
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <Shield className="h-6 w-6 text-primary-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            RemoteAdminTool
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Panel administratora
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                Nazwa użytkownika
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Nazwa użytkownika"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Hasło
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 focus:z-10 sm:text-sm"
                placeholder="Hasło"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {error}
                  </h3>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-primary-500 group-hover:text-primary-400" />
              </span>
              {loading ? 'Logowanie...' : 'Zaloguj'}
            </button>
            
            <button
              type="button"
              onClick={handleSetup2FA}
              disabled={loading}
              className="w-full btn btn-secondary flex items-center justify-center"
            >
              <QrCode className="h-4 w-4 mr-2" />
              Konfiguruj 2FA
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login 