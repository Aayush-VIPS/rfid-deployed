// Script to simulate device authentication for testing
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

async function simulateDeviceAuth() {
    try {
        console.log('🔧 Starting device authentication simulation...');
        
        // First, let's check what sessions are available
        console.log('\n1. Checking available sessions...');
        const sessionsRes = await fetch(`${API_BASE_URL}/api/session/active`);
        
        if (!sessionsRes.ok) {
            throw new Error(`Failed to fetch sessions: ${sessionsRes.status}`);
        }
        
        const sessions = await sessionsRes.json();
        console.log('Active sessions:', sessions);
        
        if (sessions.length === 0) {
            console.log('❌ No active sessions found. Please start a session first.');
            return;
        }
        
        const session = sessions[0]; // Use the first active session
        console.log(`\n2. Using session: ${session.id}`);
        console.log(`   Teacher: ${session.subjectInst?.faculty?.name}`);
        console.log(`   Subject: ${session.subjectInst?.subject?.name}`);
        
        // Check if there are any devices registered
        console.log('\n3. Checking registered devices...');
        const devicesRes = await fetch(`${API_BASE_URL}/api/device/all`);
        
        if (!devicesRes.ok) {
            throw new Error(`Failed to fetch devices: ${devicesRes.status}`);
        }
        
        const devices = await devicesRes.json();
        console.log('Registered devices:', devices);
        
        if (devices.length === 0) {
            console.log('❌ No devices registered. Registering a test device...');
            
            // Register a test device
            const registerRes = await fetch(`${API_BASE_URL}/api/device/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    macAddr: 'AA:BB:CC:DD:EE:FF',
                    name: 'Test Device for Simulation'
                })
            });
            
            if (!registerRes.ok) {
                throw new Error(`Failed to register device: ${registerRes.status}`);
            }
            
            const newDevice = await registerRes.json();
            console.log('✅ Test device registered:', newDevice);
        }
        
        // Get the teacher's RFID UID (we'll use empId as a fallback)
        const teacherRfidUid = session.subjectInst?.faculty?.rfidUid || session.subjectInst?.faculty?.empId || 'TEST_TEACHER_RFID';
        console.log(`\n4. Simulating teacher RFID scan with UID: ${teacherRfidUid}`);
        
        // Simulate device authentication
        const authRes = await fetch(`${API_BASE_URL}/api/device/authenticate-teacher`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                deviceMacAddress: devices[0]?.macAddr || 'AA:BB:CC:DD:EE:FF',
                teacherRfidUid: teacherRfidUid,
                sessionId: session.id
            })
        });
        
        if (!authRes.ok) {
            const errorData = await authRes.json();
            throw new Error(`Device authentication failed: ${authRes.status} - ${errorData.message}`);
        }
        
        const authResult = await authRes.json();
        console.log('✅ Device authentication successful:', authResult);
        
        // Check the authentication status
        console.log('\n5. Checking authentication status...');
        const statusRes = await fetch(`${API_BASE_URL}/api/device/auth-status/${session.id}`);
        
        if (!statusRes.ok) {
            throw new Error(`Failed to check auth status: ${statusRes.status}`);
        }
        
        const status = await statusRes.json();
        console.log('Authentication status:', status);
        
        console.log('\n🎉 Simulation complete! The AttendanceBoard should now show the device as authenticated.');
        
    } catch (error) {
        console.error('❌ Simulation failed:', error.message);
    }
}

// Run the simulation
simulateDeviceAuth();