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
* Profile

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

* Shotgun -> Daily check-in mission
* Grenade -> 0.3 USDC mission

Shotgun must stay locked until unlocked.

## Missions

### Daily Check-in

Type:

* Onchain

Reward:

* Shotgun unlock

Rules:

* Once every 24h
* Unlock is driven by active daily reward state

### Follow Twitter + Telegram

Type:

* Local only

Reward:

* Armor

Rules:

* No external verification API
* Stored in browser state
* Armor is separate from HP
* Active armor uses armored marine variant

### Pay 0.3 USDC

Type:

* Onchain

Reward:

* Grenade unlock

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
* Visible leaderboard starts from Base block `47772727`
* Read `ScoreSubmitted` logs in chunks no larger than `10_000` blocks on Base RPC

## Important Files

Frontend:

* src/components/GameOverModal.tsx
* src/components/ConnectWallet.tsx
* src/components/Hud.tsx
* src/components/OnchainPanel.tsx
* src/components/ProfilePanel.tsx
* src/components/MissionRewardSync.tsx
* src/hooks/useDailyCheckIn.ts
* src/hooks/useUsdcPayment.ts
* src/config/contracts.ts
* src/config/season.ts
* src/lib/seasonProgress.ts

Contracts:

* contracts/src/GameProgress.sol
* contracts/script/DeployGameProgress.s.sol

## Current Known Issue

Recent work:

* leaderboard reset to start from Base block `47772727` (`2026-06-25 00:00:00 MSK`)
* Base RPC `eth_getLogs` paging fixed by reading max `10_000` blocks per chunk
* Arsenal rewards remapped:
* Daily check-in -> Shotgun
* Social links -> Armor
* 0.3 USDC -> Grenade
* Game Over modal now uses `/sprites/player-marine-dead.png`
* Profile tab now uses `/sprites/profile-marine.png`
* HUD helmet art was replaced and rescaled in `src/components/Hud.tsx`

Status:

* typecheck passes
* browser verification still useful after art swaps or HUD tuning

## Startup Workflow

Before making changes:

1. Read this file.
2. Run git status --short.
3. Run git diff.
4. Continue with the active task.
