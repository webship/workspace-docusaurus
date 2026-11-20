#!/usr/bin/env node
'use strict';

// Turns a site that `create-docusaurus <name> classic --typescript` just made
// into the site the step pack's features run on, or adds one feature to it.
// The same file is site/test-site.cjs of the step pack (@webship-js/docusaurus-steps)
// and scripts/node/docusaurus-test-site.cjs of the Workspace plugin
// (@webship.co/workspace-docusaurus): both builds give the same site.
// Run in the folder of the site, in its container, before the build:
//
//   node test-site.cjs --test-content   the pack's test site: its own docs (with
//                                       tabs, admonitions and code blocks), three
//                                       versions of them, a French locale, its own
//                                       blog, an announcement bar, a dropdown in
//                                       the navbar and the local search
//   node test-site.cjs --versions       the docs in three versions (Next, 2.0, 1.0)
//   node test-site.cjs --locales        a second locale, French (fr)
//   node test-site.cjs --search         the local search (the package
//                                       @easyops-cn/docusaurus-search-local must be
//                                       installed in the site)
//
// --test-content does all four, on content of its own; the others change the
// template's own site, and can be given together. Run once on a new site: a
// second run says what is already there and changes nothing.
//
// Nothing here is fetched from the network, and nothing names an account: a
// documentation site has none. The addresses are at example.com.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SITE = process.cwd();
const args = new Set(process.argv.slice(2));
const known = ['--test-content', '--versions', '--locales', '--search'];
for (const arg of args) {
  if (!known.includes(arg)) {
    console.error(`Unknown option ${arg}. Options: ${known.join(', ')}.`);
    process.exit(2);
  }
}
if (!args.size) {
  console.error(`Nothing to do. Options: ${known.join(', ')}.`);
  process.exit(2);
}
const testContent = args.has('--test-content');
const versions = testContent || args.has('--versions');
const locales = testContent || args.has('--locales');
const search = testContent || args.has('--search');

const CONFIG = path.join(SITE, 'docusaurus.config.ts');
if (!fs.existsSync(CONFIG) || !fs.existsSync(path.join(SITE, 'node_modules', '@docusaurus', 'core'))) {
  console.error(`${SITE} is not a site made with create-docusaurus classic --typescript, with its packages installed.`);
  process.exit(1);
}
const MARK = 'webship-test-site';

function write(file, text) {
  const target = path.join(SITE, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, text.replace(/^\n/, ''));
}

function run(command, ...rest) {
  execFileSync(path.join(SITE, 'node_modules', '.bin', command), rest, { cwd: SITE, stdio: 'inherit' });
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(SITE, file), 'utf8'));
}

function writeJson(file, data) {
  write(file, `${JSON.stringify(data, null, 2)}\n`);
}

// Put French messages into a translation file that write-translations wrote:
// each key given must be there.
function translate(file, messages) {
  const data = readJson(file);
  for (const [key, message] of Object.entries(messages)) {
    if (!data[key]) throw new Error(`${file} has no message "${key}" to translate.`);
    data[key].message = message;
  }
  writeJson(file, data);
}

// Change the template's own configuration: each anchor must be there once.
function edit(config, anchor, replacement, what) {
  const count = config.split(anchor).length - 1;
  if (count !== 1) {
    throw new Error(`Cannot add ${what}: docusaurus.config.ts has ${count} copies of "${anchor.trim()}" (one expected). The template changed; add it by hand.`);
  }
  return config.replace(anchor, replacement);
}

function searchTheme(languages) {
  return [
    "  // A search that runs in the browser, on an index the build writes: no account, no outside service.",
    '  themes: [',
    '    [',
    "      '@easyops-cn/docusaurus-search-local',",
    '      {',
    '        hashed: true,',
    `        language: [${languages.map((l) => `'${l}'`).join(', ')}],`,
    '        indexDocs: true,',
    '        indexBlog: true,',
    '        indexPages: false,',
    '        highlightSearchTermsOnTargetPage: true,',
    '        explicitSearchResultPath: true,',
    '      },',
    '    ],',
    '  ],',
    '',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// The test site: its own configuration and content
// ---------------------------------------------------------------------------

const TEST_CONFIG = `
// ${MARK}: the site the step pack's features run on (test-site.cjs --test-content).
import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Example Docs',
  tagline: 'The documentation of the Example project',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://docs.example.com',
  baseUrl: '/',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'fr'],
    localeConfigs: {
      en: {label: 'English'},
      fr: {label: 'Français'},
    },
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://example.com/docs/edit/main/',
          versions: {
            current: {label: 'Next'},
          },
        },
        blog: {
          showReadingTime: true,
          postsPerPage: 2,
          blogSidebarTitle: 'Recent posts',
          blogSidebarCount: 5,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          editUrl: 'https://example.com/docs/edit/main/',
          onInlineTags: 'throw',
          onInlineAuthors: 'throw',
          onUntruncatedBlogPosts: 'throw',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  // A search that runs in the browser, on an index the build writes: no account, no outside service.
  themes: [
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        language: ['en', 'fr'],
        indexDocs: true,
        indexBlog: true,
        indexPages: false,
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
      },
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    announcementBar: {
      id: 'version-2-0',
      content: 'Version 2.0 is out. <a href="/blog/version-2-0">Read what is new</a>.',
      isCloseable: true,
    },
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Example Docs',
      logo: {
        alt: 'Example Docs logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {to: '/blog', label: 'Blog', position: 'left'},
        {
          type: 'dropdown',
          label: 'Community',
          position: 'left',
          items: [
            {label: 'Support', to: '/support'},
            {label: 'Forum', href: 'https://example.com/forum'},
          ],
        },
        {type: 'docsVersionDropdown', position: 'right'},
        {type: 'localeDropdown', position: 'right'},
        {
          href: 'https://example.com/source',
          label: 'Source',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [{label: 'Introduction', to: '/docs/intro'}],
        },
        {
          title: 'More',
          items: [
            {label: 'Blog', to: '/blog'},
            {label: 'Support', to: '/support'},
          ],
        },
      ],
      copyright: 'Example Docs, a site for automated tests.',
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'powershell'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
`;

const SIDEBARS = `
// ${MARK}: one sidebar, made from the folders of docs/.
import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [{type: 'autogenerated', dirName: '.'}],
};

export default sidebars;
`;

function intro(version) {
  const what = version === 'next'
    ? 'This is the **Next** version: what it describes is not released yet.'
    : `This is the documentation of version **${version}**.`;
  const reference = version === '1.0' ? '' : '\n- [Command line](./reference/command-line.mdx): every command and its options.';
  return `
---
sidebar_position: 1
title: Introduction
description: What Example Docs covers and where to start.
---

# Introduction

Example Docs is the documentation of the Example project. ${what}

## What you will find here

- [Installation](./getting-started/installation.mdx): how to install the project on Linux, macOS and Windows.
- [Configuration](./getting-started/configuration.mdx): the settings file and its defaults.
- [Writing content](./guides/writing-content.mdx): pages, notes and warnings.${reference}

:::note

Every page has an "Edit this page" link at its foot.

:::

## Getting help

Ask on the [support page](/support).
`;
}

function introFr(version) {
  const what = version === 'next'
    ? 'Ceci est la version **Next** : ce qu\'elle décrit n\'est pas encore publié.'
    : `Ceci est la documentation de la version **${version}**.`;
  return `
---
sidebar_position: 1
title: Introduction
description: Ce que couvre Example Docs et par où commencer.
---

# Introduction

Example Docs est la documentation du projet Example. ${what}

## Ce que vous trouverez ici

- [Installation](./getting-started/installation) : installer le projet sous Linux, macOS et Windows.
- [Configuration](./getting-started/configuration) : le fichier de réglages et ses valeurs par défaut.

## Obtenir de l'aide

Posez votre question sur la [page d'assistance](/support).
`;
}

const CATEGORY_GETTING_STARTED = {
  label: 'Getting Started',
  position: 2,
  collapsed: false,
  link: {
    type: 'generated-index',
    description: 'Install the project and write its settings file.',
  },
};

const CATEGORY_GUIDES = {
  label: 'Guides',
  position: 3,
  link: {
    type: 'generated-index',
    description: 'How to write pages and publish the site.',
  },
};

const CATEGORY_REFERENCE = {
  label: 'Reference',
  position: 4,
  link: {
    type: 'generated-index',
    description: 'The command line and the questions people ask most.',
  },
};

const INSTALLATION = `
---
sidebar_position: 1
title: Installation
description: Install the command line tool on Linux, macOS or Windows.
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Installation

Install the command line tool, then check that it answers.

## Download

<Tabs groupId="operating-system">
  <TabItem value="linux" label="Linux" default>

\`\`\`bash
curl -fsSL https://example.com/install.sh | sh
\`\`\`

  </TabItem>
  <TabItem value="macos" label="macOS">

\`\`\`bash
brew install example
\`\`\`

  </TabItem>
  <TabItem value="windows" label="Windows">

\`\`\`powershell
winget install Example.Cli
\`\`\`

  </TabItem>
</Tabs>

## Check the installation

<Tabs groupId="operating-system">
  <TabItem value="linux" label="Linux" default>

Open a terminal and run \`example --version\`.

  </TabItem>
  <TabItem value="macos" label="macOS">

Open Terminal and run \`example --version\`.

  </TabItem>
  <TabItem value="windows" label="Windows">

Open PowerShell and run \`example.exe --version\`.

  </TabItem>
</Tabs>

## Update

Run the download command of your system again: it replaces the tool with the latest release.
`;

const CONFIGURATION = `
---
sidebar_position: 2
title: Configuration
description: The settings file of a project and its defaults.
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

# Configuration

## The settings file

The settings live in \`example.config.js\`, at the root of the project. The highlighted lines are the ones most projects change.

\`\`\`js title="example.config.js" {2,4-5} showLineNumbers
module.exports = {
  name: 'my-project',
  output: 'build',
  port: 8080,
  open: true,
};
\`\`\`

## Read the port in your code

<Tabs groupId="language" queryString>
  <TabItem value="js" label="JavaScript" default>

\`\`\`js title="server.js"
const config = require('./example.config.js');
// highlight-next-line
const port = config.port;
\`\`\`

  </TabItem>
  <TabItem value="ts" label="TypeScript">

\`\`\`ts title="server.ts"
import config from './example.config.js';
// highlight-next-line
const port: number = config.port;
\`\`\`

  </TabItem>
</Tabs>

## Defaults

| Setting | Default |
| --- | --- |
| \`output\` | \`build\` |
| \`port\` | \`8080\` |
| \`open\` | \`false\` |
`;

function paragraphs(topic, count) {
  const out = [];
  for (let i = 1; i <= count; i += 1) {
    out.push(`This is paragraph ${i} about ${topic}. A page of the guides is long, so that its table of contents follows the reader down the page: the heading of the part that is in view is the one the table of contents marks.`);
  }
  return out.join('\n\n');
}

const WRITING_CONTENT = `
---
sidebar_position: 1
title: Writing Content
description: Pages, notes, warnings and the parts of a long page.
---

# Writing Content

## Notes and warnings

:::note

A note gives the reader something more to know.

:::

:::tip[Keep it short]

Short sentences are easier to read.

:::

:::info

Every page is written in Markdown.

:::

:::warning

A page without a title gets the name of its file.

:::

:::danger[Do not publish secrets]

Never put a password or a key in a page.

:::

## Headings

${paragraphs('headings', 6)}

### Heading levels

${paragraphs('heading levels', 4)}

## Links

${paragraphs('links', 6)}

## Lists

${paragraphs('lists', 6)}

## Tables

${paragraphs('tables', 6)}

## Long pages

${paragraphs('long pages', 8)}
`;

const DEPLOYMENT = `
---
sidebar_position: 2
title: Deployment
description: Publish the built site on a web server.
---

# Deployment

The build writes the whole site into the \`build\` folder: copy that folder to any web server.

## Behind a firewall

Open port 443 on the firewall of the web server, and nothing else.

## On a path of a domain

Set \`baseUrl\` to the path, for example \`/docs/\`, and build again.
`;

const COMMAND_LINE = `
---
sidebar_position: 1
title: Command Line
description: Every command of the command line tool.
---

# Command Line

## example build

Builds the site into the \`build\` folder.

\`\`\`bash
example build --out build
\`\`\`

## example serve

Serves the built site on a local port.

\`\`\`bash
example serve --port 8080
\`\`\`
`;

const FAQ = `
---
sidebar_position: 2
title: FAQ
description: The questions people ask most.
---

# FAQ

## Can I use my own theme?

Yes: copy a component of the theme into your project and change it.

## Does the search need an account?

No: the search index is built with the site and runs in the browser.
`;

const SUPPORT = `
---
title: Support
description: Where to ask a question about the Example project.
---

# Support

Ask your question on the forum, or write to support@example.com.
`;

const SUPPORT_FR = `
---
title: Assistance
description: Où poser une question sur le projet Example.
---

# Assistance

Posez votre question sur le forum, ou écrivez à support@example.com.
`;

// A page that renders one text on the server and another in the browser, on
// purpose: the step pack proves with it that its check of hydration errors can
// fail. No link leads to it.
const HYDRATION_MISMATCH = `
import Layout from '@theme/Layout';

export default function HydrationMismatch() {
  const where = typeof window === 'undefined' ? 'the server' : 'the browser';
  return (
    <Layout title="Hydration mismatch" description="A page that renders differently on the server and in the browser, on purpose.">
      <main className="container margin-vert--lg">
        <h1>Hydration mismatch</h1>
        <p>This text was rendered by {where}.</p>
      </main>
    </Layout>
  );
}
`;

const AUTHORS = `
alex:
  name: Alex Example
  title: Maintainer of Example Docs
  url: https://example.com/team/alex
  page: true

sam:
  name: Sam Example
  title: Writer
  url: https://example.com/team/sam
  page: true
`;

const TAGS = `
release:
  label: Release
  permalink: /release
  description: The releases of the Example project

guide:
  label: Guide
  permalink: /guide
  description: How to do something with the Example project

community:
  label: Community
  permalink: /community
  description: News from the people around the Example project
`;

function post(file, { title, slug, authors, tags, summary, body }) {
  write(`blog/${file}`, `
---
title: ${title}
slug: ${slug}
authors: [${authors.join(', ')}]
tags: [${tags.join(', ')}]
---

${summary}

{/* truncate */}

${body}
`);
}

const POSTS = [
  ['2026-01-15-welcome.mdx', { title: 'Welcome to Example Docs', slug: 'welcome', authors: ['alex'], tags: ['community'],
    summary: 'Example Docs is where the Example project keeps its documentation.',
    body: 'Every page can be edited: follow the "Edit this page" link at the foot of a page.' }],
  ['2026-03-02-version-1-0.mdx', { title: 'Version 1.0', slug: 'version-1-0', authors: ['alex'], tags: ['release'],
    summary: 'Version 1.0 is the first release of the Example project.',
    body: 'Its documentation stays online under Docs, in the version menu.' }],
  ['2026-05-20-writing-better-guides.mdx', { title: 'Writing Better Guides', slug: 'writing-better-guides', authors: ['sam'], tags: ['guide'],
    summary: 'Five habits make a guide easier to follow.',
    body: 'Write short sentences, one task per page, a title that says what the page is for, an example for every option, and a note where people get stuck.' }],
  ['2026-07-08-version-2-0.mdx', { title: 'Version 2.0', slug: 'version-2-0', authors: ['alex', 'sam'], tags: ['release'],
    summary: 'Version 2.0 adds the command line reference.',
    body: 'Read the Command Line page under Reference, and the questions people ask most in the FAQ.' }],
  ['2026-09-30-what-comes-next.mdx', { title: 'What Comes Next', slug: 'what-comes-next', authors: ['sam'], tags: ['community', 'release'],
    summary: 'The next version is written in the open.',
    body: 'Its pages are under Docs, in the version Next.' }],
];

function testSite() {
  const config = fs.readFileSync(CONFIG, 'utf8');
  if (config.includes(MARK)) {
    console.log('The test content is already there; nothing is changed.');
    return;
  }
  if (!fs.existsSync(path.join(SITE, 'node_modules', '@easyops-cn', 'docusaurus-search-local'))) {
    throw new Error('Install the local search first: npm install @easyops-cn/docusaurus-search-local');
  }
  write('docusaurus.config.ts', TEST_CONFIG);
  write('sidebars.ts', SIDEBARS);

  // The docs: what version 1.0 has, then what 2.0 adds, then the next version.
  fs.rmSync(path.join(SITE, 'docs'), { recursive: true, force: true });
  write('docs/intro.mdx', intro('1.0'));
  writeJson('docs/getting-started/_category_.json', CATEGORY_GETTING_STARTED);
  write('docs/getting-started/installation.mdx', INSTALLATION);
  write('docs/getting-started/configuration.mdx', CONFIGURATION);
  writeJson('docs/guides/_category_.json', CATEGORY_GUIDES);
  write('docs/guides/writing-content.mdx', WRITING_CONTENT);
  run('docusaurus', 'docs:version', '1.0');
  write('docs/intro.mdx', intro('2.0'));
  write('docs/guides/deployment.mdx', DEPLOYMENT);
  writeJson('docs/reference/_category_.json', CATEGORY_REFERENCE);
  write('docs/reference/command-line.mdx', COMMAND_LINE);
  write('docs/reference/faq.mdx', FAQ);
  run('docusaurus', 'docs:version', '2.0');
  write('docs/intro.mdx', intro('next'));

  // The blog: its own posts, authors and tags.
  fs.rmSync(path.join(SITE, 'blog'), { recursive: true, force: true });
  write('blog/authors.yml', AUTHORS);
  write('blog/tags.yml', TAGS);
  for (const [file, data] of POSTS) post(file, data);

  write('src/pages/support.mdx', SUPPORT);
  write('src/pages/hydration-mismatch.tsx', HYDRATION_MISMATCH);

  // French: the messages of the theme are the theme's own; the labels of the
  // navbar, the footer, the sidebar and the versions, and a few pages, here.
  run('docusaurus', 'write-translations', '--locale', 'fr');
  translate('i18n/fr/docusaurus-theme-classic/navbar.json', {
    'item.label.Docs': 'Documentation',
    'item.label.Community': 'Communauté',
    'item.label.Support': 'Assistance',
    'item.label.Forum': 'Forum',
    'item.label.Source': 'Source',
  });
  translate('i18n/fr/code.json', {
    'theme.SearchBar.label': 'Rechercher',
  });
  translate('i18n/fr/docusaurus-theme-classic/footer.json', {
    'link.title.More': 'Plus',
    'link.item.label.Support': 'Assistance',
  });
  for (const version of ['current', 'version-2.0', 'version-1.0']) {
    const file = `i18n/fr/docusaurus-plugin-content-docs/${version}.json`;
    const messages = {
      'sidebar.docsSidebar.category.Getting Started': 'Premiers pas',
      'sidebar.docsSidebar.category.Getting Started.link.generated-index.description': 'Installer le projet et écrire son fichier de réglages.',
      'sidebar.docsSidebar.category.Guides': 'Guides',
    };
    if (version !== 'version-1.0') messages['sidebar.docsSidebar.category.Reference'] = 'Référence';
    translate(file, messages);
  }
  write('i18n/fr/docusaurus-plugin-content-docs/current/intro.mdx', introFr('next'));
  write('i18n/fr/docusaurus-plugin-content-docs/version-2.0/intro.mdx', introFr('2.0'));
  write('i18n/fr/docusaurus-plugin-content-docs/version-1.0/intro.mdx', introFr('1.0'));
  write('i18n/fr/docusaurus-plugin-content-pages/support.mdx', SUPPORT_FR);
  console.log('The test content is in place: three versions of the docs (Next, 2.0, 1.0), English and French, the blog, the local search.');
}

// ---------------------------------------------------------------------------
// One feature at a time, on the template's own site
// ---------------------------------------------------------------------------

function templateFeatures() {
  let config = fs.readFileSync(CONFIG, 'utf8');
  if (config.includes(MARK)) {
    console.log('This site has the test content, which has every feature already; nothing is changed.');
    return;
  }
  const NAVBAR_ITEMS = /(\n    navbar: \{[\s\S]*?\n      items: \[\n)/;
  const navbarItem = (item, what) => {
    if (!NAVBAR_ITEMS.test(config)) throw new Error(`Cannot add ${what}: docusaurus.config.ts has no navbar items list. The template changed; add it by hand.`);
    config = config.replace(NAVBAR_ITEMS, `$1        ${item}\n`);
  };
  if (versions) {
    if (fs.existsSync(path.join(SITE, 'versions.json'))) {
      console.log('The docs have versions already.');
    } else {
      run('docusaurus', 'docs:version', '1.0');
      run('docusaurus', 'docs:version', '2.0');
      navbarItem("{type: 'docsVersionDropdown', position: 'right'},", 'the version menu');
      console.log('The docs have three versions: Next (the docs folder), 2.0 and 1.0.');
    }
  }
  if (locales) {
    if (/locales: \[[^\]]*'fr'/.test(config)) {
      console.log('The site has French already.');
    } else {
      config = edit(config, "    locales: ['en'],\n", "    locales: ['en', 'fr'],\n    localeConfigs: {\n      en: {label: 'English'},\n      fr: {label: 'Français'},\n    },\n", 'French');
      navbarItem("{type: 'localeDropdown', position: 'right'},", 'the locale menu');
      console.log('The site has a second locale: French (fr).');
    }
  }
  if (search) {
    if (config.includes('@easyops-cn/docusaurus-search-local')) {
      console.log('The site has the local search already.');
    } else {
      if (!fs.existsSync(path.join(SITE, 'node_modules', '@easyops-cn', 'docusaurus-search-local'))) {
        throw new Error('Install the local search first: npm install @easyops-cn/docusaurus-search-local');
      }
      const languages = /locales: \[[^\]]*'fr'/.test(config) ? ['en', 'fr'] : ['en'];
      config = edit(config, '\n  themeConfig: {\n', `\n${searchTheme(languages)}  themeConfig: {\n`, 'the local search');
      console.log('The site has the local search.');
    }
  }
  fs.writeFileSync(CONFIG, config);
  if (locales && !fs.existsSync(path.join(SITE, 'i18n', 'fr'))) {
    run('docusaurus', 'write-translations', '--locale', 'fr');
  }
}

try {
  if (testContent) testSite();
  else templateFeatures();
} catch (err) {
  console.error(String((err && err.message) || err));
  process.exit(1);
}
