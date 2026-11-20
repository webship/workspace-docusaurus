---
name: docusaurus-scenarios
description: Write and run webship-js scenarios for a Docusaurus site of the Webship Workspace with the Docusaurus step pack (`@webship-js/docusaurus-steps`) — the phrases of the pack by area (the page ready and hydrated, pages in the same document, the navbar and its menus, the navigation menu of a narrow screen, the sidebar, the table of contents and the headings, the pager and the breadcrumbs, versions and languages, the colour mode and the announcement bar, the search, the blog, tabs, admonitions and code blocks), and the workspace command that runs them in the site's container. Use when asked to "write a scenario for this Docusaurus site", "test the version menu", "which step is there for the table of contents", "add a feature for the search", or when a `.feature` file of a Docusaurus project is being written or fixed.
argument-hint: '<site> [what to cover]'
---

# docusaurus-scenarios

Scenarios for a Docusaurus site of a Webship Workspace (`~/workspace`, container-based, DDEV by
default), written from the steps of [`@webship-js/docusaurus-steps`](https://github.com/webship/docusaurus-steps)
and of [webship-js](https://github.com/webship/webship-js) itself, and run in the site's container by
the workspace's own command. It comes with the Docusaurus plugin (`@webship.co/workspace-docusaurus`),
like the builder (`cmd-docusaurus-project.sh`), the CLI tool (`cmd-tools-docusaurus-cli.sh`) and the
agents `docusaurus-site-builder` and `docusaurus-tester`.

## Where everything is

| What | Where |
| --- | --- |
| The site | `~/workspace/<folder>/<site>`, at `https://<site>.ddev.site` (`<folder>` is a sites folder: `dev`, `test`, `sandboxes`, `demos`) |
| Its sources | `<site>/site/` (what it holds: `<site>/.ddev/docusaurus-content`, `test-content` or `template`) |
| The suite's configuration | `<site>/cucumber.js`: the step definitions it loads and the address of the site |
| The features | `<site>/tests/features/*.feature` (`site.feature` is the first one the setup wrote) |
| The pack's steps | `<site>/node_modules/@webship-js/docusaurus-steps/tests/step-definitions/*.steps.js` |
| webship-js's steps | `<site>/node_modules/webship-js/tests/step-definitions/*.js` |
| The reports | `<site>/tests/reports/` |

## The order of work

1. **Make sure the testing stack is there.** From the sites folder:
   ```bash
   cd ~/workspace/<folder>
   bash cmd-tools-testing.sh <site>
   ```
   It adds webship-js, the step pack, the tags and `tests/features/site.feature`. It is safe to run
   again: it adds what is missing and keeps what was changed.
2. **Read the installed steps before writing a phrase.** They are the source of truth: the pack moves,
   and a phrase from memory is a guess.
   ```bash
   grep -hE "^(Given|When|Then)\(" <site>/node_modules/@webship-js/docusaurus-steps/tests/step-definitions/*.steps.js
   ```
3. **Look at the page in the Playwright MCP browser first**, in a tab of your own: what it shows, what
   it does while it hydrates, opens another page or loads its search index, the exact texts.
4. **Match every step, then run**, narrow first:
   ```bash
   bash cmd-tools-testing.sh <site> --dry-run --path tests/features/<name>.feature
   bash cmd-tools-testing.sh <site> --run --path tests/features/<name>.feature
   ```

## The phrases, by area

**The page ready and hydrated**

| Phrase | What it checks |
| --- | --- |
| `When I wait for the page to be ready` | Loaded, hydrated, no script of a page still loading, no progress bar, no request running |
| `Then I should see a hydrated page` | `<html data-has-hydrated="true">`: the site took over the server's HTML |
| `Then there should be no hydration errors` | The console reported no mismatch between the server's HTML and the first render |
| `Then the site should be served as a production build` | Hashed code under /assets/js/, no development server |
| `Then the page generator version should start with "3"` | The version in the generator meta tag |
| `Then I should be on a 404 page` | The server answered 404, or the router shows its not-found page |

**Moving around**

| Phrase | What it does or checks |
| --- | --- |
| `When I click the link "Installation" without a full page reload` | The link opens its page in the same document |
| `When I go back without a full page reload` | Or `forward` |
| `When I click "FAQ" in the sidebar` | A link or a button in a named part: navbar, navigation menu, sidebar, table of contents, breadcrumbs, version banner, announcement bar, footer, blog sidebar, search results, content |
| `Then I should see "Installation" in the sidebar` | A visible text in a named part (or `should not see`) |
| `Then the keyboard focus should be at the start of the page` | After a page change the site moves the focus to the top |
| `Then the navbar link "Blog" should be active` | The navbar marks the part of the site the page belongs to |
| `Then the navbar link "Source" should open "https://example.com/source" in a new tab` | A link to another site |

**The menus of the navbar, and the navigation menu**

| Phrase | What it does or checks |
| --- | --- |
| `When I open the "Community" menu of the navbar` | The pointer on the menu: it opens under it |
| `When I choose "Support" in the "Community" menu of the navbar` | An item of a menu |
| `When I choose "1.0" in the version menu` | The same page in that version |
| `When I choose "Français" in the language menu` | The same page in that language (loaded from the server) |
| `Then the version menu should list "Next, 2.0 and 1.0"` | In that order; also `the language menu should list`, `the "…" menu of the navbar should list` |
| `Then the version menu should show "2.0"` | Its label; also `the language menu should show "English"` |
| `When I open the navigation menu` | The navbar folded at a narrow width (`I set the viewport to the "xs" breakpoint` first); `I close the navigation menu` |
| `Then the navigation menu should be open` | Or `closed` |
| `When I go back to the main menu` | From the sidebar of the docs in the navigation menu |

**The docs**

| Phrase | What it does or checks |
| --- | --- |
| `When I expand the "Guides" category in the sidebar` | Or `collapse`; waits for the end of the animation |
| `Then the "Guides" category in the sidebar should be collapsed` | Or `expanded` |
| `Then the active page in the sidebar should be "Installation"` | `aria-current="page"` |
| `When I scroll to the heading "Links"` | As a reader scrolls |
| `Then the table of contents should highlight "Links"` | It follows the scroll |
| `Then the heading "Tables" should be in view` | Below the navbar |
| `When I click the anchor link of the heading "Getting help"` | The "#" of a heading |
| `Then the address should point to the heading "Getting help"` | The fragment is the heading's id |
| `Then the next page should be "Configuration"` | Or `previous`; `there should be no previous page`; `When I go to the next page` |
| `Then the breadcrumbs should be "Home page, Guides, Writing Content"` | From the home page to the page |
| `Then the page should have an edit link ending with "docs/intro.mdx"` | Or `to "<whole address>"`, or `should not have an edit link` |
| `Then the page should show a version banner` | An old or the unreleased version |
| `Then the version banner should link to "/docs/intro"` | The same page in the latest version |
| `Then the page should belong to the version "1.0"` | The version badge of the page |

**Content**

| Phrase | What it does or checks |
| --- | --- |
| `Then I should see a "tip" admonition titled "Keep it short"` | Also `I should see a "note" admonition`, `the "danger" admonition should say "…"` |
| `When I choose the "macOS" tab` | Once the page has hydrated; tabs of one group choose together |
| `Then the "macOS" tab should be selected in every group` | Or without `in every group`: the first group that has it |
| `Then the selected tab should show "brew install example"` | The panel of the selected tab |
| `Then the code block "example.config.js" should highlight the lines "2, 4-5"` | Also `should show line numbers`, `should be written in "js"` |
| `When I copy the code block "example.config.js"` | Its copy button |
| `Then the clipboard should hold the code of "example.config.js"` | Or `the clipboard should contain "…"` |

**Search, blog, feeds**

| Phrase | What it does or checks |
| --- | --- |
| `When I search for "firewall"` | Waits for the index, then for the suggestions |
| `Then the search should suggest "Behind a firewall"` | Or `should find nothing` |
| `When I open the search suggestion "Behind a firewall"` | Its page, with the words marked |
| `When I open the page of all the search results` | `/search?q=…`; `the search results page should list "…"`, `I open the search result "…"` |
| `Then the words "firewall" should be marked on the page` | `<mark>` on the page a result opened |
| `Then the blog should list the posts "What Comes Next, Version 2.0"` | In order; `the blog should list the post "…"` |
| `When I open the blog post "Version 2.0"` | Then `the blog post should be tagged "Release"`, `should be by "Alex Example"` |
| `When I open the tag "Release"` | A tag of a post or of the page of all the tags |
| `When I go to the older posts` | Or `newer posts`; on a post `the older post`; `there should be no older posts` |
| `Then the blog archive should list "Version 2.0" under "2026"` | The archive by year |
| `Then the RSS feed should list "Version 2.0"` | Or `the Atom feed`, `at "/blog/rss.xml"` |
| `Then the sitemap should list "/docs/intro"` | Or `the sitemap at "/fr/sitemap.xml"` |

**The colour mode and the announcement bar**

| Phrase | What it does or checks |
| --- | --- |
| `Given the browser prefers a dark colour scheme` | As an operating system set to dark does |
| `When I switch the colour mode to "dark"` | `light`, `dark` or `system` |
| `Then the colour mode should be "dark"` | The colours shown; `the colour mode should follow the system` |
| `Then I should see the announcement bar` | `When I close the announcement bar`; it stays closed |

webship-js's own steps do the rest: `I am on "…"`, `I go to "…"`, `I should see "…"`, `the path should
be "…"`, `current url should have the "language" parameter with the "ts" value`, `the page language
should be "fr"`, `the response status code should be 404`, `I reload the page`, `I set the viewport to
the "xs" breakpoint`, `the link "Docs" with the href "/docs/1.0/intro" should exist`.

## Traps found on a real site

- **A click before hydration loads the page from the server**, and a tab clicked before hydration does
  nothing. The pack's steps wait for `<html data-has-hydrated="true">` first.
- **The address changes before the page does.** The router writes the new address at once and keeps the
  old page on screen while the code of the new one loads; the canonical link of the page changes with the
  address too. The pack's steps wait for the code to be in (no `<script data-rspack>` left in the head).
- **A remembered choice comes after hydration.** The server's HTML shows the default tab and the default
  version on every load; the stored choice applies once the page has hydrated.
- **The version chosen in the version menu is remembered; a version opened from its address is not.**
- **The menus of the navbar open on hover.** A click on their label does nothing.
- **The search has no index on the development server.** Test the production build.
- **`docusaurus serve` answers an unknown address under `/fr/` with the default language's 404 page.**
- **The browser logs "Failed to load resource" for a 404**: tag those scenarios `@js-off`.

## Rules

- **No accounts.** A documentation site has none: no login, no password in a feature file.
- **No platform name in a step phrase**: `I choose "1.0" in the version menu`, never a phrase that names
  the framework or its plugins. The same holds for a custom step.
- **A scenario changes nothing on the site.** What it chooses lives in its own browser.
- **A custom step is the last resort**: look in the pack and in webship-js first, write it in
  `<site>/tests/step-definitions/` with a comment block and examples, and say it may belong in the pack.
- **Everything runs in the container**, through `cmd-tools-testing.sh`. Never `npx cucumber-js` or
  `npx playwright` on the host.
- **A failing scenario is a result.** No `@wip`, no longer timeout, no looser assertion to turn a run
  green: say what the site did.

## Examples that run

`examples/` holds three features that pass on a site built with
`bash cmd-docusaurus-project.sh <site> --install --test-content`. Copy one into the suite and run it:

- `examples/navigation.feature`: pages in the same document, the sidebar, the table of contents, the pager.
- `examples/versions-and-languages.feature`: the version menu and its banner, the language menu.
- `examples/search-and-content.feature`: the search, tabs that choose together, a code block copied.

```bash
cp ~/workspace/ai-skills/docusaurus-scenarios/examples/navigation.feature ~/workspace/<folder>/<site>/tests/features/
cd ~/workspace/<folder>
bash cmd-tools-testing.sh <site> --run --path tests/features/navigation.feature
```

## The book

For any automated functional testing in this work (a Gherkin feature, a step definition, choosing a
step, a test run and its failures), read the book *Automated Functional Testing Recipes* first.

- **Where.** Use the first that exists: `.claude/automated-functional-testing-recipes/` in the project,
  `~/.claude/automated-functional-testing-recipes/` (installed by webship/webship-js-ai-agent,
  webship/webship-js-skills or webship/ai-agents), or
  https://github.com/webship/webship-js-ai-agent/tree/2.0.x/automated-functional-testing-recipes
- **How.** Its `README.md` first, then the chapter that matches the task (one file per chapter,
  named by its subject), not the single complete file.
- **Which wins.** The installed webship-js package and the step pack are the source of truth for
  step phrasing. When they differ from the book, follow them and say so.
- **For Docusaurus.** Start with `ch27-testing-spa.md` (pages opened in the same document, history and
  parts that load late), `ch07-waiting-dynamic-content.md` (waiting on the site's own signals, never on a
  clock), `ch05-navigation-recipes.md` (links, menus and the address) and `ch21-when-tests-go-bad.md`
  (flaky, brittle and slow scenarios).
