import { useEffect, useState } from 'react';

export default function Home() {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tasks, setTasks] = useState([]);

  async function loadTasks() {
    const res = await fetch('/api/tasks');
    const data = await res.json();
    setTasks(data.tasks || []);
  }

  useEffect(() => {
    loadTasks();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!description.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '拆解失敗');
        return;
      }
      const project = description.length > 30 ? description.slice(0, 30) + '…' : description;
      const saveRes = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project, tasks: data.tasks }),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok) {
        setError(saveData.error || '儲存失敗');
        return;
      }
      setTasks(saveData.tasks || []);
      setDescription('');
    } catch (err) {
      setError('發生錯誤: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateTask(id, patch) {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      await loadTasks();
    }
  }

  async function deleteTask(id) {
    if (!confirm('確定要刪除這個任務嗎？')) return;
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await loadTasks();
    }
  }

  async function completeTask(id) {
    const res = await fetch(`/api/tasks/${id}/complete`, { method: 'POST' });
    if (res.ok) {
      await loadTasks();
    }
  }

  async function addTask() {
    const task_name = prompt('新任務名稱：');
    if (!task_name) return;
    const estimated_hours = Number(prompt('預估工時（小時）：', '1')) || 0;
    const maxOrder = tasks.reduce((m, t) => Math.max(m, t.order_index || 0), 0);
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project: tasks[0]?.project || '未命名專案',
        task_name,
        estimated_hours,
        order_index: maxOrder + 1,
      }),
    });
    if (res.ok) {
      await loadTasks();
    }
  }

  const completed = tasks.filter((t) => t.status === '完成' && t.actual_hours != null && t.estimated_hours > 0);
  let accuracyText = '目前還沒有已完成的任務，無法計算估時準確度。';
  if (completed.length > 0) {
    const avgDiffPct =
      completed.reduce((sum, t) => {
        const diff = Math.abs(t.actual_hours - t.estimated_hours) / t.estimated_hours;
        return sum + diff;
      }, 0) / completed.length;
    accuracyText = `已完成 ${completed.length} 個任務，平均預估／實際落差為 ${(avgDiffPct * 100).toFixed(1)}%`;
  }

  return (
    <div>
      <h1>個人專案排程小工具（原型）</h1>

      <form onSubmit={handleSubmit}>
        <textarea
          rows={3}
          placeholder="輸入你想做的事情，例如：幫公司內部系統加一個匯出報表功能"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button type="submit" disabled={loading} style={{ marginTop: 8 }}>
          {loading ? '拆解中...' : '送出，讓 AI 拆解任務'}
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div className="stats">{accuracyText}</div>

      <div style={{ marginTop: 16 }}>
        <button onClick={addTask}>+ 手動新增任務</button>
      </div>

      <table>
        <thead>
          <tr>
            <th>順序</th>
            <th>專案</th>
            <th>任務名稱</th>
            <th>預估時數</th>
            <th>實際時數</th>
            <th>狀態</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr key={t.id} className={t.status === '完成' ? 'done' : ''}>
              <td>
                <input
                  type="text"
                  style={{ width: 50 }}
                  defaultValue={t.order_index}
                  onBlur={(e) => updateTask(t.id, { order_index: Number(e.target.value) })}
                />
              </td>
              <td>{t.project}</td>
              <td>
                <input
                  type="text"
                  defaultValue={t.task_name}
                  onBlur={(e) => updateTask(t.id, { task_name: e.target.value })}
                  disabled={t.status === '完成'}
                />
              </td>
              <td>
                <input
                  type="text"
                  style={{ width: 60 }}
                  defaultValue={t.estimated_hours}
                  onBlur={(e) => updateTask(t.id, { estimated_hours: Number(e.target.value) })}
                  disabled={t.status === '完成'}
                />
              </td>
              <td>{t.actual_hours != null ? t.actual_hours : '-'}</td>
              <td>{t.status}</td>
              <td>
                {t.status !== '完成' && (
                  <button onClick={() => completeTask(t.id)}>標記完成</button>
                )}{' '}
                <button onClick={() => deleteTask(t.id)}>刪除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
