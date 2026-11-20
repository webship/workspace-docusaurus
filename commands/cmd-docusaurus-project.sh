#!/usr/bin/env bash

# workspace-name: Docusaurus (documentation site, production build)

# Installed by the Docusaurus plugin (plugins.sh --install docusaurus); __WORKSPACE__ is the workspace it was installed into.
#
# Build a Docusaurus site in a container, made with create-docusaurus (the classic template, in
# TypeScript), at https://<name>.ddev.site: the site of the template, with versions of its docs
# (--versions), a second language (--locales) and the local search (--search) when asked, or the test
# content of the step pack (--test-content). With --install the site is built to a production build and
# served there. A documentation site has no accounts.

# Bootstrap.
# Find the workspace tooling from this script, so a fresh clone needs no setup.
WORKSPACE_SCRIPTS="${WORKSPACE_SCRIPTS:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../core/scripts" && pwd)}";
source ${WORKSPACE_SCRIPTS}/bootstrap.sh || exit 1 ;

# Load workspace settings.
eval $(parse_yaml ${WORKSPACE_CONFIG}/workspace.__WORKSPACE__.settings.yml);

# Distribution.
distribution_name="docusaurus";
distribution_title="Docusaurus";
distribution_webroot="";

ARGPARSE_DESCRIPTION="Build a ${distribution_title} site in __WORKSPACE__"
# The args file comes with the plugin: core/scripts/plugins/docusaurus/ is where plugins.sh --install puts it.
source ${WORKSPACE_SCRIPTS}/plugins/docusaurus/args/arg-docusaurus.sh || exit 1 ;

shift $#;

docusaurus_build ;
