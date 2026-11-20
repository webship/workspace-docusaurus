Feature: Search and content
  The search finds a page by its words, the tabs of one group choose together and are remembered, and
  the copy button of a code block copies its code.

  Scenario: The search opens a page with the words marked
    Given I am on "/docs/intro"
    When I search for "firewall"
    Then the search should suggest "Behind a firewall"
    When I open the search suggestion "Behind a firewall"
    Then the words "firewall" should be marked on the page

  Scenario: The tabs of one group choose together and are remembered
    Given I am on "/docs/getting-started/installation"
    When I choose the "macOS" tab
    Then the "macOS" tab should be selected in every group
    When I reload the page
    Then the "macOS" tab should be selected in every group

  Scenario: The copy button copies the code of its block
    Given I am on "/docs/getting-started/configuration"
    Then the code block "example.config.js" should highlight the lines "2, 4-5"
    When I copy the code block "example.config.js"
    Then the clipboard should hold the code of "example.config.js"
