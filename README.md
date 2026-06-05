# Based DOOM

Based DOOM is a browser-based 2D side-view survival shooter built with Next.js, TypeScript, React, Tailwind CSS, Phaser 3, Zustand, wagmi, viem, Solidity, and Foundry.

The project is desktop-first for gameplay. Core combat does not require a wallet. Wallet connection is used only for optional Base Mainnet features such as leaderboard score submission and onchain Arsenal missions.

## Current structure

- `Game`: playable survival arena
- `Leaderboard`: onchain best-score board
- `Arsenal`: mission cards for offchain and onchain rewards
- `Wallet panel`: optional onchain save/progression layer

## Core gameplay

- The player is a sci-fi marine on the left side of the arena
- Enemies spawn from the right and attack in waves
- Desktop controls:
  - `A / D`: move
  - `W / Space / Up`: jump
  - `Left click`: shoot
  - `Q`: grenade
  - `E`: ability
  - `R`: heal
  - `Esc / P`: pause
  - `1`: pistol
  - `2`: shotgun
  - `3`: burst rifle

## Features

- Phaser 3 survival loop with melee, ranged, and heavy enemies
- React HUD over the Phaser canvas
- Onchain leaderboard reads and best-score submission
- Arsenal missions for armor, grenade, and shotgun rewards

## Project structure

```text
src/
  app/
  components/
  config/
  game/
  hooks/
  lib/
contracts/
  src/
  script/
  test/
```

## Install and run locally

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Frontend environment variables

Copy `.env.example` to `.env.local` and configure:

- `NEXT_PUBLIC_BASE_CHAIN_ID=8453`
- `NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org`
- `NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=` optional legacy fallback
- `NEXT_PUBLIC_GAME_SEASON_LABEL=Season 2`
- `NEXT_PUBLIC_GAME_SEASON_START_BLOCK=46900000`
- `NEXT_PUBLIC_GAME_PROGRESS_ADDRESS=...`
- `NEXT_PUBLIC_DAILY_CHECKIN_CONTRACT_ADDRESS=...`
- `NEXT_PUBLIC_USDC_TOKEN_ADDRESS=...`
- `NEXT_PUBLIC_USDC_RECIPIENT=...`
- `NEXT_PUBLIC_SOCIAL_TWITTER_URL=...`
- `NEXT_PUBLIC_SOCIAL_TELEGRAM_URL=...`

Notes:

- `NEXT_PUBLIC_DAILY_CHECKIN_CONTRACT_ADDRESS` can point to the same deployed contract as `NEXT_PUBLIC_GAME_PROGRESS_ADDRESS`
- If `NEXT_PUBLIC_DAILY_CHECKIN_CONTRACT_ADDRESS` is empty, the frontend falls back to `NEXT_PUBLIC_GAME_PROGRESS_ADDRESS`
- `NEXT_PUBLIC_BASE_RPC_URL` is the main RPC used by the frontend config
- `NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL` is kept only as a compatibility fallback
- Season data uses the old `GameProgress` contract. The frontend calculates the active season from `ScoreSubmitted` and `DailyCheckedIn` events emitted at or after `NEXT_PUBLIC_GAME_SEASON_START_BLOCK`.

## Contract deploy environment variables

For Foundry deploys on Base Mainnet, configure:

- `BASE_RPC_URL=https://mainnet.base.org`
- `DEPLOYER_PRIVATE_KEY=...`
- `NEXT_PUBLIC_USDC_TOKEN_ADDRESS=...`
- `NEXT_PUBLIC_USDC_RECIPIENT=...`
- `BASESCAN_API_KEY=...` optional

The deploy script also supports legacy fallback names:

- `PRIVATE_KEY`
- `USDC_TOKEN_ADDRESS`
- `USDC_RECIPIENT`

## Foundry installation

Install Foundry:

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

On Windows, use the official Foundry install instructions or WSL. Then verify:

```bash
forge --version
cast --version
```

## Base Mainnet deploy setup

The existing contract is:

- `contracts/src/GameProgress.sol`

It already contains:

- leaderboard best-score storage
- daily check-in state
- shotgun purchase/unlock logic

That means deploy flow does not need a second Daily Check-in contract. The current MVP uses one contract for:

- `submitScore`
- `getBestScore`
- `dailyCheckIn`
- `getLastCheckIn`
- `getCheckInCount`
- `purchaseShotgun`
- `isItemUnlocked`

## Foundry deploy script

Deploy script:

- `contracts/script/DeployGameProgress.s.sol`

It:

- reads deploy env values
- deploys `GameProgress`
- emits `GameProgressDeployed(...)` with the deployed address and constructor args

Constructor args are pulled from env:

- deployer key
- USDC token address
- USDC recipient address

Shotgun price is hardcoded in the script to match the current MVP:

- `0.3 USDC`
- `300000` base units for `6` decimals

## Deploy to Base Mainnet

1. Enter the contracts directory:

```bash
cd contracts
```

2. Copy `contracts/.env.example` to `contracts/.env` or export the variables in your shell.

PowerShell example:

```powershell
$env:BASE_RPC_URL="https://mainnet.base.org"
$env:DEPLOYER_PRIVATE_KEY="YOUR_PRIVATE_KEY"
$env:NEXT_PUBLIC_USDC_TOKEN_ADDRESS="0xYOUR_USDC_TOKEN"
$env:NEXT_PUBLIC_USDC_RECIPIENT="0xYOUR_RECIPIENT"
```

3. Deploy:

```bash
forge script script/DeployGameProgress.s.sol:DeployGameProgress --rpc-url $BASE_RPC_URL --broadcast -vvvv
```

PowerShell version:

```powershell
forge script script/DeployGameProgress.s.sol:DeployGameProgress --rpc-url $env:BASE_RPC_URL --broadcast -vvvv
```

4. Read the deployed address from the script output. The script emits:

- `GameProgressDeployed(deployedAddress, usdcToken, usdcRecipient, shotgunPrice)`

If you use Foundry broadcast artifacts, you can also inspect the latest address from:

- `contracts/broadcast/DeployGameProgress.s.sol/8453/`

## Frontend wiring after deploy

After deployment, update `.env.local`:

```env
NEXT_PUBLIC_GAME_PROGRESS_ADDRESS=0xDEPLOYED_CONTRACT
NEXT_PUBLIC_DAILY_CHECKIN_CONTRACT_ADDRESS=0xDEPLOYED_CONTRACT
NEXT_PUBLIC_BASE_CHAIN_ID=8453
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_USDC_TOKEN_ADDRESS=0xYOUR_USDC_TOKEN
NEXT_PUBLIC_USDC_RECIPIENT=0xYOUR_RECIPIENT
```

Then restart the frontend dev server.

Current frontend wiring:

- leaderboard reads `ScoreSubmitted` events from `NEXT_PUBLIC_GAME_PROGRESS_ADDRESS` after `NEXT_PUBLIC_GAME_SEASON_START_BLOCK`
- score submit writes use the legacy `submitScore(uint256)` function
- daily check-in stats read `DailyCheckedIn` events after `NEXT_PUBLIC_GAME_SEASON_START_BLOCK`
- daily check-in writes use the legacy `dailyCheckIn()` function via `NEXT_PUBLIC_DAILY_CHECKIN_CONTRACT_ADDRESS`, with fallback to `NEXT_PUBLIC_GAME_PROGRESS_ADDRESS`
- wallet flow still uses Base Mainnet only
- wallet remains optional for core gameplay

## Mission mechanics

### Daily Check-in

- Mission type: onchain
- A wallet can check in once every 24 hours
- Contract state:
  - `lastCheckInAt`
  - `checkInCount`
- Frontend reads:
  - `canCheckIn`
  - `getLastCheckIn`
  - `getCheckInCount`

#### Armor reward

- Successful daily check-in grants a full armor buffer equal to base HP
- The player switches to the red armored marine variant while the reward is active
- HP logic stays unchanged
- Reward state is kept separate from the mission card UI

### Follow Twitter + Telegram

- Mission type: offchain
- Uses:
  - `NEXT_PUBLIC_SOCIAL_TWITTER_URL`
  - `NEXT_PUBLIC_SOCIAL_TELEGRAM_URL`
- Completion is stored locally in the browser
- No external API is required

#### Grenade reward

- Successful confirmation unlocks the `fire-grenade`
- The reward is stored locally in the browser
- The default heal flow stays unchanged

### Pay 0.3 USDC

- Mission type: onchain
- Uses an ERC20 `transfer` with wagmi/viem
- Fixed amount:
  - `0.3 USDC`
  - `parseUnits("0.3", 6)`
- Uses:
  - `NEXT_PUBLIC_USDC_TOKEN_ADDRESS`
  - `NEXT_PUBLIC_USDC_RECIPIENT`

#### Shotgun unlock

- `pistol` is available by default
- `shotgun` is locked until the USDC mission succeeds
- After a successful USDC payment:
  - shotgun unlock is stored
  - hotkey `2` becomes active
  - shotgun becomes usable in combat

## Leaderboard rules

- The contract stores one `bestScore` per wallet
- A new score updates the stored score only if it is higher than the previous best
- Equal or lower scores do not replace the existing best
- The frontend sorts players by descending best score
- The connected player is highlighted in the leaderboard UI

## How to verify Daily Check-in after deploy

1. Set `NEXT_PUBLIC_GAME_PROGRESS_ADDRESS`
2. Set `NEXT_PUBLIC_DAILY_CHECKIN_CONTRACT_ADDRESS`
3. Start the frontend
4. Connect a wallet on Base Mainnet
5. Open `Arsenal`
6. Click `Daily Check-in`
7. Confirm the transaction
8. Verify:
   - mission status changes from available to cooldown state
   - `checkInCount` increases
   - the next run starts with bonus armor
   - the marine uses the red armored variant

## How to verify Base Mainnet in the frontend

You should see Base Mainnet behavior in these places:

- wallet panel network label
- mission cards with `wrong network` status if the wallet is on another chain
- score submit flow in `Game Over`

Expected frontend values:

- `NEXT_PUBLIC_BASE_CHAIN_ID=8453`
- `NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org`

If the wallet is on the wrong chain, the app should expose a `Switch to Base Mainnet` action before writes.

## How to test all 3 missions locally

### 1. Daily Check-in

1. Set the deployed contract address in frontend env
2. Connect a wallet on Base Mainnet
3. Open `Arsenal`
4. Click `Daily Check-in`
5. Confirm the transaction
6. Restart a run and verify bonus armor plus the red marine variant

### 2. Follow socials mission

1. Set `NEXT_PUBLIC_SOCIAL_TWITTER_URL`
2. Set `NEXT_PUBLIC_SOCIAL_TELEGRAM_URL`
3. Open `Arsenal`
4. Open both links
5. Click `Confirm Mission`
6. Verify that `fire-grenade` becomes unlocked and active in gameplay

### 3. Pay 0.3 USDC

1. Set `NEXT_PUBLIC_USDC_TOKEN_ADDRESS`
2. Set `NEXT_PUBLIC_USDC_RECIPIENT`
3. Fund the wallet with USDC on Base Mainnet
4. Open `Arsenal`
5. Click `Pay 0.3 USDC`
6. Confirm the transfer
7. Verify:
   - mission shows success
   - shotgun status becomes unlocked
   - hotkey `2` works in the next run

## Contract tests

If Foundry is installed:

```bash
cd contracts
forge test
```
