#!/usr/bin/env node

import { Command } from 'commander';
import pc from 'picocolors';
import boxen from 'boxen';
import ora from 'ora';
import prompts from 'prompts';

import { findProcessOnPort, listAllListeningPorts, getFullCommand } from './scanner.js';
import { killProcess } from './killer.js';
import { formatProcessTable, formatResults } from './formatter.js';
import type { PortProcess, KillResult } from './types.js';

const program = new Command();

program
  .name('freeport')
  .description('⚡ Instantly kill whatever process is blocking your port. Cross-platform & zero-config.')
  .version('1.0.0')
  .argument('[ports...]', 'Port(s) or range(s) to free up (e.g. 3000, 8080, 3000-3005)')
  .option('-y, --yes', 'Automatically confirm and kill without prompting')
  .option('-f, --force', 'Force kill immediately (SIGKILL) without graceful shutdown')
  .option('-l, --list', 'List all currently active listening ports and processes')
  .action(async (portArgs: string[], options) => {
    // 1. List mode: freeport -l
    if (options.list) {
      const spinner = ora('Scanning all listening ports...').start();
      const allPorts = listAllListeningPorts();
      spinner.stop();

      console.log(
        boxen(
          `${pc.bold(pc.cyan('⚡ ACTIVE LISTENING PORTS'))}\n\n${formatProcessTable(allPorts)}`,
          {
            padding: 1,
            margin: { top: 1, bottom: 1 },
            borderStyle: 'round',
            borderColor: 'cyan'
          }
        )
      );
      return;
    }

    // 2. Parse port arguments if provided
    const targetPorts: number[] = [];
    if (portArgs && portArgs.length > 0) {
      for (const arg of portArgs) {
        if (arg.includes('-')) {
          // Range: e.g. 3000-3005
          const [startStr, endStr] = arg.split('-');
          const start = parseInt(startStr, 10);
          const end = parseInt(endStr, 10);
          if (!isNaN(start) && !isNaN(end) && start <= end) {
            for (let p = start; p <= end; p++) {
              targetPorts.push(p);
            }
          }
        } else {
          const p = parseInt(arg, 10);
          if (!isNaN(p)) targetPorts.push(p);
        }
      }
    }

    // 3. Interactive mode if no ports provided: freeport
    if (targetPorts.length === 0) {
      const spinner = ora('Scanning open ports...').start();
      const openPorts = listAllListeningPorts();
      spinner.stop();

      if (openPorts.length === 0) {
        console.log(pc.green('✔ No active listening ports found. Everything is free!'));
        return;
      }

      const choices = openPorts.map(proc => ({
        title: `${pc.bold(pc.cyan(proc.port.toString().padEnd(6)))} • ${pc.green(proc.name.padEnd(16))} (PID: ${pc.yellow(proc.pid.toString())})`,
        value: proc
      }));

      const response = await prompts({
        type: 'multiselect',
        name: 'selected',
        message: 'Select the ports you want to free up (Space to select, Enter to confirm):',
        choices,
        hint: '- Space to select. Return to submit'
      });

      if (!response.selected || response.selected.length === 0) {
        console.log(pc.gray('No ports selected. Exiting.'));
        return;
      }

      console.log();
      const results: KillResult[] = [];
      for (const proc of response.selected as PortProcess[]) {
        const res = await killProcess(proc, options.force);
        results.push(res);
      }

      formatResults(results);
      return;
    }

    // 4. Targeted port kill mode
    const processesToKill: PortProcess[] = [];
    for (const port of targetPorts) {
      const found = findProcessOnPort(port);
      if (found.length === 0) {
        console.log(`${pc.green('✔')} Port ${pc.bold(pc.cyan(port))} is already free.`);
      } else {
        processesToKill.push(...found);
      }
    }

    if (processesToKill.length === 0) {
      return;
    }

    // Display found processes
    console.log('\n' + pc.bold('Found processes blocking target ports:'));
    for (const proc of processesToKill) {
      const fullCmd = getFullCommand(proc.pid);
      console.log(
        `  • Port ${pc.bold(pc.cyan(proc.port))} occupied by ${pc.bold(pc.green(proc.name))} (PID: ${pc.yellow(proc.pid)})${
          proc.user ? pc.gray(` [${proc.user}]`) : ''
        }`
      );
      if (fullCmd && fullCmd !== proc.name) {
        console.log(`    ${pc.dim(fullCmd.slice(0, 80))}${fullCmd.length > 80 ? '...' : ''}`);
      }
    }
    console.log();

    // Confirm if not in --yes mode
    if (!options.yes) {
      const confirmPrompt = await prompts({
        type: 'confirm',
        name: 'proceed',
        message: `Kill ${processesToKill.length === 1 ? 'this process' : `these ${processesToKill.length} processes`}?`,
        initial: true
      });

      if (!confirmPrompt.proceed) {
        console.log(pc.gray('Cancelled. No processes were killed.'));
        return;
      }
    }

    const killSpinner = ora('Freeing ports...').start();
    const results: KillResult[] = [];
    for (const proc of processesToKill) {
      const res = await killProcess(proc, options.force);
      results.push(res);
    }
    killSpinner.stop();

    console.log();
    formatResults(results);
    console.log();
  });

program.parse(process.argv);
