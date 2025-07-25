const express = require('express');
const router = express.Router();
const crudController = require('../controllers/crudController');

// CRUD routes for all models
router.post('/Customer', crudController.createCustomer); // Create notification
router.post('/:modelName', crudController.createDocument); // Create
router.get('/:modelName', crudController.getAllDocuments); // Get all
router.get('/:modelName/:id', crudController.getDocumentById); // Get by ID
router.put('/:modelName/:id', crudController.updateDocument); // Update by ID
router.delete('/:modelName/:id', crudController.deleteDocument); // Delete by ID

// Custom route example
router.post('/notification', crudController.createNotification); // Create notification
// Custom route example

module.exports = router;
