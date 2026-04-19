# Based DOOM Project Handoff

## Purpose

This file is a practical handoff for continuing the project from another Codex account without the original chat history.

Project path:

- `C:\codex_projects\Doom`

Repository/product name:

- `Based DOOM`

Project type:

- browser-based 2D side-view survival shooter
- desktop-first gameplay
- Next.js + React UI shell
- Phaser 3 gameplay runtime
- optional onchain layer on Base Mainnet

## High-Level Product Summary

The player is a sci-fi marine on the left side of the arena. Enemies spawn from the right. The player survives waves, gains score, and can optionally connect a wallet to use mission rewards and save best score onchain.

Core rule:

- wallet is optional for gameplay

Current tabs:

- `Game`
- `Leaderboard`
- `Arsenal`

Separate wallet surface:

- wallet panel / wallet trigger remains separate from core gameplay UI

## Final Product Direction

Use this as the current source of truth for future changes.

- Do not rewrite the project from scratch.
- Make minimal, targeted changes.
- Keep gameplay first.
- Do not bring back Farcaster / mini-app architecture.
- Do not make wallet required to start or play.
- Keep `game logic`, `UI logic`, and `onchain logic` separated.
- Do not reintroduce the old inventory panel.
- Do not bloat the screen with extra explanatory UI.

## Stack

- Next.js App Router
- TypeScript
- React
- Tailwind CSS
- Phaser 3
- Zustand
- wagmi
- viem
- `@tanstack/react-query`
- Solidity
- Foundry

## Network / Onchain Status

Current target network:

- `Base Mainnet`
- chain id `8453`

The project started with Base Sepolia in earlier planning, but the active direction is now Base Mainnet.

Main contract concept:

- one `GameProgress` contract currently covers:
  - best score storage
  - daily check-in
  - shotgun purchase/unlock

Frontend uses env-driven addresses. Do not hardcode deployed addresses in source.

## Core Gameplay State

Gameplay itself should remain mostly untouched unless explicitly requested.

Controls currently expected:

- `A / D` move
- `W / Space / Up` jump
- left mouse shoot
- `Q` grenade
- `E` ability
- `R` heal
- `Esc / P` pause
- `1` pistol
- `2` shotgun

Important:

- extra weapon on hotkey `3` was removed by product direction
- pause button should exist in the in-game UI

## Weapons / Unlock Rules

Current intended weapon availability:

- `pistol` available by default
- `shotgun` locked until USDC mission succeeds
- hotkey `2` must not select shotgun while locked

Do not reintroduce burst rifle unless explicitly requested.

## Mission System: Current Truth

There are 3 Arsenal mission cards.

### 1. Daily Check-in

Type:

- onchain

State:

- once per 24 hours

Reward:

- bonus armor

Gameplay integration:

- reward is not plain HP rewrite
- use an armor buffer / extra armor points
- current visual direction: armored reward also changes the marine presentation to the red armored variant while active

Important:

- daily check-in no longer gives heal reward
- daily check-in reward is now armor

### 2. Follow Twitter + Telegram

Type:

- offchain / local only

Storage:

- local browser state
- no external API

Links come from env/config:

- `NEXT_PUBLIC_SOCIAL_TWITTER_URL`
- `NEXT_PUBLIC_SOCIAL_TELEGRAM_URL`

Current fallback URLs in source:

- `https://x.com/super_jenork`
- `https://t.me/monstrohunt`

Reward:

- grenade unlock only

Important:

- this mission no longer gives armor
- this mission no longer gives heal
- after user correction, reward became grenade only

### 3. Pay 0.3 USDC

Type:

- onchain

Payment:

- exactly `0.3 USDC`
- ERC20 `transfer`
- `parseUnits("0.3", 6)`

Reward:

- shotgun unlock

Important:

- do not add USDC payment to gameplay unless explicitly asked
- current reward is unlock state, not direct stat buff

## UI / Visual Direction

The product was visually reworked toward a stronger inferno / DOOM-like style.

Current design direction:

- darker infernal background
- red-orange glow accents
- stronger arcade/retro framing
- more aggressive typography and panel styling
- compact mission cards
- fewer helper texts

Current visible branding:

- `Based DOOM`

Explicitly removed old footer-style slogans:

- `BaseUp Survival`
- `Doom-like Aesthetic`
- `Atmospheric and Immersive`
- `Gameplay First`

The user wanted the app to look closer to a supplied reference image. Continue moving in that direction rather than reverting to generic web-app cards.

## Wallet / Header / HUD Direction

Recent UI decisions:

- wallet trigger belongs in the top-right corner
- tab group should be shifted left so it does not hide under the wallet button
- sound button should sit near the in-game pause control, not as a competing top header action

Wallet panel cleanup direction:

- remove unnecessary explanatory text
- allow fast wallet copy
- allow block explorer jump

Use Base ecosystem naming and explorer logic. Avoid unrelated chain naming.

## Leaderboard Rules

Leaderboard logic should behave like this:

- store only the best result per wallet
- update only if the new score is strictly higher
- equal or lower scores must not replace the stored best
- frontend sorts descending by best score
- current player row is highlighted

Do not rewrite leaderboard from zero unless absolutely necessary.

## Base App Verification

Homepage `<head>` should include:

```html
<meta name="base:app_id" content="69e39c8642302cc6a1381d44" />
```

This was requested explicitly for verification.

## Env / Secrets Guidance

Never commit secrets.

Key frontend env names used by the project:

- `NEXT_PUBLIC_BASE_CHAIN_ID`
- `NEXT_PUBLIC_BASE_RPC_URL`
- `NEXT_PUBLIC_GAME_PROGRESS_ADDRESS`
- `NEXT_PUBLIC_DAILY_CHECKIN_CONTRACT_ADDRESS`
- `NEXT_PUBLIC_USDC_TOKEN_ADDRESS`
- `NEXT_PUBLIC_USDC_RECIPIENT`
- `NEXT_PUBLIC_SOCIAL_TWITTER_URL`
- `NEXT_PUBLIC_SOCIAL_TELEGRAM_URL`

Key deploy env names:

- `BASE_RPC_URL`
- `DEPLOYER_PRIVATE_KEY`
- `BASESCAN_API_KEY`

Actual private values live in local/Vercel env, not in tracked docs.

## Key Source Areas

Use these files as the main project map.

- `src/app/` app shell and layout
- `src/components/` UI surfaces including wallet, tabs, HUD, modal
- `src/game/` Phaser gameplay runtime
- `src/hooks/` mission and wallet hooks
- `src/config/` chain, missions, contract, and item config
- `src/lib/` mission storage/helpers and wallet utilities
- `contracts/src/GameProgress.sol` main contract
- `contracts/script/DeployGameProgress.s.sol` Foundry deploy script

Particularly important files:

- `src/components/GameOverModal.tsx`
- `src/components/ConnectWallet.tsx`
- `src/components/Hud.tsx`
- `src/components/OnchainPanel.tsx`
- `src/components/SiteTabs.tsx`
- `src/hooks/useDailyCheckIn.ts`
- `src/hooks/useUsdcPayment.ts`
- `src/config/contracts.ts`
- `src/config/missions.ts`
- `src/config/wagmi.ts`
- `src/lib/wallet.ts`

## Current Uncommitted Workspace State

At the moment of writing this handoff, the repo has local uncommitted changes.

Modified files:

- `src/components/ConnectWallet.tsx`
- `src/components/GameOverModal.tsx`
- `src/config/missions.ts`
- `src/config/wagmi.ts`
- `src/lib/wallet.ts`

Diff summary:

- wallet connector flow simplified toward browser injected wallet
- `baseAccount` connector path removed from wagmi config
- mission config keeps current social fallbacks
- score submit flow is being adjusted
- low-level wallet helper added for direct injected transaction send

Before making more changes, the new Codex account should check `git diff` and decide whether to commit, refine, or revert none of it.

## Active Known Issue

Current open bug being worked on:

- onchain score submission can show `Version of JSON-RPC protocol is not supported.`

Most recent mitigation already applied in the working tree:

- score submission in `GameOverModal` was moved away from the problematic `wagmi` write path toward direct `eth_sendTransaction` through the injected provider

Status:

- `npm run typecheck` passed after the change
- runtime verification in browser still needs to be confirmed manually

If this still fails in the browser, inspect:

- actual wallet provider in use
- whether another flow still hits unsupported RPC methods
- whether the issue happens only on `submitScore` or also on `dailyCheckIn` / `pay 0.3 USDC`

## Commands

Local dev:

```powershell
npm install
npm run dev
```

Typecheck:

```powershell
npm run typecheck
```

Contracts:

```powershell
cd contracts
forge test
forge script script/DeployGameProgress.s.sol:DeployGameProgress --rpc-url $env:BASE_RPC_URL --broadcast -vvvv
```

## Recommended Startup Prompt For A New Codex Account

Use a prompt like this in the new account:

```text
Работаем в существующем проекте Based DOOM по файлам PROJECT_HANDOFF.md и CHAT_DECISIONS.md.
Не переписывай проект целиком. Вноси минимальные изменения.
Сначала прочитай handoff-файлы и текущий git diff, затем продолжай с открытой задачей.
```

## What To Read First In A New Session

Recommended order:

1. `PROJECT_HANDOFF.md`
2. `CHAT_DECISIONS.md`
3. `git status --short`
4. `git diff`
5. `README.md`

That should recover enough context to continue without the original chat.
