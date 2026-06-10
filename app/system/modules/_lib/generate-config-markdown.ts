import type { AdminModule, ModuleLabels, SystemPreset } from '../_types';

export const generateConfigMarkdown = (
  modules: AdminModule[],
  preset: SystemPreset | undefined,
  labels: ModuleLabels
): string => {
  const enabledModules = modules.filter((m) => m.enabled);
  const disabledModules = modules.filter((m) => !m.enabled);
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const markdown = labels.markdown;

  return `# ${labels.moduleConfig}

> ${markdown.generatedAt}: ${now}
> ${markdown.preset}: ${preset?.name ?? labels.custom}

## ${markdown.summary}

- ${markdown.enabledModules}: ${enabledModules.length}
- ${markdown.disabledModules}: ${disabledModules.length}

## ${markdown.enabledModules}

| ${markdown.module} | ${markdown.category} | ${markdown.core} |
|--------|----------|------|
${enabledModules
  .map(
    (m) => `| ${m.key} | ${labels.categories[m.category]} | ${m.isCore ? markdown.yes : markdown.no} |`
  )
  .join('\n')}

## ${markdown.disabledModules}

${disabledModules.length > 0
  ? disabledModules.map((m) => `- ${m.key} (${labels.categories[m.category]})`).join('\n')
  : `_${markdown.none}_`}

## ${markdown.jsonConfig}

\`\`\`json
{
  "preset": "${preset?.key ?? 'custom'}",
  "modules": {
${modules.map((m) => `    "${m.key}": ${m.enabled}`).join(',\n')}
  }
}
\`\`\`
`;
};
