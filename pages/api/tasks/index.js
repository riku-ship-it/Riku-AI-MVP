// GET  -> 取得所有任務（依 order_index 排序）
// POST -> 新增任務。body 可以是單一任務物件，也可以是 { project, tasks: [...] } 用來一次存入 AI 拆解出的任務清單
import { getDb } from '../../../lib/db';

export default function handler(req, res) {
  const db = getDb();

  if (req.method === 'GET') {
    const rows = db
      .prepare('SELECT * FROM tasks ORDER BY order_index ASC, id ASC')
      .all();
    return res.status(200).json({ tasks: rows });
  }

  if (req.method === 'POST') {
    const body = req.body || {};

    // 批次新增（AI 拆解結果）
    if (Array.isArray(body.tasks)) {
      const project = body.project || '未命名專案';
      const insert = db.prepare(
        `INSERT INTO tasks (project, task_name, estimated_hours, status, order_index)
         VALUES (?, ?, ?, '進行中', ?)`
      );
      const inserted = [];
      for (const t of body.tasks) {
        const info = insert.run(
          project,
          t.task_name,
          Number(t.estimated_hours) || 0,
          Number(t.order_index) || 0
        );
        inserted.push(Number(info.lastInsertRowid));
      }
      const rows = db
        .prepare('SELECT * FROM tasks ORDER BY order_index ASC, id ASC')
        .all();
      return res.status(201).json({ tasks: rows, insertedIds: inserted });
    }

    // 單筆新增（手動新增任務）
    const { project, task_name, estimated_hours, order_index } = body;
    if (!task_name) {
      return res.status(400).json({ error: '任務名稱為必填' });
    }
    const insert = db.prepare(
      `INSERT INTO tasks (project, task_name, estimated_hours, status, order_index)
       VALUES (?, ?, ?, '進行中', ?)`
    );
    const info = insert.run(
      project || '未命名專案',
      task_name,
      Number(estimated_hours) || 0,
      Number(order_index) || 0
    );
    const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(Number(info.lastInsertRowid));
    return res.status(201).json({ task: row });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method not allowed' });
}
