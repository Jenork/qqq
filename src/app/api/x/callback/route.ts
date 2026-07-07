import { type NextRequest, NextResponse } from 'next/server'
import {
  X_OAUTH_STATE_COOKIE,
  X_OAUTH_VERIFIER_COOKIE,
  clearTemporaryOAuthCookies,
  createBasicAuthHeader,
  getXConfig,
  setAccessTokenCookie,
} from '@/lib/xOAuth'

export const dynamic = 'force-dynamic'

type TokenResponse = {
  access_token?: string
  expires_in?: number
  error?: string
  error_description?: string
}

export async function GET(request: NextRequest) {
  const config = getXConfig(request)
  const requestUrl = new URL(request.url)
  const appUrl = new URL('/?x=connected#game', requestUrl.origin)
  const errorUrl = new URL('/?x=error#game', requestUrl.origin)

  if (!config) {
    return NextResponse.redirect(errorUrl)
  }

  const code = requestUrl.searchParams.get('code')
  const state = requestUrl.searchParams.get('state')
  const storedState = request.cookies.get(X_OAUTH_STATE_COOKIE)?.value
  const codeVerifier = request.cookies.get(X_OAUTH_VERIFIER_COOKIE)?.value

  if (!code || !state || !storedState || !codeVerifier || state !== storedState) {
    return NextResponse.redirect(errorUrl)
  }

  const tokenResponse = await fetch('https://api.x.com/2/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: createBasicAuthHeader(config.clientId, config.clientSecret),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.redirectUri,
      code_verifier: codeVerifier,
    }),
  })
  const tokenJson = (await tokenResponse.json().catch(() => ({}))) as TokenResponse

  if (!tokenResponse.ok || !tokenJson.access_token) {
    console.error('Failed to exchange X OAuth code.', tokenJson)
    const response = NextResponse.redirect(errorUrl)
    clearTemporaryOAuthCookies(response)
    return response
  }

  const response = NextResponse.redirect(appUrl)

  clearTemporaryOAuthCookies(response)
  setAccessTokenCookie(response, tokenJson.access_token, tokenJson.expires_in ?? 7200)

  return response
}
