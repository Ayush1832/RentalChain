import { Router, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { AuthRequest } from '../types';
import { db } from '../models/db';

export const notificationsRouter = Router();

// GET /notifications — list user's notifications
notificationsRouter.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(parseInt((req.query['limit'] as string) || '20'), 50);
    const result = await db.query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [req.user!.userId, limit]
    );
    const unreadCount = await db.query(
      `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE`,
      [req.user!.userId]
    );
    res.json({
      notifications: result.rows.map(r => ({
        id: r.id,
        type: r.type,
        title: r.title,
        body: r.body,
        data: r.data,
        isRead: r.is_read,
        createdAt: r.created_at,
      })),
      unreadCount: parseInt(unreadCount.rows[0].count),
    });
  } catch (err) { next(err); }
});

// PUT /notifications/:id/read — mark single notification as read
notificationsRouter.put('/:id/read', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await db.query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2`,
      [req.params["id"] as string, req.user!.userId]
    );
    res.json({ message: 'Marked as read' });
  } catch (err) { next(err); }
});

// PUT /notifications/read-all — mark all as read
notificationsRouter.put('/read-all', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await db.query(
      `UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE`,
      [req.user!.userId]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) { next(err); }
});

// Helper exported for internal use — create a notification
export async function createNotification(data: {
  userId: string;
  type: string;
  title: string;
  body: string;
  notifData?: Record<string, unknown>;
}): Promise<void> {
  await db.query(
    `INSERT INTO notifications (user_id, type, title, body, data) VALUES ($1, $2, $3, $4, $5)`,
    [data.userId, data.type, data.title, data.body, JSON.stringify(data.notifData ?? {})]
  );
}
