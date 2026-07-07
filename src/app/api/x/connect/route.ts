import { NextResponse } from 'next/server'
import {
  X_OAUTH_STATE_COOKIE,
  X_OAUTH_VERIFIER_COOKIE,
  X_SCOPES,
  createCodeChallenge,
  createOAuthToken,
  getXConfig,
  setTemporaryOAuthCookie,
} from '@/lib/xOAuth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const config = getXConfig(request)

  if (!config) {
    return NextResponse.json({ error: 'x_oauth_not_configured' }, { status: 503 })
  }

  const state = createOAuthToken()
  const verifier = createOAuthToken()
  const searchParams = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: X_SCOPES,
    state,
    code_challenge: createCodeChallenge(verifier),
    code_challenge_method: 'S256',
  })
  const response = NextResponse.redirect(`https://twitter.com/i/oauth2/authorize?${searchParams.toString()}`)

  setTemporaryOAuthCookie(response, X_OAUTH_STATE_COOKIE, state)
  setTemporaryOAuthCookie(response, X_OAUTH_VERIFIER_COOKIE, verifier)

  return response
}
