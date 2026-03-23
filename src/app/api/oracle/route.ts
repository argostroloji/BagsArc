import { NextRequest, NextResponse } from 'next/server';
import { generateOracleMessage } from '@/services/GeminiService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { tokenSummary } = await req.json();

    if (!tokenSummary || typeof tokenSummary !== 'string') {
      return NextResponse.json({ error: 'tokenSummary is required' }, { status: 400 });
    }

    const message = await generateOracleMessage(tokenSummary);
    return NextResponse.json({ message, timestamp: Date.now() });
  } catch (err) {
    console.error('[Oracle API] Error:', err);

    const errObj = err as any;
    if (errObj?.status === 429) {
      return NextResponse.json({ 
        message: '🔮 "I must conserve my energy... the visions are too fast. Wait a moment." (Rate Limit Reached)', 
        timestamp: Date.now(),
        isFallback: true 
      });
    }

    // Fallback mesaj
    const fallbackMessages = [
      '🔮 The Oracle is meditating... The islands have gone silent.',
      '⚡ The Nebula\'s energy is too intense, Oracle connection weakened...',
      '🌊 A whisper rises from the deep waters, but it cannot yet be deciphered...',
      '💎 The crystal ball has clouded over, await the next prophecy...',
    ];
    const fallback = fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];

    return NextResponse.json({ 
      message: fallback, 
      timestamp: Date.now(),
      isFallback: true 
    });
  }
}
