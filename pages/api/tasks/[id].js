// PATCH  -> 更新任務欄位（task_name / estimated_hours / project / order_index）
// DELETE -> 刪除任務
import { getDb } from '../../../lib/db';

export default function handler(req, res) {
  const db = getDb();
  const id = Number(req.query.id);
  if (!id) {
    return res.status(400).json({ error: '無效的任務 id' });
  }

  if (req.method === 'PATCH') {
    const existing = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: '找不到任務' });
    }
    const body = req.body || {};
    const next = {
      project: body.project !== undefined ? body.project : existing.project,
      task_name: body.task_name !== undefined ? body.task_name : existing.task_name,
      estimated_hours:
        body.estimated_hours !== undefined ? Number(body.estimated_hours) : existing.estimated_hours,
      order_index: body.order_index !== undefined ? Number(body.order_index) : existing.order_index,
    };
    db.prepare(
      `UPDATE tasks SET project = ?, task_name = ?, estimated_hours = ?, order_index = ? WHERE id = ?`
    ).run(next.project, next.task_name, next.estimated_hours, next.order_index, id);
    const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    return res.status(200).json({ task: row });
  }

  if (req.method === 'DELETE') {
    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', ['PATCH', 'DELETE']);
  return res.status(405).json({ error: 'Method not allowed' });
}
