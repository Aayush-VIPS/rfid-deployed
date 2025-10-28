// rfid-attendance-system/apps/backend/src/routes/session.js
import { Router } from 'express';
import { ObjectId } from 'mongodb'; // Add this import for ObjectId validation
import * as sessionService from '../services/sessionService.js';
import createError from 'http-errors';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.js';
import authenticateDevice from '../middlewares/deviceAuth.js';
import WebSocket from 'ws';

const router = Router();

// Middleware to get WebSocket server instance
router.use((req, res, next) => {
    req.wss = req.app.locals.wss;
    next();
});

// Start a new class session
router.post('/start', authenticateToken, authorizeRoles(['TEACHER', 'PCOORD', 'ADMIN']), async (req, res, next) => {
    try {
        const { facultyId, scheduledClassId } = req.body;

        if (req.user.role === 'TEACHER' && req.user.facultyId !== facultyId) {
            throw createError(403, 'Forbidden: Teachers can only start sessions for themselves.');
        }

        const newSession = await sessionService.startClassSession(facultyId, scheduledClassId);

        if (req.wss && req.wss.clients) {
            req.wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'SESSION_STATUS_UPDATE',
                        session: newSession
                    }));
                }
            });
        }

        res.status(201).json({ message: 'Session started successfully', session: newSession });
    } catch (error) {
        next(error);
    }
});

// Start a manual class session (without scheduled class dependency)
router.post('/start-manual', authenticateToken, authorizeRoles(['TEACHER', 'PCOORD', 'ADMIN']), async (req, res, next) => {
    try {
        const { facultyId, subjectInstanceId } = req.body;

        if (req.user.role === 'TEACHER' && req.user.facultyId !== facultyId) {
            throw createError(403, 'Forbidden: Teachers can only start sessions for themselves.');
        }

        // Create a manual session for the subject instance
        const newSession = await sessionService.startManualClassSession(facultyId, subjectInstanceId);

        if (req.wss && req.wss.clients) {
            req.wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'SESSION_STATUS_UPDATE',
                        session: newSession
                    }));
                }
            });
        }

        res.status(201).json({ message: 'Manual session started successfully', session: newSession });
    } catch (error) {
        next(error);
    }
});

// Close an active class session
router.post('/close/:sessionId', authenticateToken, authorizeRoles(['TEACHER', 'PCOORD', 'ADMIN']), async (req, res, next) => {
    try {
        // ✅ FIXED: Use ObjectId validation instead of parseInt
        const sessionId = req.params.sessionId;
        if (!sessionId || !ObjectId.isValid(sessionId)) {
            return next(createError(400, 'Invalid session ID.'));
        }

        const session = await sessionService.getSessionById(sessionId);

        if (!session) {
            throw createError(404, 'Session not found.');
        }

        if (req.user.role === 'TEACHER' && req.user.facultyId !== session.teacherId) {
            throw createError(403, 'Forbidden: You can only close your own sessions.');
        }

        const closedSession = await sessionService.closeClassSession(sessionId);

        if (req.wss && req.wss.clients) {
            req.wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'SESSION_STATUS_UPDATE',
                        session: closedSession
                    }));
                }
            });
        }

        res.json({ message: 'Session closed successfully', session: closedSession });
    } catch (error) {
        next(error);
    }
});

// Get all active sessions (for PCOORD/ADMIN dashboard)
router.get('/active', authenticateToken, authorizeRoles(['PCOORD', 'ADMIN']), async (req, res, next) => {
    try {
        const activeSessions = await sessionService.getActiveSessions();
        res.json(activeSessions);
    } catch (error) {
        next(error);
    }
});

// NEW ROUTE: Get active session by teacher ID (for device to query)
// This route will be called by the ESP32 after teacher authentication.
router.get('/active-by-teacher/:teacherId', authenticateDevice, async (req, res, next) => {
    try {
        // ✅ FIXED: Use ObjectId validation instead of parseInt
        const teacherId = req.params.teacherId;
        if (!teacherId || !ObjectId.isValid(teacherId)) {
            return next(createError(400, 'Invalid teacher ID.'));
        }

        const deviceMacAddress = req.device.macAddr; // Get MAC from authenticated device (using macAddr as per schema)

        const activeSession = await sessionService.getActiveSessionByTeacherId(teacherId);

        if (!activeSession) {
            throw createError(404, `No active session found for teacher ID ${teacherId}.`);
        }

        res.json(activeSession);
    } catch (error) {
        next(error);
    }
});

// Get subject instances assigned to a specific teacher
// FIX: Moved this route BEFORE the /:sessionId route
router.get('/teacher-instances', authenticateToken, authorizeRoles(['TEACHER', 'PCOORD', 'ADMIN']), async (req, res, next) => {
    try {
        let facultyId;
        
        if (req.user.role === 'TEACHER') {
            facultyId = req.user.facultyId;
        } else {
            // ✅ FIXED: Use ObjectId validation instead of parseInt for query parameter
            facultyId = req.query.facultyId;
            if (facultyId && !ObjectId.isValid(facultyId)) {
                return next(createError(400, 'Invalid faculty ID format.'));
            }
        }

        if (!facultyId) {
            throw createError(400, 'Faculty ID is required.');
        }

        const teacherInstances = await sessionService.getTeacherSubjectInstances(facultyId);
        res.json(teacherInstances);
    } catch (error) {
        next(error);
    }
});

// Get a specific session by ID
// This route should come AFTER more specific routes like /teacher-instances
router.get('/:sessionId', authenticateToken, authorizeRoles(['TEACHER', 'PCOORD', 'ADMIN']), async (req, res, next) => {
    try {
        // ✅ FIXED: Use ObjectId validation instead of parseInt
        const sessionId = req.params.sessionId;
        if (!sessionId || !ObjectId.isValid(sessionId)) {
            return next(createError(400, 'Invalid session ID.'));
        }

        const session = await sessionService.getSessionById(sessionId);

        if (!session) {
            throw createError(404, 'Session not found.');
        }

        if (req.user.role === 'TEACHER' && req.user.facultyId !== session.teacherId) {
            throw createError(403, 'Forbidden: You can only view your own sessions.');
        }

        res.json(session);
    } catch (error) {
        next(error);
    }
});

export default router;
