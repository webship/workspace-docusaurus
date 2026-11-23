# @webship.co/workspace-docusaurus

Docusaurus for the [Webship Workspace](https://github.com/webship/workspace) dashboard: a builder that
makes a real Docusaurus documentation site in a container with `create-docusaurus` (the classic
template, in TypeScript) — as the template makes it, with versions of its docs, a second language and
the local search on request, or with the whole test content of the step pack — built for production and
served; a CLI tool that runs the `docusaurus` CLI and npm on it; the
[Docusaurus step pack](https://github.com/webship/docusaurus-steps) wired into the workspace's testing
setup; and its AI items — two agents, a skill, a command and two prompts — each listed in the workspace
folder of its kind.

The workspace is container-based (DDEV by default): a Docusaurus project is a row like any other, so the
row menus the core draws (start, stop, launch, backup, clone, remove, tests) work on it unchanged.

It is made from the reference platform plugin, `@webship.co/workspace-wordpress`, and serves its site
the way the Gatsby and Astro plugins serve theirs: a generic container project whose web container
serves the production build.

## Use it

```bash
cd ~/workspace
bash core/scripts/plugins.sh --require @webship.co/workspace-docusaurus --with-needs   # npm install into the dashboard
bash core/scripts/plugins.sh --activate docusaurus --with-needs                         # plugins.docusaurus in settings.yml
bash core/scripts/plugins.sh --install docusaurus                                       # commands, functions, args, AI items
bash core/scripts/plugins.sh --configure docusaurus                                     # nothing to configure: it has no settings file
```

The same four steps are buttons on the dashboard's **Settings → Plugins** page. `--install` is
idempotent. `--uninstall` removes what it placed; an AI item you edited stays.

Everything the plugin carries lands in the folder it belongs to, when that folder is an active
workspace folder:

| What | Lands in |
| --- | --- |
| `cmd-docusaurus-project.sh`, `cmd-tools-docusaurus-cli.sh` | every active sites folder: `dev/`, `test/`, `sandboxes/`, `demos/` |
| The agents `docusaurus-site-builder`, `docusaurus-tester` | `ai-agents/` |
| The skill `docusaurus-scenarios` | `ai-skills/` |
| The command `/docusaurus-test` | `ai-commands/` |
| The prompts `docusaurus-build-and-test`, `docusaurus-scenarios-for-a-page` | `ai-prompts/` |

There they are listed like any other item of the folder, and installed into Claude Code from there.

## What it needs

A workspace starts empty, so the manifest says what else this plugin needs (`needs`):

- one sites folder, for the builder and the tool: `dev`, `test`, `sandboxes`, `demos` (`dev` is the one added when none is there). The folder also carries `cmd-tools-testing.sh` and the Users tools this plugin's hooks answer to.
- `ai-agents`, `ai-skills`, `ai-commands` and `ai-prompts`: the AI folders its agents, its skill, its command and its prompts are placed in.

`--require` says so, `--activate` and `--install` stop until the workspace has them, and `--with-needs` adds what is missing first:

```bash
bash core/scripts/plugins.sh --activate docusaurus --with-needs   # dev and the four AI folders are required, activated and installed first
bash core/scripts/plugins.sh --install docusaurus
```

Everything the builder runs for a site runs in the site's own container, through the container tool the workspace already needs: `create-docusaurus`, npm, `docusaurus build` and the site's server all run there, with the Node.js of the workspace (24). The plugin asks for no command of its own on the machine.

## What the package holds

| Path | What it is |
| --- | --- |
| `commands/cmd-docusaurus-project.sh` | The builder, in the Build list as **Docusaurus (documentation site, production build)**, installed into every sites folder |
| `commands/cmd-tools-docusaurus-cli.sh` | The `docusaurus` CLI and npm for one site: what the site is, a `docusaurus` command, npm, a production build, the build served again, an update |
| `scripts/functions/fun-docusaurus.sh` | The bash functions behind both, sourced by bootstrap once installed; the names the core's tools look for (`set_docusaurus_users`, `add_docusaurus_users`, `cancel_docusaurus_users`, `testing_configure_docusaurus`) |
| `scripts/args/arg-docusaurus.sh`, `arg-docusaurus-cli.sh` | Their argparse; the Build form draws the builder's flags from the first |
| `scripts/node/docusaurus-test-site.cts` | The versions, the second language, the local search and the test content of the step pack, written into a site `create-docusaurus` made (the same script as the step pack's own build) |
| `testing/site.feature`, `testing/test-site.feature` | The first feature a project gets when testing is set up: the classic template's, the test content's |
| `ai/agents/docusaurus-site-builder.md` | The agent that builds and maintains Docusaurus sites with these commands |
| `ai/agents/docusaurus-tester.md` | The agent that writes and runs scenarios with the Docusaurus step pack |
| `ai/skills/docusaurus-scenarios/` | The skill: the step pack's phrases by area, the traps found on real sites, three example features |
| `ai/commands/docusaurus-test.md` | The slash command `/docusaurus-test <site>`: set up, match every step, run, report |
| `ai/prompts/docusaurus-build-and-test.md`, `docusaurus-scenarios-for-a-page.md` | Two prompts: whole launch commands for a new session |
| `src/index.ts` | `register(api)`: what the assistant is told about Docusaurus here |
| `features/docusaurus.feature` | Scenarios for the dashboard's own browser suite |

The `workspacePlugin` block in `package.json` is the manifest the installer reads.

## What is different from a platform with a project type

DDEV has no project type for Docusaurus. The plugin keeps the shape of the reference and changes
only this:

| | WordPress (the reference) | Docusaurus |
| --- | --- | --- |
| Project | `--project-type=wordpress` | `--project-type=generic --webserver-type=generic --docroot=""` with no database: the router sends the project's address to the site's server on port 3000, which the web container runs as a daemon (`docusaurus serve`) once there is a production build |
| Layout | The site at the project root | The site in `site/`, the testing stack at the top of the project: the site's own `package.json` stays apart |
| Recognised by | The DDEV project type | Its files: `.ddev/config.docusaurus.yaml`, and `.ddev/docusaurus-content` (`test-content` or `template`) |
| Getting the code | `wp core download` | `create-docusaurus <name> classic --typescript` at the release asked for (`--docusaurus-version`, 3.10.2 by default) |
| Install | `wp core install` | `docusaurus build` (every language), then `docusaurus serve` |
| Accounts | WP-CLI | None: a documentation site has no accounts |

## The commands

Run them from a sites folder. `--help` is safe on both.

### Build a site

```bash
cd ~/workspace/dev
bash cmd-docusaurus-project.sh mydocs --install --versions --locales --search
```

| Flag | What it does |
| --- | --- |
| `--install` | Build the site for production (every language) and serve it |
| `--versions` | Put the docs in versions: 1.0 and 2.0 are cut from the docs of the template, the docs folder becomes the unreleased version (Next), and the navbar gets the version menu |
| `--locales` | Add French (`fr`, at `/fr/`), the language menu, and the translation files to fill in |
| `--search` | Add a search that runs in the browser on an index the build writes (`@easyops-cn/docusaurus-search-local` 0.55.3, MIT): no account, no outside service |
| `--test-content` | The test content of the step pack instead of the pages of the template: its own docs in three versions, French, its own blog, an announcement bar, a menu in the navbar and the local search; every feature of the step pack runs on it |
| `--docusaurus-version <x>` | The release of create-docusaurus and of the site: 3.10.2 (the default, the current release) or another of the 3.x line |
| `--add-users` | Taken like every builder's; there are no accounts, so nothing is added |
| `--launch` | Open the site when it is ready |

The site answers at `https://mydocs.ddev.site`. The build runs `ddev config --project-type=generic`
with the Node.js of the workspace (26) baked into the web image, makes the site in `site/` with
`create-docusaurus`, installs its packages with npm, adds what the flags ask for with
`scripts/node/docusaurus-test-site.cts` (in the site for the time of the call), and with `--install`
builds and serves it. A project of the same name is deleted first.

npm 11 in the container skips the install scripts of two packages of the site (core-js, which prints a
message, and @swc/core, which checks its binary) and says so; the site builds without them.

### Work on a site

```bash
bash cmd-tools-docusaurus-cli.sh mydocs                                  # release, address, build, versions, languages, search
bash cmd-tools-docusaurus-cli.sh mydocs --run "docs:version 3.0"         # a docusaurus command, with its arguments
bash cmd-tools-docusaurus-cli.sh mydocs --npm "ls @docusaurus/core"      # npm in the site
bash cmd-tools-docusaurus-cli.sh mydocs --build                          # a new production build, served
bash cmd-tools-docusaurus-cli.sh mydocs --restart                        # the build served again
bash cmd-tools-docusaurus-cli.sh mydocs --update                         # the latest release of Docusaurus, built and served
```

A change to the pages or to `site/docusaurus.config.ts` shows once the site is built again (`--build`):
the server serves the production build. `docusaurus serve` answers an unknown address with the build's
`404.html`, the one of the default language, under `/fr/` too.

### Accounts

None: a documentation site has no accounts. `--add-users`, `cmd-tools-add-users.sh <name> docusaurus`
and `cmd-tools-cancel-users.sh <name> docusaurus` say so and change nothing.

### Test a site

```bash
bash cmd-tools-testing.sh mydocs                 # webship-js, the step pack, a first feature
bash cmd-tools-testing.sh mydocs --run           # run the suite in the container
bash cmd-tools-testing.sh mydocs --run --path tests/features/site.feature
```

`cmd-tools-testing.sh` is the workspace's own. For a Docusaurus project it also adds
`@webship-js/docusaurus-steps` to `package.json` (a pack the project already has, from npm or from a
tarball, is kept), lists its step definitions in `cucumber.js` after webship-js's own, writes the tags
that keep the pack's assertions that must fail out of a normal run, and the scenarios of the pack's
features for the other kind of site (`@template` on a site with the test content, `@test-site` on a
site of the template), and places
`tests/features/site.feature` when the project has none: the one of the test content on a site built
with `--test-content`, else the one of the classic template. The testing stack lives at the top of the
project, beside `site/`. Run it again and it adds what is missing and keeps what you changed.

The features of the step pack tagged `@test-site` run as they are on a site built with
`--test-content`: the content is the same as the pack's own build, from the same script. The ones
tagged `@template` run on a site built without flags. `bash cmd-tools-testing.sh <name> --examples
docusaurus` copies them all into the project, and a normal run picks the ones of the site.

## The AI items

| Item | Kind | What it does |
| --- | --- | --- |
| `docusaurus-site-builder` | agent | Builds, maintains and removes Docusaurus sites with the builder, the CLI tool and the workspace's own tools; containers only |
| `docusaurus-tester` | agent | Writes and runs scenarios with the step pack: the Playwright MCP browser first, then the scenario; no accounts, never a platform name in a step phrase |
| `docusaurus-scenarios` | skill | The step pack's phrases by area, the traps found on real sites, three example features that pass on a site built with `--test-content` |
| `/docusaurus-test <site>` | command | Set the testing stack up when missing, match every step, run the suite (or a feature, or a tag), report |
| `docusaurus-build-and-test` | prompt | A new session that builds a site and runs its first feature |
| `docusaurus-scenarios-for-a-page` | prompt | A new session that writes and runs the scenarios of one page: hydration, navigation, its parts and content |

Every phrase an item shows is a phrase of the step pack or of webship-js
(`tests/fixtures/step-definitions.txt`, read from the pack at the version the builder pins), and every
command and flag it names exists: the tests check both.

## Develop it

```bash
npm install
npm run lint && npm test         # the manifest, the commands, the functions, the items
git ls-files -z '*.sh' | xargs -0 -n1 bash -n
```

The plugin is TypeScript throughout. `scripts/node/docusaurus-test-site.cts` is not compiled: the builder
copies it into the site for the time of a call and the Node.js of the container runs it as it is (type
stripping, on Node.js 24, the lowest the Workspace accepts). It is a CommonJS module with erasable
syntax only; `npm run lint` type-checks it (`tsconfig.scripts.json`).

Prove it in a throwaway workspace before a release: `webship-workspace init`, then require the plugin
from its packed tarball, activate and install it with `--with-needs`; check that Settings lists it, the
Build list of `dev` offers the builder, and each AI folder lists its items; build one real site with
`--install --test-content`, run `cmd-tools-testing.sh <name>` and its first feature; then uninstall and
check that nothing is left behind.
