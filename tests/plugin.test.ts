import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

import { register, assistantContext, PLATFORM, COMMANDS, AGENTS } from '../src/index';

// Compiled, these tests run from dist/tests, so the package root is one folder further up.
const PKG = fs.existsSync(path.join(__dirname, '..', 'package.json')) ? path.join(__dirname, '..') : path.join(__dirname, '..', '..');
const read = (f: string) => fs.readFileSync(path.join(PKG, f), 'utf8');
const manifest = JSON.parse(read('package.json')).workspacePlugin;

test('the manifest names the platform, and every file it names ships', () => {
  assert.strictEqual(manifest.name, PLATFORM);
  const named = [...manifest.commands.files, ...manifest.scripts.functions, ...manifest.scripts.args, ...manifest.scripts.machine,
    ...manifest.ai.agents, ...manifest.ai.skills, ...manifest.ai.commands, ...manifest.ai.prompts, ...manifest.features];
  for (const f of named) assert.ok(fs.existsSync(path.join(PKG, f)), `${f} is in the package`);
  assert.deepStrictEqual(manifest.commands.files.map((f: string) => path.basename(f)), COMMANDS);
  assert.deepStrictEqual(manifest.ai.agents.map((f: string) => path.basename(f, '.md')), AGENTS);
  assert.deepStrictEqual(manifest.commands.types, ['sites'], 'the commands go to sites folders only');
  const files: string[] = JSON.parse(read('package.json')).files;
  for (const f of named) assert.ok(files.includes(f.split('/')[0]), `${f} is published with the package`);
});

test('every command finds the workspace by itself, names its folder, and sources its args from where the installer puts them', () => {
  for (const f of manifest.commands.files) {
    const src = read(f);
    assert.match(src, /^#!\/usr\/bin\/env bash/, `${f} is a bash script`);
    assert.match(src, /WORKSPACE_SCRIPTS="\$\{WORKSPACE_SCRIPTS:-\$\(cd "\$\(dirname "\$\{BASH_SOURCE\[0\]\}"\)\/\.\.\/core\/scripts" && pwd\)\}"/, `${f} locates the tooling from its own path`);
    assert.match(src, /workspace\.__WORKSPACE__\.settings\.yml/, `${f} loads the settings of the folder it is installed into`);
    assert.match(src, /source \$\{WORKSPACE_SCRIPTS\}\/plugins\/docusaurus\/args\/arg-[a-z-]+\.sh \|\| exit 1 ;/, `${f} reads its arguments from the plugin's args`);
    const last = src.trim().split('\n').pop() as string;
    assert.match(read('scripts/functions/fun-docusaurus.sh'), new RegExp(`^function ${last.replace(/ ;$/, '')}\\(\\)`, 'm'), `${f} ends by calling a function the plugin defines`);
  }
  assert.match(read('commands/cmd-docusaurus-project.sh'), /^# workspace-name: Docusaurus/m, 'the builder carries the name the Build list shows');
  assert.doesNotMatch(read('commands/cmd-tools-docusaurus-cli.sh'), /^# workspace-name:/m, 'a tool is not a builder');
});

test('every shell script parses', () => {
  for (const f of [...manifest.commands.files, ...manifest.scripts.functions, ...manifest.scripts.args]) {
    const r = spawnSync('bash', ['-n', path.join(PKG, f)], { encoding: 'utf8' });
    assert.strictEqual(r.status, 0, `${f}: ${r.stderr}`);
  }
});

test('--help of each command only prints: argparse stops before the command does anything', () => {
  // The args files hold the whole parser: with --help it prints and exits before any function runs.
  for (const f of manifest.scripts.args) {
    const src = read(f);
    assert.match(src, /^argparse "\$@" <<ARGEOF \|\| exit 1$/m, `${f} is the core's argparse`);
    assert.doesNotMatch(src, /\b(ddev|docker|rm|curl)\b/, `${f} runs nothing`);
  }
});

test('the functions carry the names the core\'s tools look for, and build the site the documented way', () => {
  const src = read('scripts/functions/fun-docusaurus.sh');
  for (const fn of ['set_docusaurus_users', 'add_docusaurus_users', 'cancel_docusaurus_users', 'testing_configure_docusaurus', 'docusaurus_build', 'docusaurus_cli_tool']) {
    assert.match(src, new RegExp(`^function ${fn}\\(\\) \\{`, 'm'), `${fn} is defined`);
  }
  assert.doesNotMatch(src, /^function build_docusaurus\(\)/m, 'the core\'s own example function is not redefined');
  assert.match(src, /--project-type=generic --webserver-type=generic --docroot=""/, 'a generic project: the site\'s own server answers');
  assert.match(src, /--omit-containers=db/, 'no database: the site is files');
  assert.match(src, /--nodejs-version=\$\(ddev_nodejs_version\)/, 'the build runs the Node.js of the workspace rule');
  assert.match(src, /n install \$\{nodejs_version\}/, 'the Node.js of the build is baked in the web image');
  assert.match(src, /create-docusaurus@\$\{version\} site classic --typescript --package-manager npm --skip-install/, 'the classic template in TypeScript, the documented way');
  assert.match(src, /@easyops-cn\/docusaurus-search-local@\$\{DOCUSAURUS_SEARCH_VERSION\}/, 'the local search, at the release the pack was proven with');
  assert.match(src, /docusaurus_test_site --test-content/, 'the test content of the step pack, from its own script');
  assert.match(src, /docusaurus serve --port \$\{DOCUSAURUS_PORT\} --host 0\.0\.0\.0 --no-open/, 'the production build is served');
  assert.match(src, /web_extra_daemons:/, 'the site is served by the web container');
  assert.doesNotMatch(src, /pkill|pgrep|killall/, 'no process is stopped by a pattern');
  assert.doesNotMatch(src, /ddev stop -y/, 'ddev stop takes no -y');
  assert.match(src, /< \/dev\/null/, 'a command in the container gets no open stdin');
  assert.doesNotMatch(src, /docsearch|algolia/i, 'no search that needs an account');
});

test('the args offer the documented options', () => {
  const args = read('scripts/args/arg-docusaurus.sh');
  for (const flag of ['--install', '--versions', '--locales', '--search', '--test-content', '--docusaurus-version', '--add-users', '--launch']) assert.ok(args.includes(`'${flag}'`), `the builder takes ${flag}`);
  const cli = read('scripts/args/arg-docusaurus-cli.sh');
  for (const flag of ['--run', '--npm', '--build', '--restart', '--update']) assert.ok(cli.includes(`'${flag}'`), `the CLI tool takes ${flag}`);
});

test('the test site script is the step pack\'s own: no account, nothing from the network, example addresses only', () => {
  const src = read('scripts/node/docusaurus-test-site.cjs');
  for (const flag of ['--test-content', '--versions', '--locales', '--search']) assert.ok(src.includes(`'${flag}'`), `the script takes ${flag}`);
  assert.match(src, /run\('docusaurus', 'docs:version', '1\.0'\)/, 'versions are cut with the CLI of the site');
  assert.match(src, /run\('docusaurus', 'write-translations', '--locale', 'fr'\)/, 'the translations are written by the CLI of the site');
  assert.doesNotMatch(src, /https?:\/\/(?!example\.com|docs\.example\.com)[a-z]/, 'every address is at example.com');
  for (const m of src.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[a-z]{2,}/g) || []) assert.match(m, /@example\.(com|org)$/, `${m} is an example address`);
});

test('each agent is a definition the AI Agents folder can list: named after its file, described, on the fable model', () => {
  for (const f of manifest.ai.agents) {
    const src = read(f);
    const head = src.split('\n---\n')[0];
    assert.match(head, /^---\n/, `${f} opens with frontmatter`);
    assert.match(head, new RegExp(`^name: ${path.basename(f, '.md')}$`, 'm'));
    assert.match(head, /^description: .{80,}$/m, `${f} says when to use it`);
    assert.match(head, /^model: fable$/m);
    assert.match(head, /^tools:\n(  - \S+\n?)+/m);
    assert.match(src, /cmd-tools-testing\.sh|cmd-docusaurus-project\.sh/, `${f} names the plugin's commands`);
  }
  const tester = read('ai/agents/docusaurus-tester.md');
  assert.match(tester, /No accounts\./);
  assert.match(tester, /No platform name in a step phrase/);
  assert.match(tester, /Playwright MCP browser first/);
});

test('register() adds the assistant context and nothing else', () => {
  const calls: string[] = [];
  const api: any = { name: 'docusaurus', addAssistantContext: (fn: () => string) => calls.push(fn()) };
  register(api);
  assert.strictEqual(calls.length, 1);
  assert.strictEqual(calls[0], assistantContext());
  for (const c of COMMANDS) assert.ok(calls[0].includes(c), `the assistant hears of ${c}`);
  assert.match(calls[0], /container/, 'it says the site runs in a container');
});

test('the README says what the plugin ships, what it needs, and that a documentation site has no accounts', () => {
  const readme = read('README.md');
  for (const c of COMMANDS) assert.ok(readme.includes(c), `the README names ${c}`);
  assert.match(readme, /container-based \(DDEV by default\)/);
  assert.doesNotMatch(readme, /DDEV-only/i);
  assert.match(readme, /no accounts/, 'it says there are no accounts');
  assert.doesNotMatch(readme, /\/home\/(?!YOUR_USER)[a-z]/, 'no personal path');
});
