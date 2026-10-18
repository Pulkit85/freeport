import pc from 'picocolors';
import type { PortProcess, KillResult } from './types.js';

export function formatProcessTable(processes: PortProcess[]): string {
  if (processes.length === 0) {
    return pc.gray('No listening ports found.');
  }

  const headers = ['PORT', 'PID', 'PROCESS', 'USER'];
  const rows = processes.map(p => [
    pc.bold(pc.cyan(p.port.toString())),
    pc.yellow(p.pid.toString()),
    pc.green(p.name),
    pc.gray(p.user || '-')
  ]);

  // Compute column widths
  const widths = [6, 8, 18, 15];

  const headerLine = headers.map((h, i) => pc.bold(h.padEnd(widths[i]))).join(' ');
  const dividerLine = pc.dim('─'.repeat(55));

  const dataLines = processes.map(p => {
    const portStr = pc.bold(pc.cyan(p.port.toString().padEnd(widths[0])));
    const pidStr = pc.yellow(p.pid.toString().padEnd(widths[1]));
    const nameStr = pc.green(p.name.slice(0, widths[2] - 1).padEnd(widths[2]));
    const userStr = pc.gray((p.user || '-').slice(0, widths[3] - 1).padEnd(widths[3]));
    return `${portStr} ${pidStr} ${nameStr} ${userStr}`;
  });

  return `${headerLine}\n${dividerLine}\n${dataLines.join('\n')}`;
}

export function formatResults(results: KillResult[]): void {
  for (const r of results) {
    if (r.success) {
      console.log(
        `  ${pc.green('✔')} Port ${pc.bold(pc.cyan(r.port))} freed (killed ${pc.green(r.name)} [PID: ${pc.yellow(r.pid)}])`
      );
    } else {
      console.log(
        `  ${pc.red('✖')} Failed to free port ${pc.bold(pc.cyan(r.port))} (${pc.gray(r.error || 'Unknown error')})`
      );
    }
  }
}
