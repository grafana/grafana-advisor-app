---
title: Configure
description: 'Choose which Grafana Advisor checks run by enabling or disabling the steps of each check type.'
keywords:
  - 'Grafana Advisor'
  - app
  - configuration
  - checks
sidebar_position: 4
---

This document explains how to choose which checks Grafana Advisor runs.

## Before you begin

Before you configure the app, ensure you have:

- **Grafana permissions:** The `Organization administrator` role. Only organization administrators can configure apps.

## Open the configuration page

<!-- snippet:open-app-config -->

To open the Grafana Advisor configuration page:

1. Click **Administration** > **Plugins and data** > **Plugins** in the left-side menu.
1. Enter `Grafana Advisor` in the search bar.
1. Select **Grafana Advisor**.

<!-- /snippet:open-app-config -->

Then click the **Configuration** tab. You can also click the cogwheel button in the top-right corner of the Advisor page.

## Configure settings

The configuration page has no connection or credential settings. It lists the **Available Check Types** and lets you enable or disable each step of a check type. The available check types cover configuration, installed plugins and data sources, Grafana instance versions and SSO settings.

Each check type is shown as a card named **Check type: `<name>`**, with the following settings:

| Setting         | Description                                                                                                                                                  | Required |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| **Step switch** | Turns one step of the check type on or off. Advisor skips a step when its switch is off, so it no longer appears in the report. Every step is on by default. | No       |

Changes apply when you flip a switch. There's no separate save button.

> [!NOTE]
> If a card shows "Your current version of Grafana does not support ignoring steps", the switches are disabled. Upgrade Grafana to use them.
