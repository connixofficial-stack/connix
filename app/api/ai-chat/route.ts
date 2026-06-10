import { NextResponse } from 'next/server';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/convex';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = String(body?.message ?? '').trim();
    const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : undefined;
    const sourcePath = typeof body?.sourcePath === 'string' ? body.sourcePath : undefined;

    if (!message) {
      return NextResponse.json({ message: 'Vui lòng nhập nội dung cần hỏi.' }, { status: 400 });
    }

    const client = getConvexClient();
    const result = await client.action(api.aiChat.sendMessage, {
      message,
      sessionId,
      sourcePath,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Chatbot AI chưa thể phản hồi.';
    return NextResponse.json({ message }, { status: 500 });
  }
}
