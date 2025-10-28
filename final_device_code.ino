#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>    // For JSON parsing and creation

// --- CONFIGURATION ---
// WiFi Credentials - replace with your network info
#define WIFI_SSID "Test1"          
#define WIFI_PASSWORD "Test1234"  

// Backend API Configuration
#define BACKEND_URL "https://rfid-attendance-backend-five.vercel.app" 

// Device Credentials (must match your backend DB device record)
// NOTE: MAC address will be auto-detected, but you need to update this secret
// to match what's in your database for your specific device
#define DEVICE_SECRET "YOUR_DEVICE_SECRET_HERE"  // Update this with actual secret from your database

// EM-18 RFID Reader Pins (HardwareSerial)
#define EM18_RX_PIN 16 
#define EM18_TX_PIN 17 

// --- END CONFIGURATION ---

// EM-18 RFID Reader setup
HardwareSerial em18Serial(2); // Use Serial2 (UART2) on ESP32

// Global variables for device state
bool deviceAuthenticated = false;
String authenticatedTeacherId = "";     // Store teacher ID as string
bool isTeacherAuthenticated = false;    // Track teacher authentication status
String activeSessionId = "";             // Active class session ID as string
bool hasActiveSession = false;           // Track active session presence

// --- Function Prototypes ---
void connectWiFi();
String readRfidUid();
long em18ToCollegeDecimal(String em18UID);
void handleTeacherAuthentication(String rfidUid);
void getActiveSessionForTeacher();
void handleStudentScan(String rfidUid);
String getMacAddress();

// --- Setup ---
void setup() {
  Serial.begin(115200);
  em18Serial.begin(9600, SERIAL_8N1, EM18_RX_PIN, EM18_TX_PIN);
  
  Serial.println("RFID Attendance Device Starting...");
  connectWiFi();
  Serial.println("Device MAC Address: " + getMacAddress());
  Serial.println("Ready for operation - scan teacher card to authenticate device");
}

// --- Main Loop ---
void loop() {
  if (em18Serial.available() > 0) {
    String rfidUid = readRfidUid();
    if (rfidUid.length() == 12) {
      Serial.print("Scanned RFID UID: ");
      Serial.println(rfidUid);

      // Convert EM-18 format to college decimal
      long collegeDecimal = em18ToCollegeDecimal(rfidUid);
      if (collegeDecimal <= 0) {
        Serial.println("ERROR: RFID conversion failed - invalid card format");
        delay(2000);
        return;
      }

      if (!deviceAuthenticated) {
        Serial.println("Device not authenticated. Attempting teacher authentication...");
        handleTeacherAuthentication(String(collegeDecimal));
      } else {
        if (!hasActiveSession) {
          Serial.println("Device authenticated, but no active session found. Attempting to get active session...");
          getActiveSessionForTeacher();
          if (!hasActiveSession) {
            Serial.println("No active session for authenticated teacher. Cannot record attendance.");
            delay(2000);
          } else {
            Serial.print("Active session found: ");
            Serial.println(activeSessionId);
            handleStudentScan(String(collegeDecimal));
          }
        } else {
          Serial.print("Active session: ");
          Serial.println(activeSessionId);
          handleStudentScan(String(collegeDecimal));
        }
      }
    } else {
      Serial.print("Invalid RFID UID length received: ");
      Serial.println(rfidUid);
      Serial.print("Actual length: ");
      Serial.println(rfidUid.length());
      while(em18Serial.available()) {
        em18Serial.read();
      }
    }
  }
  delay(50);
}

// --- WiFi Connection ---
void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
  Serial.print("MAC Address: ");
  Serial.println(WiFi.macAddress());
  delay(1000);
}

// --- RFID Reading for EM-18 ---
String readRfidUid() {
  String rfidUid = "";
  char buffer[13];
  int bytesRead = 0;

  long startTime = millis();
  while (bytesRead < 12 && (millis() - startTime < 500)) {
    if (em18Serial.available()) {
      buffer[bytesRead++] = em18Serial.read();
    }
  }
  buffer[bytesRead] = '\0';

  if (bytesRead == 12) {
    rfidUid = String(buffer);
  } else {
    rfidUid = "";
  }

  while(em18Serial.available()) {
    em18Serial.read();
  }

  rfidUid.toUpperCase();
  return rfidUid;
}

// --- EM-18 to College Decimal Conversion ---
long em18ToCollegeDecimal(String em18UID) {
  // Check length
  if (em18UID.length() != 12) {
    Serial.println("Conversion failed: Invalid EM-18 UID length");
    return -1;
  }
  
  // Extract middle 6 hex digits (positions 4-10)
  String hexPart = em18UID.substring(4, 10);
  
  // Validate hex format
  for (int i = 0; i < hexPart.length(); i++) {
    if (!isHexadecimalDigit(hexPart.charAt(i))) {
      Serial.println("Conversion failed: Invalid hex characters");
      return -1;
    }
  }
  
  // Convert hex to decimal
  char hexArray[7];
  hexPart.toCharArray(hexArray, 7);
  long decimal = strtol(hexArray, NULL, 16);
  
  Serial.print("Converted EM-18 ");
  Serial.print(em18UID);
  Serial.print(" -> College UID: ");
  Serial.println(decimal);
  
  return decimal;
}

// --- Teacher Authentication ---
void handleTeacherAuthentication(String collegeUid) {
  HTTPClient http;
  String serverPath = String(BACKEND_URL) + "/api/device/authenticate-teacher";

  Serial.print("Sending teacher authentication request to: ");
  Serial.println(serverPath);

  http.begin(serverPath);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(15000); // 15 seconds timeout

  StaticJsonDocument<200> doc;
  doc["deviceMacAddress"] = getMacAddress();
  doc["teacherRfidUid"] = collegeUid; // Send as string

  String requestBody;
  serializeJson(doc, requestBody);

  Serial.print("Request Body: ");
  Serial.println(requestBody);

  int httpResponseCode = http.POST(requestBody);

  if (httpResponseCode > 0) {
    Serial.printf("HTTP Response code: %d\n", httpResponseCode);
    String response = http.getString();
    Serial.println("Response: " + response);

    StaticJsonDocument<500> responseDoc;
    DeserializationError error = deserializeJson(responseDoc, response);

    if (error) {
      Serial.print(F("deserializeJson() failed: "));
      Serial.println(error.f_str());
      Serial.println("Teacher authentication failed: Invalid JSON response.");
      deviceAuthenticated = false;
      isTeacherAuthenticated = false;
      authenticatedTeacherId = "";
    } else if (httpResponseCode == 200) {
      if (responseDoc.containsKey("teacher") && responseDoc["teacher"].containsKey("id")) {
        deviceAuthenticated = true;
        isTeacherAuthenticated = true;
        authenticatedTeacherId = responseDoc["teacher"]["id"].as<String>();
        String empId = responseDoc["teacher"]["empId"] | "Unknown";

        Serial.printf("Device authenticated by Teacher %s (ID: %s)\n", 
                      empId.c_str(), authenticatedTeacherId.c_str());

        getActiveSessionForTeacher();
      } else {
        Serial.println("Teacher authentication failed: Backend response missing teacher info.");
        deviceAuthenticated = false;
        isTeacherAuthenticated = false;
        authenticatedTeacherId = "";
      }
    } else if (httpResponseCode == 401 || httpResponseCode == 403 || httpResponseCode == 400 || httpResponseCode == 404) {
      String errorMessage = responseDoc["message"] | "Authentication failed. Invalid RFID or device not found.";
      Serial.println(errorMessage);
      deviceAuthenticated = false;
      isTeacherAuthenticated = false;
      authenticatedTeacherId = "";
    } else {
      Serial.printf("Teacher authentication failed with HTTP code %d\n", httpResponseCode);
      deviceAuthenticated = false;
      isTeacherAuthenticated = false;
      authenticatedTeacherId = "";
    }
  } else {
    Serial.printf("Teacher authentication failed. Error: %s\n", http.errorToString(httpResponseCode).c_str());
    deviceAuthenticated = false;
    isTeacherAuthenticated = false;
    authenticatedTeacherId = "";
  }
  http.end();
}

// --- Get Active Session for Authenticated Teacher ---
void getActiveSessionForTeacher() {
  if (!isTeacherAuthenticated || authenticatedTeacherId == "") {
    Serial.println("Cannot get active session: No teacher authenticated on device.");
    activeSessionId = "";
    hasActiveSession = false;
    return;
  }

  HTTPClient http;
  String serverPath = String(BACKEND_URL) + "/api/session/active-by-teacher/" + authenticatedTeacherId;

  Serial.print("Requesting active session for teacher ID ");
  Serial.print(authenticatedTeacherId);
  Serial.print(" from: ");
  Serial.println(serverPath);

  http.begin(serverPath);
  http.addHeader("x-device-mac", getMacAddress());
  http.addHeader("x-device-secret", DEVICE_SECRET);
  http.setTimeout(15000);

  int httpResponseCode = http.GET();

  if (httpResponseCode > 0) {
    Serial.printf("HTTP Response code: %d\n", httpResponseCode);
    String response = http.getString();
    Serial.println("Response: " + response);

    StaticJsonDocument<1000> responseDoc; // increased size for large response
    DeserializationError error = deserializeJson(responseDoc, response);

    if (error) {
      Serial.print(F("deserializeJson() failed: "));
      Serial.println(error.f_str());
      Serial.println("Failed to parse active session response.");
      activeSessionId = "";
      hasActiveSession = false;
    } else if (httpResponseCode == 200) {
      if (responseDoc.containsKey("id")) {
        activeSessionId = responseDoc["id"].as<String>();
        hasActiveSession = true;
        Serial.print("Successfully retrieved active session ID: ");
        Serial.println(activeSessionId);
      } else {
        Serial.println("No active session found for this teacher (ID not in response).");
        activeSessionId = "";
        hasActiveSession = false;
      }
    } else if (httpResponseCode == 404) {
      Serial.println("No active session found for this teacher (404).");
      activeSessionId = "";
      hasActiveSession = false;
    } else {
      Serial.printf("Failed to get active session. HTTP code: %d\n", httpResponseCode);
      activeSessionId = "";
      hasActiveSession = false;
    }
  } else {
    Serial.printf("Failed to get active session. Error: %s\n", http.errorToString(httpResponseCode).c_str());
    activeSessionId = "";
    hasActiveSession = false;
  }
  http.end();
  delay(1000);
}

// --- Student Scan Handling ---
void handleStudentScan(String collegeUid) {
  HTTPClient http;
  String serverPath = String(BACKEND_URL) + "/api/scan/rfid";

  Serial.print("Sending student scan request to: ");
  Serial.println(serverPath);

  http.begin(serverPath);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-mac", getMacAddress());
  http.addHeader("x-device-secret", DEVICE_SECRET);
  http.setTimeout(15000);

  StaticJsonDocument<200> doc;
  doc["rfidUid"] = collegeUid; // Send as string
  doc["deviceMacAddress"] = getMacAddress();
  doc["sessionId"] = activeSessionId;

  String requestBody;
  serializeJson(doc, requestBody);

  Serial.print("Request Body: ");
  Serial.println(requestBody);

  int httpResponseCode = http.POST(requestBody);

  if (httpResponseCode > 0) {
    Serial.printf("HTTP Response code: %d\n", httpResponseCode);
    String response = http.getString();
    Serial.println("Response: " + response);

    StaticJsonDocument<500> responseDoc;
    DeserializationError error = deserializeJson(responseDoc, response);

    if (error) {
      Serial.print(F("deserializeJson() failed: "));
      Serial.println(error.f_str());
      Serial.println("Student attendance failed: Invalid JSON response.");
    } else if (httpResponseCode == 201) {
      Serial.println("✅ Student attendance recorded successfully!");
    } else if (httpResponseCode == 409) {
      String errorMessage = responseDoc["message"] | "Student already marked present for this session.";
      Serial.println("⚠️  " + errorMessage);
    } else if (httpResponseCode == 401 || httpResponseCode == 403 || httpResponseCode == 400 || httpResponseCode == 404) {
      String errorMessage = responseDoc["message"] | "Attendance recording failed due to validation error.";
      Serial.println("❌ " + errorMessage);
    } else {
      Serial.printf("❌ Student attendance failed with HTTP code %d\n", httpResponseCode);
    }
  } else {
    Serial.printf("❌ Student attendance failed. Error: %s\n", http.errorToString(httpResponseCode).c_str());
  }
  http.end();
}

// --- Get ESP32 MAC Address ---
String getMacAddress() {
  byte mac[6];
  WiFi.macAddress(mac);
  String macAddress = "";
  for (int i = 0; i < 6; ++i) {
    if (mac[i] < 0x10) {
      macAddress += "0";
    }
    macAddress += String(mac[i], HEX);
    if (i < 5) {
      macAddress += ":";
    }
  }
  macAddress.toUpperCase();
  return macAddress;
}