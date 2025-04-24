import { AuditLog } from '../models/AuditLog.js';

export const auditMiddleware = (req, res, next) => {
  // Capture start time
  const start = Date.now();

  res.on('finish', async () => {
    try {
      const duration = Date.now() - start;
      const logEntry = new AuditLog({
        user: req.user?._id || null,
        action: res.statusCode,
        method: req.method,
        endpoint: req.originalUrl,
        timestamp: new Date(),
        details: {
          params: req.params,
          query: req.query,
          body: req.body,
          responseTimeMs: duration
        }
      });
      await logEntry.save();
    } catch (err) {
      console.error('Error saving audit log:', err);
    }
  });

  next();
}; 