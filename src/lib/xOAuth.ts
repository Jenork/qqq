import { createHash, randomBytes } from 'crypto'
import type { NextResponse } from 'next/server'

export const X_ACCESS_TOKEN_COOKIE = 'based_doom_x_access_token'
export const X_OAUTH_STATE_COOKIE = 'based_doom_x_oauth_state'
export const X_OAUTH_VERIFIER_COOKIE = 'based_doom_x_oauth_verifier'

export const X_SCOPES = ['tweet.read', 'tweet.write', 'users.read', 'media.write', 'offline.access'].join(' ')

type XConfig = {
  clientId: string
  clientSecret: string
  redirectUri: string
}

export function getXConfig(request: Request): XConfig | null {
  const clientId = process.env.X_CLIENT_ID?.trim()
  const clientSecret = process.env.X_CLIENT_SECRET?.trim()

  if (!clientId || !clientSecret) {
    return null
  }

  return {
    clientId,
    clientSecret,
    redirectUri: process.env.X_REDIRECT_URI?.trim() || new URL('/api/x/callback', request.url).toString(),
  }
}

export function createOAuthToken() {
  return base64Url(randomBytes(32))
}

export function createCodeChallenge(verifier: string) {
  return base64Url(createHash('sha256').update(verifier).digest())
}

export function createBasicAuthHeader(clientId: string, clientSecret: string) {
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
}

export function setTemporaryOAuthCookie(response: NextResponse, name: string, value: string) {
  response.cookies.set(name, value, {
    httpOnly: true,
    maxAge: 10 * 60,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
}

export function setAccessTokenCookie(response: NextResponse, accessToken: string, expiresInSeconds: number) {
  response.cookies.set(X_ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    maxAge: Math.max(60, expiresInSeconds - 60),
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
}

export function clearTemporaryOAuthCookies(response: NextResponse) {
  response.cookies.delete(X_OAUTH_STATE_COOKIE)
  response.cookies.delete(X_OAUTH_VERIFIER_COOKIE)
}

export function clearAccessTokenCookie(response: NextResponse) {
  response.cookies.delete(X_ACCESS_TOKEN_COOKIE)
}

function base64Url(value: Buffer) {
  return value.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}
