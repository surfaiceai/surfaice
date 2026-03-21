#!/usr/bin/env node
import { Command } from 'commander'
import { exportCommand } from './commands/export.js'
import { checkCommand } from './commands/check.js'
import { diffCommand } from './commands/diff.js'

const program = new Command()
  .name('surfaice')
  .description('Surfaice CLI — manage UI manifests')
  .version('0.0.1')

program
  .command('export')
  .description('Export .surfaice.md files from a running app')
  .requiredOption('-u, --url <url>', 'Base URL of the running app')
  .option('-r, --routes <routes...>', 'Routes to export', ['/'])
  .option('-o, --out <dir>', 'Output directory', 'surfaice/')
  .action(async (opts) => {
    await exportCommand({ baseUrl: opts.url, routes: opts.routes, outDir: opts.out })
  })

program
  .command('check')
  .description('Check committed .surfaice.md files against live app')
  .requiredOption('-u, --url <url>', 'Base URL of the running app')
  .option('-d, --dir <dir>', 'Directory with .surfaice.md files', 'surfaice/')
  .action(async (opts) => {
    const exitCode = await checkCommand({ dir: opts.dir, baseUrl: opts.url })
    process.exit(exitCode)
  })

program
  .command('diff')
  .description('Show drift between committed and live UI')
  .requiredOption('-u, --url <url>', 'Base URL of the running app')
  .option('-d, --dir <dir>', 'Directory with .surfaice.md files', 'surfaice/')
  .option('--json', 'Output as JSON', false)
  .action(async (opts) => {
    await diffCommand({ dir: opts.dir, baseUrl: opts.url, json: opts.json })
  })

program.parse()
