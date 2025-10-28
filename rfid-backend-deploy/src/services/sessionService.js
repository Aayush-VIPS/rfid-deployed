// rfid-attendance-system/apps/backend/src/services/sessionService.js
import createError from 'http-errors';
import prisma from './prisma.js'; // Our centralized Prisma client
import { toZonedTime, format } from 'date-fns-tz'; // ADDED: Import library for timezone handling

// Helper to convert "HH:mm" string to minutes from midnight
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Automatically starts a class session for a given faculty member and their subject instance.
 * Infers the subject instance from the faculty's assigned classes or scheduled classes.
 * @param {string} facultyId - The ID of the faculty member starting the session.
 * @param {string} [scheduledClassId] - Optional: The ID of the specific ScheduledClass to start a session for.
 * If not provided, attempts to find the current valid one based on time.
 * @returns {Promise<Object>} The created ClassSession object.
 * @throws {HttpError} If no active/scheduled class is found or session cannot be created.
 */
async function startClassSession(facultyId, scheduledClassId = null) {
  // ✅ FIXED: Convert facultyId to string
  const stringFacultyId = String(facultyId);

  // Find the faculty to ensure they exist and get related info
  const faculty = await prisma.faculty.findUnique({
    where: { id: stringFacultyId },
    include: {
      subjectInstances: { // Include subject instances to potentially use later for validation/display
        include: {
          subject: true,
          section: true,
        }
      },
    },
  });

  if (!faculty) {
    throw createError(404, 'Faculty not found.');
  }

  let targetSubjectInstance; // This will hold the SubjectInstance for the session

  if (scheduledClassId) {
    // ✅ FIXED: Convert scheduledClassId to string
    const stringScheduledClassId = String(scheduledClassId);

    // SCENARIO 1: A specific scheduledClassId is provided (e.g., from a "Start Session" button next to a timetable entry)
    const scheduledClass = await prisma.scheduledClass.findUnique({
      where: { id: stringScheduledClassId },
      include: { subject: true, section: true, faculty: true } // Include faculty to verify assignment
    });

    if (!scheduledClass) {
      throw createError(404, 'Scheduled class not found.');
    }

    // Verify that the provided scheduledClassId actually belongs to this faculty
    if (scheduledClass.facultyId !== stringFacultyId) {
      throw createError(403, 'Forbidden: This scheduled class is not assigned to you.');
    }

    // Check if the current time is within the scheduled window for this specific class
    const nowInIST = toZonedTime(new Date(), 'Asia/Kolkata');
    const currentDayOfWeek = format(nowInIST, 'EEEE').toUpperCase();
    const currentTime = format(nowInIST, 'HH:mm');

    const GRACE_PERIOD_MINUTES = 15; // Allow starting 15 mins before or after scheduled start

    const currentMinutes = timeToMinutes(currentTime);
    const scheduledStartMinutes = timeToMinutes(scheduledClass.startTime);
    const scheduledEndMinutes = timeToMinutes(scheduledClass.endTime);

    // Define the window for starting the session: 15 mins before start, up to end time + 15 mins
    const windowStart = scheduledStartMinutes - GRACE_PERIOD_MINUTES;
    const windowEnd = scheduledEndMinutes + GRACE_PERIOD_MINUTES;

    // Check if the current day matches AND current time is within the window
    if (currentDayOfWeek !== scheduledClass.dayOfWeek || !(currentMinutes >= windowStart && currentMinutes <= windowEnd)) {
      throw createError(400, `Cannot start session: This class is not scheduled for now. It is scheduled for ${scheduledClass.dayOfWeek} from ${scheduledClass.startTime} to ${scheduledClass.endTime}.`);
    }

    // Now, find the corresponding SubjectInstance for this valid scheduled class
    targetSubjectInstance = await prisma.subjectInstance.findFirst({
      where: {
        subjectId: scheduledClass.subjectId,
        sectionId: scheduledClass.sectionId,
        facultyId: stringFacultyId, // Ensure it's assigned to this faculty
      },
    });

    if (!targetSubjectInstance) {
      // This should ideally not happen if the previous fix for SubjectInstance creation is working
      throw createError(404, 'Corresponding SubjectInstance not found for the scheduled class. Please contact administration.');
    }

  } else {
    // SCENARIO 2: No specific scheduledClassId provided (teacher clicks a generic "Start Session" button)
    // Auto-infer the class based on current day and time
    const nowInIST = toZonedTime(new Date(), 'Asia/Kolkata');
    const currentDayOfWeek = format(nowInIST, 'EEEE').toUpperCase(); // e.g., "MONDAY"
    const currentTime = format(nowInIST, 'HH:mm'); // e.g., "10:05" (24-hour format)

    // Find all scheduled classes for this faculty on the current day
    const scheduledClassesToday = await prisma.scheduledClass.findMany({
      where: {
        facultyId: stringFacultyId,
        dayOfWeek: currentDayOfWeek,
      },
      include: { subject: true, section: true }
    });

    const GRACE_PERIOD_MINUTES = 15; // Allow starting 15 mins before or after scheduled start

    let matchingScheduledClass = null;
    for (const sc of scheduledClassesToday) {
      const currentMinutes = timeToMinutes(currentTime);
      const scheduledStartMinutes = timeToMinutes(sc.startTime);
      const scheduledEndMinutes = timeToMinutes(sc.endTime);

      // Define the window for starting the session: 15 mins before start, up to end time + 15 mins
      const windowStart = scheduledStartMinutes - GRACE_PERIOD_MINUTES;
      const windowEnd = scheduledEndMinutes + GRACE_PERIOD_MINUTES;

      // Check if current time is within the grace period of the scheduled start time
      if (currentMinutes >= windowStart && currentMinutes <= windowEnd) {
        matchingScheduledClass = sc;
        break; // Found a matching class, take the first one
      }
    }

    if (!matchingScheduledClass) {
      throw createError(400, `No class scheduled for you at this time (${currentTime} on ${currentDayOfWeek}).`);
    }

    // Now that we found a matching ScheduledClass, find its corresponding SubjectInstance
    targetSubjectInstance = await prisma.subjectInstance.findFirst({
      where: {
        subjectId: matchingScheduledClass.subjectId,
        sectionId: matchingScheduledClass.sectionId,
        facultyId: stringFacultyId,
      },
    });

    if (!targetSubjectInstance) {
      // This should ideally not happen if the previous fix for SubjectInstance creation is working
      throw createError(404, 'Corresponding SubjectInstance not found for the scheduled class. Please contact administration.');
    }
  }

  // Check if there's an already active (unclosed) session for this subject instance
  const existingActiveSession = await prisma.classSession.findFirst({
    where: {
      subjectInstId: targetSubjectInstance.id,
      isClosed: false,
    },
  });

  if (existingActiveSession) {
    throw createError(409, 'An active session for this class is already running.');
  }

  // Check if there's already an authenticated device for this teacher
  let authenticatedDeviceId = null;
  
  // Look for any existing active session for this teacher that has a device linked
  const existingSessionWithDevice = await prisma.classSession.findFirst({
    where: {
      teacherId: stringFacultyId,
      isClosed: false,
      deviceId: { not: null }
    },
    include: { device: true }
  });
  
  if (existingSessionWithDevice) {
    authenticatedDeviceId = existingSessionWithDevice.deviceId;
    console.log(`[Session Service] Found existing authenticated device ${existingSessionWithDevice.device.macAddr} for teacher ${stringFacultyId}, linking to new session`);
  }

  // Create the new session
  const newSession = await prisma.classSession.create({
    data: {
      subjectInstId: targetSubjectInstance.id,
      teacherId: stringFacultyId,
      startAt: toZonedTime(new Date(), 'Asia/Kolkata'), // ✅ FIXED: Use IST timezone
      isClosed: false,
      deviceId: authenticatedDeviceId, // Link to authenticated device if found
    },
    include: {
      subjectInst: {
        include: {
          subject: true,
          section: true
        }
      },
      teacher: {
        select: { name: true }
      },
      device: true // Include device in the response
    }
  });

  return newSession;
}

/**
 * Closes an active class session.
 * @param {string} sessionId - The ID of the session to close.
 * @returns {Promise<Object>} The updated ClassSession object.
 * @throws {HttpError} If session not found or already closed.
 */
async function closeClassSession(sessionId) {
  // ✅ FIXED: Convert sessionId to string
  const stringSessionId = String(sessionId);

  const session = await prisma.classSession.findUnique({
    where: { id: stringSessionId },
  });

  if (!session) {
    throw createError(404, 'Session not found.');
  }

  if (session.isClosed) {
    throw createError(409, 'Session is already closed.');
  }

  const updatedSession = await prisma.classSession.update({
    where: { id: stringSessionId },
    data: {
      endAt: toZonedTime(new Date(), 'Asia/Kolkata'), // ✅ FIXED: Use IST timezone
      isClosed: true,
    },
  });

  return updatedSession;
}

/**
 * Get a session by ID.
 * @param {string} sessionId
 * @returns {Promise<Object>} The session object.
 */
async function getSessionById(sessionId) {
  // ✅ FIXED: Convert sessionId to string
  const stringSessionId = String(sessionId);

  return prisma.classSession.findUnique({
    where: { id: stringSessionId },
    include: {
      subjectInst: {
        include: {
          subject: true,
          section: true,
          faculty: true
        }
      },
      teacher: true,
      device: true,
      logs: true
    }
  });
}

/**
 * Get active sessions (not closed).
 * @returns {Promise<Array<Object>>} List of active sessions.
 */
async function getActiveSessions() {
  return prisma.classSession.findMany({
    where: {
      isClosed: false
    },
    include: {
      subjectInst: {
        include: {
          subject: true,
          section: true,
          faculty: true
        }
      },
      teacher: true
    }
  });
}

/**
 * Retrieves the currently active (unclosed) class session for a specific teacher.
 * There should ideally be only one active session per teacher at a time.
 * @param {string} teacherId - The ID of the teacher.
 * @returns {Promise<Object|null>} The active ClassSession object, or null if no active session.
 */
async function getActiveSessionByTeacherId(teacherId) {
  // ✅ FIXED: Convert teacherId to string
  const stringTeacherId = String(teacherId);

  return prisma.classSession.findFirst({
    where: {
      teacherId: stringTeacherId,
      isClosed: false,
    },
    include: {
      subjectInst: {
        include: {
          subject: true,
          section: true,
        }
      },
      teacher: {
        select: { id: true, name: true, empId: true }
      }
    },
    orderBy: { startAt: 'desc' } // In case multiple are somehow active, get the latest
  });
}

/**
 * Gets all subject instances assigned to a specific faculty member.
 * Includes relevant scheduled classes for the current day for each instance.
 * @param {string} facultyId - The ID of the faculty member.
 * @returns {Promise<Array<Object>>} List of subject instances assigned to the faculty,
 * each with an array of relevant scheduled classes for today.
 */
async function getTeacherSubjectInstances(facultyId) {
  // ✅ FIXED: Convert facultyId to string
  const stringFacultyId = String(facultyId);

  // ✅ FIXED: Use IST timezone instead of server's local timezone
  const nowInIST = toZonedTime(new Date(), 'Asia/Kolkata');
  const currentDayOfWeek = format(nowInIST, 'EEEE').toUpperCase();

  // Fetch ALL SubjectInstances assigned to this faculty
  const subjectInstances = await prisma.subjectInstance.findMany({
    where: { facultyId: stringFacultyId },
    include: {
      subject: true,
      section: true,
      classSessions: {
        where: { isClosed: false },
        select: { id: true, startAt: true, teacherId: true }
      }
    },
    orderBy: {
      subject: { name: 'asc' }
    }
  });

  // For each subject instance, find its scheduled classes for the current day
  const instancesWithScheduledClasses = await Promise.all(subjectInstances.map(async (instance) => {
    const scheduledClasses = await prisma.scheduledClass.findMany({
      where: {
        subjectId: instance.subjectId,
        sectionId: instance.sectionId,
        facultyId: instance.facultyId, // Ensure it's this faculty's scheduled class
        dayOfWeek: currentDayOfWeek,
      },
      orderBy: { startTime: 'asc' }
    });
    return {
      ...instance,
      scheduledClassesToday: scheduledClasses // Attach scheduled classes for today
    };
  }));

  return instancesWithScheduledClasses;
}

/**
 * Start a manual class session for a subject instance without requiring scheduled class
 * @param {string} facultyId - The ID of the faculty member starting the session.
 * @param {string} subjectInstanceId - The ID of the subject instance.
 * @returns {Promise<Object>} The created ClassSession object.
 */
async function startManualClassSession(facultyId, subjectInstanceId) {
  const stringFacultyId = String(facultyId);

  // Find the faculty to ensure they exist
  const faculty = await prisma.faculty.findUnique({
    where: { id: stringFacultyId },
    include: {
      subjectInstances: {
        include: {
          subject: true,
          section: true,
        }
      }
    }
  });

  if (!faculty) {
    throw createError(404, 'Faculty not found.');
  }

  // Find the specific subject instance
  const subjectInstance = await prisma.subjectInstance.findUnique({
    where: { id: subjectInstanceId },
    include: {
      subject: true,
      section: true,
      faculty: true
    }
  });

  if (!subjectInstance) {
    throw createError(404, 'Subject instance not found.');
  }

  // Verify that this faculty teaches this subject instance
  if (subjectInstance.facultyId !== stringFacultyId) {
    throw createError(403, 'Faculty is not authorized to start sessions for this subject instance.');
  }

  // Check if there's already an active session for this subject instance
  const existingSession = await prisma.classSession.findFirst({
    where: {
      subjectInstId: subjectInstanceId,
      isClosed: false
    }
  });

  if (existingSession) {
    throw createError(409, 'There is already an active session for this subject instance.');
  }

  // Check if there's already an authenticated device for this teacher
  let authenticatedDeviceId = null;
  
  // Look for any existing active session for this teacher that has a device linked
  const existingSessionWithDevice = await prisma.classSession.findFirst({
    where: {
      teacherId: stringFacultyId,
      isClosed: false,
      deviceId: { not: null }
    },
    include: { device: true }
  });
  
  if (existingSessionWithDevice) {
    authenticatedDeviceId = existingSessionWithDevice.deviceId;
    console.log(`[Session Service] Found existing authenticated device ${existingSessionWithDevice.device.macAddr} for teacher ${stringFacultyId}, linking to manual session`);
  }

  // Create the manual session
  const newSession = await prisma.classSession.create({
    data: {
      subjectInstId: subjectInstanceId,
      teacherId: stringFacultyId,
      startAt: toZonedTime(new Date(), 'Asia/Kolkata'),
      isClosed: false,
      deviceId: authenticatedDeviceId, // Link to authenticated device if found
      // Note: No scheduledClassId since this is manual
    },
    include: {
      subjectInst: {
        include: {
          subject: true,
          section: true,
          faculty: true
        }
      },
      teacher: true,
      device: true // Include device in the response
    }
  });

  console.log(`✅ Manual session started: ${newSession.id} for ${subjectInstance.subject.name} - ${subjectInstance.section.name} by ${faculty.name}`);

  return newSession;
}

export {
  startClassSession,
  startManualClassSession,
  closeClassSession,
  getSessionById,
  getActiveSessions,
  getTeacherSubjectInstances,
  getActiveSessionByTeacherId // Export the new function
};