#!/usr/bin/env bash

# Docusaurus for the Webship Workspace: make a documentation site with create-docusaurus (the classic
# template, in TypeScript), give it versions of its docs, a second language, the local search or the
# whole test content of the step pack, build it for production and serve it, run the docusaurus CLI on
# it, and wire its step pack into the testing setup.
#
# Placed by `plugins.sh --install docusaurus` in core/scripts/plugins/docusaurus/functions/, where
# bootstrap sources it after the core's own functions. Everything runs in the project's container
# (DDEV by default), never on the host: the site is a Node.js project in the project's site/ folder,
# the web container builds it and serves the build as a daemon (`docusaurus serve`), and the router
# serves that at the project's address. There is no database.
#
# A documentation site has no accounts. DDEV has no project type for Docusaurus, so a Docusaurus
# project is recognised by a file (.ddev/config.docusaurus.yaml, written by the builder), and four
# names are the ones the core's tools look for:
#   set_docusaurus_users          an empty list: there are no accounts  (cmd-tools-add-users.sh <project> docusaurus)
#   add_docusaurus_users          says so, and adds nothing             (the same tool)
#   cancel_docusaurus_users       says so, and removes nothing          (cmd-tools-cancel-users.sh <project> docusaurus)
#   testing_configure_docusaurus  the step pack in the testing stack    (cmd-tools-testing.sh <project>)

# The step pack a Docusaurus project is tested with, and the release line it is required at.
readonly DOCUSAURUS_STEPS_PACKAGE='@webship-js/docusaurus-steps';
readonly DOCUSAURUS_STEPS_VERSION='^2.0.0';

# Where the site lives in the web container, and the port its server listens on.
readonly DOCUSAURUS_SITE='/var/www/html/site';
readonly DOCUSAURUS_PORT='3000';

# The release a site is made on unless --docusaurus-version says otherwise (the current release), and
# the release of the local search (@easyops-cn/docusaurus-search-local, MIT: no account, no outside
# service) the step pack was proven with.
readonly DOCUSAURUS_DEFAULT_VERSION='3.10.2';
readonly DOCUSAURUS_SEARCH_VERSION='0.55.3';

# The Node.js script the plugin places with itself in core/scripts/plugins/docusaurus/: the versions,
# the second language, the local search and the test content of the step pack, written into a site
# create-docusaurus made (the same script as the step pack's own build).
DOCUSAURUS_TEST_SITE="${WORKSPACE_SCRIPTS}/plugins/docusaurus/docusaurus-test-site.cjs";

# A documentation site has no accounts: the list is empty.
function set_docusaurus_users() {
  users=();
}

# Is this folder a Docusaurus project? The builder leaves .ddev/config.docusaurus.yaml in it.
function docusaurus_is_project() {
  local project_path="$1";
  [ -f "${project_path}/.ddev/config.docusaurus.yaml" ] ;
}

# What the site holds: "test-content" (the step pack's test site) or "template" (the classic template,
# with what --versions, --locales and --search added). The builder writes it in .ddev/docusaurus-content.
function docusaurus_content() {
  local project_path="${1:-.}";
  cat "${project_path}/.ddev/docusaurus-content" 2>/dev/null || echo template ;
}

# Go to the project a tool was asked about, or say why not.
function docusaurus_enter_project() {
  local project_path="${WORKSPACE_ROOT}/${doc_name}/${PROJECT_NAME}";
  if [ ! -d "${project_path}" ] ; then
    echo "No project ${PROJECT_NAME} in ${WORKSPACE_ROOT}/${doc_name}." ;
    return 1 ;
  fi
  if ! docusaurus_is_project "${project_path}" ; then
    echo "${doc_name}/${PROJECT_NAME} is not a Docusaurus project (it has no .ddev/config.docusaurus.yaml)." ;
    return 1 ;
  fi
  cd "${project_path}" || return 1 ;
}

# What the container tool is told about the site: the router sends the project's address to the server
# of the built site, which the web container runs as a daemon once there is a build, and Node.js is in
# the web image itself, so the server has it before anything starts, on every restart, on a slow
# connection and offline.
function docusaurus_write_ddev_config() {
  local project_path="$1" nodejs_version="$2";
  mkdir -p "${project_path}/.ddev/web-build" || return 1 ;
  cat > "${project_path}/.ddev/config.docusaurus.yaml" <<YAMLEOF
# Docusaurus in this project. Written by the Docusaurus builder of the workspace; build again rather
# than editing by hand. The web container serves no files of its own: the router sends ports 80 and 443
# of the project's address to the server of the built site on port ${DOCUSAURUS_PORT} (docusaurus serve),
# which the web container runs as a daemon (.ddev/docusaurus-serve.sh) once the site has a production
# build (site/build).
web_extra_exposed_ports:
  - name: docusaurus
    container_port: ${DOCUSAURUS_PORT}
    http_port: 80
    https_port: 443
web_extra_daemons:
  - name: docusaurus
    command: "bash /var/www/html/.ddev/docusaurus-serve.sh"
    directory: /var/www/html
YAMLEOF
  cat > "${project_path}/.ddev/docusaurus-serve.sh" <<SERVEEOF
#!/usr/bin/env bash
# Serves the production build of the site (site/build) on port ${DOCUSAURUS_PORT}. Run by the web container's
# supervisor. Written by the Docusaurus builder of the workspace.
cd ${DOCUSAURUS_SITE} 2>/dev/null || { sleep 5; exit 1; }
if [ ! -x node_modules/.bin/docusaurus ] || [ ! -f build/index.html ]; then sleep 5; exit 1; fi
exec node_modules/.bin/docusaurus serve --port ${DOCUSAURUS_PORT} --host 0.0.0.0 --no-open
SERVEEOF
  chmod +x "${project_path}/.ddev/docusaurus-serve.sh" ;
  cat > "${project_path}/.ddev/web-build/Dockerfile.docusaurus" <<DOCKEREOF
# Node.js ${nodejs_version} in the web image, so the site's server has it before the container's
# daemons start. Written by the Docusaurus builder of the workspace.
RUN N_PREFIX=/usr/local n install ${nodejs_version} && node --version
DOCKEREOF
}

# A command in the site's folder in the web container, with stdin closed: an open stdin pipe keeps some
# tools waiting for input when a builder runs in the background.
function docusaurus_exec() {
  ddev exec -d "${DOCUSAURUS_SITE}" "$*" < /dev/null ;
}

# npm and the docusaurus CLI in the container, in the folder of the site.
function docusaurus_npm() {
  docusaurus_exec "npm $*" ;
}

function docusaurus_cli() {
  docusaurus_exec "node_modules/.bin/docusaurus $*" ;
}

# The release of Docusaurus the site has installed.
function docusaurus_version() {
  ddev exec "node -p \"require('${DOCUSAURUS_SITE}/node_modules/@docusaurus/core/package.json').version\"" < /dev/null 2>/dev/null | tr -d '\r' ;
}

# Wait until the server of the built site answers on its own port.
function docusaurus_wait() {
  local attempt ;
  for attempt in $(seq 1 90) ; do
    if ddev exec "curl -fsS -o /dev/null http://127.0.0.1:${DOCUSAURUS_PORT}/" < /dev/null > /dev/null 2>&1 ; then
      return 0 ;
    fi
    sleep 2 ;
  done
  echo "The server of the built site did not start; what it said:" ;
  docker logs --tail 40 "ddev-${PROJECT_NAME}-web" 2>&1 | tail -40 ;
  return 1 ;
}

# Serve the build of the site again (the daemon of the web container), and wait for it.
function docusaurus_restart() {
  if [ ! -f site/build/index.html ] ; then
    echo "The site has no production build yet (site/build): build it with --build." ;
    return 1 ;
  fi
  ddev exec "supervisorctl restart webextradaemons:docusaurus" < /dev/null > /dev/null || return 1 ;
  docusaurus_wait ;
}

# Build the site to a production build (every language), and serve the new build.
function docusaurus_production_build() {
  echo "Building the site to a production build (docusaurus build)." ;
  docusaurus_npm run build || { echo "The build of the site failed." ; return 1 ; } ;
  docusaurus_restart ;
}

# Run the plugin's script for the versions, the second language, the search and the test content in
# the site's folder, with the site's own packages; the script is in the site only for that call.
function docusaurus_test_site() {
  if [ ! -f "${DOCUSAURUS_TEST_SITE}" ] ; then
    echo "The plugin's test site script is missing: ${DOCUSAURUS_TEST_SITE} (install the plugin again)." ;
    return 1 ;
  fi
  cp "${DOCUSAURUS_TEST_SITE}" site/.webship-test-site.cjs || return 1 ;
  local status=0 ;
  docusaurus_exec "node .webship-test-site.cjs $*" || status=$? ;
  rm -f site/.webship-test-site.cjs ;
  return ${status} ;
}

# Build a Docusaurus site from nothing: the container, the classic template, its packages, the parts
# asked for (--versions, --locales, --search, or --test-content for all of them on the step pack's own
# content), and with --install the production build, served.
function docusaurus_build() {
  trim_project_name ;
  local base_url="https://${PROJECT_NAME}.ddev.site" ;
  local version="${DOCUSAURUS_VERSION:-${DOCUSAURUS_DEFAULT_VERSION}}" ;
  local project_path="${WORKSPACE_ROOT}/${doc_name}/${PROJECT_NAME}" ;
  local parts="" ;
  [ "${VERSIONS}" == 'yes' ] && parts="${parts} --versions" ;
  [ "${LOCALES}" == 'yes' ] && parts="${parts} --locales" ;
  [ "${SEARCH}" == 'yes' ] && parts="${parts} --search" ;

  cd ${WORKSPACE_ROOT}/${doc_name} || exit 1 ;

  drop_database ;
  rm -rf "${PROJECT_NAME}" ;
  mkdir -p "${PROJECT_NAME}" ;
  cd "${project_path}" || exit 1 ;

  # A generic web server and no database: the site is files, built once and served.
  ddev config --project-type=generic --webserver-type=generic --docroot="" --project-name=${PROJECT_NAME} \
    --omit-containers=db --nodejs-version=$(ddev_nodejs_version) < /dev/null || exit 1 ;
  docusaurus_write_ddev_config "${project_path}" "$(ddev_nodejs_version)" || exit 1 ;
  ddev_up start -y < /dev/null || exit 1 ;

  echo "Making the site of the classic template (TypeScript) with create-docusaurus ${version}." ;
  ddev exec -d /var/www/html "npx -y create-docusaurus@${version} site classic --typescript --package-manager npm --skip-install" < /dev/null \
    || { echo "create-docusaurus could not make the site." ; exit 1 ; } ;
  echo "Installing the packages of the site (npm). This takes a minute or two." ;
  docusaurus_npm install --no-audit --no-fund || { echo "npm install failed in the site." ; exit 1 ; } ;

  if [ "${TEST_CONTENT}" == 'yes' ] || [ "${SEARCH}" == 'yes' ] ; then
    echo "Adding the local search (@easyops-cn/docusaurus-search-local ${DOCUSAURUS_SEARCH_VERSION})." ;
    docusaurus_npm install --no-audit --no-fund "@easyops-cn/docusaurus-search-local@${DOCUSAURUS_SEARCH_VERSION}" || exit 1 ;
  fi
  if [ "${TEST_CONTENT}" == 'yes' ] ; then
    echo "Adding the test content of the step pack: three versions of the docs, French, the blog, the local search." ;
    docusaurus_test_site --test-content || exit 1 ;
    echo test-content > .ddev/docusaurus-content ;
  else
    if [ -n "${parts}" ] ; then
      docusaurus_test_site ${parts} || exit 1 ;
    fi
    echo template > .ddev/docusaurus-content ;
  fi

  [ "${ADD_USERS}" == 'yes' ] && echo "--add-users: a documentation site has no accounts; nothing is added." ;

  if [ "${INSTALL}" == 'yes' ] ; then
    docusaurus_production_build || exit 1 ;
    echo "${doc_name} ${PROJECT_NAME} has been built and is served: Docusaurus $(docusaurus_version)." ;
    echo "Go to ${base_url}" ;
  else
    echo "${doc_name} ${PROJECT_NAME} is ready to build: Docusaurus $(docusaurus_version)." ;
    echo "Build and serve it with: bash cmd-tools-docusaurus-cli.sh ${PROJECT_NAME} --build   (or build with --install)" ;
  fi

  if [ "${LAUNCH}" == 'yes' ] ; then
    ddev launch ;
  fi

  cd ${WORKSPACE_ROOT}/${doc_name};
}

# A documentation site has no accounts: there is nothing to add, and nothing to remove.
function add_docusaurus_users() {
  echo "A Docusaurus site has no accounts, so there are none to add." ;
}

function cancel_docusaurus_users() {
  echo "A Docusaurus site has no accounts, so there are none to remove." ;
}

# What cmd-tools-docusaurus-cli.sh does: the first of --run, --npm, --build, --restart, --update that
# was asked for; with none of them, what the site is.
function docusaurus_cli_tool() {
  trim_project_name ;
  docusaurus_enter_project || exit 1 ;

  if ! ddev describe -j 2>/dev/null | grep -q '"status":"running"' ; then
    ddev start -y < /dev/null || exit 1 ;
  fi

  if [ ! "${RUN}" == '_none_' ] ; then
    # Unquoted on purpose: --run "docs:version 3.0" is a command and its arguments.
    docusaurus_cli ${RUN} ;
    exit $? ;
  fi
  if [ ! "${NPM}" == '_none_' ] ; then
    docusaurus_npm ${NPM} ;
    exit $? ;
  fi

  if [ "${BUILD}" == 'yes' ] ; then
    docusaurus_production_build || exit 1 ;
    echo "Docusaurus $(docusaurus_version): the new build is served at https://${PROJECT_NAME}.ddev.site" ;
  elif [ "${RESTART}" == 'yes' ] ; then
    docusaurus_restart || exit 1 ;
    echo "Docusaurus $(docusaurus_version): the build is served again at https://${PROJECT_NAME}.ddev.site" ;
  elif [ "${UPDATE}" == 'yes' ] ; then
    echo "Docusaurus $(docusaurus_version) is installed; updating its packages to the latest release." ;
    local packages ;
    packages="$(python3 -c "import json; p=json.load(open('site/package.json')); print(' '.join(sorted({n + '@latest' for k in ('dependencies', 'devDependencies') for n in p.get(k, {}) if n.startswith('@docusaurus/')})))")" ;
    docusaurus_npm install --no-audit --no-fund ${packages} || exit 1 ;
    docusaurus_production_build || exit 1 ;
    echo "Docusaurus $(docusaurus_version): the new build is served at https://${PROJECT_NAME}.ddev.site" ;
  else
    echo "${doc_name}/${PROJECT_NAME}: Docusaurus $(docusaurus_version) at https://${PROJECT_NAME}.ddev.site" ;
    echo "" ;
    if [ -f site/build/index.html ] ; then
      echo "Production build: site/build, $(find site/build -name '*.html' | wc -l) pages, built $(date -r site/build/index.html '+%Y-%m-%d %H:%M')" ;
      if ddev exec "curl -fsS -o /dev/null http://127.0.0.1:${DOCUSAURUS_PORT}/" < /dev/null > /dev/null 2>&1 ; then
        echo "Server: running (docusaurus serve)" ;
      else
        echo "Server: not answering; serve it again with --restart" ;
      fi
    else
      echo "Production build: none yet; build it with --build" ;
    fi
    echo "Content: $(docusaurus_content)" ;
    if [ -f site/versions.json ] ; then
      echo "Versions of the docs: Next (site/docs), $(python3 -c "import json; print(', '.join(json.load(open('site/versions.json'))))")" ;
    else
      echo "Versions of the docs: one (site/docs)" ;
    fi
    echo "Languages: $(python3 -c "import re; s=open('site/docusaurus.config.ts').read(); m=re.search(r'locales: \[([^\]]*)\]', s); print(', '.join(re.findall(r\"'([^']+)'\", m.group(1))) if m else 'en')")" ;
    if grep -q '@easyops-cn/docusaurus-search-local' site/docusaurus.config.ts 2>/dev/null ; then
      echo "Search: the local search (an index built with the site)" ;
    else
      echo "Search: none" ;
    fi
    echo "Accounts: none (a documentation site)" ;
  fi
  cd ${WORKSPACE_ROOT}/${doc_name};
}

# The step pack in the testing stack of a Docusaurus project. The core's testing_configure calls this in
# the project folder once webship-js is scaffolded and before the dependencies are installed; for a
# project that is not Docusaurus it changes nothing.
#
# It adds the pack to package.json, lists its step definitions in cucumber.js after webship-js's own,
# adds the tags that keep the pack's assertions that must fail out of a normal run, and writes a first
# feature when the project has none of its own: the one of the test content, or the one of the classic
# template. There is no users registry: the site has no accounts. Every part is skipped when it is
# already there, so a second run adds what the first missed and never resets a suite. The suite is the
# project's (its package.json, cucumber.js and tests/ are next to site/, not in it).
function testing_configure_docusaurus() {
  local project_path="$1";
  docusaurus_is_project "${project_path}" || return 0 ;
  if [ ! -f "${project_path}/cucumber.js" ] || [ ! -f "${project_path}/package.json" ] ; then
    echo "  Docusaurus: cucumber.js is not here yet — run the testing setup again once webship-js is scaffolded." ;
    return 1 ;
  fi

  echo "Adding the Docusaurus step pack (${DOCUSAURUS_STEPS_PACKAGE} ${DOCUSAURUS_STEPS_VERSION}).";

  python3 - "${project_path}" "${DOCUSAURUS_STEPS_PACKAGE}" "${DOCUSAURUS_STEPS_VERSION}" <<'PYEOF' || return 1
import json, re, sys

project, pack, version = sys.argv[1:4]

# package.json: the pack as a dev dependency, at the release line this plugin was proven on. A pack the
# project already has (from npm, or from a tarball or a folder: --add-steps) is kept as it is.
pkg_file = project + '/package.json'
pkg = json.load(open(pkg_file))
if pack not in pkg.get('dependencies', {}) and pack not in pkg.get('devDependencies', {}):
    pkg.setdefault('devDependencies', {})[pack] = version
    open(pkg_file, 'w').write(json.dumps(pkg, indent=4) + '\n')
    print('  package.json: %s %s' % (pack, version))

# cucumber.js: the pack's step definitions after webship-js's own, and the tags.
cucumber_file = project + '/cucumber.js'
src = open(cucumber_file).read()
before = src

if ('node_modules/%s/' % pack) not in src:
    line = "'node_modules/%s/tests/step-definitions/**/*.js'," % pack
    core = re.search(r"^([ \t]*)'node_modules/webship-js/tests/step-definitions/[^']*',.*$", src, re.M)
    opening = re.search(r"^([ \t]*)require:[ \t]*\[[ \t]*$", src, re.M)
    if core:
        src = src[:core.end()] + '\n' + core.group(1) + line + src[core.end():]
    elif opening:
        src = src[:opening.end()] + '\n' + opening.group(1) + '  ' + line + src[opening.end():]
    else:
        sys.exit("  cucumber.js has no require list this can add to. Add this line to it:\n    " + line)
    print('  cucumber.js: the step definitions of %s' % pack)

if not re.search(r"^[ \t]*tags:", src, re.M):
    default = re.search(r"^([ \t]*)default:[ \t]*\{[ \t]*$", src, re.M)
    if default:
        pad = default.group(1) + '  '
        block = [
            pad + "// The pack's assertions that must fail are no part of a normal run.",
            pad + "tags: process.env.CUCUMBER_TAGS || 'not @wip and not @must-fail',",
        ]
        src = src[:default.end()] + '\n' + '\n'.join(block) + src[default.end():]
        print('  cucumber.js: the tags that keep the assertions that must fail out of a normal run')

if src != before:
    open(cucumber_file, 'w').write(src)
PYEOF

  # A first feature, when the project has none for the site yet: the production build, hydrated, its
  # pages in the same document, and what the content of the site has.
  local feature="${WORKSPACE_SCRIPTS}/plugins/docusaurus/site.feature" ;
  if [ "$(docusaurus_content "${project_path}")" == 'test-content' ] ; then feature="${WORKSPACE_SCRIPTS}/plugins/docusaurus/test-site.feature" ; fi
  if [ -f "${feature}" ] && [ ! -f "${project_path}/tests/features/site.feature" ] ; then
    mkdir -p "${project_path}/tests/features" && cp "${feature}" "${project_path}/tests/features/site.feature" \
      && echo "  tests/features/site.feature: a first feature for the site" ;
  fi

  if [ ! -f "${project_path}/site/build/index.html" ] ; then
    echo "  the site has no production build yet: build it (cmd-tools-docusaurus-cli.sh ${PROJECT_NAME} --build) before the suite runs" ;
  fi
}
