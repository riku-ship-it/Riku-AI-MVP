// 呼叫 Claude API，把使用者輸入的模糊想法/目標拆解成具體任務清單（透過 tool use 取得結構化 JSON）
import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `你是一個專案規劃助理。使用者會給你一個模糊的想法、目標或任務描述。
你的工作是把它拆解成一組「具體、可執行」的任務清單，並針對每個任務給出「合理的預估工時（小時）」。

拆解原則：
- 任務要具體到「一看就知道要做什麼」，不要太籠統（例如避免只寫「開發功能」，而要拆成更細的步驟）。
- 每個任務盡量落在 0.5 ～ 8 小時之間，太大的任務要再拆分。
- 任務數量依複雜度彈性調整，通常 3～10 個。
- 依照合理的執行順序給每個任務一個 order_index（從 1 開始，數字越小越先做）。
- 預估工時要務實，考慮一般開發者/工作者的實際狀況，不要過度樂觀。

你必須使用提供的工具回傳結果，不要直接用文字回答。`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { description } = req.body || {};
  if (!description || typeof description !== 'string' || !description.trim()) {
    return res.status(400).json({ error: '請輸入任務目標描述' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: '尚未設定 ANTHROPIC_API_KEY，請在 .env.local 中加入你的 Anthropic API key',
    });
  }

  const client = new Anthropic({ apiKey });

  const tool = {
    name: 'submit_task_breakdown',
    description: '回傳拆解後的任務清單，每個任務包含任務名稱、預估工時（小時）與建議執行順序',
    input_schema: {
      type: 'object',
      properties: {
        tasks: {
          type: 'array',
          description: '拆解後的具體任務清單',
          items: {
            type: 'object',
            properties: {
              task_name: { type: 'string', description: '具體的任務名稱' },
              estimated_hours: { type: 'number', description: '預估花費工時（小時），可為小數' },
              order_index: { type: 'integer', description: '建議執行順序，從 1 開始，數字越小越先做' },
            },
            required: ['task_name', 'estimated_hours', 'order_index'],
          },
        },
      },
      required: ['tasks'],
    },
  };

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      tools: [tool],
      tool_choice: { type: 'tool', name: 'submit_task_breakdown' },
      messages: [
        { role: 'user', content: `我想做的事情：${description}` },
      ],
    });

    const toolUse = message.content.find((block) => block.type === 'tool_use');
    if (!toolUse) {
      return res.status(502).json({ error: 'Claude 沒有回傳預期的工具呼叫結果' });
    }

    const tasks = toolUse.input.tasks || [];
    return res.status(200).json({ tasks });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: '呼叫 Claude API 失敗: ' + (err.message || String(err)) });
  }
}
