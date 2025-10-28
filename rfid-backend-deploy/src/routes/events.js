// rfid-attendance-system/apps/backend/src/routes/events.js
import express from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.js';

const router = express.Router();

// Store active SSE connections
const activeConnections = new Map();

/**
 * SSE endpoint for real-time updates
 */
router.get('/attendance-updates', authenticateToken, authorizeRoles(['TEACHER', 'PCOORD', 'ADMIN']), (req, res) => {
  const { sessionId } = req.query;
  const userId = req.user.id;

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Send initial connection message
  res.write('data: {"type": "connected", "message": "SSE connection established"}\n\n');

  // Store connection
  const connectionKey = `${userId}-${sessionId}`;
  activeConnections.set(connectionKey, { res, sessionId, userId });

  console.log(`SSE connection established for user ${userId}, session ${sessionId}`);

  // Handle client disconnect
  req.on('close', () => {
    activeConnections.delete(connectionKey);
    console.log(`SSE connection closed for user ${userId}, session ${sessionId}`);
  });

  // Keep connection alive with periodic pings
  const keepAlive = setInterval(() => {
    if (res.writableEnded) {
      clearInterval(keepAlive);
      activeConnections.delete(connectionKey);
      return;
    }
    res.write('data: {"type": "ping"}\n\n');
  }, 30000); // 30 seconds

  req.on('close', () => {
    clearInterval(keepAlive);
  });
});

/**
 * Broadcast device authentication status to all connected clients
 */
export function broadcastDeviceAuthStatus(authData) {
  const message = {
    type: 'DEVICE_AUTH_STATUS_UPDATE',
    isAuth: authData.isAuth,
    authenticatedBy: authData.authenticatedBy,
    deviceMacAddress: authData.deviceMacAddress,
    message: authData.message,
    timestamp: new Date().toISOString()
  };

  activeConnections.forEach(({ res }, connectionKey) => {
    try {
      if (!res.writableEnded) {
        res.write(`event: device-auth\ndata: ${JSON.stringify(message)}\n\n`);
      } else {
        activeConnections.delete(connectionKey);
      }
    } catch (error) {
      console.error(`Error broadcasting to ${connectionKey}:`, error);
      activeConnections.delete(connectionKey);
    }
  });

  console.log(`Broadcasted device auth status to ${activeConnections.size} connections`);
}

/**
 * Broadcast attendance updates to relevant session connections
 */
export function broadcastAttendanceUpdate(sessionId, attendanceData) {
  const message = {
    type: 'ATTENDANCE_SNAPSHOT_UPDATE',
    sessionId,
    attendance: attendanceData,
    timestamp: new Date().toISOString()
  };

  let broadcastCount = 0;
  activeConnections.forEach(({ res, sessionId: connSessionId }, connectionKey) => {
    if (connSessionId === sessionId) {
      try {
        if (!res.writableEnded) {
          res.write(`event: attendance-update\ndata: ${JSON.stringify(message)}\n\n`);
          broadcastCount++;
        } else {
          activeConnections.delete(connectionKey);
        }
      } catch (error) {
        console.error(`Error broadcasting attendance to ${connectionKey}:`, error);
        activeConnections.delete(connectionKey);
      }
    }
  });

  console.log(`Broadcasted attendance update for session ${sessionId} to ${broadcastCount} connections`);
}

export default router;
