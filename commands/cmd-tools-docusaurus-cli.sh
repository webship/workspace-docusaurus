#!/usr/bin/env bash

# Installed by the Docusaurus plugin (plugins.sh --install docusaurus); __WORKSPACE__ is the workspace it was installed into.
#
# The docusaurus CLI and npm for one Docusaurus site of this workspace, in its container: say what the
# site is, run a docusaurus command or npm, build it for production and serve it, serve it again,
# update Docusaurus. Nothing here runs on the host.

# Bootstrap.
# Find the workspace tooling from this script, so a fresh clone needs no setup.
WORKSPACE_SCRIPTS="${WORKSPACE_SCRIPTS:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../core/scripts" && pwd)}";
source ${WORKSPACE_SCRIPTS}/bootstrap.sh || exit 1 ;

# Load workspace settings.
eval $(parse_yaml ${WORKSPACE_CONFIG}/workspace.__WORKSPACE__.settings.yml);

# Distribution.
distribution_name="docusaurus";

ARGPARSE_DESCRIPTION="Run the docusaurus CLI and npm for a Docusaurus site of __WORKSPACE__: status, a docusaurus command, npm, the production build, serving it again, an update"
# The args file comes with the plugin: core/scripts/plugins/docusaurus/ is where plugins.sh --install puts it.
source ${WORKSPACE_SCRIPTS}/plugins/docusaurus/args/arg-docusaurus-cli.sh || exit 1 ;

shift $#;

docusaurus_cli_tool ;
