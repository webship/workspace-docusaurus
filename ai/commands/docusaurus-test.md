---
description: Test a Docusaurus site of the Webship Workspace with webship-js and the Docusaurus step pack — set the testing stack up when it is missing, match every step, run the suite (or one feature, or one tag) in the site's container, and report what failed and why.
argument-hint: '<site> [tests/features/<name>.feature | @tag]'
---

# /docusaurus-test

Test the Docusaurus site named in: `$ARGUMENTS`

`$ARGUMENTS` stands for what was typed after the command. An AI CLI that does not fill it in
reads the same from the request: the name of the site, then, if anything, one feature path or one
tag.

The first word is the site (its folder name in a sites folder of the workspace). What follows, if
anything, narrows the run: a path that starts with `tests/features/` is one feature (or one folder
of features), a word that starts with `@` is a tag expression. With nothing after the site, the
whole suite runs. With no site at all, stop and ask for one: list the candidates with
`ls -d ~/workspace/*/*/.ddev/config.docusaurus.yaml`.

The workspace is container-based (DDEV by default) and everything below runs in the site's
container through the workspace's own command. Never run `npx cucumber-js`, `npx playwright`,
`node`, `npm` or `docusaurus` on the host.

## 1. Find the site

```bash
ls -d ~/workspace/*/<site>/.ddev/config.docusaurus.yaml
cat ~/workspace/<folder>/<site>/.ddev/docusaurus-content
```

`<folder>` is the sites folder the site is in (`dev`, `test`, `sandboxes`, `demos`), and the second
line says what it holds (`test-content`, the step pack's test site, or `template`). If the site has no
`.ddev/config.docusaurus.yaml`, stop: this command is for a site built with
`cmd-docusaurus-project.sh`. If `<folder>` has no `cmd-tools-testing.sh`, stop and say that the
folder is not a sites folder of this workspace.

## 2. Make sure the testing stack and the build are there

```bash
cd ~/workspace/<folder>
grep -c "@webship-js/docusaurus-steps" <site>/cucumber.js
bash cmd-tools-docusaurus-cli.sh <site>
```

If `cucumber.js` is missing or does not name the step pack, set the stack up (it adds what is
missing and keeps what was changed):

```bash
bash cmd-tools-testing.sh <site>
```

The suite runs against the production build: if the CLI tool says the site has no build, or the
pages changed since, build it with `bash cmd-tools-docusaurus-cli.sh <site> --build`.

## 3. Match every step, without a browser

```bash
bash cmd-tools-testing.sh <site> --dry-run                                        # the whole suite
bash cmd-tools-testing.sh <site> --dry-run --path tests/features/<name>.feature   # one feature
bash cmd-tools-testing.sh <site> --dry-run --tags "@critical"                     # one tag
```

Use the form that matches what was asked. An `Undefined` or `Ambiguous` step is a finding: name the
feature, the line and the phrase, show the closest phrase the pack defines
(`grep -hE "^(Given|When|Then)\(" <site>/node_modules/@webship-js/docusaurus-steps/tests/step-definitions/*.steps.js`),
and stop before the real run.

## 4. Run

```bash
bash cmd-tools-testing.sh <site> --run                                            # the whole suite
bash cmd-tools-testing.sh <site> --run --path tests/features/<name>.feature       # one feature
bash cmd-tools-testing.sh <site> --run --tags "@critical"                         # one tag
```

Run it once. Do not add `--retry`, do not tag a scenario `@wip` and do not change a feature to make
the run pass.

## 5. Report

Say, in this order:

1. The site, its address (`https://<site>.ddev.site`) and what was run (suite, feature or tag).
2. The totals the run printed: scenarios and steps, passed and failed, and the time.
3. For each failed scenario: the feature and line, the step that failed, the message, and what it
   means for the site — a defect of the site, a scenario that asserts something the site never did,
   or the environment (the site was stopped, or serves an old build:
   `bash cmd-tools-docusaurus-cli.sh <site> --build` serves a new production build; a request was
   cut: the machine's network changed, run it again).
4. Where the report is: `~/workspace/<folder>/<site>/tests/reports/`.

A failing suite is a result: report it as it is. A documentation site has no accounts: never write a
password into a feature file, and never write a platform name into a step phrase. For writing or
fixing scenarios, use the `docusaurus-scenarios` skill or hand over to the `docusaurus-tester` agent;
for changing the site, to `docusaurus-site-builder`.

Before you write or change a scenario, or read a failed run, read the book *Automated Functional
Testing Recipes* (its `README.md`, then the matching chapter):
`.claude/automated-functional-testing-recipes/` in the project,
`~/.claude/automated-functional-testing-recipes/`, or
https://github.com/webship/webship-js-ai-agent/tree/2.0.x/automated-functional-testing-recipes
