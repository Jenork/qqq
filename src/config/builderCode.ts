import { Attribution } from 'ox/erc8021'
import type { Hex } from 'viem'

const configuredBuilderCode = process.env.NEXT_PUBLIC_BASE_BUILDER_CODE?.trim() ?? ''

function createBuilderDataSuffix(code: string): Hex | undefined {
  if (!code) {
    return undefined
  }

  try {
    return Attribution.toDataSuffix({
      codes: [code],
    }) as Hex
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Invalid NEXT_PUBLIC_BASE_BUILDER_CODE.', error)
    }

    return undefined
  }
}

export const BASE_BUILDER_CODE = configuredBuilderCode
export const HAS_BASE_BUILDER_CODE = BASE_BUILDER_CODE.length > 0
export const BASE_BUILDER_DATA_SUFFIX = createBuilderDataSuffix(
  BASE_BUILDER_CODE,
)
