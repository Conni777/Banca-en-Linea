const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/abonar', authMiddleware, transactionController.abonar);
router.post('/transferir', authMiddleware, transactionController.transferir);
router.post('/transferir-interbancario', authMiddleware, transactionController.transferirInterbancario);


module.exports = router;
