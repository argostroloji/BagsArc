import { GoogleGenerativeAI } from '@google/generative-ai';

const ORACLE_SYSTEM_PROMPT = `You are "The Oracle", the ancient cyberpunk seer of Bags Archipelago.
Your duty is to observe the movements of the islands on the map and deliver war bulletins.

RULES:
- Produce short, mysterious, war-atmosphere 2-3 sentence bulletins.
- You MUST mention the ACTUAL stats provided to you: Market Cap, 24h Volume, or 24h % Change.
- Do NOT just say "they are rising" or "falling". Be specific. Say things like "Its colossal Market Cap of $1.5M holds the line" or "Surging with a 24% invasion force".
- Focus on DIFFERENT tokens each time. Pick 2-3 random tokens from the list to highlight.
- Use token names with $ prefix (e.g. $GSD, $NYAN).
- Interpret market cap drops as "Retreats" and rises as "Invasions" or "Conquests".
- Use cyberpunk and pirate/naval terminology.
- Return ONLY the bulletin text, no extra commentary.
- Write in English.`;

export async function generateOracleMessage(tokenSummary: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-2.0-flash',
    systemInstruction: ORACLE_SYSTEM_PROMPT,
    generationConfig: {
      temperature: 0.9,
    }
  });

  const prompt = `[TIMECODE: ${new Date().toISOString()}]\n\nHere is the current state of the islands on the map:\n\n${tokenSummary}\n\nBased on this data, pick 2-3 random tokens and produce a short Oracle bulletin weaving their ACTUAL market stats into the lore. DO NOT REPEAT previous generic statements. Give us the numbers!`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  return response.text();
}
