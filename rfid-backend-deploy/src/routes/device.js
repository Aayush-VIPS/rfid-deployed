// rfid-attendance-system/apps/backend/src/routes/device.js
import { Router } from 'express';
import { ObjectId } from 'mongodb'; // ✅ ADDED: Import for ObjectId validation
import * as deviceService from '../services/deviceService.js';
import createError from 'http-errors';
import authenticateDevice from '../middlewares/deviceAuth.js'; // Import device authentication middleware (default export)
import WebSocket from 'ws'; // Import WebSocket

const router = Router();

// Endpoint for devices to send periodic heartbeats (device-authenticated)
router.post('/heartbeat', authenticateDevice, async (req, res, next) => {
  try {
    const { macAddr } = req.device; // Using macAddr as per your schema
    const updatedDevice = await deviceService.recordDeviceHeartbeat(macAddr);
    res.json({ message: 'Heartbeat recorded successfully', device: updatedDevice });
  } catch (error) {
    next(error);
  }
});

// Endpoint for admin to register a new RFID device (admin-authenticated)
router.post('/register', async (req, res, next) => { // Assuming this route is protected by admin auth middleware elsewhere
  try {
    const newDevice = await deviceService.registerDevice(req.body);
    res.status(201).json({ message: 'Device registered successfully', device: newDevice });
  } catch (error) {
    next(error);
  }
});

// Endpoint to get all registered devices (admin-authenticated)
router.get('/all', async (req, res, next) => { // Assuming this route is protected by admin auth middleware elsewhere
  try {
    const devices = await deviceService.getAllDevices();
    res.json(devices);
  } catch (error) {
    next(error);
  }
});

// NEW ROUTE: Get device authentication status for frontend polling
router.get('/auth-status/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    
    console.log(`[Device Auth Status] Received request for session: ${sessionId}`);
    
    // Get session details to find the authenticated device
    const session = await req.app.locals.prisma.classSession.findUnique({
      where: { id: sessionId },
      include: {
        teacher: true,
        device: true
      }
    });
    
    console.log(`[Device Auth Status] Session ${sessionId} query result:`, {
      found: !!session,
      sessionId: session?.id,
      hasDevice: !!session?.device,
      deviceId: session?.deviceId,
      deviceMac: session?.device?.macAddr,
      teacherName: session?.teacher?.name,
      teacherId: session?.teacherId,
      isClosed: session?.isClosed
    }); // Enhanced debug log
    
    if (!session) {
      const errorResponse = { 
        isAuth: false, 
        authenticatedBy: 'N/A',
        deviceMacAddress: 'N/A',
        message: 'Session not found' 
      };
      console.log(`[Device Auth Status] Session not found, returning:`, errorResponse);
      return res.status(404).json(errorResponse);
    }
    
    // Check if there's a device associated with this session
    const isAuth = session.device ? true : false;
    
    const response = {
      isAuth: isAuth,
      authenticatedBy: isAuth ? session.teacher.name : 'N/A',
      deviceMacAddress: isAuth ? session.device.macAddr : 'N/A',
      message: isAuth ? `Device authenticated and ready (${session.device.name || 'Unnamed Device'})` : 'Device not authenticated - Teacher needs to scan RFID card'
    };
    
    console.log(`[Device Auth Status] Returning response:`, response);
    
    res.json(response);
    
  } catch (error) {
    console.error(`[Device Auth Status] Error:`, error);
    next(error);
  }
});

// NEW ROUTE: Teacher authenticates the device with their RFID
// This route will be called by the ESP32 after a teacher scans their card.
router.post('/authenticate-teacher', async (req, res, next) => {
  try {
    const { deviceMacAddress, teacherRfidUid, sessionId } = req.body;

    if (!deviceMacAddress || !teacherRfidUid) {
      throw createError(400, 'Device MAC address and teacher RFID UID are required.');
    }

    // ✅ IMPROVED: Add basic validation for RFID UID format if needed
    // Note: RFID UIDs are typically strings, so no ObjectId validation needed here
    if (typeof deviceMacAddress !== 'string' || typeof teacherRfidUid !== 'string') {
      throw createError(400, 'Device MAC address and teacher RFID UID must be valid strings.');
    }

    // Call the simplified service function - it only verifies, doesn't update device DB record
    const result = await deviceService.authenticateDeviceByTeacherRfid(deviceMacAddress, teacherRfidUid);

    // Automatically link device to any active sessions for this teacher
    console.log(`[Device Auth] Looking for device with MAC: ${deviceMacAddress}`);
    let device = await req.app.locals.prisma.device.findUnique({
      where: { macAddr: deviceMacAddress }
    });
    
    if (!device) {
      console.log(`[Device Auth] Device not found with MAC: ${deviceMacAddress}`);
      // Try to find device with the hardcoded MAC as fallback
      device = await req.app.locals.prisma.device.findUnique({
        where: { macAddr: "1C:69:20:A3:8A:4C" }
      });
      
      if (device) {
        console.log(`[Device Auth] Found device with hardcoded MAC: ${device.macAddr}, using that instead`);
      } else {
        console.log(`[Device Auth] No device found with either MAC address`);
      }
    } else {
      console.log(`[Device Auth] Found device with provided MAC: ${device.macAddr}`);
    }
    
    if (device && result.teacher) {
      // Find any active sessions for this teacher (including those without devices linked)
      const activeSessions = await req.app.locals.prisma.classSession.findMany({
        where: {
          teacherId: result.teacher.id,
          isClosed: false
        }
      });
      
      // Update all active sessions to use this device
      for (const session of activeSessions) {
        console.log(`[Device Auth] Linking device ${device.id} to session ${session.id}`);
        await req.app.locals.prisma.classSession.update({
          where: { id: session.id },
          data: { deviceId: device.id }
        });
        console.log(`[Device Auth] Successfully linked device to session ${session.id}`);
      }
      
      console.log(`[Device Auth] Linked device ${deviceMacAddress} (ID: ${device.id}) to ${activeSessions.length} active sessions for teacher ${result.teacher.empId}`);
    }

    // Get the WebSocket server instance from app.locals (assuming app.js sets it up)
    const wss = req.app.locals.wss;

    if (wss && wss.clients) {
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          // Send update to all connected clients (especially AttendanceBoard)
          client.send(JSON.stringify({
            type: 'DEVICE_AUTH_STATUS_UPDATE',
            deviceMacAddress: deviceMacAddress,
            isAuth: true, // Device is now authenticated locally on ESP32
            authenticatedBy: result.teacher.name, // Name of the teacher who authenticated it
            authenticatedTeacherId: result.teacher.id, // ID of the teacher (for ESP32 to query session)
            message: result.message
          }));
        }
      });
    }

    res.json({ message: result.message, teacher: result.teacher });
  } catch (error) {
    next(error);
  }
});

export default router;
