function isUserRejectedError(error: unknown) {
  if (!error) {
    return false
  }

  if (typeof error === 'string') {
    const normalized = error.toLowerCase()
    return normalized.includes('user rejected') || normalized.includes('user denied')
  }

  if (typeof error === 'object') {
    const candidate = error as {
      code?: number
      shortMessage?: string
      message?: string
      details?: string
    }

    if (candidate.code === 4001) {
      return true
    }

    const combined = [candidate.shortMessage, candidate.message, candidate.details]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return combined.includes('user rejected') || combined.includes('user denied')
  }

  return false
}

export function getDisplayErrorMessage(error: unknown) {
  if (!error) {
    return 'Unknown error.'
  }

  if (isUserRejectedError(error)) {
    return null
  }

  if (typeof error === 'string') {
    return error
  }

  if (typeof error === 'object') {
    const candidate = error as { shortMessage?: string; message?: string }

    if (candidate.shortMessage) {
      return candidate.shortMessage
    }

    if (candidate.message) {
      return candidate.message
    }
  }

  return 'Request failed.'
}

export function formatRelativeUnlockTime(timestampMs: number) {
  const diff = Math.max(0, timestampMs - Date.now())

  if (diff <= 0) {
    return 'Now'
  }

  const totalMinutes = Math.ceil(diff / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours <= 0) {
    return `${minutes}m`
  }

  if (minutes === 0) {
    return `${hours}h`
  }

  return `${hours}h ${minutes}m`
}
