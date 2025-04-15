import { Router } from "express";
import { authMiddleware } from "../middleware/authmiddleware.js";
import * as salesController from '../controllers/salesController.js'

const router = Router()

router.post('/sales', salesController.createSales, authMiddleware)
router.get('/sales', salesController.getSales, authMiddleware)

export default router;