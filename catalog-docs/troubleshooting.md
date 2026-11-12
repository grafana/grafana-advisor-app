---
title: Troubleshooting
description: 'Troubleshoot common Grafana Advisor errors.'
keywords:
  - 'Grafana Advisor'
  - app
  - troubleshooting
sidebar_position: 7
---

This page explains how to fix common issues when you use Grafana Advisor. For an overview of the app, refer to the [Introduction](./index.md).

## Configuration errors

These errors occur on the [configuration page](./configure.md).

### "Error loading check types"

**Symptoms:** The **Available Check Types** list doesn't load and the page shows "Error loading check types".

**Solutions:**

1. Reload the page.
1. Confirm you're signed in with the `Organization administrator` role.
1. Open the browser developer tools and check the console and network requests for the failing Advisor API call.

### "No check types available"

**Symptoms:** The configuration page shows "No check types available".

**Solutions:**

1. Open the Advisor page and click **Refresh**, then reopen the configuration page.
1. Open the browser developer tools and check the console for Advisor API errors.

### "Your current version of Grafana does not support ignoring steps"

**Symptoms:** The step switches on the configuration page are disabled.

**Solutions:** Upgrade Grafana to a version that supports ignoring steps.

## Get more detail about an error

For errors in the app, open the developer tools in your browser and check the console.

## Get additional help

If this page doesn't solve your problem:

- Search the [Grafana community forums](https://community.grafana.com/).
- Open an issue in the [Grafana Advisor repository](https://github.com/grafana/grafana-advisor-app/issues).
- If your Grafana Cloud or Grafana Enterprise plan includes support, contact Grafana Support.

When you report an issue, include:

- The Grafana and plugin versions.
- The error message, with sensitive information removed.
- The steps to reproduce the issue.
- The app page where it happens and the relevant app settings.
