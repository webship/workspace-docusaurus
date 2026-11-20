import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';

// Compiled, these tests run from dist/tests, so the package root is one folder further up.
const PKG = fs.existsSync(path.join(__dirname, '..', 'package.json')) ? path.join(__dirname, '..') : path.join(__dirname, '..', '..');
const FUNCTIONS = path.join(PKG, 'scripts', 'functions', 'fun-docusaurus.sh');

// The cucumber.js webship-js scaffolds, as far as the testing hook reads it.
const SCAFFOLD = `module.exports = {
  default: {
    requireModule: ['tsx/cjs'],
    require: [
      'node_modules/webship-js/tests/step-definitions/**/*.js',          // Webship-js core step definitions.
      'tests/step-definitions/**/*.js',                                  // Your custom step definitions.
    ],
    paths: ['tests/features/**/*.feature'],
    worldParameters: {
      launchUrl: process.env.LAUNCH_URL || 'http://localhost:8080',
    },
  },
};
`;

/**
 * A project folder with the testing stack scaffolded, and the tooling folder the installer would have filled.
 * A Docusaurus project has .ddev/config.docusaurus.yaml and says what it holds in .ddev/docusaurus-content.
 */
function project(kind: 'test-content' | 'template' | 'drupal') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'docusaurus-plugin-'));
  const dir = path.join(root, 'dev', 'docs1');
  fs.mkdirSync(path.join(dir, '.ddev'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'site'), { recursive: true });
  if (kind === 'drupal') {
    fs.writeFileSync(path.join(dir, '.ddev', 'config.yaml'), 'name: docs1\ntype: drupal11\ndocroot: web\n');
  } else {
    fs.writeFileSync(path.join(dir, '.ddev', 'config.yaml'), 'name: docs1\ntype: generic\ndocroot: ""\n');
    fs.writeFileSync(path.join(dir, '.ddev', 'config.docusaurus.yaml'), 'web_extra_daemons: []\n');
    fs.writeFileSync(path.join(dir, '.ddev', 'docusaurus-content'), `${kind}\n`);
  }
  fs.writeFileSync(path.join(dir, 'cucumber.js'), SCAFFOLD);
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'docs1', devDependencies: { 'webship-js': '^2.0.16' } }, null, 2));
  const scripts = path.join(root, 'core', 'scripts');
  fs.mkdirSync(path.join(scripts, 'plugins', 'docusaurus'), { recursive: true });
  for (const f of ['testing/site.feature', 'testing/test-site.feature', 'scripts/node/docusaurus-test-site.cjs']) {
    fs.copyFileSync(path.join(PKG, f), path.join(scripts, 'plugins', 'docusaurus', path.basename(f)));
  }
  return { root, dir, scripts };
}

/** Run bash with the plugin's functions sourced and `ddev` replaced by a recorder; the recorder notes whether the script was in the site folder. */
function bash(script: string, env: Record<string, string> = {}) {
  const fake = 'ddev() { echo "ddev $*" >> "${DDEV_LOG:-/dev/null}" ; if [ "$1" == "exec" ] ; then [ -f site/.webship-test-site.cjs ] && echo "script in the site" >> "${DDEV_LOG:-/dev/null}" ; fi ; return 0 ; }';
  return spawnSync('bash', ['-c', `${fake}\nsource ${FUNCTIONS}\nDOCUSAURUS_TEST_SITE="\${WORKSPACE_SCRIPTS}/plugins/docusaurus/docusaurus-test-site.cjs"\n${script}`],
    { encoding: 'utf8', env: { ...process.env, ...env } });
}

test('a documentation site has no accounts: the list is empty, and adding or removing them does nothing', () => {
  const p = project('template');
  const log = path.join(p.root, 'ddev.log');
  const env = { WORKSPACE_ROOT: p.root, WORKSPACE_SCRIPTS: p.scripts, doc_name: 'dev', PROJECT_NAME: 'docs1', DDEV_LOG: log };
  const r = bash('set_docusaurus_users ; echo "count=${#users[@]}" ; add_docusaurus_users ; cancel_docusaurus_users', env);
  assert.strictEqual(r.status, 0, r.stderr);
  assert.match(r.stdout, /^count=0$/m);
  assert.match(r.stdout, /no accounts, so there are none to add/);
  assert.match(r.stdout, /no accounts, so there are none to remove/);
  assert.ok(!fs.existsSync(log), 'nothing ran in the container');
});

test('the test site script runs in the site folder, with the site\'s packages, and is gone after', () => {
  const p = project('test-content');
  const log = path.join(p.root, 'ddev.log');
  const env = { WORKSPACE_ROOT: p.root, WORKSPACE_SCRIPTS: p.scripts, doc_name: 'dev', PROJECT_NAME: 'docs1', DDEV_LOG: log };
  const r = spawnSync('bash', ['-c', `cd ${JSON.stringify(p.dir)} && ${'ddev() { echo "ddev $*" >> "${DDEV_LOG:-/dev/null}" ; [ -f site/.webship-test-site.cjs ] && echo "script in the site" >> "${DDEV_LOG:-/dev/null}" ; return 0 ; }'}\nsource ${FUNCTIONS}\nDOCUSAURUS_TEST_SITE="\${WORKSPACE_SCRIPTS}/plugins/docusaurus/docusaurus-test-site.cjs"\ndocusaurus_test_site --versions --locales`], { encoding: 'utf8', env: { ...process.env, ...env } });
  assert.strictEqual(r.status, 0, r.stderr + r.stdout);
  const written = fs.readFileSync(log, 'utf8');
  assert.match(written, /^ddev exec -d \/var\/www\/html\/site node \.webship-test-site\.cjs --versions --locales$/m);
  assert.match(written, /^script in the site$/m, 'the script is in the site folder while it runs');
  assert.ok(!fs.existsSync(path.join(p.dir, 'site', '.webship-test-site.cjs')), 'and gone after');
});

test('a tool asked about a project that is not a Docusaurus site says so', () => {
  const p = project('drupal');
  const r = bash('docusaurus_enter_project', { WORKSPACE_ROOT: p.root, WORKSPACE_SCRIPTS: p.scripts, doc_name: 'dev', PROJECT_NAME: 'docs1' });
  assert.notStrictEqual(r.status, 0);
  assert.match(r.stdout, /dev\/docs1 is not a Docusaurus project/);
});

test('the testing hook wires the pack and the tags, and the first feature of the test content, once', () => {
  const p = project('test-content');
  const env = { WORKSPACE_ROOT: p.root, WORKSPACE_SCRIPTS: p.scripts, doc_name: 'dev', PROJECT_NAME: 'docs1' };
  let r = bash(`testing_configure_docusaurus ${p.dir}`, env);
  assert.strictEqual(r.status, 0, r.stderr + r.stdout);
  const pkg = JSON.parse(fs.readFileSync(path.join(p.dir, 'package.json'), 'utf8'));
  assert.strictEqual(pkg.devDependencies['@webship-js/docusaurus-steps'], '^2.0.0');
  const cucumber = fs.readFileSync(path.join(p.dir, 'cucumber.js'), 'utf8');
  assert.match(cucumber, /'node_modules\/webship-js\/tests\/step-definitions\/\*\*\/\*\.js',.*\n\s+'node_modules\/@webship-js\/docusaurus-steps\/tests\/step-definitions\/\*\*\/\*\.js',/, 'the pack after webship-js');
  assert.match(cucumber, /tags: process\.env\.CUCUMBER_TAGS \|\| 'not @wip and not @must-fail and not @template',/, 'a normal run leaves out the scenarios for the site of the template');
  assert.doesNotMatch(cucumber, /users:|loginPath/, 'no users registry: there are no accounts');
  const loaded = spawnSync(process.execPath, ['-e', `const c = require(${JSON.stringify(path.join(p.dir, 'cucumber.js'))}).default; if (!c.require.some((r) => r.includes('docusaurus-steps'))) process.exit(1);`], { encoding: 'utf8' });
  assert.strictEqual(loaded.status, 0, `cucumber.js loads: ${loaded.stderr}`);
  assert.strictEqual(fs.readFileSync(path.join(p.dir, 'tests', 'features', 'site.feature'), 'utf8'), fs.readFileSync(path.join(PKG, 'testing', 'test-site.feature'), 'utf8'), 'the first feature of the test content');
  assert.match(r.stdout, /no production build yet/);
  // A second run adds nothing.
  r = bash(`testing_configure_docusaurus ${p.dir}`, env);
  assert.strictEqual(r.status, 0, r.stderr + r.stdout);
  assert.strictEqual(fs.readFileSync(path.join(p.dir, 'cucumber.js'), 'utf8'), cucumber, 'a second run changes nothing');
  assert.doesNotMatch(r.stdout, /package\.json:|cucumber\.js:|site\.feature:/);
});

test('the testing hook gives the site of the template its own first feature', () => {
  const p = project('template');
  const env = { WORKSPACE_ROOT: p.root, WORKSPACE_SCRIPTS: p.scripts, doc_name: 'dev', PROJECT_NAME: 'docs1' };
  const r = bash(`testing_configure_docusaurus ${p.dir}`, env);
  assert.strictEqual(r.status, 0, r.stderr + r.stdout);
  const cucumber = fs.readFileSync(path.join(p.dir, 'cucumber.js'), 'utf8');
  assert.match(cucumber, /@webship-js\/docusaurus-steps/);
  assert.match(cucumber, /tags: process\.env\.CUCUMBER_TAGS \|\| 'not @wip and not @must-fail and not @test-site',/, 'a normal run leaves out the scenarios for the test site');
  assert.strictEqual(fs.readFileSync(path.join(p.dir, 'tests', 'features', 'site.feature'), 'utf8'), fs.readFileSync(path.join(PKG, 'testing', 'site.feature'), 'utf8'));
});

test('the testing hook keeps a tags line the project already has', () => {
  const p = project('test-content');
  fs.writeFileSync(path.join(p.dir, 'cucumber.js'), SCAFFOLD.replace("    paths:", "    tags: 'not @slow',\n    paths:"));
  const r = bash(`testing_configure_docusaurus ${p.dir}`, { WORKSPACE_ROOT: p.root, WORKSPACE_SCRIPTS: p.scripts, doc_name: 'dev', PROJECT_NAME: 'docs1' });
  assert.strictEqual(r.status, 0, r.stderr + r.stdout);
  const cucumber = fs.readFileSync(path.join(p.dir, 'cucumber.js'), 'utf8');
  assert.match(cucumber, /tags: 'not @slow',/);
  assert.strictEqual((cucumber.match(/^\s*tags:/gm) || []).length, 1, 'one tags line, the project\'s own');
});

test('the testing hook keeps a pack the project already has, from npm or from a tarball', () => {
  const p = project('test-content');
  const tarball = 'file:tests/step-packs/webship-js-docusaurus-steps-2.0.0.tgz';
  fs.writeFileSync(path.join(p.dir, 'package.json'), JSON.stringify({ name: 'docs1', devDependencies: { 'webship-js': '^2.0.16', '@webship-js/docusaurus-steps': tarball } }, null, 2));
  const r = bash(`testing_configure_docusaurus ${p.dir}`, { WORKSPACE_ROOT: p.root, WORKSPACE_SCRIPTS: p.scripts, doc_name: 'dev', PROJECT_NAME: 'docs1' });
  assert.strictEqual(r.status, 0, r.stderr + r.stdout);
  assert.strictEqual(JSON.parse(fs.readFileSync(path.join(p.dir, 'package.json'), 'utf8')).devDependencies['@webship-js/docusaurus-steps'], tarball);
});

test('the testing hook leaves a project of another platform alone', () => {
  const p = project('drupal');
  const before = fs.readFileSync(path.join(p.dir, 'cucumber.js'), 'utf8');
  const r = bash(`testing_configure_docusaurus ${p.dir}`, { WORKSPACE_ROOT: p.root, WORKSPACE_SCRIPTS: p.scripts, doc_name: 'dev', PROJECT_NAME: 'docs1' });
  assert.strictEqual(r.status, 0, r.stderr + r.stdout);
  assert.strictEqual(fs.readFileSync(path.join(p.dir, 'cucumber.js'), 'utf8'), before);
  assert.strictEqual(r.stdout, '');
});
