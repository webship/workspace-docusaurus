#!/usr/bin/env bash

argparse "$@" <<ARGEOF || exit 1
parser.add_argument('PROJECT_NAME',
                    help='The Docusaurus site in this workspace.')
parser.add_argument('-r', '--run',
                    default="_none_",
                    help='A command of the docusaurus CLI of the site, with its arguments. Example: --run "docs:version 3.0"')
parser.add_argument('-m', '--npm',
                    default="_none_",
                    help='npm in the folder of the site, with its arguments. Example: --npm "ls @docusaurus/core"')
parser.add_argument('-b', '--build',
                    action='store_true',
                    default=False,
                    help='Build the site to a production build (every language) and serve the new build.')
parser.add_argument('-s', '--restart',
                    action='store_true',
                    default=False,
                    help='Serve the production build of the site again.')
parser.add_argument('-u', '--update',
                    action='store_true',
                    default=False,
                    help='Update the packages of Docusaurus in the site to their latest release, then build and serve it.')
ARGEOF
