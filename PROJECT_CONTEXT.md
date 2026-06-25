# PROJECT_CONTEXT.md

## Based DOOM

Browser-based 2D survival shooter.

Stack:

* Next.js
* TypeScript
* React
* Tailwind
* Phaser 3
* Zustand
* wagmi
* viem
* Solidity
* Foundry

## Product Rules

* Gameplay first.
* Wallet is optional.
* Base Mainnet only.
* Do not reintroduce Farcaster / Mini App architecture.
* Do not bring back the old Inventory panel.
* Do not rewrite large parts of the project unless explicitly requested.
* Make minimal targeted changes.

## Network

* Base Mainnet
* Chain ID: 8453

Required meta tag:

```html
<meta name="base:app_id" content="69e39c8642302cc6a1381d44" />
```

## Tabs

* Game
* Leaderboard
* Arsenal

Wallet UI remains separate from gameplay.

## Gameplay

Controls:

* A / D = Move
* W / Space / Up = Jump
* Left Mouse = Shoot
* Q = Grenade
* E = Ability
* R = Heal
* Esc / P = Pause
* 1 = Pistol
* 2 = Shotgun

Do not add weapon slot 3.

## Weapons

Default:

* Pistol

Unlocks:

* Shotgun → 0.3 USDC mission
* Grenade → Social mission

Shotgun must stay locked until unlocked.

## Missions

### Daily Check-in

Type:

* Onchain

Reward:

* Armor

Rules:

* Once every 24h
* Armor is separate from HP
* Active armor uses red marine variant

### Follow Twitter + Telegram

Type:

* Local only

Reward:

* Grenade unlock

Rules:

* No external verification API
* Stored in browser state

### Pay 0.3 USDC

Type:

* Onchain

Reward:

* Shotgun unlock

Rules:

* Uses parseUnits("0.3", 6)
* Uses configured USDC token and recipient

## UI Direction

Style:

* DOOM-like
* Infernal atmosphere
* Red-orange glow
* Aggressive arcade styling
* Compact mission cards

Header:

* Wallet button top-right
* Tabs shifted left
* Sound button near pause button

## Leaderboard Rules

* One best score per wallet
* Update only if score is higher
* Ignore equal or lower scores
* Sort descending
* Highlight current player

## Important Files

Frontend:

* src/components/GameOverModal.tsx
* src/components/ConnectWallet.tsx
* src/components/Hud.tsx
* src/components/OnchainPanel.tsx
* src/hooks/useDailyCheckIn.ts
* src/hooks/useUsdcPayment.ts
* src/config/wagmi.ts
* src/config/contracts.ts
* src/lib/wallet.ts

Contracts:

* contracts/src/GameProgress.sol
* contracts/script/DeployGameProgress.s.sol

## Current Known Issue

Open bug:

Version of JSON-RPC protocol is not supported.

Recent work:

* submitScore moved away from wagmi write path
* switched toward injected wallet transaction flow

Status:

* typecheck passes
* browser verification still required

## Startup Workflow

Before making changes:

1. Read this file.
2. Run git status --short.
3. Run git diff.
4. Continue with the active task.
