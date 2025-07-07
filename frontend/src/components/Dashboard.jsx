import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import DeviceCard from './DeviceCard'
import { LogOut, RefreshCw, Smartphone, Shield } from 'lucide-react'
import axios from 'axios'

function Dashboard() {
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [healthStatus, setHealthStatus] = useState(null)
  const { logout } = useAuth()

  const fetchDevices = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/devices')
      setDevices(response.data.devices)
      setError('')
    } catch (error) {
      setError('Błąd podczas pobierania urządzeń')
      console.error('Error fetching devices:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchHealthStatus = async () => {
    try {
      const response = await axios.get('/api/health')
      setHealthStatus(response.data)
    } catch (error) {
      console.error('Error fetching health status:', error)
    }
  }

  useEffect(() => {
    fetchDevices()
    fetchHealthStatus()
    
    // Refresh devices every 30 seconds
    const interval = setInterval(fetchDevices, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Smartphone className="h-8 w-8 text-primary-600" />
              <h1 className="ml-3 text-2xl font-bold text-gray-900">
                RemoteAdminTool
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* 2FA Status */}
              {healthStatus && (
                <div className="flex items-center space-x-2 text-sm">
                  <Shield className={`h-4 w-4 ${healthStatus.twoFactorEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className={healthStatus.twoFactorEnabled ? 'text-green-600' : 'text-gray-500'}>
                    2FA {healthStatus.twoFactorEnabled ? 'Włączone' : 'Wyłączone'}
                  </span>
                </div>
              )}
              
              <button
                onClick={fetchDevices}
                disabled={loading}
                className="btn btn-secondary flex items-center"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Odśwież
              </button>
              <button
                onClick={handleLogout}
                className="btn btn-danger flex items-center"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Wyloguj
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  {error}
                </h3>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-12">
            <Smartphone className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Brak podłączonych urządzeń
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Uruchom aplikację na urządzeniu iOS, aby się pojawiła tutaj.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {devices.map((device) => (
              <DeviceCard 
                key={device.socketId} 
                device={device}
                onCommandSent={fetchDevices}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default Dashboard 