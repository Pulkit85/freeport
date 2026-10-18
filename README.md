<div align="center">

# ⚡ Freeport

<p align="center">
  <strong>Instantly kill whatever process is blocking your port. Cross-platform, interactive & zero-config.</strong>
</p>

<p align="center">
  <a href="https://npmjs.com/package/freeport"><img src="https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white" alt="npm" /></a>
  <a href="#"><img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge" alt="License: MIT" /></a>
  <a href="https://github.com/pulkitbisht/freeport/stargazers"><img src="https://img.shields.io/github/stars/pulkitbisht/freeport?style=for-the-badge&logo=github" alt="Stars" /></a>
  <a href="#"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge" alt="PRs Welcome" /></a>
</p>

</div>

<hr />

## 💡 Why Freeport?

Every developer has seen this red nightmare:
```
Error: listen EADDRINUSE: address already in use :::3000
```

Normally, you have to Google `how to kill port 3000`, remember `lsof -i :3000`, copy the PID, and run `kill -9 <PID>`.

**Freeport kills the friction.** Run `npx freeport 3000` and you're back to coding in under a second.

---

## 🚀 Quick Start

No installation needed! Run directly with `npx`:

```bash
# Free up a single port
npx freeport 3000

# Free up multiple ports at once
npx freeport 3000 8080 5173

# Free up a range of ports
npx freeport 3000-3005

# Interactive dashboard: view all listening ports and select which to kill
npx freeport

# Just list active ports without killing anything
npx freeport --list
```

Or install globally:

```bash
npm install -g freeport
freeport 3000
```

---

## ✨ Features

- ⚡ **Lightning Fast**: Frees blocked ports in milliseconds.
- 🛡️ **Safe & Transparent**: Shows you the process name (`node`, `docker`, `python`), PID, and full command before killing so you never kill the wrong service.
- 🎯 **Interactive TUI**: Run `freeport` without arguments to see an interactive checklist of all active ports.
- 🌍 **Cross-Platform**: Works identically on **macOS**, **Linux**, and **Windows**.
- 🤝 **Graceful Shutdown**: Sends `SIGTERM` first to allow graceful database disconnects; escalates to `SIGKILL` only if the process hangs.

---

## 🛠️ CLI Options

```bash
Usage: freeport [options] [ports...]

Arguments:
  ports          Port(s) or range(s) to free up (e.g. 3000, 8080, 3000-3005)

Options:
  -y, --yes      Automatically confirm and kill without prompting
  -f, --force    Force kill immediately (SIGKILL) without waiting for graceful shutdown
  -l, --list     List all currently active listening ports and processes
  -V, --version  Output the version number
  -h, --help     Display help for command
```

---

## 📝 License

Distributed under the **MIT** License. See [`LICENSE`](LICENSE) for more details.

<div align="center">

---
⭐ **If you find Freeport useful, give it a star on GitHub!** ⭐

</div>
