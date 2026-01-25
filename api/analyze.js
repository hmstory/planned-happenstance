export default async function handler(req, res) {
    // CORS 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const { events } = req.body;
    
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: `다음은 사용자가 입력한 4가지 인생 사건입니다. Planned Happenstance 이론의 5가지 기술(Curiosity, Persistence, Flexibility, Optimism, Risk-taking)을 분석해주세요.
  
  ${events.map((e, i) => `
  이벤트 ${i + 1}: ${e.title} (${e.period})
  - 우연한 사건: ${e.situation}
  - 나의 행동: ${e.action}
  `).join('\n')}
  
  각 기술별로 어떤 이벤트에서 발현되었는지 분석하되, 억지로 모든 기술을 끼워맞추지 마세요. 명확한 것만 분석해주세요.`
          }]
        })
      });
      
      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }