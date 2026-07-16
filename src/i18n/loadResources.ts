import { type ResourceLoader } from '@grafana/i18n';

// loadResources dynamically imports the plugin's own bundled translations for
// the frontend-owned strings (buttons, section headers, tooltips). Backend
// strings — check step titles/descriptions/resolutions and failure-link
// messages — come from a separate /translations endpoint via backendLoader
// in module.tsx.
//
// Grafana 12.1+ can auto-load these via plugin.json's `languages` field, but
// wiring the loader explicitly keeps the plugin compatible with older Grafana
// versions too (see metrics-drilldown's identical pattern).
export const loadResources: ResourceLoader = async (language: string) => {
  const fallbackLanguage = 'en-US';
  const locale = language || fallbackLanguage;

  try {
    return await import(`../locales/${locale}/grafana-advisor-app.json`);
  } catch (error) {
    if (locale !== fallbackLanguage) {
      return await import(`../locales/${fallbackLanguage}/grafana-advisor-app.json`);
    }
    throw error;
  }
};
