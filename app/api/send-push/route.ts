import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { fcm } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { userId, title, body } = await request.json();

    if (!userId || !title || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createClient();

    // 1. Get User's FCM Token
    const { data: user, error } = await supabase
      .from('users')
      .select('fcm_token')
      .eq('id', userId)
      .single();

    if (error || !user?.fcm_token) {
      console.log(`No FCM token found for user ${userId}`);
      return NextResponse.json({ message: 'User has no FCM token' });
    }

    // 2. Send Notification
    try {
      await fcm.send({
        token: user.fcm_token,
        notification: {
          title: title,
          body: body,
        },
        data: {
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
          type: 'report_resolved',
        },
      });
      return NextResponse.json({ success: true });
    } catch (fcmError: any) {
      console.error('FCM Send Error:', fcmError);
      // Clean up invalid tokens
      if (fcmError.code === 'messaging/registration-token-not-registered') {
         await supabase.from('users').update({ fcm_token: null }).eq('id', userId);
      }
      return NextResponse.json({ error: 'Failed to send FCM message' }, { status: 500 });
    }

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
