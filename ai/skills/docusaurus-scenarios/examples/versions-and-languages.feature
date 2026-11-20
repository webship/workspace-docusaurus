Feature: Versions and languages
  The version menu opens the same page in an old version, with its banner, and the language menu the
  same page in French.

  Scenario: An old version of a page shows its banner and leads back to the latest one
    Given I am on "/docs/getting-started/installation"
    Then the version menu should list "Next, 2.0 and 1.0"
    When I choose "1.0" in the version menu
    Then the page should belong to the version "1.0"
    And the page should show a version banner
    When I click "latest version" in the version banner
    Then the version menu should show "2.0"
    And the page should not show a version banner

  Scenario: The language menu opens the same page in French and back
    Given I am on "/docs/intro"
    When I choose "Français" in the language menu
    Then the page language should be "fr"
    And I should see "Documentation" in the navbar
    When I choose "English" in the language menu
    Then the page language should be "en"
