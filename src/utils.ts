import { t } from '@grafana/i18n';
import { CheckStatus } from 'types';

export function formatDate(date: Date): string {
  const formatter = new Intl.DateTimeFormat('hu-HU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return formatter.format(date).replace(',', ' -');
}

export const isOld = (check: CheckStatus) => {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  return tenMinutesAgo > check.lastUpdate;
};

// Translation helpers for backend strings.
// The backend returns English text; the frontend translates it using known IDs as keys.
// All t() calls use static string literals so i18n-extract can discover them.

interface StepTranslations {
  title: string;
  description: string;
  resolution: string;
}

function getStepTranslations(): Record<string, StepTranslations> {
  return {
    deprecation: {
      title: t('backend.step.deprecation.title', 'Deprecation check'),
      description: t('backend.step.deprecation.description', 'Check if any installed plugins are deprecated.'),
      resolution: t(
        'backend.step.deprecation.resolution',
        "Check the <a href='https://grafana.com/legal/plugin-deprecation/#a-plugin-i-use-is-deprecated-what-should-i-do' target=_blank>documentation</a> for recommended steps or delete the plugin."
      ),
    },
    'health-check': {
      title: t('backend.step.health-check.title', 'Health check'),
      description: t('backend.step.health-check.description', 'Checks if a data source is healthy.'),
      resolution: t(
        'backend.step.health-check.resolution',
        'Go to the data source configuration page and address the issues reported.'
      ),
    },
    'missing-plugin': {
      title: t('backend.step.missing-plugin.title', 'Missing plugin check'),
      description: t(
        'backend.step.missing-plugin.description',
        'Checks if the plugin associated with the data source is installed and available.'
      ),
      resolution: t('backend.step.missing-plugin.resolution', 'Delete the datasource or install the plugin.'),
    },
    out_of_support_version: {
      title: t('backend.step.out_of_support_version.title', 'Grafana version check'),
      description: t(
        'backend.step.out_of_support_version.description',
        'Check if the current Grafana version is out of support.'
      ),
      resolution: t(
        'backend.step.out_of_support_version.resolution',
        "Out of support versions will not receive security updates or bug fixes. Upgrade to a more recent version. <a href='https://grafana.com/docs/grafana/latest/upgrade-guide/when-to-upgrade/#what-to-know-about-version-support' target='_blank'>Learn more about version support</a>."
      ),
    },
    pinned_version: {
      title: t('backend.step.pinned_version.title', 'Grafana Cloud version check'),
      description: t('backend.step.pinned_version.description', 'Checks if the Grafana version is pinned.'),
      resolution: t(
        'backend.step.pinned_version.resolution',
        "You may miss out on security updates and bug fixes if you use a pinned version. Contact your Grafana administrator and open a <a href='https://grafana.com/profile/org#support' target=_blank>support ticket</a> to help you get unpinned."
      ),
    },
    'prom-dep-auth': {
      title: t('backend.step.prom-dep-auth.title', 'Prometheus deprecated authentication check'),
      description: t(
        'backend.step.prom-dep-auth.description',
        'Checks if Prometheus data sources are using deprecated authentication methods (Azure auth and SigV4)'
      ),
      resolution: t(
        'backend.step.prom-dep-auth.resolution',
        "Make sure that 'Azure Monitor Managed Service for Prometheus' and/or 'Amazon Managed Service for Prometheus' plugins are installed. If the data source is provisioned, edit data source type in the provisioning file to use 'azureprometheus' or 'amazonprometheus'."
      ),
    },
    security_config: {
      title: t('backend.step.security_config.title', 'Security config check'),
      description: t(
        'backend.step.security_config.description',
        'Checks if the Grafana security configuration is set correctly.'
      ),
      resolution: t('backend.step.security_config.resolution', 'Follow the documentation for each element.'),
    },
    'sso-list-format-validation': {
      title: t('backend.step.sso-list-format-validation.title', 'SSO List Setting Format Validation'),
      description: t(
        'backend.step.sso-list-format-validation.description',
        'Checks if list configs in SSO settings are in a valid list format (space-separated, comma-separated or JSON array).'
      ),
      resolution: t(
        'backend.step.sso-list-format-validation.resolution',
        'Configure the relevant SSO setting using a valid format, like space-separated ("opt1 opt2"), comma-separated values ("opt1, opt2") or JSON array format (["opt1", "opt2"]).'
      ),
    },
    twinmaker_sceneviewer: {
      title: t('backend.step.twinmaker_sceneviewer.title', 'TwinMaker SceneViewer deprecation check'),
      description: t(
        'backend.step.twinmaker_sceneviewer.description',
        'Warns when the Grafana IoT TwinMaker App is installed that the SceneViewer panel will stop working in Grafana 13.1.'
      ),
      resolution: t(
        'backend.step.twinmaker_sceneviewer.resolution',
        'The SceneViewer panel in the TwinMaker App will stop working in Grafana 13.1. Ignore or silence this warning if you are not using the SceneViewer panel.'
      ),
    },
    'uid-validation': {
      title: t('backend.step.uid-validation.title', 'UID validation'),
      description: t('backend.step.uid-validation.description', 'Checks if the UID of a data source is valid.'),
      resolution: t(
        'backend.step.uid-validation.resolution',
        "Check the <a href='https://grafana.com/docs/grafana/latest/upgrade-guide/upgrade-v11.2/#grafana-data-source-uid-format-enforcement' target=_blank>documentation</a> for more information or delete the data source and create a new one."
      ),
    },
    unsigned: {
      title: t('backend.step.unsigned.title', 'Plugin signature check'),
      description: t(
        'backend.step.unsigned.description',
        "Checks if the plugin's signature is missing or invalid."
      ),
      resolution: t(
        'backend.step.unsigned.resolution',
        "For security, we recommend only installing plugins from the catalog. Review the plugin's status and verify your allowlist if appropriate."
      ),
    },
    update: {
      title: t('backend.step.update.title', 'Update check'),
      description: t(
        'backend.step.update.description',
        'Checks if an installed plugins has a newer version available.'
      ),
      resolution: t(
        'backend.step.update.resolution',
        'There are newer versions available for the plugins listed below. We recommend going to the plugin admin page and upgrading to the latest version.'
      ),
    },
  };
}

function getCheckTypeNames(): Record<string, string> {
  return {
    config: t('backend.check-type.config.name', 'config setting'),
    datasource: t('backend.check-type.datasource.name', 'data source'),
    instance: t('backend.check-type.instance.name', 'instance attribute'),
    plugin: t('backend.check-type.plugin.name', 'plugin'),
    ssosetting: t('backend.check-type.ssosetting.name', 'SSO setting'),
  };
}

function getLinkMessages(): Record<string, string> {
  return {
    'avoid-default-value': t('backend.link.avoid-default-value', 'Avoid default value'),
    'change-provisioning-file': t('backend.link.change-provisioning-file', 'Change provisioning file'),
    'check-the-documentation': t('backend.link.check-the-documentation', 'Check the documentation'),
    'configure-provider': t('backend.link.configure-provider', 'Configure provider'),
    'delete-data-source': t('backend.link.delete-data-source', 'Delete data source'),
    'fix-me': t('backend.link.fix-me', 'Fix me'),
    upgrade: t('backend.link.upgrade', 'Upgrade'),
    'view-azure-auth-docs': t('backend.link.view-azure-auth-docs', 'View Azure auth docs'),
    'view-plugin': t('backend.link.view-plugin', 'View plugin'),
    'view-sigv4-docs': t('backend.link.view-sigv4-docs', 'View SigV4 docs'),
  };
}

export function translateStepTitle(stepID: string, fallback: string): string {
  return getStepTranslations()[stepID]?.title ?? fallback;
}

export function translateStepDescription(stepID: string, fallback: string): string {
  return getStepTranslations()[stepID]?.description ?? fallback;
}

export function translateStepResolution(stepID: string, fallback: string): string {
  return getStepTranslations()[stepID]?.resolution ?? fallback;
}

export function translateCheckTypeName(checkTypeID: string, fallback: string): string {
  return getCheckTypeNames()[checkTypeID] ?? fallback;
}

export function translateLinkMessage(message: string): string {
  const key = message.toLowerCase().replace(/\s+/g, '-');
  return getLinkMessages()[key] ?? message;
}
