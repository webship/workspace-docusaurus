Build a Docusaurus documentation site in a sites folder and prove it with its first webship-js feature.

The launch command below is for Claude Code, the default; the text between the triple quotes can be given to another AI CLI as it is.

```
claude --permission-mode bypassPermissions """
Build the Docusaurus site named <name> in this sites folder and test it with webship-js
# ~/workspace/<dev|test|sandboxes|demos> · https://<name>.ddev.site · container-based (DDEV by default)
# the builder deletes a project of the same name first: stop if <name> is a site somebody still needs
# nothing on the host: no node, npm, npx or docusaurus outside the container; look at free -g first (a production build wants memory)
# a feature to write or a run to read: the book Automated Functional Testing Recipes first (its README.md, then the matching chapter), from .claude/automated-functional-testing-recipes/ in the project, ~/.claude/automated-functional-testing-recipes/ or https://github.com/webship/webship-js-ai-agent/tree/2.0.x/automated-functional-testing-recipes

1. bash cmd-docusaurus-project.sh <name> --install <--test-content|--versions --locales --search|>
   (--test-content gives the site the step pack's own test content, on which every feature of the pack runs;
   --versions, --locales and --search add those parts to the site of the classic template)
2. bash cmd-tools-docusaurus-cli.sh <name>
   tell me the release, the address, the build, the versions, the languages and the search it lists
3. bash cmd-tools-testing.sh <name>
   webship-js, the step pack and tests/features/site.feature
4. bash cmd-tools-testing.sh <name> --dry-run --path tests/features/site.feature
5. bash cmd-tools-testing.sh <name> --run --path tests/features/site.feature

If a command fails, show the line that failed and stop. Do not retry with other flags.
When the feature is green: the address, the release, how many scenarios and steps passed.
Then ask me whether to keep the site or remove it with: bash cmd-tools-remove.sh <name>
"""
```
