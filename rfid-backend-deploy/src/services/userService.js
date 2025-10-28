// rfid-attendance-system/apps/backend/src/services/userService.js
import bcrypt from 'bcryptjs';
import createError from 'http-errors';
import prisma from './prisma.js'; // Our centralized Prisma client

// Helper to find a user by email, including their related Faculty/Student profile
async function findUserByEmail(email) {
    // ✅ IMPROVED: Add basic email validation
    if (!email || typeof email !== 'string') {
        throw createError(400, 'Valid email address is required.');
    }

    try {
        return await prisma.user.findUnique({
            where: { email },
            include: {
                facultyProfile: true, // Include faculty profile if it exists
                // studentProfile: true // Future: if you link student directly to User model
            },
        });
    } catch (error) {
        console.error('Error finding user by email:', error);
        throw createError(500, 'Failed to find user due to a database error.');
    }
}

// User login logic
async function loginUser(email, password) {
    // ✅ IMPROVED: Add input validation
    if (!email || !password) {
        throw createError(400, 'Email and password are required.');
    }

    const user = await findUserByEmail(email);

    if (!user) {
        throw createError(401, 'Invalid credentials: User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
        throw createError(401, 'Invalid credentials: Password mismatch');
    }

    // Return a simplified user object for token payload and client
    return {
        id: user.id, // ✅ This is already a string ObjectId from MongoDB
        email: user.email,
        role: user.role,
        facultyId: user.facultyProfile ? user.facultyProfile.id : null, // Include facultyId if user is a faculty
        rfidUid: user.facultyProfile ? user.facultyProfile.rfidUid : null, // Include faculty RFID if user is a faculty
    };
}

// Function to create a new user (e.g., for initial admin setup)
async function createUser(email, password, role) {
    // ✅ IMPROVED: Add comprehensive input validation
    if (!email || !password || !role) {
        throw createError(400, 'Email, password, and role are required.');
    }

    if (typeof email !== 'string' || typeof password !== 'string' || typeof role !== 'string') {
        throw createError(400, 'Email, password, and role must be valid strings.');
    }

    // ✅ IMPROVED: Add role validation
    const validRoles = ['ADMIN', 'TEACHER', 'PCOORD'];
    if (!validRoles.includes(role)) {
        throw createError(400, `Role must be one of: ${validRoles.join(', ')}`);
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
        throw createError(409, 'User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10); // 10 salt rounds

    try {
        const newUser = await prisma.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
                role,
            },
        });

        return { id: newUser.id, email: newUser.email, role: newUser.role };
    } catch (error) {
        console.error('Error creating user:', error);
        throw createError(500, 'Failed to create user due to a database error.');
    }
}

export { findUserByEmail, loginUser, createUser };
