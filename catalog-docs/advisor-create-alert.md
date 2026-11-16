---
title: 'Create an alert from Advisor results'
description: 'Create a Grafana alert rule that fires when Grafana Advisor detects failures, using the Advisor HTTP API and the Infinity data source.'
keywords:
  - 'Grafana Advisor'
  - alerting
  - Infinity
sidebar_position: 6
---

Create a Grafana alert rule that monitors Advisor check results and fires when Advisor detects failures.

## Before you begin

Before you create the alert, ensure you have:

- **Grafana permissions:** The `Admin` role, to create a service account and a data source, and permission to create alert rules.
- **Plugins:** The [Infinity data source](https://grafana.com/grafana/plugins/yesoreyeram-infinity-datasource/), version 3.3.0 or later, which supports the JQ parser used in this guide.

## Create a service account and token

Advisor results are available through the Advisor HTTP API. To query the API, create a service account and a token:

1. Click **Administration** > **Users and access** > **Service accounts** in the left-side menu.
1. Click **Add service account**.
1. Enter a name, for example `advisor-alert-service-account`.
1. Set the role to **Admin**, which gives the service account the required permissions.
1. Click **Create**.
1. In the service account details, click **Add service account token**.
1. Enter a token name and set an expiration date.
1. Click **Generate token**.

> [!CAUTION]
> Copy the token value immediately and store it securely. You can't view it again.

## Set up the Infinity data source

The Infinity data source queries the Advisor HTTP API using the service account token.

1. Click **Connections** > **Add new connection**.
1. Search for `Infinity`.
1. If the plugin isn't installed, click **Install** and wait for the installation to finish.
1. On the plugin page, click **Add new data source**.
1. Configure the data source:
   - **Name:** Enter a descriptive name, for example `Advisor API`.
   - **Auth type:** Select **Bearer Token**, then paste the service account token in **Auth details**.
   - **Allowed hosts:** Enter `https://<GRAFANA_HOST>` and click **Add**. Replace _`<GRAFANA_HOST>`_ with the host of your Grafana instance.
1. Click **Save & test** to verify the connection.

## Create the alert rule

1. Click **Alerting** > **Alert rules** in the left-side menu.
1. Click **New alert rule**.
1. Enter a rule name, for example `Advisor failures alert`.

### Configure the query

1. In **Data source**, select the Infinity data source you set up.
1. Configure the query settings:
   - **Type:** JSON
   - **Parser:** JQ
   - **Source:** URL
   - **Format:** Table
   - **Method:** GET
   - **URL:** `https://<GRAFANA_HOST>/apis/advisor.grafana.app/v0alpha1/namespaces/<NAMESPACE>/checks`

Replace the following placeholders in the URL:

- _`<GRAFANA_HOST>`_: The host of your Grafana instance.
- _`<NAMESPACE>`_: The namespace of your Grafana instance. To find it, refer to the [namespace API reference](https://grafana.com/docs/grafana/latest/developer-resources/api-reference/http-api/apis/#namespace-namespace).

For more information about this endpoint, refer to the [Advisor HTTP API](https://grafana.com/docs/grafana/latest/developer-resources/api-reference/http-api/advisor/).

### Configure parsing options

In **Rows/Root**, paste the following JQ expression:

```jq
.items | map({
  type: .metadata.labels["advisor.grafana.app/type"],
  creationTimestamp: .metadata.creationTimestamp,
  failuresCount: (.status.report.failures | length)
}) | group_by(.type) | map(sort_by(.creationTimestamp) | last)
```

This expression returns the most recent result for each check type, with its timestamp and failure count. You can use it to alert when any check type has more than 0 failures.

In **Columns**, add the following columns:

| Selector            | Format |
| ------------------- | ------ |
| `creationTimestamp` | Time   |
| `failuresCount`     | Number |
| `type`              | String |

### Filter by check type

Optionally, alert only on specific check types:

1. Go to the **Computed columns, Filter, Group by** section.
1. Add a **Filter**, for example `type == "license"`. Replace `license` with the check type you want to alert on.

### Set the alert condition

1. In **Alert condition**, select **WHEN Last OF QUERY Is above 0**. The alert fires when any check type has failures.
1. Click **Preview alert rule condition** to view the result of the query.

### Complete the alert configuration

Select your evaluation behavior, for example every 24 hours, and configure the notification settings.

## Save the alert rule

Click **Save** and verify that the alert fires as expected.
