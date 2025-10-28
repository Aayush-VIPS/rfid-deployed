// rfid-attendance-system/apps/backend/src/routes/subjectInstance.js
import express from 'express';
import createError from 'http-errors';
import { ObjectId } from 'mongodb';
import { authenticateToken, authorizeRoles } from '../middlewares/auth.js';
import {
    createSubjectInstance,
    getAllSubjectInstances,
    updateSubjectInstance,
    deleteSubjectInstance,
} from '../services/subjectInstanceService.js';

const router = express.Router();

// All SubjectInstance management routes require ADMIN or PCOORD roles
router.use(authenticateToken, authorizeRoles(['ADMIN', 'PCOORD']));

/**
 * @route POST /api/subject-instance
 * @desc Create a new SubjectInstance (assign subject to section by faculty).
 * @access Private (ADMIN, PCOORD)
 */
router.post('/', async (req, res, next) => {
    try {
        const newInstance = await createSubjectInstance(req.body);
        res.status(201).json({ message: 'Subject instance created successfully.', instance: newInstance });
    } catch (error) {
        next(error);
    }
});

/**
 * @route GET /api/subject-instance
 * @desc Get all SubjectInstances with full details.
 * @access Private (ADMIN, PCOORD)
 */
router.get('/', async (req, res, next) => {
    try {
        const instances = await getAllSubjectInstances();
        res.status(200).json(instances);
    } catch (error) {
        next(error);
    }
});

/**
 * @route PUT /api/subject-instance/:instanceId
 * @desc Update an existing SubjectInstance.
 * @access Private (ADMIN, PCOORD)
 */
router.put('/:instanceId', async (req, res, next) => {
    const instanceId = req.params.instanceId;
    
    // Enhanced validation with better error messages
    if (!instanceId) {
        return next(createError(400, 'Subject Instance ID is required.'));
    }
    
    if (!ObjectId.isValid(instanceId)) {
        console.log(`Invalid ObjectId format received: ${instanceId}`);
        return next(createError(400, `Invalid Subject Instance ID format: ${instanceId}`));
    }

    try {
        const updatedInstance = await updateSubjectInstance(instanceId, req.body);
        res.status(200).json({ message: 'Subject instance updated successfully.', instance: updatedInstance });
    } catch (error) {
        console.error(`Error updating subject instance ${instanceId}:`, error);
        next(error);
    }
});

/**
 * @route DELETE /api/subject-instance/:instanceId
 * @desc Delete a SubjectInstance.
 * @access Private (ADMIN, PCOORD)
 */
router.delete('/:instanceId', async (req, res, next) => {
    const instanceId = req.params.instanceId;
    
    // Enhanced validation with better error messages
    if (!instanceId) {
        return next(createError(400, 'Subject Instance ID is required.'));
    }
    
    if (!ObjectId.isValid(instanceId)) {
        console.log(`Invalid ObjectId format received for deletion: ${instanceId}`);
        return next(createError(400, `Invalid Subject Instance ID format: ${instanceId}`));
    }

    try {
        console.log(`Attempting to delete subject instance: ${instanceId}`);
        await deleteSubjectInstance(instanceId);
        console.log(`Successfully deleted subject instance: ${instanceId}`);
        res.status(204).send(); // No content on successful delete
    } catch (error) {
        console.error(`Error deleting subject instance ${instanceId}:`, error);
        next(error);
    }
});

export default router;
