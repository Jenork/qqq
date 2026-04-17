import { isAddress, parseUnits, type Address } from 'viem'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as Address

function readAddress(value?: string) {
  const normalized = value?.trim()
  return normalized && isAddress(normalized) ? (normalized as Address) : ZERO_ADDRESS
}

export const USDC_DECIMALS = 6
export const USDC_PAYMENT_AMOUNT_USDC = '0.3'
export const USDC_PAYMENT_AMOUNT_UNITS = parseUnits('0.3', 6)
export const SHOTGUN_PRICE_USDC = USDC_PAYMENT_AMOUNT_USDC
export const SHOTGUN_PRICE_UNITS = USDC_PAYMENT_AMOUNT_UNITS

export const USDC_TOKEN_ADDRESS = readAddress(process.env.NEXT_PUBLIC_USDC_TOKEN_ADDRESS)
export const HAS_USDC_TOKEN_ADDRESS = USDC_TOKEN_ADDRESS !== ZERO_ADDRESS

export const USDC_RECIPIENT = readAddress(process.env.NEXT_PUBLIC_USDC_RECIPIENT)
export const HAS_USDC_RECIPIENT = USDC_RECIPIENT !== ZERO_ADDRESS

export const erc20Abi = [
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const
