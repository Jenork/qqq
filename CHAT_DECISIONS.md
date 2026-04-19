# Based DOOM Chat Decisions

## Why This Exists

This file compresses the important product and engineering decisions that were made in the original Codex chat so a new account can continue without replaying the whole conversation.

## Project Identity

Original working name:

- `BaseUp Survival`

Current visible name:

- `Based DOOM`

Product category:

- desktop-first browser survival shooter with optional Base onchain layer

## Stable Rules

These rules were repeated many times and should be treated as hard constraints unless the user changes them again.

- Do not rewrite the entire project.
- Make minimal edits.
- Do not break gameplay while working on missions or wallet flows.
- Do not make wallet mandatory for starting the game.
- Keep onchain logic optional.
- Do not reintroduce Farcaster / mini-app architecture.
- Do not bring back the removed inventory panel.
- Do not overload the UI with explanatory copy.

## Major Product Direction Changes

### Network Direction

Initial direction:

- Base Sepolia for MVP

Later decision:

- switch to `Base Mainnet`

This change affected:

- env values
- deploy instructions
- frontend chain config
- wallet flow expectations

### Daily Check-in Reward

Early requested direction:

- heal reward

Later correction from user:

- daily check-in reward should be armor

Current truth:

- successful daily check-in grants bonus armor
- this reward is separated from plain HP logic
- visual direction ties active armor to a different marine appearance

### Social Mission Reward

Early intermediate direction:

- social mission reward involved armor / heal discussion

Final correction from user:

- social mission reward is grenade only

Current truth:

- follow Twitter + Telegram
- local completion only
- reward is grenade unlock

### USDC Mission Reward

This remained stable:

- pay `0.3 USDC`
- reward is shotgun unlock

Current truth:

- shotgun is no longer available by default
- pistol is default
- shotgun unlocks after successful USDC mission
- hotkey `2` must not work before unlock

### Weapon Set

Earlier state:

- multiple weapons including hotkey `3`

User correction:

- remove extra weapon on button `3`

Current truth:

- do not bring back the third weapon unless explicitly requested

## UI / Design Decisions

The user repeatedly wanted the site to look much closer to a supplied infernal DOOM-like reference image.

Accepted visual direction:

- inferno / hellish atmosphere
- strong red-orange glow
- aggressive panel frames
- more game-like and less SaaS-like UI
- compact Arsenal mission cards
- cleaner wallet panel with less explanatory text

Branding changes:

- rename visible product to `Based DOOM`
- remove older supporting slogans from the surface UI

Header / control placement decisions:

- wallet button should live in the top-right
- tabs should be shifted left to avoid overlap with wallet button
- sound button should live near the pause button in gameplay UI, not as a top competing header action

## Wallet / Onchain Decisions

Wallet behavior:

- optional for core gameplay
- used for leaderboard save and onchain missions

Connection strategy moved toward:

- simpler injected browser wallet flow

Important meta requirement added:

```html
<meta name="base:app_id" content="69e39c8642302cc6a1381d44" />
```

This should remain in the homepage `<head>` unless explicitly removed by the user.

## Mission UI Decisions

The user asked to normalize the three Arsenal cards into a more consistent style.

Current direction:

- each card should show a clear reward
- success state should be visually unified
- remove extra labels like `Armor`, `Reward Active`, and other noisy mixed wording
- prefer one clean success pattern across all mission cards

## Explorer / Wallet Panel Intent

The user asked for:

- fewer unnecessary wallet explanations
- quick wallet copy
- explorer jump from wallet panel

Implementation details can vary, but the intent should stay the same.

## Leaderboard Intent

The user asked to stabilize leaderboard behavior rather than rewrite it.

Current rules:

- best score per player only
- update only on strictly better score
- do not overwrite with equal or lower scores
- frontend sorts descending
- highlight the current player

## Local / Deploy / Tooling Decisions

The user needed help installing Foundry on Windows manually.

Important practical context:

- Foundry installation through PowerShell script was problematic on the user machine
- manual download of Windows release artifacts was used instead

If future deploy work is needed, assume Windows-first instructions are useful.

## Errors Already Seen In Real Usage

These are not hypothetical. They happened during testing.

- wallet wrong-network errors when wallet was on Ethereum mainnet instead of Base
- noisy `User rejected the request...` messages should not be surfaced as ugly UI text
- social mission links at one point opened generic social sites instead of target accounts
- grenade reward was locked in Arsenal while still available in gameplay
- score submission produced `Version of JSON-RPC protocol is not supported.`

That last item is the main currently active bug.

## Current Open Technical Thread

Latest work before handoff focused on the score submission error:

- `Version of JSON-RPC protocol is not supported.`

Attempts already made:

- remove explicit chain switching from score submit path
- remove explicit `chainId` from the `writeContract` score submission call
- simplify wagmi connector setup away from `@base-org/account`
- switch score submit toward direct injected-provider transaction send

At the time of handoff:

- latest code compiles with `npm run typecheck`
- browser re-test still needs confirmation

## What A New Codex Account Should Avoid Re-Litigating

Do not reopen these as if undecided:

- Base Mainnet vs Base Sepolia: current direction is Mainnet
- whether wallet should be mandatory: it should not
- whether social mission should use external verification API: it should not
- whether daily check-in reward is heal: it is not
- whether social reward is armor: it is not
- whether shotgun should be unlocked by default: it should not
- whether burst rifle should stay: it should not

## Suggested Immediate First Checks In A New Session

1. Read `PROJECT_HANDOFF.md`.
2. Run `git status --short`.
3. Run `git diff`.
4. Start local dev server if needed.
5. Re-test `submitScore` on Base Mainnet wallet.
6. Only after that continue with new feature work.
