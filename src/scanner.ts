import { execSync } from 'node:child_process';
import os from 'node:os';
import type { PortProcess } from './types.js';

export function getFullCommand(pid: number): string | undefined {
  if (os.platform() === 'win32') {
    try {
      const out = execSync(`wmic process where ProcessId=${pid} get CommandLine /value`, {
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore']
      });
      const match = out.match(/CommandLine=(.+)/);
      return match ? match[1].trim() : undefined;
    } catch {
      return undefined;
    }
  }

  try {
    const cmd = execSync(`ps -p ${pid} -o command=`, {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();
    return cmd || undefined;
  } catch {
    return undefined;
  }
}

export function findProcessOnPort(port: number): PortProcess[] {
  if (os.platform() === 'win32') {
    return findProcessOnPortWindows(port);
  }
  return findProcessOnPortUnix(port);
}

export function listAllListeningPorts(): PortProcess[] {
  if (os.platform() === 'win32') {
    return listAllPortsWindows();
  }
  return listAllPortsUnix();
}

// Unix (macOS & Linux) implementation using lsof
function findProcessOnPortUnix(port: number): PortProcess[] {
  try {
    const raw = execSync(`lsof -iTCP:${port} -sTCP:LISTEN -n -P`, {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore']
    });
    return parseLsofOutput(raw).filter(p => p.port === port);
  } catch {
    return [];
  }
}

function listAllPortsUnix(): PortProcess[] {
  try {
    const raw = execSync('lsof -iTCP -sTCP:LISTEN -n -P', {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore']
    });
    return parseLsofOutput(raw);
  } catch {
    return [];
  }
}

function parseLsofOutput(output: string): PortProcess[] {
  const lines = output.trim().split('\n');
  if (lines.length <= 1) return [];

  const results: Map<string, PortProcess> = new Map();

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Format: COMMAND PID USER FD TYPE DEVICE SIZE/OFF NODE NAME
    const parts = line.split(/\s+/);
    if (parts.length < 9) continue;

    const commandName = parts[0];
    const pid = parseInt(parts[1], 10);
    const user = parts[2];
    const nameCol = parts.slice(8).join(' ');

    const portMatch = nameCol.match(/:(\d+)(?:\s+\(LISTEN\))?$/);
    if (!portMatch) continue;

    const port = parseInt(portMatch[1], 10);
    if (isNaN(port) || isNaN(pid)) continue;

    const key = `${port}-${pid}`;
    if (!results.has(key)) {
      results.set(key, {
        port,
        pid,
        name: commandName,
        user,
        protocol: 'TCP'
      });
    }
  }

  return Array.from(results.values()).sort((a, b) => a.port - b.port);
}

// Windows implementation using netstat
function findProcessOnPortWindows(port: number): PortProcess[] {
  try {
    const raw = execSync(`netstat -ano -p tcp | findstr :${port}`, {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore']
    });
    return parseWindowsNetstat(raw).filter(p => p.port === port);
  } catch {
    return [];
  }
}

function listAllPortsWindows(): PortProcess[] {
  try {
    const raw = execSync('netstat -ano -p tcp', {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore']
    });
    return parseWindowsNetstat(raw);
  } catch {
    return [];
  }
}

function parseWindowsNetstat(output: string): PortProcess[] {
  const lines = output.trim().split('\n');
  const results: Map<string, PortProcess> = new Map();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('TCP')) continue;

    const parts = trimmed.split(/\s+/);
    if (parts.length < 5) continue;

    const localAddress = parts[1];
    const state = parts[3];
    const pid = parseInt(parts[4], 10);

    if (state !== 'LISTENING' || isNaN(pid)) continue;

    const portMatch = localAddress.match(/:(\d+)$/);
    if (!portMatch) continue;

    const port = parseInt(portMatch[1], 10);
    if (isNaN(port)) continue;

    const key = `${port}-${pid}`;
    if (!results.has(key)) {
      let name = `PID:${pid}`;
      try {
        const taskInfo = execSync(`tasklist /fi "PID eq ${pid}" /fo csv /nh`, {
          encoding: 'utf-8',
          stdio: ['ignore', 'pipe', 'ignore']
        });
        const m = taskInfo.match(/"([^"]+)"/);
        if (m) name = m[1];
      } catch {}

      results.set(key, {
        port,
        pid,
        name,
        protocol: 'TCP'
      });
    }
  }

  return Array.from(results.values()).sort((a, b) => a.port - b.port);
}
