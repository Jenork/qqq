# BaseUp Survival

BaseUp Survival is a mobile-first MVP 2D survival shooter built as a standard web app for the Base App. The stack uses Next.js, TypeScript, Tailwind CSS, Phaser 3, wagmi, viem, React Query, Base Account, Solidity, and Foundry.

## Features

- Playable 2D side-view survival loop with waves, ranged and melee enemies, score, game over, and restart
- React HUD over a Phaser canvas that works in a mobile webview
- Wallet connection with `injected()` and `baseAccount()`
- Free onchain item claim flow
- Best-score submission after game over
- Frontend-built leaderboard sourced from contract data

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

## Install frontend dependencies

```bash
npm install
```

## Run the app locally

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Environment variables

Copy `.env.example` to `.env.local` for the frontend and set:

- `NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL`: Base Sepolia RPC endpoint
- `NEXT_PUBLIC_GAME_PROGRESS_ADDRESS`: deployed `GameProgress` contract address

For contract deployment you also need:

- `PRIVATE_KEY`: deployer private key
- `BASESCAN_API_KEY`: optional contract verification key

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

## Deploy `GameProgress` to Base Sepolia

1. Enter the contracts directory.

```bash
cd contracts
```

2. Copy environment values into `contracts/.env` or export them in your shell.

```bash
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
PRIVATE_KEY=your_private_key
```

3. Deploy:

```bash
forge script script/DeployGameProgress.s.sol:DeployGameProgress \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast
```

4. Take the deployed address and place it into `NEXT_PUBLIC_GAME_PROGRESS_ADDRESS`.

## Wallet flow

- The game runs without a wallet.
- Connect a wallet only for claiming locked items or submitting a best score.
- If the wallet is on the wrong network, the UI exposes a `Switch to Base Sepolia` action before any write.

## Claim items

1. Connect a wallet.
2. Open Inventory.
3. Claim an item marked as `Onchain unlock`.
4. Wait for transaction confirmation.
5. The UI refetches unlocked status and the item becomes equippable.

## Submit score

1. Finish a run.
2. In the Game Over modal, click `Submit Score Onchain`.
3. Confirm the transaction.
4. The contract keeps only the best score for that wallet.

## Test leaderboard

1. Deploy the contract.
2. Play multiple runs from one or more wallets.
3. Submit different scores.
4. Open `Leaderboard` to confirm entries are sorted descending on the frontend.

## Contract tests

```bash
cd contracts
forge test
```
