Feature: The site answers as a production build
  As the owner of the site
  I want its front page served as a hydrated production build, its docs opened in the same document and an unknown address answered by a 404
  So that a build that came out broken is caught before anything else is tested

  # Placed by the workspace's testing setup as a starting point: it is yours to change.
  # A documentation site has no accounts: no scenario logs in.

  @critical
  Scenario: The front page is a hydrated production build
    Given I am on "/"
    When I wait for the page to be ready
    Then the site should be served as a production build
    And I should see a hydrated page
    And there should be no hydration errors

  Scenario: The docs open from the navbar in the same document
    Given I am on "/"
    When I click "Tutorial" in the navbar
    Then the path should be "/docs/intro"
    And the navbar link "Tutorial" should be active
    And the active page in the sidebar should be "Tutorial Intro"
    And the keyboard focus should be at the start of the page

  Scenario: The colour mode chosen is remembered
    Given I am on "/docs/intro"
    When I switch the colour mode to "dark"
    And I reload the page
    Then the colour mode should be "dark"

  @js-off
  Scenario: An address with no page answers with the not-found page
    When I go to "/no-such-page"
    Then I should be on a 404 page
