import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { X_ACCESS_TOKEN_COOKIE, getXConfig } from '@/lib/xOAuth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    configured: Boolean(getXConfig(request)),
    connected: Boolean(request.cookies.get(X_ACCESS_TOKEN_COOKIE)?.value),
  })
}
