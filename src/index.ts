/**
 * Docusaurus for Webship Workspace: a platform plugin.
 *
 * What the package carries is placed by the installer from the manifest: the builder and the CLI tool
 * in the sites folders, their functions, argparse, the first features and the Node.js script of the
 * test site under core/scripts/plugins/docusaurus/, and its AI items (ai/ in this package) in the folder
 * of their kind: the agents in AI Agents, the skill in AI Skills, the command in AI Commands, the
 * prompts in AI Prompts. The dashboard needs nothing drawn for it: the builder is in the Build list
 * because it is a cmd-*-project.sh, the row menus are the core's, the AI items are listed like any
 * other. What register() adds is what the assistant is told.
 *
 * Everything the dashboard is asked for goes through `api`; this package requires nothing from the
 * dashboard's own files, so it can be installed from npm and removed without a trace.
 */

import type { PluginApi } from '@webship.co/workspace-plugin-api';

/** The plugin's name. A Docusaurus project has the DDEV project type generic: the plugin knows it by its files. */
export const PLATFORM = 'docusaurus';

/** The commands the installer places in every sites folder. */
export const COMMANDS = ['cmd-docusaurus-project.sh', 'cmd-tools-docusaurus-cli.sh'];

/** The agents the installer places in the AI Agents folder. */
export const AGENTS = ['docusaurus-site-builder', 'docusaurus-tester'];

/** The skill the installer places in the AI Skills folder (a folder each, with its SKILL.md). */
export const SKILLS = ['docusaurus-scenarios'];

/** The slash command the installer places in the AI Commands folder. */
export const AI_COMMANDS = ['docusaurus-test'];

/** The prompts the installer places in the AI Prompts folder: each a whole launch command for a new session. */
export const PROMPTS = ['docusaurus-build-and-test', 'docusaurus-scenarios-for-a-page'];

/** What the assistant is told about Docusaurus in this workspace. */
export function assistantContext(): string {
  return [
    'Docusaurus (a plugin, @webship.co/workspace-docusaurus): a documentation site is built with',
    '`bash cmd-docusaurus-project.sh <name> --install` from a sites folder (dev, test, sandboxes, demos), made with create-docusaurus',
    '(the classic template, in TypeScript): `--versions` puts its docs in versions (Next, 2.0, 1.0), `--locales` adds French, `--search`',
    'adds a search that runs in the browser on an index the build writes (no account), and `--test-content` gives it the test content',
    'of the step pack instead of the pages of the template; `--docusaurus-version` picks the release.',
    'It runs in a container like every other project (DDEV project type generic, the site in site/, Node.js 24, its production build served by the web container) at https://<name>.ddev.site.',
    '`bash cmd-tools-docusaurus-cli.sh <name>` says what the site is; `--run "<docusaurus command>"` runs the docusaurus CLI in it, `--npm "<arguments>"` npm,',
    '`--build` serves a new production build, `--restart` serves it again, `--update` moves it to the latest release.',
    '`bash cmd-tools-testing.sh <name>` sets up webship-js with the Docusaurus step pack; `--run` runs the suite. A documentation site has no accounts.',
    `For Docusaurus work, hand over to the agents ${AGENTS.map((a) => `\`${a}\``).join(' and ')}.`,
    `The plugin also places the skill ${SKILLS.map((a) => `\`${a}\``).join(', ')} (the step pack's phrases, by area) in ai-skills/,`,
    `the command ${AI_COMMANDS.map((a) => `\`/${a} <site>\``).join(', ')} in ai-commands/ and the prompts ${PROMPTS.map((a) => `\`${a}\``).join(' and ')} in ai-prompts/.`,
    'Never run node, npm or docusaurus on the host for a project.',
  ].join(' ');
}

export function register(api: PluginApi): void {
  api.addAssistantContext(assistantContext);
}
