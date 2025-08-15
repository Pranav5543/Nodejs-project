// File: routes/userRoutes.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// All API routes for user management
router.post('/create_user', userController.createUser);
router.post('/get_users', userController.getUsers);
router.post('/delete_user', userController.deleteUser);
router.post('/update_user', userController.updateUser);
router.post('/get_managers', userController.getManagers);

module.exports = router;