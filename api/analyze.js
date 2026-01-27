import Anthropic from '@anthropic-ai/sdk';

export default async function handler(req, res) {
  // API 키 확인
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set');
    return res.status(500).json({ error: 'API key not configured' });
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
  // CORS 헤더
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { events, requestStructuredData } = req.body;

    if (!events || !Array.isArray(events)) {
      return res.status(400).json({ error: 'Invalid events data' });
    }

    // 이벤트 정보를 텍스트로 변환
    const eventsText = events.map((event, index) => `
이벤트 ${index + 1}:
- 시기: ${event.period}
- 제목: ${event.title}
- 우연한 사건: ${event.situation}
- 나의 행동: ${event.action}
    `).join('\n');

    // 구조화된 데이터 요청 여부에 따라 프롬프트 변경
    let systemPrompt = `당신은 John Krumboltz의 Planned Happenstance Theory 전문가입니다. 
사용자의 커리어 이벤트를 분석하여 다음 5가지 스킬이 어떻게 발현되었는지 분석해주세요:

1. Curiosity (호기심)
2. Persistence (지속성)
3. Flexibility (유연성)
4. Optimism (낙관성)
5. Risk-taking (위험 감수)`;

    let userPrompt = `다음 4개의 이벤트를 분석해주세요:\n\n${eventsText}\n\n`;

    if (requestStructuredData) {
      userPrompt += `
각 이벤트별로 어떤 스킬이 발현되었는지 분석하고, 반드시 다음 JSON 형식으로도 제공해주세요:

{
  "events": [
    {"skills": ["Curiosity", "Risk-taking"]},
    {"skills": ["Flexibility", "Optimism"]},
    {"skills": ["Persistence"]},
    {"skills": ["Curiosity", "Optimism", "Risk-taking"]}
  ]
}

먼저 상세한 분석을 한글로 작성하고, 마지막에 위 JSON 형식을 추가해주세요.`;
    } else {
      userPrompt += `각 이벤트에서 발현된 스킬을 구체적인 근거와 함께 분석해주세요.`;
    }

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    });

    res.status(200).json(message);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Analysis failed',
      details: error.message 
    });
  }
}