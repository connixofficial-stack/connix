import { NextResponse } from 'next/server';
import { getConvexClient } from '@/lib/convex';
import { api } from '@/convex/_generated/api';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const to = String(body?.to ?? '').trim();
    const subject = String(body?.subject ?? '').trim();
    const html = String(body?.html ?? '').trim();

    if (!EMAIL_REGEX.test(to)) {
      return NextResponse.json({ message: 'Email nhận không hợp lệ.' }, { status: 400 });
    }
    if (!subject) {
      return NextResponse.json({ message: 'Tiêu đề email không hợp lệ.' }, { status: 400 });
    }
    if (!html) {
      return NextResponse.json({ message: 'Nội dung email không hợp lệ.' }, { status: 400 });
    }

    const client = getConvexClient();
    const result = await client.action(api.email.sendTestEmailAction, {
      to,
      subject,
      html,
    });

    if (!result.success) {
      return NextResponse.json({ message: result.reason || 'Gửi email test thất bại.' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Gửi email test thất bại.';
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
