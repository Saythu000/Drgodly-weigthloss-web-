import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const expectedEmail = process.env.ADMIN_EMAIL || 'kalyan@drgodly.com';
    const expectedPassword = process.env.ADMIN_PASSWORD || 'drgodly@123456';

    if (
      email?.trim().toLowerCase() === expectedEmail.toLowerCase() &&
      password === expectedPassword
    ) {
      const response = NextResponse.json({ success: true, message: 'Authenticated successfully' });

      // Set HTTP-only session cookie valid for 30 days
      response.cookies.set({
        name: 'drgodly_session',
        value: 'authenticated_admin_session',
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 days
      });

      return response;
    }

    return NextResponse.json(
      { success: false, error: 'Invalid Admin email or password' },
      { status: 401 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Authentication error' },
      { status: 500 }
    );
  }
}
