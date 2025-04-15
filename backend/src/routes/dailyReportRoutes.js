import express from 'express';
import { createDailyReport, closeDailyReport, addExpense, getCurrentDayReport } from '../controllers/dailyReportController.js';
import { authMiddleware, checkRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', 
    authMiddleware, 
    checkRole(['admin', 'encargado', 'cajero']), 
    createDailyReport
);

router.post('/:reportId/expenses', 
    authMiddleware, 
    checkRole(['admin', 'encargado', 'cajero']), 
    addExpense
);

router.put('/:reportId/close', 
    authMiddleware, 
    checkRole(['admin', 'encargado', 'cajero']), 
    closeDailyReport
);

router.get('/current/:businessId', 
    authMiddleware, 
    checkRole(['admin', 'encargado', 'cajero']), 
    getCurrentDayReport
);

export default router;