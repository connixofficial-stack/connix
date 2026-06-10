const fs = require('fs');
const path = require('path');

const types = [
  { name: 'About', key: 'about', form: 'AboutForm', preview: 'AboutPreview', styleType: 'AboutStyle', configType: 'AboutEditorState', stateField: 'state' },
  { name: 'Benefits', key: 'benefits', form: 'BenefitsForm', preview: 'BenefitsPreview', styleType: 'BenefitsStyle', configType: 'BenefitsEditorState', stateField: 'state' },
  { name: 'CTA', key: 'cta', form: 'CTAForm', preview: 'CTAPreview', styleType: 'CTAStyle', configType: 'CTAConfig', stateField: 'config' },
  { name: 'Faq', key: 'faq', form: 'FaqForm', preview: 'FaqPreview', styleType: 'FaqStyle', configType: 'FaqConfig', stateField: 'faqConfig' },
  { name: 'Countdown', key: 'countdown', form: 'CountdownForm', preview: 'CountdownPreview', styleType: 'CountdownStyle', configType: 'CountdownConfigState', stateField: 'value' },
  { name: 'Services', key: 'services', form: 'ServicesForm', preview: 'ServicesPreview', styleType: 'ServicesStyle', configType: 'ServicesConfig', stateField: 'items' },
  { name: 'Team', key: 'team', form: 'TeamForm', preview: 'TeamPreview', styleType: 'TeamStyle', configType: 'TeamConfig', stateField: 'members' },
  { name: 'Testimonials', key: 'testimonials', form: 'TestimonialsForm', preview: 'TestimonialsPreview', styleType: 'TestimonialsStyle', configType: 'TestimonialsConfig', stateField: 'items' },
  { name: 'Video', key: 'video', form: 'VideoForm', preview: 'VideoPreview', styleType: 'VideoStyle', configType: 'VideoConfig', stateField: 'config' },
  { name: 'VoucherPromotions', key: 'voucher-promotions', form: 'VoucherPromotionsForm', preview: 'VoucherPromotionsPreview', styleType: 'VoucherPromotionsStyle', configType: 'VoucherPromotionsConfigState', stateField: 'config' },
  { name: 'Process', key: 'process', form: 'ProcessForm', preview: 'ProcessPreview', styleType: 'ProcessStyle', configType: 'ProcessConfig', stateField: 'steps' },
  { name: 'Hero', key: 'hero', form: 'HeroForm', preview: 'HeroPreview', styleType: 'HeroStyle', configType: 'HeroConfig', stateField: 'heroSlides' },
  { name: 'Pricing', key: 'pricing', form: 'PricingForm', preview: 'PricingPreview', styleType: 'PricingStyle', configType: 'PricingConfig', stateField: 'config' },
  { name: 'Clients', key: 'clients', form: 'ClientsForm', preview: 'ClientsPreview', styleType: 'ClientsStyle', configType: 'ClientsConfig', stateField: 'items' },
  { name: 'Career', key: 'career', form: 'CareerForm', preview: 'CareerPreview', styleType: 'CareerStyle', configType: 'CareerConfig', stateField: 'jobs' },
  { name: 'Features', key: 'features', form: 'FeaturesForm', preview: 'FeaturesPreview', styleType: 'FeaturesStyle', configType: 'FeaturesConfig', stateField: 'items' },
  { name: 'Contact', key: 'contact', form: 'ContactForm', preview: 'ContactPreview', styleType: 'ContactStyle', configType: 'ContactConfig', stateField: 'config' }
];

let output = `// Auto-generated router for snapshot editors
import React from 'react';
`;

types.forEach(t => {
  output += `import { ${t.form} } from '../../${t.key}/_components/${t.form}';\n`;
  output += `import { ${t.preview} } from '../../${t.key}/_components/${t.preview}';\n`;
});

output += `

export function SnapshotFormRouter({ type, config, onChange, colors, fontStyle }: any) {
  switch (type) {
`;

types.forEach(t => {
  output += `    case '${t.name}':
      return (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,420px] gap-6 mt-6">
          <div><${t.form} ${t.stateField}={config} onChange={onChange} brandColor={colors.primary} /></div>
          <div className="lg:sticky lg:top-6 lg:self-start space-y-4">
            <${t.preview} ${t.stateField}={config} brandColor={colors.primary} secondary={colors.secondary} mode={colors.mode} fontStyle={fontStyle} fontClassName="font-active" />
          </div>
        </div>
      );
`;
});

output += `    default: return <div>Unsupported component type: {type}</div>;
  }
}
`;

fs.writeFileSync(path.join(__dirname, '../app/admin/home-components/snapshots/_components/SnapshotFormRouter.tsx'), output);
console.log('Generated SnapshotFormRouter.tsx');
