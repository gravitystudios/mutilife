import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'

const AUTH_COOKIE_NAME = 'dashboard_auth'
const secret = new TextEncoder().encode(process.env.COOKIE_SECRET || 'fallback-secret-change-in-production')

export async function setAuthCookie() {
  const token = await new SignJWT({ authenticated: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)

  cookies().set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/'
  })
}

export function clearAuthCookie() {
  cookies().delete(AUTH_COOKIE_NAME)
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    const authCookie = cookies().get(AUTH_COOKIE_NAME)
    if (!authCookie?.value) return false

    const { payload } = await jwtVerify(authCookie.value, secret)
    return payload.authenticated === true
  } catch {
    return false
  }
}

export async function verifyAuth(request: Request) {
  try {
    const cookieHeader = request.headers.get('cookie')
    if (!cookieHeader) return { authenticated: false }

    const authCookie = cookieHeader.split(';').find(c => c.trim().startsWith(AUTH_COOKIE_NAME + '='))
    if (!authCookie) return { authenticated: false }

    const token = authCookie.split('=')[1]
    const { payload } = await jwtVerify(token, secret)
    return { authenticated: payload.authenticated === true }
  } catch {
    return { authenticated: false }
  }
}
