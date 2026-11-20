#!/usr/bin/env bash

argparse "$@" <<ARGEOF || exit 1
parser.add_argument('PROJECT_NAME',
                    help='The name of the project: its folder, its DDEV project and its host name.')
parser.add_argument('-i', '--install',
                    action='store_true',
                    default=False,
                    help='Build the site to a production build and serve it at the address of the project.')
parser.add_argument('-v', '--versions',
                    action='store_true',
                    default=False,
                    help='Put the docs in versions: 1.0 and 2.0 are cut from the docs of the template, the docs folder becomes the unreleased version (Next), and the navbar gets the version menu.')
parser.add_argument('-o', '--locales',
                    action='store_true',
                    default=False,
                    help='Add a second language, French (fr), with its own address (/fr/), the language menu in the navbar and the translation files to fill in.')
parser.add_argument('-s', '--search',
                    action='store_true',
                    default=False,
                    help='Add a search that runs in the browser on an index the build writes (@easyops-cn/docusaurus-search-local, MIT): no account and no outside service.')
parser.add_argument('-t', '--test-content',
                    action='store_true',
                    default=False,
                    help='Give the site the test content of the step pack instead of the pages of the template: its own docs in three versions, French, its own blog, an announcement bar, a menu in the navbar and the local search; the features of the step pack run on it.')
parser.add_argument('-r', '--docusaurus-version',
                    default="3.10.2",
                    help='The release of create-docusaurus and of the site (3.10.2 is the current release). Example: --docusaurus-version 3.10.2')
parser.add_argument('-a', '--add-users',
                    action='store_true',
                    default=False,
                    help='Taken so that every builder accepts the same flags: a documentation site has no accounts, and nothing is added.')
parser.add_argument('-l', '--launch',
                    action='store_true',
                    default=False,
                    help='Open the site in a browser when it is ready.')
ARGEOF
