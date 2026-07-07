import { type NextRequest, NextResponse } from 'next/server'
import { X_ACCESS_TOKEN_COOKIE, clearAccessTokenCookie, getXConfig } from '@/lib/xOAuth'

export const dynamic = 'force-dynamic'

type UploadResponse = {
  data?: {
    id?: string
    media_id?: string
    media_id_string?: string
  }
  errors?: unknown[]
  detail?: string
  title?: string
}

type CreatePostResponse = {
  data?: {
    id?: string
    text?: string
  }
  errors?: unknown[]
  detail?: string
  title?: string
}

function isAllowedOrigin(request: NextRequest) {
  const origin = request.headers.get('origin')

  if (!origin) {
    return true
  }

  return origin === new URL(request.url).origin || origin === 'https://based-doom.vercel.app'
}

function getXErrorDetail(payload: UploadResponse | CreatePostResponse) {
  const firstError = Array.isArray(payload.errors) ? payload.errors[0] : null

  if (firstError && typeof firstError === 'object') {
    const errorRecord = firstError as Record<string, unknown>
    const detail = errorRecord.detail ?? errorRecord.message ?? errorRecord.title

    if (typeof detail === 'string') {
      return detail
    }
  }

  return payload.detail ?? payload.title
}

function jsonError(error: string, status: number, detail?: string, upstreamStatus?: number) {
  return NextResponse.json({ error, detail, upstreamStatus }, { status })
}

export async function POST(request: NextRequest) {
  if (!isAllowedOrigin(request)) {
    return jsonError('forbidden_origin', 403)
  }

  if (!getXConfig(request)) {
    return jsonError('x_oauth_not_configured', 503)
  }

  const accessToken = request.cookies.get(X_ACCESS_TOKEN_COOKIE)?.value

  if (!accessToken) {
    return jsonError('x_not_connected', 401)
  }

  const formData = await request.formData()
  const image = formData.get('image')
  const text = String(formData.get('text') ?? '').trim()

  if (!(image instanceof File) || image.type !== 'image/png') {
    return jsonError('invalid_share_image', 400)
  }

  if (image.size > 5 * 1024 * 1024) {
    return jsonError('share_image_too_large', 400)
  }

  if (!text || text.length > 280) {
    return jsonError('invalid_share_text', 400)
  }

  const encodedImage = Buffer.from(await image.arrayBuffer()).toString('base64')

  const uploadResponse = await fetch('https://api.x.com/2/media/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      media: encodedImage,
      media_category: 'tweet_image',
      media_type: 'image/png',
    }),
  })
  const uploadJson = (await uploadResponse.json().catch(() => ({}))) as UploadResponse
  const mediaId = uploadJson.data?.id ?? uploadJson.data?.media_id_string ?? uploadJson.data?.media_id

  if (!uploadResponse.ok || !mediaId) {
    console.error('Failed to upload X media.', uploadResponse.status, uploadJson)

    if (uploadResponse.status === 401 || uploadResponse.status === 403) {
      const response = jsonError('x_reconnect_required', 401, getXErrorDetail(uploadJson), uploadResponse.status)
      clearAccessTokenCookie(response)
      return response
    }

    if (uploadResponse.status === 429) {
      return jsonError('x_rate_limited', 429, getXErrorDetail(uploadJson), uploadResponse.status)
    }

    return jsonError('x_media_upload_failed', 502, getXErrorDetail(uploadJson), uploadResponse.status)
  }

  const postResponse = await fetch('https://api.x.com/2/tweets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      media: {
        media_ids: [mediaId],
      },
    }),
  })
  const postJson = (await postResponse.json().catch(() => ({}))) as CreatePostResponse
  const postId = postJson.data?.id

  if (!postResponse.ok || !postId) {
    console.error('Failed to create X post.', postResponse.status, postJson)

    if (postResponse.status === 401 || postResponse.status === 403) {
      const response = jsonError('x_reconnect_required', 401, getXErrorDetail(postJson), postResponse.status)
      clearAccessTokenCookie(response)
      return response
    }

    if (postResponse.status === 429) {
      return jsonError('x_rate_limited', 429, getXErrorDetail(postJson), postResponse.status)
    }

    return jsonError('x_post_failed', 502, getXErrorDetail(postJson), postResponse.status)
  }

  return NextResponse.json({
    id: postId,
    url: `https://x.com/i/web/status/${postId}`,
  })
}
