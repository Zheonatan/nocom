<div align="center">

<img src="assets/marca/nocom.svg" alt="" width="96" height="96">

# NoCom

**A todo list that lives on top of your work.**

Shows up on a keyboard shortcut, hides on `Escape`, and keeps everything on
your computer. No account, no cloud, no sync.

**English** · [Português](README.pt-BR.md)

[![Download](https://img.shields.io/github/v/release/Zheonatan/nocom?label=download&style=for-the-badge)](https://github.com/Zheonatan/nocom/releases/latest)
[![CI](https://img.shields.io/github/actions/workflow/status/Zheonatan/nocom/ci.yml?style=for-the-badge&label=CI)](https://github.com/Zheonatan/nocom/actions/workflows/ci.yml)
[![MIT License](https://img.shields.io/github/license/Zheonatan/nocom?style=for-the-badge&label=license)](LICENSE)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support-FF5E5B?style=for-the-badge&logo=kofi&logoColor=white)](https://ko-fi.com/zheos)

<!-- Two photos of the same window, one per theme, and GitHub picks by the
     reader's `prefers-color-scheme` -- the app follows the system theme, and a
     light photo in a dark README would advertise an app it isn't. The PNG has a
     transparent background, so the window's rounded corner sits well on both.
     The `-en` pair: the app follows the system language too, so this README
     shows the window an English-speaking reader would actually get. -->
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/telas/janela-escura-en.png">
  <img src="assets/telas/janela-clara-en.png" width="420"
       alt="The NoCom window: the Work and Home tabs, a new-task field and seven
            tasks. Two have their date in a column on the right, and today's is
            highlighted in red.">
</picture>

</div>

---

## The problem

You're in the middle of something else — code, a spreadsheet, a meeting — and a
task comes to mind. Writing it down shouldn't cost switching apps, waiting for
a load screen and losing your train of thought.

NoCom exists for that instant. The full cycle is:

```
⌃⌥T  →  type  →  Enter  →  ⌃⌥T
```

Two seconds, and your hand never leaves the keyboard.

## Download

### macOS — via Homebrew (recommended)

```sh
brew tap Zheonatan/tap
brew trust --cask Zheonatan/tap/nocom
brew install --cask nocom
```

Updating later is just `brew upgrade --cask nocom`.

**One caveat before installing:** `brew` stamps a quarantine flag on everything
it installs, so on first launch macOS will block NoCom and offer "Move to
Trash". Don't click that button — the explanation and the one-line command that
fixes it are in [First launch](#first-launch-the-system-warning).

**Why the `brew trust`?** Without it, `brew` refuses the install with
*"Refusing to load cask from untrusted tap"*. It's not a sign of a problem with
NoCom: since Homebrew 6, any tap that isn't official requires you to say
explicitly, once, that you trust it. The command above trusts **this cask
only** — nothing else I publish on the tap rides along.

### Windows — via winget (recommended)

```sh
winget install Zheonatan.NoCom
```

Updating later is just `winget upgrade Zheonatan.NoCom`.

**No SmartScreen warning this way.** The *"Windows protected your PC"* notice
comes from a mark the **browser** stamps on every downloaded file; winget
downloads and runs the installer outside the browser, checking the `sha256`
published in the manifest. Downloading the `.exe` by hand, the warning remains —
and the cause is the usual one: the installer isn't signed yet. See
[First launch](#first-launch-the-system-warning).

### Direct download

| System | File |
| --- | --- |
| **macOS** (Apple Silicon) | [NoCom_0.5.0_aarch64.dmg](https://github.com/Zheonatan/nocom/releases/download/v0.5.0/NoCom_0.5.0_aarch64.dmg) |
| **macOS** (Intel) | [NoCom_0.5.0_x64.dmg](https://github.com/Zheonatan/nocom/releases/download/v0.5.0/NoCom_0.5.0_x64.dmg) |
| **Windows** | [NoCom_0.5.0_x64-setup.exe](https://github.com/Zheonatan/nocom/releases/download/v0.5.0/NoCom_0.5.0_x64-setup.exe) |
| **Linux** (.deb) | [NoCom_0.5.0_amd64.deb](https://github.com/Zheonatan/nocom/releases/download/v0.5.0/NoCom_0.5.0_amd64.deb) |
| **Linux** (.rpm) | [NoCom-0.5.0-1.x86_64.rpm](https://github.com/Zheonatan/nocom/releases/download/v0.5.0/NoCom-0.5.0-1.x86_64.rpm) |
| **Linux** (AppImage) | [NoCom_0.5.0_amd64.AppImage](https://github.com/Zheonatan/nocom/releases/download/v0.5.0/NoCom_0.5.0_amd64.AppImage) |

Every version is always in [Releases](https://github.com/Zheonatan/nocom/releases).

### First launch: the system warning

The app is **not signed with a paid developer certificate**, and on macOS it
isn't notarized by Apple either, so your system will warn that it doesn't know
the program. That's expected. On Windows it happens once; on macOS, once per
`brew` install — the why is right below.

<details>
<summary><b>macOS</b> — the system blocks the first launch</summary>

> **"NoCom" can't be opened — Apple could not verify it is free of malware.**
>
> or, on earlier versions:
>
> **"NoCom" is damaged and can't be opened. You should move it to the Trash.**

**Never click "Move to Trash"** — that button deletes the app.

NoCom leaves the build with an *ad-hoc* signature: it's valid and it seals the
bundle, but there's no developer certificate behind it, and the app isn't
notarized by Apple. Gatekeeper then blocks the first launch. One command fixes
it, removing the quarantine mark the download left behind:

```sh
xattr -dr com.apple.quarantine "/Applications/NoCom.app"
```

After that it opens normally. It also works without a terminal: in **System
Settings › Privacy & Security**, scroll to the bottom and click **Open Anyway**
on the notice about NoCom, once per install.

**About the second message:** the app wasn't damaged, and the download wasn't
corrupted. The build used to ship with an incomplete signature, which
Gatekeeper rejected before even evaluating policy — and "damaged" is the phrase
macOS uses in that case. The `xattr` above fixes both.

**Installing via Homebrew, repeat that command on every `brew upgrade`.** It's
`brew` itself that stamps the quarantine, on every install, and since Homebrew 6
there's no way to turn it off: `--no-quarantine` was removed with no
replacement. Updating from inside the app skips all of this — the app swaps its
own bundle without stamping anything, which is why it's the smoothest path on
macOS.
</details>

<details>
<summary><b>Windows</b> — "Windows protected your PC"</summary>

Click **More info** and then **Run anyway**.

The warning comes from SmartScreen, and it warns because the installer isn't
signed with an Authenticode certificate — a signature that costs money per year
and that the project doesn't have yet. It's not a defect in the file, nor a
sign that something was detected: it's Windows saying it doesn't know who
signed it, and nobody did.

To skip the warning for good, install [via winget](#windows--via-winget-recommended).
</details>

## Updating

Open the gear inside the app and click **Check for a new version**. If there is
one, the button switches to **Update and restart**: the app downloads the new
version, verifies its signature, replaces itself and comes back on its own. You
don't have to find the release, pick the file for your architecture, drag it to
`/Applications` or repeat the `xattr`.

There is no automatic check, on purpose — see
[Your tasks stay with you](#your-tasks-stay-with-you).

On Windows there's one extra visible step: the app closes, the installer shows
up with a progress bar for a few seconds and the app comes back on its own. It
works that way because a running program can't overwrite itself on Windows — it
asks for no password, no confirmation, and doesn't go through the SmartScreen
warning.

A few honest caveats:

- **On Linux, only the AppImage updates itself.** If you installed the `.deb`
  or the `.rpm`, keep updating through your package manager: the button will
  say it couldn't check, and nothing in the app is changed.
- **Via Homebrew both paths work, but they don't cost the same.** Updating from
  inside the app leaves `brew` thinking you're on the previous version until
  the next `brew upgrade --cask nocom`, which merely reinstalls the same
  version. Nothing breaks, and your tasks aren't in `/Applications`. But
  **every `brew upgrade` re-stamps the quarantine**, and macOS goes back to
  blocking the app until you repeat the `xattr -dr com.apple.quarantine`.
  Through the button inside the app, that doesn't happen.
- **The same goes for winget.** Updating from inside the app leaves
  `winget upgrade` thinking there's a new version to install until you run it
  once. It reinstalls the same version, and nothing is lost.

## Using it

Open the app once. From then on it stays in the background, in the tray icon.

| Action | How |
| --- | --- |
| Show / hide the window | `⌃⌥T` on macOS, `Ctrl+Alt+T` on Windows and Linux |
| Hide the window | `Escape` |
| Create a task | type and `Enter` |
| Complete a task | click the circle |
| Bring it back without the keyboard | click the tray icon |
| See how many are left without opening | hover the tray icon |
| Change the shortcut | the gear, inside the app |
| Jot down a date | write it in the title: `pay the bill 08/20` |

### Tabs are contexts

Work, home, a specific project. Each tab is a separate list, created and named
in a single gesture — no dialog, no new screen. The tab you were on is still
open next time.

### The date you wrote

Write the date in the middle of the text, like you would on paper: **pay the
bill 08/20**. The app recognizes the date, highlights it and — when it sits at
the end of the title — moves it to a **column on the right**, leaving the text
on the left:

```
☐ pay the bill              08/20
☐ TEST                      10/19
☐ meeting 10/19 with the team
```

Every date gets a gray highlight. **On its day, the highlight turns pastel
red** — and goes back to gray the next day, on its own, even with the app open
for weeks.

The date only moves right when the title has **one** date and it's at the
**end**. A date in the middle of a sentence, or two dates in the same task
("from 10/19 to 10/25"), stay where they are, text untouched — the app never
rewrites what you typed.

`08/20`, `08/20/26` and `08/20/2026` all work, with one or two digits (`6/9`
works). The day/month order follows your **system's regional format**, not its
language: someone using their system in English while living in Brazil keeps
writing `20/08`.

Two things it does **not** do: it doesn't alert you when the date passes, and
yesterday's date looks the same as tomorrow's. It's not a deadline — see
[What it isn't](#what-it-isnt).

### Nothing is lost by accident

Every destructive gesture — removing a task, closing a tab, clearing completed —
can be undone on the spot. There's never a confirmation box in the way.

## What it isn't

A non-goal is as much a part of the product as a feature. NoCom has no
deadlines, priorities, subtasks, labels, attachments, collaboration or sync.
It's not going to become a project manager.

**"No deadlines" still holds even with the date column.** The app **reads** the
date you wrote and says "it's today" on the right day. It doesn't **manage**
due dates: it doesn't sort by date, doesn't alert when one passes, doesn't
count remaining days and has no "due when" field.

The red marks **coincidence, not urgency** — it's the date's day, not
"overdue". Yesterday's date stays gray, same as tomorrow's, because the app
doesn't store any date to compare against later.

## Your tasks stay with you

Everything in one plain text file on your computer, which never leaves it:

| System | Where |
| --- | --- |
| macOS | `~/Library/Application Support/com.nocom.app/todos.json` |
| Windows | `%APPDATA%\com.nocom.app\todos.json` |
| Linux | `~/.local/share/com.nocom.app/todos.json` |

No telemetry and no account. The **only** network request the app makes is the
update check, and it comes from a click of yours inside the gear — never on
launch, never on a timer, never in the background. Without that click, nothing
leaves this machine.

To take your tasks to another machine, copy that file.

Language (Portuguese or English) and light/dark theme follow your system —
there's no selector for either.

## For developers

Tauri v2 (Rust) + React 19 + TypeScript + Tailwind + shadcn/ui.

```sh
npm install
npm run tauri dev
```

Everything else — prerequisites, tests, the image pipeline and how a release
ships — lives in [`DEVELOPMENT.md`](DEVELOPMENT.md). It is in Portuguese, the
project's working language, like [`PRODUCT.md`](PRODUCT.md) (what the product
is and why), [`CONTRACT.md`](CONTRACT.md) (normative behavior and the IPC
boundary) and [`DESIGN.md`](DESIGN.md) (interface decisions). Each version's
changes are in the [`CHANGELOG.md`](CHANGELOG.md), and
[`CONTRIBUTING.md`](CONTRIBUTING.md) says what a PR needs to land — issues and
PRs in English are just as welcome.

## Project status

Version 0.5.0 — functional and in use, but not yet signed by Apple or
Microsoft, and the bundled icon is provisional. Found something odd?
[Open an issue](https://github.com/Zheonatan/nocom/issues).

## Support the project

NoCom is free, with no account, no cloud and no telemetry — and it will stay
that way. If it saves you a few seconds a day and you'd like to give back — by
Pix on LivePix, or by card on Ko-fi:

<a href="https://livepix.gg/zheo">
  <img alt="Support via LivePix" src="https://img.shields.io/badge/LivePix-Support%20the%20project-14539A?style=for-the-badge&logo=pix&logoColor=white" />
</a>
<a href="https://ko-fi.com/zheos">
  <img alt="Support via Ko-fi" src="https://img.shields.io/badge/Ko--fi-Support%20the%20project-FF5E5B?style=for-the-badge&logo=kofi&logoColor=white" />
</a>

Contributing code, reporting a bug or just telling me how you use the app is
worth the same. Nothing here sits behind a paywall.
