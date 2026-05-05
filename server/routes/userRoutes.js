import express from 'express';
import { createStaff, deleteUser } from '../controllers/userController.js';

const router = express.Router();

router.post('/users/create-staff', createStaff);
router.delete('/users/:uid', deleteUser);

export default router;
