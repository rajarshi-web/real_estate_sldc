// const express = require('express');
// const router = express.Router();

// const propertyController = require('../controller/apiController');
// const authMiddleware = require('../middleware/auth'); 

// // Check if protect is a property of the object or the object itself
// const protect = authMiddleware.protect || authMiddleware;


// console.log("Controller Loaded:", !!propertyController.createProperty);
// console.log("Middleware Loaded:", !!protect);

// // Routes
// router.post('/create', protect, propertyController.createProperty);
// router.get('/all', propertyController.getProperties);
// router.get('/single/:id', propertyController.getPropertyById);
// router.put('/update/:id', protect, propertyController.updateProperty);
// router.delete('/delete/:id', protect, propertyController.deleteProperty);

// module.exports = router;

const express = require('express');
const router = express.Router();

// Import Controller
const propertyController = require('../controller/apiController');

// Import Middleware 
// We check for both 'auth' and 'authCheck' since your file structure showed both
const authMiddleware = require('../middleware/auth') || require('../middleware/authCheck'); 

/**
 * DETERMINING THE PROTECT FUNCTION
 * In many JWT setups, 'protect' is exported as a property.
 * If req.user is still undefined, check your auth.js to see if you used
 * module.exports = protect OR exports.protect = protect
 */
const protect = authMiddleware.protect || authMiddleware;

// Debugging: These will help you see if the imports worked when you restart the server
console.log("--- API Router Initialization ---");
console.log("Property Controller Loaded:", !!propertyController.createProperty);
console.log("Auth Middleware Function Loaded:", typeof protect === 'function');
console.log("---------------------------------");


router.post('/create', protect, propertyController.createProperty);


router.get('/all', propertyController.getProperties);

router.get('/single/:id', propertyController.getPropertyById);

router.put('/update/:id', protect, propertyController.updateProperty);

router.delete('/delete/:id', protect, propertyController.deleteProperty);

module.exports = router;