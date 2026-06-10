const fs = require('fs');
const path = require('path');

const map = {
  'career': { state: 'jobs', setState: 'setJobs', type: 'JobPosition[]', init: "[createCareerJob({ type: 'Full-time' })]", isReact: false },
  'case-study': { state: 'projects', setState: 'setProjects', type: 'CaseStudyProject[]', init: '[]', isReact: false },
  'category-products': { state: 'sections', setState: 'setSections', type: 'CategoryProductsSection[]', init: '[]', isReact: false },
  'clients': { state: 'items', setState: 'setItems', type: 'ClientEditorItem[]', init: 'toEditorItems(DEFAULT_CLIENTS_CONFIG.items)', isReact: false },
  'faq': { state: 'faqItems', setState: 'setFaqItems', type: 'FaqItem[]', init: 'FALLBACK_FAQ_ITEMS', isReact: false },
  'features': { state: 'featuresItems', setState: 'setFeaturesItems', type: 'FeatureItem[]', init: '[createFeatureItem()]', isReact: false },
  'gallery': { state: 'galleryItems', setState: 'setGalleryItems', type: 'GalleryItem[]', init: 'DEFAULT_GALLERY_ITEMS', isReact: false },
  'homepage-category-hero': { state: 'heroSlides', setState: 'setHeroSlides', type: 'HomepageCategoryHeroSlide[]', init: 'DEFAULT_HOMEPAGE_CATEGORY_HERO_CONFIG.heroSlides', isReact: false },
  'marquee': { state: 'items', setState: 'setItems', type: 'MarqueeItem[]', init: '[]', isReact: false },
  'partners': { state: 'partnersItems', setState: 'setPartnersItems', type: 'PartnerItem[]', init: '[]', isReact: false },
  'pricing': { state: 'pricingPlans', setState: 'setPricingPlans', type: 'PricingEditorPlan[]', init: '[]', isReact: false },
  'process': { state: 'steps', setState: 'setSteps', type: 'ProcessFormStep[]', init: '[]', isReact: false },
  'product-categories': { state: 'productCategoriesItems', setState: 'setProductCategoriesItems', type: 'CategoryConfigItem[]', init: '[]', isReact: false },
  'services': { state: 'servicesItems', setState: 'setServicesItems', type: 'ServiceEditorItem[]', init: 'getDefaultEditorItems', isReact: false },
  'speed-dial': { state: 'actions', setState: 'setActions', type: 'SpeedDialAction[]', init: '[]', isReact: false },
  'stats': { state: 'statsItems', setState: 'setStatsItems', type: 'StatsFormItem[]', init: '[]', isReact: false },
  'team': { state: 'members', setState: 'setMembers', type: 'TeamEditorMember[]', init: '[]', isReact: true },
  'testimonials': { state: 'items', setState: 'setItems', type: 'TestimonialsItem[]', init: '[]', isReact: false },
  'trust-badges': { state: 'galleryItems', setState: 'setGalleryItems', type: 'GalleryItem[]', init: 'DEFAULT_GALLERY_ITEMS', isReact: false },
};

const dir = 'e:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs/app/admin/home-components';

let modifiedCount = 0;

for (const [folder, config] of Object.entries(map)) {
  const filePath = path.join(dir, folder, '[id]', 'edit', 'page.tsx');
  if (!fs.existsSync(filePath)) {
    console.log('Not found:', filePath);
    continue;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  if (!content.includes('useUndoRedo')) {
    // Add import
    const importStatement = `import { useUndoRedo } from '../../../_shared/hooks/useUndoRedo';\n`;
    const lastImportIndex = content.lastIndexOf('import ');
    const endOfLastImport = content.indexOf('\n', lastImportIndex) + 1;
    content = content.slice(0, endOfLastImport) + importStatement + content.slice(endOfLastImport);

    // Replace useState
    const useStateStr = config.isReact 
      ? `const [${config.state}, ${config.setState}] = React.useState<${config.type}>(${config.init});`
      : `const [${config.state}, ${config.setState}] = useState<${config.type}>(${config.init});`;
      
    const useUndoRedoStr = `const {
    state: ${config.state},
    set: ${config.setState},
    undo: undo${config.state},
    redo: redo${config.state},
    canUndo: canUndo${config.state},
    canRedo: canRedo${config.state},
    reset: reset${config.state},
  } = useUndoRedo<${config.type}>(${config.init}, { maxHistory: 15 });`;

    if (content.includes(useStateStr)) {
      content = content.replace(useStateStr, useUndoRedoStr);
      
      // Replace setState in useEffect with reset
      // Find `setX(nextX)` or `setX(x)` inside useEffect.
      // Usually it's `setX(nextX)`
      // Regex to find `setX(` and replace with `resetX(` ONLY inside the `useEffect(() => { ... }, [component` block.
      // A simple replaceAll is risky if there are multiple setX. Let's do a simple regex that replaces the first occurrence of setX(...) inside useEffect
      // Or just replace all `setX(` that look like they are initializing.
      // Wait, let's just do a regex replace for `setX(next` or `setX(` but only if it's not `setX(prev =>`.
      // Actually, since it's just the load data part, we can do:
      content = content.replace(new RegExp(`${config.setState}\\(([^)]+)\\);`), (match, p1) => {
          if (p1.includes('prev')) return match; // skip updater functions
          // Only replace if it looks like the initial data load
          return `reset${config.state}(${p1});`;
      });
      
      // Update HomeComponentStickyFooter
      const footerRegex = /<HomeComponentStickyFooter([\s\S]*?)\/>/;
      const match = content.match(footerRegex);
      if (match) {
        if (!match[1].includes('undoRedo')) {
          const undoRedoProp = `\n        undoRedo={{\n          canUndo: canUndo${config.state},\n          canRedo: canRedo${config.state},\n          onUndo: undo${config.state},\n          onRedo: redo${config.state},\n        }}`;
          content = content.replace(footerRegex, `<HomeComponentStickyFooter$1${undoRedoProp}\n        />`);
        }
      }

      changed = true;
    } else {
      console.log('useState string not found in', folder);
      // Let's just find `const [${config.state}, ${config.setState}] = `
      const fuzzyRegex = new RegExp(`const \\[${config.state},\\s*${config.setState}\\]\\s*=\\s*(React\\.)?useState(?:<[^>]+>)?\\(([^)]*)\\);`);
      const fuzzyMatch = content.match(fuzzyRegex);
      if (fuzzyMatch) {
         console.log('Fuzzy matched:', fuzzyMatch[0]);
         const actualInit = fuzzyMatch[2] || config.init;
         const useUndoRedoStrFuzzy = `const {
    state: ${config.state},
    set: ${config.setState},
    undo: undo${config.state},
    redo: redo${config.state},
    canUndo: canUndo${config.state},
    canRedo: canRedo${config.state},
    reset: reset${config.state},
  } = useUndoRedo<${config.type}>(${actualInit}, { maxHistory: 15 });`;
         content = content.replace(fuzzyMatch[0], useUndoRedoStrFuzzy);
         
         content = content.replace(new RegExp(`${config.setState}\\(([^)]+)\\);`), (match, p1) => {
            if (p1.includes('prev')) return match;
            return `reset${config.state}(${p1});`;
         });
         
         const footerRegex = /<HomeComponentStickyFooter([\s\S]*?)\/>/;
         const matchFooter = content.match(footerRegex);
         if (matchFooter && !matchFooter[1].includes('undoRedo')) {
            const undoRedoProp = `\n        undoRedo={{\n          canUndo: canUndo${config.state},\n          canRedo: canRedo${config.state},\n          onUndo: undo${config.state},\n          onRedo: redo${config.state},\n        }}`;
            content = content.replace(footerRegex, `<HomeComponentStickyFooter$1${undoRedoProp}\n        />`);
         }
         changed = true;
      }
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    modifiedCount++;
    console.log('Updated ' + folder);
  }
}
console.log('Total files modified: ' + modifiedCount);
