// Test script to simulate ESP32 authentication request
import fetch from 'node-fetch';

const BACKEND_URL = "https://studentattendancesplit.vercel.app";

async function testAuthentication() {
  try {
    console.log('=== TESTING ESP32 AUTHENTICATION ENDPOINT ===\n');
    
    // Simulate ESP32 request
    const requestData = {
      deviceMacAddress: "1C:69:20:A3:8A:4C", // Hardcoded MAC from ESP32
      teacherRfidUid: "TEST123456789" // You'll need to replace with a real teacher RFID
    };
    
    console.log('Sending request to:', `${BACKEND_URL}/api/device/authenticate-teacher`);
    console.log('Request data:', requestData);
    
    const response = await fetch(`${BACKEND_URL}/api/device/authenticate-teacher`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    console.log('\nResponse status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (response.ok) {
      console.log('\n✅ Authentication endpoint is working!');
      const data = JSON.parse(responseText);
      if (data.teacher) {
        console.log('Teacher authenticated:', data.teacher.name);
      }
    } else {
      console.log('\n❌ Authentication failed');
      console.log('This could be normal if the RFID UID is not in database');
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
    console.log('\nThis suggests the ESP32 cannot reach the backend URL');
  }
}

// Test auth status endpoint too
async function testAuthStatus() {
  try {
    console.log('\n=== TESTING AUTH STATUS ENDPOINT ===\n');
    
    // You'll need to replace with a real session ID
    const testSessionId = "test-session-id";
    
    console.log('Testing auth status for session:', testSessionId);
    
    const response = await fetch(`${BACKEND_URL}/api/device/auth-status/${testSessionId}`);
    
    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
  } catch (error) {
    console.error('Network error:', error.message);
  }
}

testAuthentication()
  .then(() => testAuthStatus())
  .catch(console.error);