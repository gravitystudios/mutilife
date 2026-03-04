import { NextResponse } from 'next';
import { verifyAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const response = await fetch('https://api-pudo.co.za/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.PUDO_EMAIL,
        password: process.env.PUDO_DPASSWORD,
        remember: true
      })
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Login failed' }, { status: 500 });
    }

    const data = await response.json();
    const balance = data[0]?.user?.account?.balance || '0.00';
    
    return NextResponse.json({ balance });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
