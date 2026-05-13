import { NextResponse } from 'next/server';
import { AUTH_COOKIE, isUserRole } from '@/lib/auth';

type LoginBody = {
  username?: unknown;
  password?: unknown;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginBody;
    const username = typeof body.username === 'string' ? body.username.toUpperCase() : '';

    if (!isUserRole(username) || body.password !== 'admin123') {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid credentials',
        },
        { status: 401 },
      );
    }

    const response = NextResponse.json({
      ok: true,
      role: username,
    });

    response.cookies.set(AUTH_COOKIE, username, {
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch (error) {
    console.error('Failed to login', error);

    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to login',
      },
      { status: 500 },
    );
  }
}
