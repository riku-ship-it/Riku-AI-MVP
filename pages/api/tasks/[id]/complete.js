// POST -> 標記任務完成。記錄目前時間、計算從建立到完成經過的時數，寫入 actual_hours，status 改為「完成」
import { getDb } from '../../../../lib/db';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const db = getDb();
  const id = Number(req.query.id);
  const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: '找不到任務' });
  }

  const createdAt = new Date(existing.created_at.replace(' ', 'T') + 'Z');
  const now = new Date();
  const diffHours = Math.max(0, (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60));
  const actualHours = Math.round(diffHours * 100) / 100;

  db.prepare(`UPDATE tasks SET status = '完成', actual_hours = ? WHERE id = ?`).run(actualHours, id);
  const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  return res.status(200).json({ task: row });
}
