---
title: 'Manage Advisor with the CLI'
description: 'Use the Grafana CLI, gcx, to list Advisor checks and failures, run checks and find plugins to update.'
keywords:
  - 'Grafana Advisor'
  - gcx
  - CLI
sidebar_position: 5
---

You can use `gcx`, the Grafana CLI, to manage Advisor `checks` and `checktypes` as resources. To install and configure it, refer to the [Grafana CLI documentation](https://grafana.com/docs/grafana/latest/ai-tools/grafana-cli/).

## Before you begin

- **Grafana permissions:** The `Admin` role.
- **Tools:** `gcx`, configured for your Grafana instance, and [`jq`](https://jqlang.org/) for the JSON examples.

## Get the list of checks

To get the list of checks, run:

```bash
gcx resources get checks -o wide
```

For a more detailed view of the elements checked and failing, inspect the JSON output:

```bash
gcx resources get checks -o json | jq -r '
  ["TYPE","CHECKED","FAILURES"],
  (
    [.items[] | {
      type: .metadata.labels["advisor.grafana.app/type"],
      ts: .metadata.creationTimestamp,
      count: (.status.report.count // 0),
      failures: ((.status.report.failures // []) | length)
    }]
    | group_by(.type)
    | map(sort_by(.ts) | last)
    | sort_by(.type)
    | .[]
    | [.type, (.count | tostring), (.failures | tostring)]
  )
  | @tsv
' | column -t -s $'\t'
```

## Get the list of check types

To get the list of check types, run:

```bash
gcx resources get checktypes -o wide
```

## Show all failures across every check type

To see all failures in your instance, run:

```bash
gcx resources get checks -o json | jq -r '
  ["SEVERITY","ITEM","RULE","TYPE"],
  (
    [.items[] | {
      type: .metadata.labels["advisor.grafana.app/type"],
      ts: .metadata.creationTimestamp,
      failures: (.status.report.failures // [])
    }]
    | group_by(.type)
    | map(sort_by(.ts) | last)
    | map(select((.failures | length) > 0))
    | .[]
    | .type as $t
    | .failures[]
    | [.severity, .item, .stepID, $t]
  )
  | @tsv
' | column -t -s $'\t'
```

## Run checks for a type

To run the checks for a specific type, create the check resource and push it:

```bash
mkdir -p resources/Check/
echo '{
  "kind":"Check",
  "metadata":{
    "name":"check-manual",
    "labels":{"advisor.grafana.app/type":"<CHECK_TYPE>"},
    "namespace":"<NAMESPACE>"
  },
  "apiVersion":"advisor.grafana.app/v0alpha1",
  "spec":{"data":{}},
  "status":{
    "report":{
      "count":0,
      "failures":[]
    }
  }
}' > resources/Check/check-manual.json
gcx push checks/check-manual
```

Replace the following placeholders:

- _`<CHECK_TYPE>`_: The check type to run, for example `datasource`.
- _`<NAMESPACE>`_: The namespace of your Grafana instance, or `default` for on-premises instances.

Wait for the check to run, then read the results:

```bash
gcx resources get checks/check-manual -o json | jq '.status.report'
```

## Get plugins that need an update

To identify the plugins that need an update, run:

```bash
gcx resources get checks -o json | jq -r '
  ["PLUGIN","SEVERITY","PLUGIN PATH"],
  (
    [.items[] | select(.metadata.labels["advisor.grafana.app/type"] == "plugin")]
    | sort_by(.metadata.creationTimestamp) | last
    | .status.report.failures[]?
    | select(.stepID == "update")
    | [.item, .severity, (.links[0].url // "-")]
  )
  | @tsv
' | column -t -s $'\t'
```

## Find unhealthy data sources

To look for unhealthy data sources, run:

```bash
gcx resources get checks -o json | jq -r '
  ["DATASOURCE","SEVERITY","DATASOURCE PATH"],
  (
    [.items[] | select(.metadata.labels["advisor.grafana.app/type"] == "datasource")]
    | sort_by(.metadata.creationTimestamp) | last
    | .status.report.failures[]?
    | select(.stepID == "health-check")
    | [.item, .severity, (.links[0].url // "-")]
  )
  | @tsv
' | column -t -s $'\t'
```
