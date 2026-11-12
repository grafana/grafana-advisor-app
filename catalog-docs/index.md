---
title: Introduction
description: 'Get started with Grafana Advisor, find what to read next and learn which Grafana versions it needs.'
keywords:
  - 'Grafana Advisor'
  - app
  - health checks
sidebar_position: 1
---

Grafana Advisor runs regular health checks on your Grafana instance and recommends how to fix what it finds. Start with [Use Grafana Advisor](./grafana-advisor.md) to generate and read your first report, then use the other pages to tune which checks run and to automate Advisor with the CLI or alerts.

## Before you begin

Before you use the app, ensure you have:

- **Grafana permissions:** The `Organization administrator` role. Only organization administrators can configure apps, and the Advisor page requires the `Admin` role.
- **Grafana version:** Grafana 13.2 or later.

Grafana Advisor is enabled automatically when it's installed, so you don't need to enable it.

## Common tasks

- [Generate and read an Advisor report](./grafana-advisor.md)
- [Choose which checks Advisor runs](./configure.md)
- [Manage Advisor from the command line](./advisor-cli.md)
- [Get alerted when Advisor finds failures](./advisor-create-alert.md)
- [Fix errors in the app](./troubleshooting.md)
