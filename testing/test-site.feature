Feature: The test site answers as a production build
  As the owner of the site
  I want its pages served as a hydrated production build, its docs, versions, languages and search working, and an unknown address answered by a 404
  So that a build that came out broken is caught before anything else is tested

  # Placed by the workspace's testing setup as a starting point: it is yours to change.
  # The site has the test content of the step pack (cmd-docusaurus-project.sh --test-content); a
  # documentation site has no accounts: no scenario logs in.

  @critical
  Scenario: A page of the docs is a hydrated production build and opens the next one in the same document
    Given I am on "/docs/intro"
    Then the site should be served as a production build
    And I should see a hydrated page
    When I click the link "Installation" without a full page reload
    Then the active page in the sidebar should be "Installation"
    And there should be no hydration errors

  Scenario: The version menu opens an old version with its banner
    Given I am on "/docs/getting-started/installation"
    When I choose "1.0" in the version menu
    Then the page should belong to the version "1.0"
    And the page should show a version banner

  Scenario: The language menu opens the same page in French
    Given I am on "/docs/intro"
    When I choose "Français" in the language menu
    Then the page language should be "fr"
    And the language menu should show "Français"

  Scenario: The search finds a page by its words
    Given I am on "/docs/intro"
    When I search for "firewall"
    Then the search should suggest "Behind a firewall"

  @js-off
  Scenario: An address with no page answers with the not-found page
    When I go to "/no-such-page"
    Then I should be on a 404 page
