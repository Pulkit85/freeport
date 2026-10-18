import { execSync } from 'node:child_process';
import os from 'node:os';
import type { PortProcess, KillResult } from './types.js';

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function killProcess(proc: PortProcess, force: boolean = false): Promise<KillResult> {
  const { pid, port, name } = proc;

  // Protect against killing PID 0 or PID 1 or self
  if (pid <= 1 || pid === process.pid) {
    return {
      port,
      pid,
      name,
      success: false,
      error: `Cannot kill protected system process (PID: ${pid})`
    };
  }

  if (os.platform() === 'win32') {
    try {
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' });
      return { port, pid, name, success: true };
    } catch (err: any) {
      return { port, pid, name, success: false, error: err.message || 'Taskkill failed' };
    }
  }

  try {
    if (!isProcessAlive(pid)) {
      return { port, pid, name, success: true };
    }

    if (force) {
      process.kill(pid, 'SIGKILL');
      return { port, pid, name, success: true };
    }

    // Try graceful SIGTERM first
    process.kill(pid, 'SIGTERM');

    // Wait up to 500ms to see if it terminated gracefully
    for (let i = 0; i < 5; i++) {
      await sleep(100);
      if (!isProcessAlive(pid)) {
        return { port, pid, name, success: true };
      }
    }

    // Still alive -> escalate to SIGKILL
    process.kill(pid, 'SIGKILL');
    await sleep(50);

    return {
      port,
      pid,
      name,
      success: !isProcessAlive(pid)
    };
  } catch (err: any) {
    if (err.code === 'ESRCH') {
      // Process already gone
      return { port, pid, name, success: true };
    }
    return {
      port,
      pid,
      name,
      success: false,
      error: err.message || 'Permission denied or failed to send kill signal'
    };
  }
}
