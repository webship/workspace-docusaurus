Write and run webship-js scenarios for what one page of a Docusaurus site shows and does: its navigation, its parts and its content.

The launch command below is for Claude Code, the default; the text between the triple quotes can be given to another AI CLI as it is.

```
claude --permission-mode bypassPermissions """
Write scenarios for the page <path> of this site: how it hydrates, opens the pages it links to, and what its parts show, and run them
# ~/workspace/<folder>/<site> · https://<site>.ddev.site · container-based (DDEV by default)
# the phrases are in the docusaurus-scenarios skill; the docusaurus-tester agent is the one to hand this work over to
# look at the site first: in the Playwright MCP browser, in a tab of your own, open the page and do each thing by hand once
# a feature to write or a run to read: the book Automated Functional Testing Recipes first (its README.md, then the matching chapter), from .claude/automated-functional-testing-recipes/ in the project, ~/.claude/automated-functional-testing-recipes/ or https://github.com/webship/webship-js-ai-agent/tree/2.0.x/automated-functional-testing-recipes

What to cover:
<what the page shows: its sidebar and table of contents, its version and language, its tabs, admonitions and code blocks, its links, one per line>

Read the installed steps first:
grep -hE '^(Given|When|Then)\(' node_modules/@webship-js/docusaurus-steps/tests/step-definitions/*.steps.js

Write one feature in tests/features/<page>.feature, from phrases that exist: the page hydrated and ready,
each link opened without a full page reload, the active page of the sidebar, the heading the table of
contents marks as the page scrolls, the version and the language the menus show, the tab chosen in every
group, the code a copy button copies, and what an unknown address shows.
A documentation site has no accounts: no login, no password in the feature, no platform name in a step
phrase, no sleep (wait for the page to be ready instead). A scenario changes nothing on the site: what it
chooses lives in its own browser.

Then, from the sites folder (cd ..):
bash cmd-tools-testing.sh <site> --dry-run --path tests/features/<page>.feature
bash cmd-tools-testing.sh <site> --run --path tests/features/<page>.feature

A failing scenario is a result: tell me what the site did, do not loosen the scenario.
When you are done: the scenarios, the result of the run, and any step you could not find in the pack
"""
```
