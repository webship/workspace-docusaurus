Feature: Moving through the docs
  The links of the docs open their pages in the same document, the sidebar marks the page shown, the
  table of contents follows the scroll, and the pager leads to the next page.

  Scenario: The sidebar opens a page in the same document and marks it
    Given I am on "/docs/intro"
    When I click the link "Installation" without a full page reload
    Then the active page in the sidebar should be "Installation"
    And the keyboard focus should be at the start of the page
    And the breadcrumbs should be "Home page, Getting Started, Installation"

  Scenario: A collapsed category opens on its pages
    Given I am on "/docs/intro"
    When I expand the "Guides" category in the sidebar
    And I click "Deployment" in the sidebar
    Then the path should be "/docs/guides/deployment"
    And the "Guides" category in the sidebar should be expanded

  Scenario: The table of contents follows the part of the page being read
    Given I am on "/docs/guides/writing-content"
    When I scroll to the heading "Tables"
    Then the table of contents should highlight "Tables"
    When I click "Links" in the table of contents
    Then the address should point to the heading "Links"

  Scenario: The pager leads to the next page and back
    Given I am on "/docs/getting-started/installation"
    When I go to the next page
    Then the path should be "/docs/getting-started/configuration"
    When I go back without a full page reload
    Then the path should be "/docs/getting-started/installation"
