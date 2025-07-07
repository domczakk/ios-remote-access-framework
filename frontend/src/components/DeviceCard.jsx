import { useState } from 'react'
import { 
  Wifi, 
  Battery, 
  MapPin, 
  Camera, 
  AlertTriangle, 
  Zap,
  Monitor,
  Activity
} from 'lucide-react'
import axios from 'axios'

function DeviceCard({ device, onCommandSent }) {
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState(null)
  const [showResponse, setShowResponse] = useState(false)

  const sendCommand = async (command, data = null) => {
    try {
      setLoading(true)
      setResponse(null)
      setShowResponse(false)

      const response = await axios.post('/api/send-command', {
        deviceId: device.socketId,
        command,
        data
      })

      setResponse(response.data)
      setShowResponse(true)
      onCommandSent()
    } catch (error) {
      setResponse({
        error: error.response?.data?.error || 'Błąd wysyłania komendy'
      })
      setShowResponse(true)
    } finally {
      setLoading(false)
    }
  }

  const getBatteryColor = (level) => {
    if (level > 0.5) return 'text-green-600'
    if (level > 0.2) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getBatteryIcon = (level) => {
    if (level > 0.8) return '🔋'
    if (level > 0.5) return '🔋'
    if (level > 0.2) return '🔋'
    return '🔋'
  }

  return (
    <div className="card">
      {/* Device header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Wifi className="h-5 w-5 text-green-500 mr-2" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {device.name}
            </h3>
            <p className="text-sm text-gray-500">
              {device.system} {device.version}
            </p>
          </div>
        </div>
        <div className="flex items-center text-sm">
          <span className={getBatteryColor(device.batteryLevel)}>
            {getBatteryIcon(device.batteryLevel)}
          </span>
          <span className="ml-1">
            {Math.round(device.batteryLevel * 100)}%
          </span>
        </div>
      </div>

      {/* Device info */}
      <div className="mb-4 text-sm text-gray-600">
        <p>ID: {device.socketId}</p>
        <p>Połączono: {new Date(device.connectedAt).toLocaleString()}</p>
      </div>

      {/* Command buttons */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => sendCommand('ping')}
          disabled={loading}
          className="btn btn-secondary flex items-center justify-center text-xs"
        >
          <Activity className="h-4 w-4 mr-1" />
          Ping
        </button>
        
        <button
          onClick={() => sendCommand('alert', 'Test alert z panelu administratora')}
          disabled={loading}
          className="btn btn-secondary flex items-center justify-center text-xs"
        >
          <AlertTriangle className="h-4 w-4 mr-1" />
          Alert
        </button>
        
        <button
          onClick={() => sendCommand('get_location')}
          disabled={loading}
          className="btn btn-secondary flex items-center justify-center text-xs"
        >
          <MapPin className="h-4 w-4 mr-1" />
          Lokalizacja
        </button>
        
        <button
          onClick={() => sendCommand('screenshot')}
          disabled={loading}
          className="btn btn-secondary flex items-center justify-center text-xs"
        >
          <Camera className="h-4 w-4 mr-1" />
          Screenshot
        </button>
      </div>

      {/* Remote control button */}
      <button
        onClick={() => sendCommand('remote_control')}
        disabled={loading}
        className="w-full btn btn-primary flex items-center justify-center"
      >
        <Monitor className="h-4 w-4 mr-2" />
        Zdalna kontrola
      </button>

      {/* Response display */}
      {showResponse && response && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Odpowiedź:
          </h4>
          {response.error ? (
            <p className="text-sm text-red-600">{response.error}</p>
          ) : (
            <div className="text-sm text-gray-700">
              {response.message && <p>{response.message}</p>}
              {response.data && (
                <div className="mt-2">
                  {response.data.type === 'screenshot' && response.data.data ? (
                    <div>
                      <p className="mb-2">Screenshot:</p>
                      <img 
                        src={`data:image/jpeg;base64,${response.data.data}`}
                        alt="Screenshot"
                        className="w-full rounded border"
                      />
                    </div>
                  ) : response.data.type === 'location' && response.data.data ? (
                    <div>
                      <p className="mb-2">Lokalizacja:</p>
                      <p>Lat: {response.data.data.latitude}</p>
                      <p>Lng: {response.data.data.longitude}</p>
                      <p>Dokładność: {response.data.data.accuracy}m</p>
                    </div>
                  ) : (
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(response.data, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="mt-4 flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
        </div>
      )}
    </div>
  )
}

export default DeviceCard 