# Changelog

## 1.0.0 (Unreleased)

### Bug Fixes

- AppConfig: Avoid rendering empty checks
- Update dependencies

## 0.0.15

### Features

- Add Ask Assistant button alongside LLM button for issues
- Use `/register` endpoint if defined
- Update dependencies

## 0.0.14

### Features

- Zero state redesign
- Update dependencies

## 0.0.13

### Bug Fixes

- Fixes for retry button
- Update dependencies
- Move to tags for versioning

## 0.0.11

### Features

- Increase the limit when listing checks
- Move all global actions to the top
- Add report interaction calls
- Display partial results

### Documentation

- Update README to include configuration instructions
- Update readme for release lifecycle
- Rewording subheader
- Update dependencies
- Add dependabot configuration for GitHub Actions and npm packages
- Update endpoints.gen.ts

## 0.0.10

### Features

- Add LLM suggestions
- Update dependencies

## 0.0.9

### Features

- Show status for each check

## 0.0.8

### Bug Fixes

- Add margin and update text

## 0.0.7

### Bug Fixes

- More small fixes

## 0.0.6

### Features

- Allow to silence issues
- Allow to skip check steps
- Allow to retry a single check
- Add more e2e tests

### Bug Fixes

- Fix publish action permissions
- Use check type name annotation
- Some minor fixes
- Fix workflows

### UX Improvements

- UX improvements
- Add link to feedback and update prerequisites
- Update dependencies
- CD: Enable provisioned plugins Argo Workflow
- Update workflows
- Update CODEOWNERS

## 0.0.5

### Features

- Display the home page under the "Admin" section
- Enable the grafanaAdvisor feature toggle
- Visualize errors
- Enable rendering HTML for ReportError.action
- Use automatically generated client
- Add feedback form
- Enable e2e test
- Home page: refactor and tests
- Add margin to link buttons
- Use creationTimestamp
- Cover components with tests
- Auto enable app
- Add page when missing the feature flag
- Show a success message if no issues are found
- Use collapsables for visualising
- Add icons to the issue titles
- Only show sections that have issues
- Only highlight headers which have issues
- Only show issue count if >0
- Update the highlighting in the CheckSummary
- Display check steps
- Add delete checks button

### Bug Fixes

- Fix isCompleted check
- Fix reloading behavior while running checks
- Fix issue count summary
- Fix ts error caused by a conflict
- Fix update smoke test and README
- Remove AppConfig and fix tests
- Remove unnecessary data getter
- Skip checks that don't have an updated timestamp
- Skip checks if type would be undefined
- Style the links in ReportError.action

### UI Updates

- Update logo and change title
- Coloring the titles by severity
- Add spacing between issues
- Stop highlighting the title (only the icon)
- Revamp action buttons
- Update dependencies
- Add Grafana workflows
- Update LICENSE
- Update README
