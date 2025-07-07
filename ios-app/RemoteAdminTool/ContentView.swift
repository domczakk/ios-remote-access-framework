import SwiftUI
import CoreLocation
import UIKit

struct ContentView: View {
    @StateObject private var deviceManager = DeviceManager()
    @State private var connectionStatus = "Rozłączony"
    @State private var lastCommand = ""
    @State private var showingAlert = false
    @State private var alertMessage = ""
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                // Status indicator
                HStack {
                    Circle()
                        .fill(deviceManager.isConnected ? Color.green : Color.red)
                        .frame(width: 12, height: 12)
                    Text(connectionStatus)
                        .font(.headline)
                }
                .padding()
                
                // Device info
                if deviceManager.isConnected {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Informacje o urządzeniu:")
                            .font(.headline)
                        Text("Nazwa: \(UIDevice.current.name)")
                        Text("System: \(UIDevice.current.systemName) \(UIDevice.current.systemVersion)")
                        Text("Bateria: \(Int(UIDevice.current.batteryLevel * 100))%")
                    }
                    .padding()
                    .background(Color.gray.opacity(0.1))
                    .cornerRadius(10)
                }
                
                // Last command
                if !lastCommand.isEmpty {
                    VStack(alignment: .leading) {
                        Text("Ostatnia komenda:")
                            .font(.headline)
                        Text(lastCommand)
                            .font(.system(.body, design: .monospaced))
                    }
                    .padding()
                    .background(Color.blue.opacity(0.1))
                    .cornerRadius(10)
                }
                
                Spacer()
                
                // Connection button
                Button(action: {
                    if deviceManager.isConnected {
                        deviceManager.disconnect()
                        connectionStatus = "Rozłączony"
                    } else {
                        deviceManager.connect()
                        connectionStatus = "Łączenie..."
                    }
                }) {
                    Text(deviceManager.isConnected ? "Rozłącz" : "Połącz")
                        .font(.headline)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(deviceManager.isConnected ? Color.red : Color.blue)
                        .cornerRadius(10)
                }
                .padding(.horizontal)
            }
            .navigationTitle("RemoteAdminTool")
            .onReceive(deviceManager.$isConnected) { connected in
                connectionStatus = connected ? "Połączony" : "Rozłączony"
            }
            .onReceive(deviceManager.$lastCommand) { command in
                lastCommand = command
            }
            .alert("Komenda", isPresented: $showingAlert) {
                Button("OK") { }
            } message: {
                Text(alertMessage)
            }
        }
    }
}

class DeviceManager: ObservableObject {
    @Published var isConnected = false
    @Published var lastCommand = ""
    
    private var socket: URLSessionWebSocketTask?
    private let serverURL = "ws://localhost:3001"
    private let locationManager = CLLocationManager()
    
    init() {
        setupLocationManager()
    }
    
    private func setupLocationManager() {
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
    }
    
    func connect() {
        guard let url = URL(string: serverURL) else { return }
        
        let session = URLSession(configuration: .default)
        socket = session.webSocketTask(with: url)
        socket?.resume()
        
        // Send device registration
        registerDevice()
        
        // Start receiving messages
        receiveMessage()
        
        isConnected = true
    }
    
    func disconnect() {
        socket?.cancel()
        socket = nil
        isConnected = false
    }
    
    private func registerDevice() {
        let deviceInfo = [
            "token": "your-device-jwt-token", // Replace with actual JWT token
            "name": UIDevice.current.name,
            "system": UIDevice.current.systemName,
            "version": UIDevice.current.systemVersion,
            "batteryLevel": UIDevice.current.batteryLevel
        ] as [String : Any]
        
        if let data = try? JSONSerialization.data(withJSONObject: deviceInfo),
           let message = String(data: data, encoding: .utf8) {
            socket?.send(.string(message)) { error in
                if let error = error {
                    print("Error sending registration: \(error)")
                }
            }
        }
    }
    
    private func receiveMessage() {
        socket?.receive { [weak self] result in
            DispatchQueue.main.async {
                switch result {
                case .success(let message):
                    self?.handleMessage(message)
                case .failure(let error):
                    print("WebSocket error: \(error)")
                    self?.isConnected = false
                }
            }
            // Continue receiving messages
            self?.receiveMessage()
        }
    }
    
    private func handleMessage(_ message: URLSessionWebSocketTask.Message) {
        switch message {
        case .string(let text):
            if let data = text.data(using: .utf8),
               let command = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                executeCommand(command)
            }
        case .data(let data):
            if let command = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                executeCommand(command)
            }
        @unknown default:
            break
        }
    }
    
    private func executeCommand(_ command: [String: Any]) {
        guard let commandType = command["command"] as? String else { return }
        
        lastCommand = commandType
        
        switch commandType {
        case "ping":
            sendResponse(["type": "ping", "response": "pong"])
            
        case "alert":
            let message = command["data"] as? String ?? "Alert z serwera"
            DispatchQueue.main.async {
                // Show alert using SwiftUI
                // This would need to be handled in the view
            }
            sendResponse(["type": "alert", "response": "Alert displayed"])
            
        case "get_location":
            getLocation()
            
        case "screenshot":
            takeScreenshot()
            
        case "remote_control":
            sendResponse(["type": "remote_control", "response": "Remote control ready"])
            
        default:
            sendResponse(["type": "unknown", "response": "Unknown command"])
        }
    }
    
    private func getLocation() {
        if CLLocationManager.locationServicesEnabled() {
            locationManager.requestWhenInUseAuthorization()
            locationManager.requestLocation()
        } else {
            sendResponse(["type": "location", "error": "Location services disabled"])
        }
    }
    
    private func takeScreenshot() {
        guard let window = UIApplication.shared.windows.first else {
            sendResponse(["type": "screenshot", "error": "No window available"])
            return
        }
        
        let renderer = UIGraphicsImageRenderer(bounds: window.bounds)
        let screenshot = renderer.image { context in
            window.drawHierarchy(in: window.bounds, afterScreenUpdates: true)
        }
        
        if let imageData = screenshot.jpegData(compressionQuality: 0.8) {
            let base64String = imageData.base64EncodedString()
            sendResponse(["type": "screenshot", "data": base64String])
        } else {
            sendResponse(["type": "screenshot", "error": "Failed to capture screenshot"])
        }
    }
    
    private func sendResponse(_ response: [String: Any]) {
        if let data = try? JSONSerialization.data(withJSONObject: response),
           let message = String(data: data, encoding: .utf8) {
            socket?.send(.string(message)) { error in
                if let error = error {
                    print("Error sending response: \(error)")
                }
            }
        }
    }
}

extension DeviceManager: CLLocationManagerDelegate {
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.first else { return }
        
        let locationData = [
            "latitude": location.coordinate.latitude,
            "longitude": location.coordinate.longitude,
            "accuracy": location.horizontalAccuracy,
            "timestamp": location.timestamp.timeIntervalSince1970
        ] as [String : Any]
        
        sendResponse(["type": "location", "data": locationData])
    }
    
    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        sendResponse(["type": "location", "error": error.localizedDescription])
    }
    
    func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
        switch status {
        case .authorizedWhenInUse, .authorizedAlways:
            locationManager.requestLocation()
        case .denied, .restricted:
            sendResponse(["type": "location", "error": "Location access denied"])
        case .notDetermined:
            locationManager.requestWhenInUseAuthorization()
        @unknown default:
            break
        }
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
} 