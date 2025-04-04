# grafana-advisor-app

[![CI](https://github.com/grafana/grafana-advisor-app/actions/workflows/push.yaml/badge.svg)](https://github.com/grafana/grafana-advisor-app/actions/workflows/push.yaml)&nbsp;&nbsp;![Latest Version Badge](https://img.shields.io/badge/dynamic/json?logo=grafana&query=$.version&url=https://grafana.com/api/plugins/grafana-advisor-app&label=Version&prefix=v&color=F47A20)

An app for visualising checks that require immediate action or investigation.

<img width="500px" src="https://raw.githubusercontent.com/grafana/grafana-advisor-app/main/docs/screenshot.png" />

## Requirements

Grafana >=11.6.0

It is also necessary to enable the `grafanaAdvisor` [feature toggle](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/feature-toggles/) in the Grafana server.

## Features

- Visualise checks that require immediate action or investigation.
- Filter by check severity.
- Take action on a check by clicking the provided links.

## Installation

This plugin can be installed using one of the following methods:

- [Grafana Plugins Catalog](https://grafana.com/docs/grafana/latest/administration/plugin-management/#install-a-plugin)
- Grafana CLI: `grafana-cli plugins install grafana-advisor-app`
- [Github releases page](https://github.com/grafana/grafana-advisor-app/releases)

## Usage

Once installed, the app can be found at `http://<your-grafana-url>/a/grafana-advisor-app`.

If no report has been generated yet, click the "Generate report" button to create one.

<img width="500px" src="https://raw.githubusercontent.com/grafana/grafana-advisor-app/main/docs/screenshot-empty.png" />

Once a report has been generated, the app will display a list of checks that require immediate action or investigation. Click on the provided links or read the associated documentation for more information and fix the issues.

Once the issues have been resolved, the report can be regenerated by clicking the "Refresh" button again.

<img width="500px" src="https://raw.githubusercontent.com/grafana/grafana-advisor-app/main/docs/screenshot-success.png" />

## Feedback

If you have any feedback or suggestions, please [open an issue](https://github.com/grafana/grafana-advisor-app/issues).
