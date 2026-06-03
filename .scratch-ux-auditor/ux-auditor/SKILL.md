---
name: ux-auditor
description: Use when the user explicitly asks to visually test, click through, or audit a mini app, mobile web app, Telegram Mini App, localhost app, or local web UI in the Codex side panel/right browser without modifying code
---

# UX Auditor

## Purpose

Open the app's raw URL directly in the Codex side panel/right browser, then inspect and click through the UI like a real user. Keep the audit visual and manual-style: the user should see the browser, pointer movement, clicks, scrolling, and navigation.

Use this skill only when the user explicitly asks for visual UX/UI audit, manual-style browser pass, visible click-through, mini-app QA, or names `$ux-auditor`. Do not use it for normal implementation or automated test writing.

## Activation Contract

When the user asks to use this skill:

1. Find the raw app URL.
2. Open that raw URL directly through the Browser plugin in-app browser runtime (`iab` backend), so it appears in the Codex side panel/right browser.
3. Visually test the app with Browser plugin/CUA movement, clicks, scrolling, screenshots, DOM snapshots, and console logs where available.
4. Return the full prioritized UX/UI audit report in chat only.

Do not use external Chrome, Safari, Playwright `--headed`, macOS `open`, proxies, wrappers, frames, or iframes unless the user explicitly overrides the side-panel-only rule.

## Hard Rules

- Do not edit application code while using this skill.
- Do not fix bugs during the audit. Report them by priority.
- Do not click destructive or real-world actions: delete, pay, submit real order, logout, clear data, remove account, production mutation, or final confirmation buttons.
- Use only the Codex side panel/right browser for preview. Do not open external Chrome.
- Open the raw app URL directly. Do not use custom frames, reverse proxies, injected environment shims, wrappers, or JS autopilot.
- Do not create or overwrite preview helper files inside the project.
- Do not save reports, screenshots, traces, or notes inside the project unless the user explicitly asks.
- Final report goes to chat only.
- Use the Browser plugin `browser-client` with `backend: "iab"` for side-panel navigation.

## Standard Workflow

1. Identify the target:
   - If the user gave a local URL, use it.
   - If the in-app browser has a current local URL, use it unless it is an old auditor URL.
   - If the current URL is an old `/ux-auditor.html?...target=...` wrapper, unwrap it and use the raw `target` URL.
   - If the current URL is an old auditor proxy URL and the raw target cannot be derived, ask the user for the raw local app URL.
   - Otherwise detect and start the dev server from obvious scripts such as `npm run dev`, `vite`, `next dev`, or documented commands.
   - Prefer the first reachable local frontend URL from the dev server output.
   - If multiple apps exist, prefer the app/mini-app frontend over backend/API servers.
   - If no URL or server can be determined, ask for the local URL.

2. Open the visual session:
   - If the Browser plugin is available, read `browser-use:browser` before the first browser action.
   - Use Node REPL with the Browser plugin `iab` backend to create/select an in-app browser tab and navigate it to the raw URL.
   - Do not use `"$PWCLI" open ... --headed`.
   - Do not transform the URL or add Telegram launch params. If a Telegram Mini App fails outside Telegram, report that as an issue.

3. Perform a manual-style pass:
   - Use visible CUA mouse movement and clicks so the user can see actions.
   - Click safe buttons/links deliberately and accurately.
   - Use short pauses; move quickly unless the app needs time to update.
   - Cover home screen, bottom tabs, top navigation, menus, cards, carousels, accordions, modals, forms with harmless dummy data, back/forward behavior, scroll behavior, sticky headers, loading/empty/error states, and disabled states where reachable.
   - Use DOM snapshots and screenshots to orient and verify, but keep the user-visible browser as the source of truth.
   - Capture console errors/warnings if available.

4. Finish with a UX/UI audit report in chat:
   - Scope and raw URL tested.
   - What works.
   - Issues grouped by priority: Critical, High, Medium, Low.
   - For each issue: screen, action, expected behavior, actual behavior, evidence if available, recommendation.
   - Suggested fix order.
   - Explicitly state that no code changes were made during the audit.

## Codex Right-Panel Browser Runtime

Use this pattern to open the raw URL in the Codex side panel/right browser:

```js
if (!globalThis.agent) {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const home = nodeRepl.homeDir || ".";
  const roots = [
    path.join(home, ".codex", "plugins", "cache"),
    path.join(home, ".codex", "plugins")
  ];
  async function findBrowserClient(dir) {
    let entries = [];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch (_) {
      return undefined;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isFile() && entry.name === "browser-client.mjs") return full;
      if (entry.isDirectory()) {
        const found = await findBrowserClient(full);
        if (found) return found;
      }
    }
    return undefined;
  }
  let browserClient;
  for (const root of roots) {
    browserClient = await findBrowserClient(root);
    if (browserClient) break;
  }
  if (!browserClient) {
    throw new Error("Browser Use plugin is required: browser-client.mjs was not found under ~/.codex/plugins.");
  }
  const { setupAtlasRuntime } = await import(`file://${browserClient}`);
  const backend = "iab";
  await setupAtlasRuntime({ globals: globalThis, backend });
}
await agent.browser.nameSession("UX Auditor");
globalThis.openUxAuditorPanel = async function (url) {
  let nextTab = (typeof tab !== "undefined" && tab) ? tab : undefined;
  if (!nextTab) {
    try { nextTab = await agent.browser.tabs.selected(); } catch (_) {}
  }
  if (!nextTab) nextTab = await agent.browser.tabs.new();
  try {
    await nextTab.goto(url);
  } catch (_) {
    nextTab = await agent.browser.tabs.new();
    await nextTab.goto(url);
  }
  globalThis.tab = nextTab;
  return await nextTab.url();
};
await openUxAuditorPanel("<raw_url>");
```

Use the same `tab` binding for screenshots, DOM snapshots, console logs, CUA movement, clicks, scrolls, or reloads after this call.

## Priority Guide

- Critical: user cannot complete a core flow, blank screen, crash, unusable navigation, data loss risk.
- High: major visible UI break, blocked primary CTA, serious mobile layout problem, misleading state.
- Medium: confusing UX, inconsistent spacing, unclear labels, missing feedback, awkward scroll behavior.
- Low: polish issues, minor copy, minor alignment, small visual inconsistency.
