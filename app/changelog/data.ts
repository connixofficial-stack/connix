export interface ChangelogItem {
  date: string;
  phase: string;
  title: string;
  categories: {
    features: string[];
    improvements: string[];
    fixes: string[];
  };
}

export const changelogData: ChangelogItem[] = [
  {
    "date": "2026-06-02",
    "phase": "Workspace Hygiene",
    "title": "Spec tao trang changelog vercel style",
    "categories": {
      "features": [
        "feat(changelog): implement clean white flat changelog page under independent route",
        "[Spec] Spec tao trang changelog vercel style"
      ],
      "improvements": [
        "chore: clean up workspace trash files and enforce hygiene rules in AGENTS.md"
      ],
      "fixes": []
    }
  },
  {
    "date": "2026-06-01",
    "phase": "Workspace Hygiene",
    "title": "Sync and upgrade to latest Viet Admin core",
    "categories": {
      "features": [],
      "improvements": [
        "chore: sync and upgrade to latest Viet Admin core",
        "chore(homepageSnapshots): add idempotent snapshot payload migration mutation with type casts"
      ],
      "fixes": []
    }
  },
  {
    "date": "2026-05-31",
    "phase": "Technical Debt & Lifecycles",
    "title": "Add product images to order emails spec",
    "categories": {
      "features": [
        "feat(system): add bulk sync action for modules from definitions"
      ],
      "improvements": [
        "chore: sync and upgrade to latest Viet Admin core",
        "[Spec] Add product images to order emails spec",
        "[Spec] Allow deleting sent notifications spec",
        "[Spec] Allow viewing sent notifications spec",
        "[Spec] B sung spec route taxonomy product detail v product type 404",
        "[Spec] Spec move product type above category filter",
        "[Spec] Spec order create page refactor",
        "[Spec] Spec smooth range slider migration via radix",
        "[Spec] Spec x l technical debt design debt ux debt media home components"
      ],
      "fixes": []
    }
  },
  {
    "date": "2026-05-30",
    "phase": "Technical Debt & Lifecycles",
    "title": "Convex resend emails cho order flow v ng b a ch kh ch h ng spec",
    "categories": {
      "features": [],
      "improvements": [
        "[Spec] Convex resend emails cho order flow v ng b a ch kh ch h ng spec",
        "[Spec] Convex resend emails cho order flow v ng b a ch kh ch h ng",
        "[Spec] Guest checkout claim account flow b ng email ho c s i n tho i",
        "[Spec] Order email notifications advanced settings",
        "[Spec] Qa c i thi n tab c u h nh c a h ng trong admin settings"
      ],
      "fixes": [
        "[Spec] Fix homepage add to cart event propagation",
        "[Spec] Fix homepage add to cart is outofstock disabled",
        "[Spec] Fix homepage add to cart variants stock guard"
      ]
    }
  },
  {
    "date": "2026-05-29",
    "phase": "Technical Debt & Lifecycles",
    "title": "Add recent searches to client header",
    "categories": {
      "features": [],
      "improvements": [
        "[Spec] Add recent searches to client header",
        "[Spec] Add recent searches to global search",
        "[Spec] Loai bo tab tat ca product grid",
        "[Spec] Nang cap admin menus builder va quick url picker",
        "[Spec] Spec add cart buttons to bento magazine showcase winegrid",
        "[Spec] Spec add shop config to admin advanced settings",
        "[Spec] Spec admin products advanced fuzzy exact search",
        "[Spec] Spec category combobox search",
        "[Spec] Spec header mobile search ux",
        "[Spec] Spec home components cart buttons layout",
        "[Spec] Spec search count total ux enhancement",
        "[Spec] Spec search dropdown ux enhancement",
        "[Spec] Spec search filter experience",
        "[Spec] Spec sua loi hien thi san pham danh muc va them 4 nut sinh nhanh category products"
      ],
      "fixes": [
        "[Spec] Fix count category and combobox ui",
        "[Spec] Fix empty products after import due to missing categories",
        "[Spec] Fix spacing ti le khung hinh slider fade hero mobile",
        "[Spec] Fix spacing va lo trong services layout 6 mobile",
        "[Spec] Spec fix category products preview buttons",
        "[Spec] Spec fix lookbook banner image hidden site",
        "[Spec] Spec fix manual product list zero price",
        "[Spec] Spec fix mat anh khi sinh nhanh product categories",
        "[Spec] Spec fix out of stock variant display",
        "[Spec] Spec fix preview buttons device scaling",
        "[Spec] Spec remove category products preview debug banner",
        "[Spec] Spec sapo import dynamic attribute names fix",
        "[Spec] Spec sapo import variant options fix"
      ]
    }
  },
  {
    "date": "2026-05-28",
    "phase": "Technical Debt & Lifecycles",
    "title": "Proposal menu upgrade from ktec",
    "categories": {
      "features": [
        "feat(menu/faq): upgrade menu layout dynamic overflow and support faq sorting based on ktec",
        "feat: sync and upgrade codebase with system_thienkim improvements"
      ],
      "improvements": [
        "[Spec] Proposal menu upgrade from ktec"
      ],
      "fixes": []
    }
  },
  {
    "date": "2026-05-27",
    "phase": "Technical Debt & Lifecycles",
    "title": "Premium attributes mobile padding and click full",
    "categories": {
      "features": [
        "feat(core): upgrade unified information architecture, file lifecycle safety, and pre-commit harness from system_thienkim"
      ],
      "improvements": [
        "chore: sync and upgrade to latest Viet Admin core",
        "[Spec] Premium attributes mobile padding and click full",
        "[Spec] Scale premium attributes mobile 3 items",
        "[Spec] Spec attributes nav and visibility",
        "[Spec] Spec make centered advertisement popup identical to design",
        "[Spec] Spec nang cap saas tu system thienkim v2",
        "[Spec] Spec premium advertisement popup style",
        "[Spec] Spec premium layout filter attributes embla",
        "[Spec] Tich hop pre commit harness husky lint staged",
        "[Spec] Toi uu hoa va rut gon agents md voi harness engine"
      ],
      "fixes": [
        "[Spec] Fix inconsistent badge max visible logos",
        "[Spec] Fix premium attributes arrows visibility",
        "[Spec] Fix premium attributes carousel",
        "[Spec] Nang fls skill va fix media cleanup risk",
        "[Spec] Spec fix close button and add 10 background modes",
        "[Spec] Spec fix partners and gallery orphaned images after cleanup",
        "[Spec] Spec fix popup button click to close",
        "[Spec] Spec fix popup not showing on site load",
        "[Spec] Spec fix premium advertisement position and size"
      ]
    }
  },
  {
    "date": "2026-05-26",
    "phase": "Technical Debt & Lifecycles",
    "title": "Spec smart ai new attribute terms",
    "categories": {
      "features": [],
      "improvements": [
        "[Spec] Spec smart ai new attribute terms"
      ],
      "fixes": [
        "[Spec] Debug ai import attributes root cause",
        "[Spec] Fix hydration mismatch home page client",
        "[Spec] Fix sku generation trigger",
        "[Spec] Spec fix attribute range slider and empty filters",
        "[Spec] Spec fix attribute range slider step and interaction",
        "[Spec] Spec fix product detail attribute visibility",
        "[Spec] Spec fix product taxonomy routing and price range filtering"
      ]
    }
  },
  {
    "date": "2026-05-25",
    "phase": "Technical Debt & Lifecycles",
    "title": "Dong bo social links theo system settings",
    "categories": {
      "features": [],
      "improvements": [
        "Remove productImageFrames module and associated functionality",
        "chore: sync and upgrade to latest Viet Admin core",
        "[Spec] Dong bo social links theo system settings",
        "[Spec] Route attribute group only filter spec",
        "[Spec] Spec redesign combo block flat",
        "[Spec] Spec sync preview description layout"
      ],
      "fixes": [
        "[Spec] Route attribute group seo catch all fix",
        "[Spec] Spec fix combo gradient disappearance",
        "[Spec] Spec fix hero save button double click",
        "[Spec] Spec fix save enable product watermark",
        "[Spec] Walkthrough fix save enable product watermark"
      ]
    }
  },
  {
    "date": "2026-05-24",
    "phase": "Technical Debt & Lifecycles",
    "title": "Audit refactor analytics clear performance",
    "categories": {
      "features": [],
      "improvements": [
        "[Spec] Audit refactor analytics clear performance",
        "[Spec] Refactor product frames to ar overlay",
        "[Spec] Spec optimize combo gradient and animation",
        "[Spec] Spec product category rich content",
        "[Spec] Spec product detail combo animate and social buttons",
        "[Spec] Spec product detail description gallery embla",
        "[Spec] Spec products combo offers",
        "[Spec] Spec redesign combo block",
        "[Spec] Spec redesign combo form ui",
        "[Spec] Spec refactor product supplemental content advanced tab",
        "[Spec] Spec synchronized product image overlays"
      ],
      "fixes": [
        "[Spec] Spec fix minimal layout product detail thumbnails"
      ]
    }
  },
  {
    "date": "2026-05-23",
    "phase": "Technical Debt & Lifecycles",
    "title": "Audit refactor product frames simple overlay",
    "categories": {
      "features": [],
      "improvements": [
        "[Spec] Audit refactor product frames simple overlay",
        "[Spec] Spec product watermark mvp"
      ],
      "fixes": []
    }
  },
  {
    "date": "2026-05-22",
    "phase": "Technical Debt & Lifecycles",
    "title": "Apply useUnsavedGuard and useUndoRedo across 33 editors",
    "categories": {
      "features": [
        "feat(admin/home-components): apply useUnsavedGuard and useUndoRedo across 33 editors",
        "feat(hero-editor): apply useUndoRedo to heroSlides + UndoRedoToolbar",
        "feat(home-components): add unsaved guard, undo/redo hook, duplicate, search/filter",
        "feat(settings): add admin header layout controls",
        "feat(settings): expose header menu controls"
      ],
      "improvements": [
        "chore: sync and upgrade from ktec",
        "chore: remove unused useUndoRedo destructuring variables",
        "refactor(snapshots): reuse phase five component editors",
        "refactor(snapshots): reuse phase four component editors",
        "refactor(snapshots): reuse phase three component editors",
        "refactor(snapshots): reuse phase two component editors",
        "refactor(snapshots): reuse phase one component editors",
        "refactor(snapshots): centralize component save adapter"
      ],
      "fixes": [
        "fix: use ImageEditorDialog for ImageUpload cropping to match MultiImageUploader",
        "fix(snapshots): fix TrustBadges missing onSnapshotSave branch and Popup missing snapshotComponent guard in redirect",
        "fix(hero): reuse editor for snapshot edits",
        "[Spec] Spec fix hero content loss on layout change"
      ]
    }
  },
  {
    "date": "2026-05-21",
    "phase": "Technical Debt & Lifecycles",
    "title": "Feat toggle all sections hero form",
    "categories": {
      "features": [
        "feat(hero): add cloudinary video helper",
        "feat(hero): support embedded video links",
        "feat(video): use shared display settings",
        "feat(trust-badges): use shared display settings",
        "feat(career): use shared display settings",
        "feat(team): use shared display settings",
        "feat(countdown): use shared display settings",
        "feat(gallery): use shared display settings",
        "feat(voucher-promotions): use shared display settings",
        "feat(clients): use shared display settings",
        "feat(pricing): use shared display settings",
        "feat(case-study): use shared display settings",
        "feat(features): use shared display settings",
        "feat(process): use shared display settings",
        "feat(benefits): use shared display settings",
        "feat(marquee): use shared display settings",
        "feat(services): use shared display settings",
        "feat(product-grid): use shared display settings",
        "feat(footer): use shared display settings",
        "feat(popup): use shared display settings",
        "feat(faq): use shared display settings",
        "feat(about): use shared display settings",
        "feat(contact): use shared display settings",
        "feat(cta): use shared display settings",
        "feat(product-categories): use shared display settings",
        "feat(testimonials): use shared display settings",
        "feat(blog): use shared display settings",
        "feat(product-list): use shared display settings",
        "feat(stats): use shared display settings",
        "feat(homepage-category-hero): use shared display settings",
        "feat(hero): use shared display settings",
        "feat(home-components): fix timing mismatch on create pages, restore toggle all on sticky footer and extend to all forms",
        "feat(home-components): integrate Toggle All for Benefits, Blog, Career, CaseStudy, and CategoryProducts forms",
        "feat: refactor 5 home component forms to integrate toggle all feature",
        "feat(home-components): integrate Toggle All for Footer, HomepageCategoryHero, Partners, Popup, and ProductCategories forms",
        "feat(admin): fix logical bug and position toggle all button to sticky footer",
        "Add career display options",
        "Add video aspect display controls",
        "Add team layout six accent",
        "Add team layout eight",
        "Add voucher image ticket layout",
        "Add pricing construction layout",
        "Add pricing tabbed layout"
      ],
      "improvements": [
        "refactor(countdown): simplify display settings order",
        "refactor(home-components): remove redundant Toggle All from single-section forms",
        "refactor: integrate toggle all synchronization feature into 5 home component forms",
        "refactor(admin): abstract toggle-all sections logic into shared hook & component",
        "Avoid media scans on component updates",
        "Query requested settings by key",
        "Store homepage snapshot summaries",
        "Reduce page view analytics bandwidth",
        "Collapse career edit sections by default",
        "Align career edit form layout",
        "Label career create header section",
        "Align career create form layout",
        "Redesign career component create flow",
        "Polish video form fields",
        "Redesign video component create flow",
        "Hide inactive team layout navigation",
        "Tone down team layout six accent",
        "Restore primary team hover accents",
        "Use secondary team hover accents",
        "Refine team layout hover accents",
        "Respect team construction columns",
        "Compact team construction cards",
        "Align team construction layout",
        "Redesign team create experience",
        "Equalize voucher carousel card heights",
        "Respect voucher image ticket columns",
        "Clarify voucher CTA toggle",
        "Hide duplicate voucher title input",
        "Refine voucher promotions display controls",
        "Clean pricing form warnings and borders",
        "Polish pricing display controls",
        "[Spec] Feat toggle all sections hero form",
        "[Spec] Spec migrate all home components to shared toggle all",
        "[Spec] Spec migrate remaining home components to shared toggle all",
        "[Spec] Spec refactor toggle all forms batch 2",
        "[Spec] Spec shared toggle all sections home components"
      ],
      "fixes": [
        "fix(home-components): clear oxlint warnings",
        "fix(hero): clarify external video hosting",
        "fix(hero): remove youtube startup mask delay",
        "fix(hero): extend youtube startup mask",
        "fix(hero): mask youtube startup chrome",
        "fix(hero): hide youtube embed controls",
        "fix(partners): compact display settings layout",
        "fix(home-components): keep header toggles synced",
        "fix(home-components): unify section toggles",
        "fix(stats): integrate useFormSectionsState + Toggle All button into StatsForm",
        "fix(admin): keep import AI button visible in sticky footer when sections collapsed",
        "Fix DB bandwidth: split snapshot payload table + clamp backfill batch + DB-side filter cleanup",
        "Fix Convex DB bandwidth leaks: countUniqueSessions upper bound + buildSystemStyle index queries + category loaders take() cap",
        "Fix spacing prop type in ServicesPreview component",
        "Fix oxlint unused warnings",
        "Refactor HeaderConfigSection to remove spacing and onSpacingChange props; update GalleryForm to handle crop aspect ratios; clean up color utility functions; add script to fix spacing issues across multiple components.",
        "Fix voucher image ticket responsiveness"
      ]
    }
  },
  {
    "date": "2026-05-20",
    "phase": "Technical Debt & Lifecycles",
    "title": "Add benefits layout line shadow",
    "categories": {
      "features": [
        "Add benefits layout line shadow",
        "add product list desktop columns"
      ],
      "improvements": [
        "Hide inactive clients carousel controls",
        "Simplify clients home component form",
        "Enhance clients home component controls",
        "Remove gallery remaining count badges",
        "Tighten gallery header spacing",
        "style(gallery): remove all decorative borders and accent bars from 6 layouts",
        "Tighten services layout eight text",
        "Respect services layout eight media alignment",
        "Constrain case study header width",
        "Reduce services layout eight icon size",
        "Tune services builder layout typography",
        "Refine process color balance",
        "Refine services layout eight controls",
        "Standardize process home component",
        "Refine case study demo images",
        "Refine services layout eight",
        "Standardize services home component",
        "Align case study form controls with stats",
        "Remove empty benefits status card",
        "Refine benefits spacing and columns",
        "refine features display layout",
        "Align benefits form sections"
      ],
      "fixes": [
        "Fix pricing header spacing parity",
        "Fix gallery lightbox scroll restore",
        "Fix gallery preview site parity",
        "Fix services layout eight alignment",
        "Fix case study header and featured layout"
      ]
    }
  },
  {
    "date": "2026-05-19",
    "phase": "Technical Debt & Lifecycles",
    "title": "Add features demo images",
    "categories": {
      "features": [
        "add features demo images",
        "add features display controls",
        "feat: add convex-quickstart skill and update integration documentation",
        "Add padded auto crop option",
        "feat: implement ServiceList section with dynamic configuration and data fetching support",
        "Add trust badges demo images",
        "Add trust badges corner radius control",
        "feat: load speed dial actions from settings",
        "feat: add smart menu builder",
        "feat: add smart logo crop",
        "Add more testimonials lucide icons",
        "Add more stats lucide icons",
        "Add Builder carousel testimonials layout"
      ],
      "improvements": [
        "make features carousel default",
        "Align benefits header controls with stats",
        "improve features text wrapping",
        "refine features carousel media",
        "align features color tokens",
        "Polish benefits visual options",
        "Refine benefits display form",
        "Normalize category products view labels",
        "Restore wine grid desktop layout",
        "Refine category products responsive settings",
        "Refine category products wine grid",
        "Use tokens for wine grid colors",
        "Refine partners colors and wine grid",
        "Align category products display settings",
        "Compact product grid category tabs",
        "Refine product grid display settings",
        "Hide partners border control on create",
        "Expand tabbed product grid background",
        "Respect product grid headers",
        "Refine product grid category tabs",
        "Use white product grid tabs",
        "Adapt product grid tab contrast",
        "Align product grid tabbed preview",
        "Align product grid storefront preview",
        "Rename product tab component label",
        "Scale trust badge stack images",
        "Equalize compact trust badge cards",
        "Remove trust badges stack dead space",
        "Compact trust badges stack summary",
        "Use Embla for trust badge card layouts",
        "Polish trust badges card layouts",
        "Refine trust badges visible limits",
        "Use PNG certificate demos",
        "Optimize trust badges for A4 certificates",
        "Refine trust badges stack editing",
        "Share trust badges section core",
        "Refine trust badges form parity",
        "Share trust badges render config",
        "Neutralize trust badges accent colors",
        "Use Embla for trust badges carousel",
        "Refine trust badges display spacing",
        "Improve trust badges credibility layouts",
        "Enable trust badges image crop",
        "Revert \"Add more stats lucide icons\""
      ],
      "fixes": [
        "fix service list showcase border",
        "fix service list header rendering",
        "fix service list header defaults",
        "fix service list data source spacing",
        "fix service list tokens and wrapping",
        "fix features header spacing parity",
        "Fix benefits display parity",
        "fix service list form parity",
        "Fix product grid sticky save state",
        "Fix trust badges spacing config",
        "fix: standardize marquee display settings",
        "fix: show marquee badge text",
        "fix: stabilize marquee header parity",
        "fix: use primary color for speed dial layout seven",
        "fix: align speed dial display tokens",
        "fix: standardize footer display settings",
        "fix: simplify smart menu builder wording",
        "fix: improve contact site responsiveness",
        "fix: polish contact color and wrapping",
        "fix: standardize contact display settings",
        "fix: stabilize about preview breakpoints",
        "fix: add about corner radius setting",
        "fix: move about spacing control",
        "fix: enable auto crop across image editor",
        "fix: make logo auto crop selectable",
        "fix: expose smart logo crop action",
        "fix: polish faq grid mobile spacing",
        "fix: widen faq grid responsive layout",
        "fix: standardize faq home component form",
        "fix: default popup CTA links to hash",
        "fix: improve popup mobile preview layouts",
        "fix: standardize popup home component form",
        "fix: resolve oxlint warnings",
        "fix: keep builder slide text readable",
        "fix: align builder slide testimonial columns",
        "fix: align builder testimonials preview columns",
        "fix: align overlap testimonials columns",
        "fix: prevent icon picker clipping",
        "fix: correct blog embla desktop sizing"
      ]
    }
  },
  {
    "date": "2026-05-18",
    "phase": "Technical Debt & Lifecycles",
    "title": "Chu n h a faq home component theo stats pattern",
    "categories": {
      "features": [
        "Add Testimonials display controls",
        "Add Builder testimonials layout",
        "feat: add shared ProductList component architecture and supporting UI modules for home page customization",
        "feat: add hero demo image action",
        "feat: add conquest hero layout",
        "feat: add product category image strip layout",
        "feat: add advanced logo background removal",
        "feat: add media clipboard upload",
        "feat: add stats builder overlay layout",
        "feat: add full category hero AI import",
        "feat: simplify category hero form UX",
        "feat: align category hero slider controls",
        "feat: add category hero AI import",
        "feat: apply file lifecycle service to admin media",
        "feat: apply FLS draft tracking to home uploads",
        "feat: add file lifecycle service skill",
        "feat: add draft file lifecycle cleanup",
        "feat: add offline dino overlay",
        "feat: add shared file reference service",
        "feat: add homepage quick create toggles",
        "feat: add media orphan recheck",
        "feat: add media storage recount action"
      ],
      "improvements": [
        "Set Testimonials image crop ratios",
        "Enforce testimonials column rules",
        "Refine Builder testimonials layout",
        "Revert \"fix: balance stats circle mobile items\"",
        "Reapply \"fix: move home AI imports to sticky footer\"",
        "Revert \"fix: isolate home component preview viewport\"",
        "Revert \"fix: move home AI imports to sticky footer\"",
        "docs: add system design guardrails",
        "[Spec] Chu n h a faq home component theo stats pattern",
        "[Spec] Chu n h a footer home component theo rule ch n",
        "[Spec] Chu n h a popup form font color spacing theo stats kh ng th m section header"
      ],
      "fixes": [
        "Fix Overlap testimonials desktop preview",
        "fix: refine CTA display controls",
        "fix: add blog embla carousel controls",
        "fix: refine blog layout controls",
        "fix: make CTA content collapsible",
        "fix: align CTA display settings form",
        "fix: align blog home component settings",
        "fix: use white lookbook hover base",
        "fix: enable mobile lookbook reveal",
        "fix: brighten lookbook hover foreground",
        "fix: refine lookbook hover and columns",
        "fix: align partners image actions",
        "fix: stabilize lookbook product cards",
        "fix: respect lookbook product list settings",
        "fix: match ega coffee lookbook animation",
        "fix: match lookbook banner card markup",
        "fix: align product list lookbook layout",
        "fix: separate product list display config",
        "fix: remove partners helper text",
        "fix: default header section label",
        "fix: rename stats header section",
        "fix: align product list edit form",
        "fix: smooth conquest hero carousel",
        "fix: refine conquest hero colors",
        "fix: add product image fallbacks",
        "fix: show product list display spacing",
        "fix: promote product category image strip layout",
        "fix: unify home component section toggles",
        "fix: add spacing controls to remaining edit pages",
        "fix: standardize home component display spacing",
        "fix: refine product category compact grid",
        "fix: compact product category card CTA",
        "fix: refine product category mobile layouts",
        "fix: align product categories display settings",
        "fix: align product list form toggles",
        "fix: compact product category carousel controls",
        "fix: align stats display settings",
        "fix: hide product category dots on mobile",
        "fix: unify home image crop actions",
        "fix: group product category dots by page",
        "fix: group product category preview dots",
        "fix: add product category crop ratios",
        "fix: align category hero display settings",
        "fix: refine product categories mobile cards",
        "fix: improve product categories mobile preview",
        "fix: align hero display settings",
        "fix: align product category toggles",
        "fix: tighten partners marquee spacing",
        "fix: remove duplicate partners display setting",
        "fix: split partners form sections",
        "fix: add partners logo sizing",
        "fix: add partners logo editor",
        "fix: refine partners layouts",
        "fix: align partners section toggles",
        "fix: center stats circle left groups",
        "fix: align stats circle left layout",
        "fix: balance stats circle mobile items",
        "fix: tighten stats circle mobile layout",
        "fix: tighten stats overlay mobile sizing",
        "fix: respect stats desktop columns",
        "fix: tighten stats editor spacing",
        "fix: align stats section toggles",
        "fix: add image crop ratios",
        "fix: add stats icon image editing",
        "fix: share hero section toggles",
        "fix: constrain stats section headers",
        "fix: move home AI imports to sticky footer",
        "fix: isolate home component preview viewport",
        "fix: sync category hero preview breakpoints",
        "fix: match AI import footer button sizing",
        "fix: improve category hero label wrapping",
        "fix: align entity AI import button",
        "fix: improve category hero responsive menu",
        "fix: ensure category hero AI keys are unique",
        "fix: add category hero image fallback",
        "fix: resolve legacy home component media cleanup",
        "fix: store media usage checks",
        "fix: persist media orphan checks",
        "fix: add hero AI image guidance",
        "fix: improve split parallax mobile hero",
        "fix: prevent fullscreen hero image cropping",
        "fix: correct media storage counters",
        "fix: align hero mobile carousel controls",
        "fix: optimize triple hero responsive layouts",
        "fix: add builder coffee blurred backdrop",
        "fix: use embla for hero slider interactions",
        "fix: correct bento hero desktop layout"
      ]
    }
  },
  {
    "date": "2026-05-17",
    "phase": "Technical Debt & Lifecycles",
    "title": "T ch h p tier 0 convex rate limiter v aggregate",
    "categories": {
      "features": [
        "feat: add layout-aware hero image crop",
        "feat: add builder coffee hero layout",
        "feat: add home component quick create controls",
        "feat: add product image placeholder fallback",
        "feat: standardize unified IA URLs",
        "feat: add bulk broken media cleanup",
        "feat: strengthen product service AI imports",
        "feat: strengthen post AI import prompt",
        "feat: show media storage usage on dashboard",
        "feat: optimize public content counts",
        "feat: optimize public read tier zero paths",
        "feat: harden Convex tier zero integrations",
        "feat: integrate Convex tier zero components",
        "feat: initialize Convex skill suite with agent configurations, skill definitions, and reference documentation"
      ],
      "improvements": [
        "Revert \"fix: render builder hero arrows in black\"",
        "chore: update Convex to 1.39.1",
        "[Spec] T ch h p tier 0 convex rate limiter v aggregate",
        "[Spec] Tier 0 4 rate limiter v aggregate u ti n public read"
      ],
      "fixes": [
        "fix: tune bento hero crop ratios",
        "fix: make hero crop manually triggered",
        "fix: reduce builder mobile arrow scale",
        "fix: show scaled builder arrows on mobile",
        "fix: constrain builder hero width",
        "fix: overlay black builder hero arrows",
        "fix: render builder hero arrows in black",
        "fix: optimize builder hero for widescreen",
        "fix: add builder coffee arrow backgrounds",
        "fix: match builder coffee hero spacing",
        "fix: keep admin list search within tables",
        "fix: clear broken media references",
        "fix: tolerate missing storage cleanup",
        "fix: prefer post content in AI import",
        "fix: correct dashboard storage usage"
      ]
    }
  },
  {
    "date": "2026-05-15",
    "phase": "Technical Debt & Lifecycles",
    "title": "Add product grid demo image uploader",
    "categories": {
      "features": [
        "Add product grid demo image uploader",
        "Add snapshot header menu controls",
        "Add snapshot clone wizard",
        "Add testimonials overlap carousel layout",
        "Add alternating process layout",
        "Add stats solar hero layout",
        "Add services builder policy layout",
        "Add about solar feature layout",
        "Add speed dial builder bar layout",
        "Add FAQ wine list layout",
        "Add category products wine grid layout",
        "Add partners logo cloud layout",
        "Add product list wine carousel layout",
        "Add popup CTA disable controls",
        "Add popup home component"
      ],
      "improvements": [
        "Respect services policy media alignment",
        "Use solid stats hero colors",
        "Refine blog construction layout",
        "Tighten process alternating spacing",
        "Compact stats hero layout",
        "Use process tokens in alternating layout",
        "Use local icons for services policy defaults",
        "Refine stats hero tokens",
        "Refine services builder policy layout",
        "Improve process alternating responsive layout",
        "Make about solar badge editable",
        "Use services tokens in policy layout",
        "Tighten product list wine carousel spacing",
        "Refine speed dial builder bar responsive layout",
        "Remove product list grid-only layouts",
        "Use Embla for wine carousel layout",
        "Refine product categories hidden header spacing",
        "Refine popup AI prompt and font",
        "Hide popup icon selector when disabled",
        "Enhance popup content controls",
        "Flatten popup color styling",
        "Simplify popup editor controls",
        "Refine popup display controls"
      ],
      "fixes": [
        "Fix snapshot lint warning",
        "Fix partners snapshot editor",
        "Fix product grid snapshot editor",
        "Fix blog snapshot editor",
        "Fix product categories snapshot editor",
        "Fix stats snapshot editor",
        "fix oxlint",
        "Fix footer preview malformed links crash",
        "Fix product categories hidden header spacing",
        "Fix popup icon visibility toggle",
        "Fix popup icon picker clipping",
        "Fix popup icon picker layering"
      ]
    }
  },
  {
    "date": "2026-05-14",
    "phase": "Technical Debt & Lifecycles",
    "title": "Add features icon visibility toggle",
    "categories": {
      "features": [
        "Add features icon visibility toggle",
        "Add category products image uploader",
        "Add spa collage about layout",
        "Add service list create image uploader",
        "feat(blog): add layout7 based on bean-construction theme",
        "Add split carousel testimonials layout",
        "Add testimonials desktop column options"
      ],
      "improvements": [
        "Expand features icon picker",
        "Refine features carousel six layout",
        "Polish spa collage divider",
        "Refine spa collage ornament",
        "Improve theme gallery thumbnail extraction",
        "style(blog): perfect layout7 to exactly match Builder.io JSON output",
        "style(blog): refine layout7 to perfectly match Bean Construction CSS",
        "Refine testimonials split fullwidth layout"
      ],
      "fixes": [
        "Fix features carousel responsive",
        "Fix snapshot hero banner thumbnails",
        "Fix hero preview slide keys",
        "Fix testimonials cards four column layout",
        "fix(blog): update layout7 to match screenshot design exactly"
      ]
    }
  },
  {
    "date": "2026-05-13",
    "phase": "Technical Debt & Lifecycles",
    "title": "Add ProductCategories demo image uploader",
    "categories": {
      "features": [
        "Add ProductCategories demo image uploader",
        "Add SEO value sections to demo detail",
        "Add snapshot OG image editing"
      ],
      "improvements": [
        "Refine demo detail customer copy",
        "Polish OG chat device mockup",
        "Make OG chat mockup more realistic",
        "Use snapshot category in chat mockup",
        "Improve OG chat preview mockup",
        "Show OG image preview mockup",
        "Use snapshot OG image on demo detail"
      ],
      "fixes": [
        "Fix snapshot demo header search",
        "Fix ServiceList hide header parity",
        "Fix homepage snapshot category validator",
        "Fix home component create counts"
      ]
    }
  },
  {
    "date": "2026-05-12",
    "phase": "Technical Debt & Lifecycles",
    "title": "CRUD category real for snapshots",
    "categories": {
      "features": [
        "feat: CRUD category real for snapshots",
        "feat: add category to homepage snapshots (dialog + theme-gallery filter)",
        "feat: implement TestimonialsForm component with drag-and-drop reordering and AI import functionality",
        "feat: implement modular home component editor with SnapshotRouter and dedicated form components for career, features, and benefits",
        "feat(product-list): add clipboard paste + drag-drop feedback to demo image uploader",
        "feat(snapshot): replace ProductList JSON editor with proper form UI",
        "feat: thêm ProductList với JSON editor trong snapshot edit (form phức tạp)",
        "feat: thêm Gallery form chuyên biệt vào snapshot edit page",
        "Add snapshot metadata editor",
        "Add snapshot component manager",
        "Add editable homepage snapshots"
      ],
      "improvements": [
        "Match trust badge stack layout",
        "Replace trust badge marquee layouts",
        "Improve trust badges editor and layouts",
        "Show snapshot categories in gallery",
        "refactor: migrate all 17 home component legacy types to dedicated forms within SnapshotEditors",
        "Simplify snapshot search list",
        "Show snapshot list with picker",
        "Improve homepage snapshot picker",
        "Use image uploader for snapshot logo",
        "Guard hero edit from snapshot keys",
        "Prevent snapshot editor live redirects",
        "Reuse existing forms for snapshot components",
        "Reuse footer form for snapshot edits"
      ],
      "fixes": [
        "Fix trust badge responsive columns",
        "Fix trust badge save state and seal layout",
        "Fix gallery other category filter",
        "Fix snapshot category query mutation",
        "fix(clients): switch from horizontal 4-col to vertical 3-col layout to prevent item overlap",
        "fix: di chuyển useTypeColorOverrideState ra top level để tuân thủ Rules of Hooks",
        "fix: SpeedDial snapshot edit - xóa legacy form, dùng form chuyên biệt với defaultOpen",
        "Fix snapshot legacy editor params"
      ]
    }
  },
  {
    "date": "2026-05-11",
    "phase": "Technical Debt & Lifecycles",
    "title": "Support demo thumbnail uploads",
    "categories": {
      "features": [
        "feat(blog): support demo thumbnail uploads",
        "feat(testimonials): support clipboard avatar uploads",
        "feat(service-list): support demo image uploads",
        "feat: implement TestimonialsForm component with drag-and-drop reordering, image uploads, and demo data integration.",
        "feat(menus): add AI import for menu items + fix JSON paste line-break issue",
        "feat: redesign AI Prompt dialog to match GenericAiDemoImport pattern with paste+preview+apply",
        "feat: expand mega prompt to cover all 32 component types with accurate styles from source",
        "feat: add AI Homepage Mega Prompt dialog with full 20-component schema, SaaS funnel best practices, and validation rules",
        "feat(create): wire AI import into create pages (career, features, pricing, case-study)",
        "feat(home-components): standardize AI import across all 16+ components",
        "feat: mockup section - scale desktop 1440px, white bg, overlapping hero, reorder sections",
        "Add detailed theme demo pages"
      ],
      "improvements": [
        "refactor(home-components): remove page-level AI prompt",
        "refactor(service-list): replace native scroll carousel with Embla Carousel API",
        "refactor(menus): follow AiHomepagePromptDialog pattern — 2-col layout, prompt, sample, preview",
        "refactor: replace BrainCircuit with Bot icon - clean, universally recognized AI icon",
        "refactor: replace Sparkles icon with BrainCircuit for professional AI branding across entire admin system",
        "Avoid deep scan when deleting media",
        "Simplify media orphan labels",
        "Limit media orphan usage scans"
      ],
      "fixes": [
        "fix(footer): guard against undefined column.links from AI import data",
        "fix: inline desktop scale 0.55 fills container correctly",
        "fix: inline tablet/phone scale calculations - eliminate white gaps",
        "fix: hero tablet/phone mockups - fixed dimensions with correct scale + brand scrollbar color"
      ]
    }
  },
  {
    "date": "2026-05-10",
    "phase": "Technical Debt & Lifecycles",
    "title": "Add media usage sorting and orphan cleanup",
    "categories": {
      "features": [
        "Add media usage sorting and orphan cleanup",
        "Add sticky footers to role and user forms",
        "Add AI import for content forms",
        "feat: nâng cấp ImageUploader (services/posts/users) thêm URL/clipboard/editor crop+remove bg",
        "feat: thêm clipboard paste + ImageEditor (crop/remove bg) vào ImageUpload và ImageFieldWithUpload",
        "feat: thêm AI Import cho Services (edit + create), follow pattern AiAboutImport",
        "feat: thay Ctrl+V global bằng nút Dán tường minh cho clipboard paste",
        "feat: clipboard paste + remove bg non-blocking với progress bar"
      ],
      "improvements": [
        "Use sticky footer for menu saves",
        "Improve AI import prompts",
        "Compact footer wave layout",
        "Improve footer logo contrast and columns",
        "style: thu nhỏ nút prev/next carousel (h-7), dùng brand color cho active, mờ khi disabled"
      ],
      "fixes": [
        "Fix unused settings uploader ref",
        "fix: sửa lỗi ImageEditorDialog không hiện (early return bug) + thêm clipboard paste vào MultiImageUploader",
        "Fix category products carousel parity",
        "fix: refactor carousel category-products dùng Embla API + nút prev/next thay CSS overflow-x-auto",
        "fix: phá circular import AVAILABLE_SERVICE_ICONS + gắn danh sách icon vào prompt AI"
      ]
    }
  },
  {
    "date": "2026-05-08",
    "phase": "Technical Debt & Lifecycles",
    "title": "Add AI import for home component",
    "categories": {
      "features": [
        "feat(about): add AI import for home component",
        "feat(clients): add layout07 - grid 2x2 with 4 landscape (24:9) images",
        "feat(settings): add image crop and background removal for logo editor",
        "feat(product-grid): add Storefront layout - brand header bar + white grid",
        "feat(product-grid): add 5-column desktop option",
        "feat(hero): add noBorderRadius toggle for hero layouts",
        "feat(product-grid): add Tabbed layout - category tabs + grid on brand bg",
        "feat(hero): add Triple 2 layout - main image 2/3 + 2 side images 1/3",
        "feat(hero): add Triple layout - 3 images 16:9 grid",
        "feat: add AI demo import across home components",
        "feat: add AI demo product import",
        "feat: add product categories compact layout"
      ],
      "improvements": [],
      "fixes": [
        "fix: theme-gallery uses real-time Convex subscription for snapshots",
        "fix(settings): fallback when public settings fetch fails",
        "fix: add onnxruntime-web peer dep for @imgly/background-removal build",
        "fix(storefront): use renderProductCard same as Catalog layout",
        "fix(tabbed): use Catalog card style for product items in both preview and site",
        "fix(tabbed): section max-w-7xl mx-auto directly, no wrapper div",
        "fix(tabbed): constrain section to max-w-7xl so brand bg does not span full viewport",
        "fix: tabbed/storefront - white bg tab active + contrast-aware text on brand bg",
        "fix(storefront): sync tabs white bg + max-w-7xl with other layouts",
        "fix(storefront): add rating row to site runtime to match preview",
        "fix(renderer): route ProductGrid tabbed/storefront to ProductGridSection",
        "fix(product-grid): add tabbed layout to site runtime render",
        "fix: refine AI product import preview",
        "fix: use literal classes for compact-grid 7-col to ensure Tailwind v4 JIT detection",
        "fix: use valid compact seven column grid",
        "fix: refine product categories compact labels",
        "fix: align product categories compact desktop columns"
      ]
    }
  },
  {
    "date": "2026-05-07",
    "phase": "Technical Debt & Lifecycles",
    "title": "Implement Voucher Promotions component management system including creation, edi...",
    "categories": {
      "features": [
        "feat: implement Voucher Promotions component management system including creation, editing, and preview functionality",
        "feat: align voucher minimal reference layout",
        "feat: align voucher carousel reference layout",
        "feat: align voucher stacked banner reference",
        "feat(voucher): redesign Ticket Ngang - match Sudes with branded square block, compact layout, clean notches",
        "feat(voucher): redesign Ticket Ngang layout to match Sudes Fashion",
        "feat: refine voucher horizontal ticket layout",
        "feat: improve voucher enterprise mobile and icon picker",
        "feat: add voucher desktop column control",
        "feat: refine voucher enterprise cards layout",
        "feat: improve voucher promotions home component",
        "feat: rich thumbnails + standalone theme-gallery + video filter",
        "feat: add template gallery pages (admin + public)",
        "feat(demo): add rich OG image with logo, brand colors, tagline, phone for /demo/[slug] pages",
        "feat: add HomeComponentRenderer component to handle dynamic rendering and styling of homepage sections",
        "feat: snapshot demo now captures and applies custom font/color overrides from /system/home-components",
        "feat: E-commerce layout now uses Commerce-style product cards (rounded, bordered, CTA button)",
        "feat: replace Minimal layout with E-commerce style (clean flat cards, circular badge, cart icon, Xem thêm CTA)",
        "feat: rename ProductGrid label to 'Lưới Sản phẩm (Grid)' for clarity",
        "feat: product-list name truncate 1 line -> line-clamp-2 across all layouts",
        "feat(product-categories): add mosaic layout",
        "feat: add PublicImage component with URL normalization and integrate into HeroRuntimeSection",
        "feat(category-products): add demo editing mode",
        "feat(services): add 3d bookmark layout"
      ],
      "improvements": [],
      "fixes": [
        "fix: remove hidden voucher header spacing",
        "fix: refine voucher carousel controls",
        "fix: tune voucher stacked banner layout",
        "fix: move voucher ticket scallops outward",
        "fix: match voucher ticket spacing reference",
        "fix: compact voucher ticket horizontal layout",
        "fix: align voucher ticket with sudes coupon",
        "fix: match voucher horizontal ticket reference",
        "fix: center voucher info modal with backdrop",
        "fix: move voucher enterprise CTA below cards",
        "fix: align voucher enterprise cards with brand tokens",
        "fix: Speed Dial Layout 3 toggle uses brand color instead of hardcoded red from first action",
        "fix: Wave footer text contrast - use stackedTextOnBg (contrast on primary bg) instead of textOnAccent (contrast on secondary)",
        "fix: E-commerce header respects title alignment - stacked layout with tabs below right-aligned",
        "fix: category tabs - text+underline right-aligned only for E-commerce layout, pill tabs for others",
        "fix: E-commerce layout match reference - gray bg, 2-row price, text+underline tabs, dark CTA",
        "fix(product-categories): balance mosaic mobile grid",
        "fix(product-categories): improve mosaic responsive grid",
        "fix(product-categories): remove unused column controls",
        "fix(product-categories): keep view all when header hidden",
        "fix(product-categories): remove hidden header spacing",
        "fix(product-categories): use shared header controls",
        "fix(product-categories): guard invalid demo image urls",
        "fix(hero): contrast slider arrow icons",
        "fix(hero): adapt text colors to dark surfaces",
        "fix(menu): sync allbirds navbar text color",
        "fix(menu): stretch classic navbar background",
        "fix(speed-dial): add shadow toggle",
        "fix(services): reduce header content spacing",
        "fix(services): align item margins across layouts",
        "fix(services): sync layout spacing and fonts",
        "fix(services): reduce layout 2 padding",
        "fix(services): match Bean bookmark style",
        "fix(services): refine 3d bookmark depth"
      ]
    }
  },
  {
    "date": "2026-05-06",
    "phase": "Technical Debt & Lifecycles",
    "title": "Add tiki favicon to public icons directory",
    "categories": {
      "features": [
        "feat: add tiki favicon to public icons directory",
        "feat(speed-dial): Layout 6 matches bean-spa - toggle with pulse, popup card with header + list",
        "feat(speed-dial): Layout 5 - site mobile also shows bottom nav (md:hidden), desktop sidebar (hidden md:block)",
        "feat(speed-dial): Layout 5 - desktop icon-only sidebar + mobile bottom nav",
        "feat(speed-dial): Layout 5 always visible, no toggle, matches bean-construction",
        "feat(speed-dial): Layout 3 - white popup card + colored toggle, matches dola-construction",
        "feat(speed-dial): Layout 3 redesign - side-stuck tabs with icon+label, no toggle",
        "feat(speed-dial): Layout 1 redesign - always visible, 44px, gradient, black tooltip, no toggle",
        "feat(speed-dial): compact UI + icon picker toggle + suggestions + X/Telegram/TikTok/Shopee/Lazada/Tiki",
        "feat(footer-form): add clear button to all text inputs",
        "feat(footer): Magazine layout redesigned (Bean Cargo inspired)",
        "feat(footer): Compact Bar redesigned (Sudes Craft inspired)",
        "feat(footer): SVG Seigaiha wave pattern (replaces CSS gradient)",
        "feat(footer): Info-Rich redesigned with Sudes Nest aesthetics",
        "feat(footer): Info-Rich layout redesigned (Sudes Nest inspired)",
        "feat(footer): Classic Grid gets its own near-neutral dark bg",
        "feat(social-icons): white border ring for dark icons on dark footer",
        "feat(footer): smart color scheme + respect original social icons",
        "feat(footer): classic grid redesigned to match Lofi Gym style",
        "feat(footer): layout 6 parallax animated wave from Euro Moto source",
        "feat(footer): layout 6 Wave redesigned to match Euro Moto",
        "feat(footer): sync FooterPreview + ComponentRenderer with new 6 layouts",
        "feat(footer): redesign 6 layouts - DynamicFooter complete"
      ],
      "improvements": [
        "refactor(speed-dial): rename layouts to Layout 1-6",
        "refactor(speed-dial): visual icon grid + remove color picker + collapsible sections",
        "chore: remove unused minimalRowClassName and centeredGridClassName",
        "refactor(footer): remove hardcoded content without form fields"
      ],
      "fixes": [
        "fix: correct destructuring alias for unused position props",
        "fix: remove 3 lint warnings (unused iconSize, position, onPositionChange)",
        "fix(speed-dial): hide position selector, always right + Layout 6 toggle/back-to-top inside",
        "fix(speed-dial): Layout 6 - smaller back-to-top, hide toggle when popup open",
        "fix(speed-dial): Zalo white circle only in Layout 5, other layouts use currentColor",
        "fix(speed-dial): Layout 5 bottom nav bigger rounder icons, preview proportional",
        "fix(speed-dial): Zalo smaller, rounder circle, neutral dark fill",
        "fix(speed-dial): Zalo white bg circle + blue brand fill, no border",
        "fix(speed-dial): Zalo icon use currentColor, no special border wrapper",
        "fix(speed-dial): Layout 5 desktop sidebar with labels + Zalo blue border circle",
        "fix(speed-dial): Layout 3 toggle use MessageSquareMore + thinner Lien he text",
        "fix(speed-dial): Layout 3 toggle = chat bubble icon + Lien he text",
        "fix(speed-dial): Layout 3 reduce Lien he font size",
        "fix(speed-dial): Layout 3 toggle shows 'Liên hệ' text instead of icon",
        "fix(speed-dial): Zalo icon 1.25x bigger",
        "fix(speed-dial): Tiki full size + white padding + blue border",
        "fix(speed-dial): Tiki blue border for contrast on white bg",
        "fix(speed-dial): Tiki logo 70%",
        "fix(speed-dial): Tiki logo smaller 80% inside white circle, not full-bleed",
        "fix(speed-dial): Tiki scale up + image brand icons fill full button in all preview styles",
        "fix(speed-dial): use seeklogo PNG for Tiki/Lazada + add Messenger icon",
        "fix(speed-dial): proper brand SVGs for Shopee/Lazada/Tiki + add Messenger icon",
        "fix(footer): hide logo placeholder when no image set",
        "fix(footer-colors): dual mode linkHover progressively adjusts secondary",
        "fix(footer): dual color mode uses secondary directly for link hover",
        "fix(footer): further reduce layout 3 spacing, sync preview+renderer copyright",
        "fix(footer): reduce Split Zones spacing, center copyright, hide section when off",
        "fix(footer): remove copyright-bar links, center copyright text",
        "fix(footer): Magazine links dark by default, secondary only on hover",
        "fix(footer): Magazine uses light bg (#f5f5f5) + primary copyright strip",
        "fix(footer): bg uses primary color directly — no more black override",
        "fix(footer): Classic bg retains brand hue (c:-0.06 vs c:-0.09)",
        "fix(social-icons): revert original colors + brand-aware dark guard",
        "fix(social-icons): smart color scheme - TikTok/X/GitHub visible on dark bg",
        "fix(footer): wave visible on tablet/mobile - overflow-x-clip + taller wave height",
        "fix(footer): layout 6 wave bg transparent - wave blends into white page",
        "fix(footer): align youtube social icon",
        "fix(product-list): align create demo image editing"
      ]
    }
  },
  {
    "date": "2026-05-05",
    "phase": "Technical Debt & Lifecycles",
    "title": "Add layer color picker for topnav/navbar/menu with APCA auto-contrast",
    "categories": {
      "features": [
        "feat(header): add layer color picker for topnav/navbar/menu with APCA auto-contrast",
        "feat(footer): add editable logo name",
        "feat(clients): replace demo images with AI-generated high-quality photos",
        "feat(clients): add layout demo images",
        "feat(clients): add banner corner toggle"
      ],
      "improvements": [
        "chore: fix 8 lint warnings — remove unused imports/vars/types, prefix intentionally unused with underscore",
        "ui(blog): add clear buttons to text inputs"
      ],
      "fixes": [
        "fix(snapshot): skip systemConfig query in legacy ComponentRenderer for snapshot isolation",
        "fix(snapshot): skip DB queries in snapshot mode so components use snapshot brand colors",
        "fix(footer): hide missing logo name on site",
        "fix(blog): hide empty subtitle",
        "fix(clients): document layout image ratios",
        "fix(clients): respect selected banner layout",
        "fix(clients): normalize banner editor state"
      ]
    }
  },
  {
    "date": "2026-05-03",
    "phase": "Technical Debt & Lifecycles",
    "title": "Expand demo to 18 items + add icon-grid layout 7",
    "categories": {
      "features": [
        "feat(product-categories): expand demo to 18 items + add icon-grid layout 7",
        "feat: use locally generated demo images for product categories",
        "feat(product-categories): add demo data mode for quick preview",
        "feat: implement MultiImageUploader component and supporting infrastructure for homepage category hero management",
        "feat: full CRUD demo categories in category hero form (name, image, add/delete) - persisted in config",
        "feat: add imageOverride, label & image fields to category hero form for demo data editing",
        "feat(homepage-category-hero): add Ant Kitchen-style thumbnail grid to mega-menu in all 6 layouts",
        "feat(homepage-category-hero): add demo data toggle to edit page",
        "feat(homepage-category-hero): selectionMode toggle real/demo with full demo categoriesData",
        "feat(homepage-category-hero): add demo data + cleaner data source UX",
        "feat(speed-dial): improve dock wave curves, Zalo SVG logo, tighter spacing, toggle mechanism",
        "feat(speed-dial): replace dock layout with wave sidebar from Bean Cargo"
      ],
      "improvements": [
        "ui(form): add clearable X button on text inputs for quick clear",
        "ui(form): collapsible sections with defaultExpanded - edit=closed, create=open",
        "ui: reclaim spacing when showProductCount is off across all 6 layouts",
        "ui(circular): remove container border and header separator in Layout 5",
        "ui(marquee): remove all borders from Layout 4",
        "ui(grid): reduce circle size and spacing in Layout 1",
        "ui(icon-grid): horizontal layout - image left + text right, minimal spacing",
        "refactor: remove minimal layout, keep 6 layouts (Layout 1-6)",
        "ui: remove 'Preview' prefix + rename tabs to Layout 1-7",
        "refactor: replace window.prompt with inline toggle image URL editor for link items",
        "refactor: compact link items with inline thumbnail preview + cleanup unused imports",
        "revert: restore max-w-5xl on admin edit page (fix was in site component)",
        "widen category hero edit page container from max-w-5xl to max-w-[1600px]",
        "refactor(homepage-category-hero): collapsible SubSections + ClearableInput"
      ],
      "fixes": [
        "fix(product-list): empty subtitle/badge now persists correctly after save",
        "fix(form): move ClearableInput outside component to prevent focus loss on re-render",
        "fix(colors): smart accent fallback - primary→secondary→neutral based on APCA contrast",
        "fix(icon-grid): desktop 6 cols, tablet 3, mobile 3",
        "fix: site renderer now handles demo mode for ProductCategories",
        "fix: device selector always pinned to far right in PreviewWrapper",
        "fix: replace broken Unsplash URLs with placehold.co placeholders",
        "fix: replace broken unsplash URL for demo category 'Thoi trang Nu'",
        "fix: flush mega-menu panel now covers full hero area + 3-col grid",
        "fix: mega-menu panel now covers full hero area on hover (inset-0)",
        "fix(homepage-category-hero): merge DEMO_CATEGORIES_DATA into categoryMap so preview + site render demo data",
        "fix(snapshot): filter out demo/invalid IDs before db.get to prevent decode crash"
      ]
    }
  },
  {
    "date": "2026-05-02",
    "phase": "Technical Debt & Lifecycles",
    "title": "Collapsible sections in form (edit=closed, create=open)",
    "categories": {
      "features": [
        "feat(product-grid): collapsible sections in form (edit=closed, create=open)",
        "feat(product-grid): add desktop columns selector (3/4/6 cols) with responsive breakpoints",
        "feat(product-grid): demo data with images+category, form fields, preview tab filtering",
        "feat(product-grid): standalone ProductGridSection with 6 layouts, category tabs, 8-item grid",
        "feat(product-grid): always show category tabs + render in preview",
        "feat(product-grid): add category tabs config and rename to Catalog",
        "feat(product-grid): replace inline title/desc with shared HeaderConfigSection",
        "feat: add desktopColumns (3|4) setting to Process - max 4 steps, responsive grid",
        "feat: smart badge color contrast on dark band - primary/secondary/white fallback",
        "feat: replace Accordion with zigzag wave layout from reference project",
        "feat: Cards - apply reference design with filled circle + dashed S-curve arrow",
        "feat: Cards - remove badge/circle, show number only, gentle curve arrow",
        "feat: Cards layout - replace icon with step number, wavy SVG arrow connectors",
        "feat: redesign Cards layout - icon circles with badge, arrow connectors, centered text",
        "feat: add horizontal connector line from step dot to card in stepper layout",
        "feat: redesign stepper layout - card-based with chevron connectors, active step highlighting, 2-digit numbers",
        "feat: add collapsible toggle to ProcessForm, default closed on edit",
        "feat: integrate HeaderConfigSection into Process edit/create pages with full header rendering",
        "feat: add Unsplash images and richer content to ServiceList demo data",
        "feat: add collapsible toggle to ServiceListForm, default collapsed on edit",
        "feat: migrate ServiceList header to shared HeaderConfigSection for system-wide consistency",
        "feat: add demo data source mode for ServiceList on create page",
        "feat(header): increase logo size levels 20->30 + fix logo overflow clipping",
        "feat(hero): add adjustable backdrop overlay opacity slider for fullscreen & parallax",
        "feat(hero): add text alignment (left/center/right) + custom button colors for primary & secondary",
        "feat(hero): add highlighted text support with {text} syntax + color picker + multi-line heading",
        "fix(hero): add video URL support to Bento and Split preview layouts",
        "feat(hero): support video URL slides in Hero Banner (create/edit/preview/runtime)",
        "feat: implement dynamic footer and header components with corresponding preview and state management modules"
      ],
      "improvements": [
        "style: reduce height ~20% across all 6 layouts - tighter padding/gaps/margins",
        "style: accordion zigzag - widen item text from 160px to 220px, taller container",
        "style: grid layout - wider cards, vertical icon, full text without truncation",
        "style: reduce all minimal text 10% more, shrink gaps and padding for wider columns",
        "style: reduce minimal header heading and subtitle font size by 40%",
        "style: shrink minimal icon circles 40% and remove step labels",
        "refactor: replace minimal process layout with 3-step-workflow-ui dark band design",
        "refactor(about): compact features to single-row + IconPopoverPicker + taller description textarea",
        "refactor(about): compact form grid (3-col/2-col) + reduce image height to banner ratio",
        "refactor(about): replace Bean-specific default text with generic demo content",
        "refactor(hero): auto-detect video URL instead of separate video card - simpler UX",
        "docs: update agent configuration documentation in AGENTS.md",
        "perf(mobile): multi-fix for CLS, LCP, and render-blocking"
      ],
      "fixes": [
        "fix(product-grid): preview derives category tabs from demo products in demo mode",
        "fix(product-grid): preview tabs match site styling and position",
        "fix(product-grid): preview renders magazine/mosaic with dedicated styles matching site",
        "fix(product-grid): magazine/mosaic use uniform grid, differ only by card style",
        "fix(product-grid): magazine/catalog/mosaic style selection + preview render",
        "fix(product-grid): preview title/subtitle mapping matches site render",
        "fix(product-grid): header config triggers save button + preview renders header correctly",
        "fix: accordion zigzag - narrow x-range to 14-86% so edge items have room",
        "fix: dynamic grid cols for minimal layout to prevent card wrapping",
        "fix: zigzag top items y 23->26%",
        "fix: zigzag - nudge top items down more (19->23%)",
        "fix: restore ArrowRight import for renderMinimal",
        "fix: zigzag - nudge top items down extra 1/4 (15->19%)",
        "fix: zigzag - move top items down so circles sit on wave line",
        "fix: zigzag - all items text below circle, remove line-clamp",
        "fix: zigzag - flip top items text above circle, add line-clamp, adjust spacing",
        "fix: zigzag wave - add description, z-index for circles, increase spacing",
        "fix: add missing demoServices to toSnapshot call in ServiceList edit",
        "fix: Horizontal - use Tailwind responsive for dot sizes and text on site",
        "fix: Cards - use Tailwind responsive classes on site for tablet/mobile",
        "fix: unify horizontal layout grid - dots and text share same grid axis for perfect center alignment",
        "fix: enable badge in all process layouts, ensure consistent showBadgeInline",
        "fix: align header with SectionHeader standard, add ProcessRuntimeSection for site",
        "fix: center step dot and connector at vertical middle of each card",
        "fix: align horizontal connector to center of step dot (19px from top)",
        "fix: connector line goes into step dot, hover shows chevron arrows overlay",
        "fix: continuous vertical connector line from step to step in stepper layout",
        "fix: add persistent vertical connector line between stepper steps, chevrons on hover",
        "fix: remove flashy effects from stepper, chevrons only visible on hover",
        "fix: remove text truncation in horizontal layout, add clear X buttons to all form inputs",
        "fix: include demoServices in snapshot so changes trigger save footer",
        "fix: show thumbnails in demo items and wire demo data to preview",
        "fix(about): increase textarea height 20% + classic layout uses Be Vietnam Pro font",
        "fix(header): increase logo max size - classic 96->160px, topbar 108->180px, allbirds 80->140px",
        "fix(hero): align buttons with text direction (center/right) in preview and runtime",
        "fix(hero): use default highlight color (#ef4444) when not explicitly set",
        "fix: remove decorative border containers from footer logos in ComponentRenderer to match DynamicFooter",
        "fix: footer brand name + logo size in ComponentRenderer; fix SpeedDial contain:layout",
        "fix: add undefined guard for resolvedComponents (TS18048/TS2488)",
        "fix: use font-display:optional for primary fonts to eliminate CLS",
        "fix: reduce CLS by reserving layout space during data loading",
        "fix: revert SiteImage blur to inline backgroundImage - fix CLS 0.51 regression"
      ]
    }
  },
  {
    "date": "2026-05-01",
    "phase": "Technical Debt & Lifecycles",
    "title": "Render header menu on demo route from snapshot data (no DB queries)",
    "categories": {
      "features": [
        "feat: render header menu on demo route from snapshot data (no DB queries)",
        "feat: add demo mode to ProductGrid form (types, form, edit, create)",
        "feat: implement reusable partner display components including divider, marquee, and preview modules for admin home dashboard.",
        "feat(footer): add collapsible toggle sections to FooterForm",
        "fix(blog): remove duplicate title + site demo data support",
        "feat(blog): add desktop columns setting (3/4 cols) like Services",
        "feat(blog): integrate SectionHeader into all 6 blog layouts",
        "feat(blog): add HeaderConfigSection + demo data source + SubSection pattern",
        "feat: shared IconPopoverPicker for all home-components",
        "feat(marquee): 30 separator icons in popup grid picker",
        "feat(marquee): uppercase toggle, scale 1-10x dropdown, 1.5x faster speed, fix text clipping",
        "feat(home-components): add Marquee (chạy chữ) component with 6 layouts",
        "feat(product-list): wire header config to preview + site rendering"
      ],
      "improvements": [
        "build: skip TypeScript check in Vercel build to avoid 45min timeout",
        "perf: optimize PageSpeed Insights - target 90+ mobile/desktop",
        "ui: Việt hóa + gọn gàng HomepageSnapshotDialog",
        "refactor: snapshot pipeline - embed demo data in config, add /demo/[slug] public route, fix systemStyle restore",
        "style(blog): align layout 4/5/6 nav arrows with ProductList Carousel pattern",
        "refactor(marquee): per-item textStyle, scale 1-5x, fix hover pause, new layouts",
        "refactor(product-list): move 'Xem tất cả' and arrows below SectionHeader",
        "refactor(product-list): use shared SectionHeader component",
        "refactor(product-list): replace custom config with shared HeaderConfigSection",
        "refactor(product-list): merge cards into collapsible SubSections"
      ],
      "fixes": [
        "fix: use CSS variable for Noto Sans instead of font loader in client component",
        "fix: extract Noto_Sans font loader from client component to fix Turbopack build",
        "fix(seo): remove force-dynamic, fix duplicate metadata, add h1, enable ISR",
        "chore: fix all 73 oxlint unused-vars warnings (0 warnings, 0 errors)",
        "fix: wrap DemoSiteShell with CustomerAuthProvider + CartProvider",
        "fix: use correct index by_status_publishedAt for services query in snapshot",
        "fix(blog): subtitle not persisting + center layout4 view-all button",
        "fix(marquee): separator popup clipped by overflow-hidden on item row",
        "fix(marquee): remove duplicate title input in edit page",
        "fix(marquee): outlined stroke 3x thinner",
        "fix(marquee): font Roboto Slab, slow/normal speed x2 faster",
        "fix(marquee): 2x faster speed, stripe alternating colors, Be Vietnam Pro font",
        "fix(product-list): hide carousel arrows/dots when all items fit on screen",
        "fix(product-list): align 'Xem tất cả' and carousel arrows with SectionHeader",
        "fix(product-list): correct title/subtitle/badge mapping for SectionHeader"
      ]
    }
  },
  {
    "date": "2026-04-30",
    "phase": "Unified IA & Bookings",
    "title": "S a team home component layout 6 nh bo g c v m u card ng u",
    "categories": {
      "features": [
        "feat(product-list): image upload + demo in create page + cleanup on delete",
        "feat(product-list): add demo data source mode - Add 'demo' to ProductSelectionMode (auto/manual/demo) - Add DemoProductItem interface and DEFAULT_DEMO_PRODUCTS constants - Update ProductListForm with demo item editor (name, price, image, tag) - Update edit page to manage demoProducts state and save to config - Update frontend ProductListSection to render demo data without DB query - Demo data lives in component config, deleted with component",
        "feat(video): redesign all 6 layouts to SaaS quality with shared SectionHeader - All layouts now use sharedHeader (py-8 px-3 wrapper) - Split: 2-col grid, video left, header+CTA right - Fullwidth: header above, wide video (21:9 on desktop) - Cinema: header above, dark-framed cinematic video - Minimal: header above, clean bordered card wrapping video - Parallax: header above, large shadow-lifted video (2:1 ratio) - Remove legacy SectionHeading, renderBadge, getHeadingClass, getCardTextClass",
        "feat: standardize SectionHeader across all home-components - TeamSectionShared: replace local header with shared SectionHeader - StatsPreview: replace renderHeader() with shared SectionHeader - TrustBadgesPreview: remove local SectionHeader, use shared - Benefits/ServiceList/ProductList/Categories: sync typography leading-tight text-balance",
        "feat+fix(testimonials): fix slider header layout + them upload avatar option voi dropdown",
        "feat(testimonials): refactor form + fix 6 layouts - bo card du, title/subtitle trong preview, toggle expand, upload anh, demo 6 item, font Be Vietnam Pro, giam spacing 25%, khong tint anh",
        "feat(pricing): apply Be Vietnam Pro font, reduce text 15%, scale price, fix Lien he suffix"
      ],
      "improvements": [
        "refactor(demo): remove tag dropdown, add URL input mode for images",
        "refactor(compact): 8 items, grid-cols-4 desktop, grid-cols-2 mobile/tablet",
        "refactor(video): redesign VideoForm - compact unified card - Merge 4 separate cards into 1 Card with collapsible SubSections - Grid-cols-3 for playback checkboxes, grid-cols-3 for CTA fields - Grid-cols-2 for heading/description - defaultExpanded prop: true for create, false for edit - Remove duplicate Style layout card from create page - Remove empty Video card from edit page - Trim helper text, better Vietnamese labels",
        "refactor(typography): dong bo hoan toan SectionHeader toan he thong",
        "refactor(sections): chuan hoa SectionHeader pattern B toan bo home-components",
        "[Spec] S a team home component layout 6 nh bo g c v m u card ng u"
      ],
      "fixes": [
        "fix(showcase): remove imageAspectRatioStyle from featured card",
        "fix(preview): type=button on all buttons + Embla carousel with prev/next state",
        "fix(video): integrate shared SectionHeader into Video component - VideoPreview: add all header config props (hideHeader, showTitle, etc) - VideoSectionShared: import+use shared SectionHeader for centered/split/minimal styles - Create page: pass headerState to VideoPreview for realtime preview - Edit page: pass header state to VideoPreview for realtime preview",
        "fix(testimonials): dong bo subtitle style va subtitleAboveTitle trong local SectionHeader preview",
        "fix(testimonials): bo double header tren site thuc - them hideHeader=true cho TestimonialsSectionShared",
        "fix(testimonials): dong bo badge style ve chuan chung (slate-100/slate-600/border)",
        "fix(services): sync badge+header giua admin preview va site thuc",
        "fix(testimonials/minimal): bo bg secondary cho role, button dung mau thuong hieu + text tuong phan APCA",
        "fix(testimonials/showcase): bo Quote icon, giam spacing, bo bg secondary cho role, text role to hon",
        "fix(team): align layout 6 card styling",
        "fix(services): hide color warning UI from admin non-dev users",
        "fix(services): redesign icon picker, compact items to single row, remove empty section, add collapsible toggle",
        "fix(pricing): align grid controls with services pattern",
        "fix(pricing): collapsible sections, container queries preview, reduce header spacing"
      ]
    }
  },
  {
    "date": "2026-04-29",
    "phase": "Unified IA & Bookings",
    "title": "Chuy n clients home component th nh banner nh th ng hi u",
    "categories": {
      "features": [
        "feat(partners): add demo images button with 6 sample partner logos",
        "feat(about): add collapsible toggle to all sections in edit/create pages",
        "feat(gallery): thêm toggle Full width desktop cho 6 layout",
        "feat(gallery): add 'Dùng ảnh demo' button to create & edit pages",
        "feat(faq): thêm toggle cho section Câu hỏi thường gặp, bỏ card Layout đang dùng",
        "feat(contact): thêm toggle cho tất cả sections - edit đóng mặc định, create mở mặc định",
        "feat(home-components): add demo banner images for clients create",
        "feat(home-components): apply showcase layouts to brand banner",
        "feat(home-components): repurpose clients as brand image banner",
        "feat(admin): thêm bulk action hiển thị/ẩn cho home components",
        "[Spec] Fix features home component header parity max width dirty state v section toggle"
      ],
      "improvements": [
        "redesign(partners): overhaul all 6 layouts - full color logos, compact spacing, smart responsive, premium hover",
        "redesign(partners): premium Grid layout inspired by Sapo themes - grayscale hover, smart responsive cols, accent bar, clean cards",
        "refactor(partners): remove duplicate header config, unify with HeaderConfigSection",
        "refactor: move status toggle from forms to StickyFooter across all home-components",
        "chore(lint): remove unused code across home components",
        "chore(benefits): remove unused shared section code",
        "[Spec] Chuy n clients home component th nh banner nh th ng hi u",
        "[Spec] P d ng 6 layout banner showcase cho banner nh th ng hi u",
        "[Spec] Th m n t demo 4 nh cho banner nh th ng hi u"
      ],
      "fixes": [
        "fix(partners): speed up Badge auto-scroll (12s for 6 items instead of 30s)",
        "fix(partners): remove maxVisible limit for Badge auto-scroll carousel",
        "fix(partners): Badge card style matches Carousel exactly (flex-col, same sizing) + auto-scroll",
        "fix(partners): unify header + content spacing in preview, remove double padding gap",
        "fix(partners): wire shared SectionHeader into preview, fix skipHeader in all 5 style components",
        "fix(gallery): fullWidthDesktop dùng max-w-none thay vì empty string",
        "fix(gallery): Việt hoá label toggle fullWidthDesktop - Toàn màn hình / Giới hạn",
        "fix(gallery): bỏ toàn bộ padding-top thừa giữa header và gallery content",
        "fix(gallery): bỏ padding-top thừa trong gallery preview content",
        "fix(gallery): giảm spacing giữa header và gallery content",
        "fix(gallery): remove duplicate header, accent bar thừa và thêm section toggle",
        "fix: Features home-component header parity, max-width, dirty state và section toggle",
        "fix(faq): render shared header on homepage runtime",
        "fix(faq): align shared header with runtime",
        "fix(contact): allow save with validation warnings",
        "fix(contact): allow legacy embed values in validation",
        "fix(contact): keep shared header inside section container",
        "fix(contact): sync shared header in create and edit",
        "fix: clients edit không track header config changes và preview không hiển thị header",
        "fix: clients preview không nhận shared header config như benefits",
        "[Spec] Fix contact edit save button still disabled 1",
        "[Spec] Fix contact edit save button still disabled",
        "[Spec] Fix contact header parity container and save disabled ux",
        "[Spec] Fix contact home component shared header create edit",
        "[Spec] Fix faq runtime section header actual site",
        "[Spec] Fix faq section header parity",
        "[Spec] Fix pricing max 4 items v grid 3 4 theo pattern services"
      ]
    }
  },
  {
    "date": "2026-04-28",
    "phase": "Unified IA & Bookings",
    "title": "Apply shared header system to home components",
    "categories": {
      "features": [
        "feat(benefits): redesign layout 6 - Hero Image Center với Floating Cards",
        "feat(benefits): redesign layout 5 với Bento Grid asymmetric",
        "feat: add shared header system to Partners component - complete all 13 components",
        "feat: add shared header system to Gallery component",
        "feat: add shared header system to FAQ component",
        "feat: add shared header system to Testimonials component",
        "feat: add shared header system to Features component",
        "feat: apply shared header system to About component",
        "feat: apply shared header system to Contact component",
        "feat(video): apply shared header system to Video component",
        "feat(clients): apply shared header system to Clients component",
        "feat(pricing): apply shared header system to Pricing component",
        "feat(services): apply shared header system to Services component",
        "feat: apply shared header system to stats create page",
        "feat: create shared header system for home components",
        "feat: add hide header toggle outside dropdown in stats edit",
        "feat: add clear button to text inputs in stats edit form",
        "feat: thêm badge cho header stats component",
        "feat: thêm toggle viết in hoa cho title và subtitle",
        "feat: thêm tùy chọn subtitle ở trên title",
        "feat: thêm animation toggle cho stats component",
        "feat(stats): tăng font size title/subtitle tương đương service-list"
      ],
      "improvements": [
        "refactor: remodel benefits layouts to six curated variants",
        "docs: báo cáo trạng thái shared header system cho 32 home components",
        "docs: update migration summary - ALL 13 COMPONENTS COMPLETE! 🎉",
        "docs: add shared header migration summary",
        "[Spec] Apply shared header system to home components",
        "[Spec] Chu n h a benefits form b style v d ng s c t desktop ki u services",
        "[Spec] Chu n h a benefits layout 1 gi ng nh m u gi nguy n ti u m t chung",
        "[Spec] Home components shared header status",
        "[Spec] Lo i b duplicate ti u m t trong benefits home component",
        "[Spec] Redesign benefits layout 5 bento grid",
        "[Spec] Refactor benefits home component theo 6 layout tham chi u",
        "[Spec] Refit benefits layout 1 theo source m u gi i ph p doanh nghi p",
        "[Spec] Refit benefits layout 3 theo source m u layout 3 benefit",
        "[Spec] Refit benefits layout 4 theo source m u layout 4 benefit",
        "[Spec] S a benefits layout 1 preview responsive o theo khung preview",
        "[Spec] S a warning border style v cho benefits layout 2 responsive gi ng layout 1",
        "[Spec] Shared header migration summary"
      ],
      "fixes": [
        "fix(benefits): include subtitle in shared section config",
        "fix(benefits): layout 4 thay hard code text bằng config.subtitle",
        "fix(benefits): layout 5 site thực cũng dùng 2 cols ở mobile",
        "fix(benefits): layout 5 mobile preview dùng 2 cols như tablet",
        "fix(benefits): layout 4 desktop preview parity + layout 5 gọn hơn",
        "fix(benefits): layout 4 icon blend + responsive preview parity",
        "fix: refit benefits layout 4 to match reference",
        "fix: remodel benefits layout 3 to match reference",
        "fix: match benefits layout 2 responsive behavior",
        "fix: align benefits preview responsive with device frame",
        "fix: refit benefits layout 1 to match reference",
        "fix: restyle benefits layout 1 cards",
        "fix: rename benefits layouts and remove desktop columns",
        "fix: chuẩn hóa benefits form theo desktop columns",
        "fix: ẩn header rỗng và mở style switch cho Benefits",
        "fix: bỏ duplicate header config trong Benefits",
        "fix: thêm header preview cho FAQ và Gallery components - hoàn tất 13/13 components với shared header system",
        "fix: track header config changes trong About edit page - hasChanges trigger khi sửa title/subtitle/badge",
        "fix: xóa Header Configuration duplicate trong AboutForm - chỉ giữ HeaderConfigSection",
        "fix: thêm header preview cho About component - hiển thị SectionHeader trong preview với đầy đủ controls",
        "fix: remove duplicate title input in create pages - add skipTitleInput prop",
        "fix: giảm spacing và size chữ badge 20%",
        "fix: cập nhật toggle viết in hoa thêm font-bold",
        "fix: sửa animation không ổn định và race conditions",
        "fix: sửa lỗi JSX syntax trong StatsPreview.tsx",
        "fix(stats): căn giữa cụm icon+text, bỏ flex-1 và class dư thừa",
        "[Spec] Fix benefits preview header r ng v layout switch b lock"
      ]
    }
  },
  {
    "date": "2026-04-27",
    "phase": "Unified IA & Bookings",
    "title": "Audit m n tr ng create blog v c c home component create t ng t",
    "categories": {
      "features": [
        "feat(stats): tăng font size và spacing 20%, căn giữa nội dung items",
        "fix(stats): implement left placement in StatsRuntimeSection (actual site component)",
        "feat(stats): implement left placement for icon/image across all 6 styles",
        "feat(stats): implement mediaAlign for all 6 styles",
        "feat(stats): apply compact layout to all runtime styles",
        "feat(stats): add fullWidth toggle and compact layout",
        "feat(stats): add responsive grid logic and max 4 items limit",
        "feat(stats): add UI/UX config parity with services",
        "feat(stats): mở rộng 100+ icons + search + icon cho tất cả 6 layouts",
        "feat(stats): thêm icon picker (lucide/url) cho stats items",
        "feat: đổi ServiceList showcase layout theo Blog layout 5",
        "feat(blog): nút 'Đọc ngay' dùng màu chính với text tương phản",
        "feat(service-list): thêm block header controls (showTitle, showSubtitle, subtitle, headerAlign) parity với services",
        "feat(about): switch highlight items to icon or image"
      ],
      "improvements": [
        "chore: xóa warning jargon APCA/minLc/ΔE khỏi VoucherPromotions edit page",
        "[Spec] Audit m n tr ng create blog v c c home component create t ng t",
        "[Spec] I servicelist showcase theo blog layout 5",
        "[Spec] Kh i ph c ui preview b x a nh m v ch n warning jargon",
        "[Spec] N c nh b o apca c n s t tr n servicelistpreview",
        "[Spec] N warning apca deltae jargon kh i ui end user tr n to n b home components",
        "[Spec] Ng b block header controls t services sang service list edit",
        "[Spec] S a n t blog layout 1 th nh c ngay v c n s t ph i",
        "[Spec] Stats ui ux config parity v i services",
        "[Spec] X l warning jargon c n s t voucherpromotions edit"
      ],
      "fixes": [
        "fix(stats): icon sát text khi mediaPlacement=left, bỏ items-center",
        "debug: add console.log to StatsSection to verify mediaPlacement/mediaAlign",
        "fix(stats): add explicit icon wrapper alignment",
        "fix(stats): limit displayed items by desktopColumns to prevent UI break",
        "fix(stats): preview responsive grid based on device state not viewport",
        "fix(stats): apply desktopColumns to horizontal style",
        "fix: Stats icon persist across preview/save/site - full parity",
        "fix(stats): preserve icon fields khi load/save/preview",
        "fix(stats): loại bỏ duplicate icon Zap",
        "fix(stats): grid 2 cols mobile cho horizontal style + fix hydration error",
        "fix(stats): responsive mobile grid 2 cols cho layout Thanh ngang",
        "fix: xóa dấu ngoặc nhọn thừa gây lỗi parsing trong các file create page",
        "fix(blog): đổi date từ inline-flex thành flex để justify-between hoạt động",
        "fix(blog): sửa nút blog layout 1 thành 'Đọc ngay' và căn sát phải",
        "fix: normalize thumbnailStorageId trong currentSnapshot để sticky footer chuyển 'Đã lưu' sau xóa thumbnail",
        "fix: xóa thumbnail post không lưu được",
        "fix(posts/edit): sửa logic snapshot comparison và hasChanges",
        "fix(ImageUploader): reset về empty state khi ảnh lỗi",
        "fix(posts): xóa thumbnail không hoạt động khi lưu",
        "fix: Kiểm tra module field author_name ở create blog page",
        "fix(home-components): hide technical color warnings",
        "fix(about): align feature editor and icon registry",
        "fix(about): streamline highlight item editor",
        "fix(about): remove stats block from layout 2",
        "fix(about): simplify featured item inputs",
        "fix(about): replace first layout 5 stat with cta",
        "fix(about): align layout widths to 7xl",
        "[Spec] Fix stats icon left placement render",
        "[Spec] Fix stats icon persist preview site parity",
        "[Spec] Fix sticky footer kh ng chuy n l u sau khi x a thumbnail post",
        "[Spec] Fix x a thumbnail post kh ng l u c"
      ]
    }
  },
  {
    "date": "2026-04-26",
    "phase": "Unified IA & Bookings",
    "title": "Audit k layout 4 c n tr i icon s t text",
    "categories": {
      "features": [
        "feat(about): replace layouts with vechungtoi variants",
        "feat(services): align variants with icon card layouts",
        "feat(services): toggle title visibility",
        "feat(services): support responsive desktop columns",
        "feat(services): align title and subtitle",
        "feat(services): add branded subtitle",
        "feat(services): support side media positions",
        "fix(services): support media align in icon cards"
      ],
      "improvements": [
        "chore(convex): enable tsgo typecheck",
        "refactor(services): simplify media position controls",
        "refactor(services): use shared media align",
        "[Spec] Audit k layout 4 c n tr i icon s t text",
        "[Spec] Audit k layout 4 c n tr i s a self center v chu n h a icon lane",
        "[Spec] Chu n h a 5 layout services theo h ng icon cards",
        "[Spec] Lu n hi n th controls services v enforce m i layout t n tr ng settings",
        "[Spec] Refactor about home component 6 layouts from vechungtoi",
        "[Spec] S a c n icon nh layout 3 4 6 khi ch n c n tr i",
        "[Spec] S a carousel services ph i m u item nh t t i m theo m u ch nh",
        "[Spec] S a carousel services theo logic m u item nh t t i m t m u ch nh",
        "[Spec] S a l i elegant grid services b m ng m u thanh xanh ngang",
        "[Spec] S a timeline services th nh benefit bar m ng v gi behavior chu n",
        "[Spec] Tinh ch nh layout 4 icon v text u theo top row"
      ],
      "fixes": [
        "fix(services): align layout 4 media lane",
        "fix(services): tune layout 4 media alignment",
        "fix(services): align left media spacing across layouts",
        "fix(preview): guard home component breakpoints",
        "[Spec] Fix about highlight item form and icon parity",
        "[Spec] Fix preview breakpoint parity cho footer gallery productlist partners video trus",
        "[Spec] Fix services mobile preview responsive parity"
      ]
    }
  },
  {
    "date": "2026-04-25",
    "phase": "Unified IA & Bookings",
    "title": "Cho ph p zalo nh n zalo me url ho c s i n tho i trong contact social links",
    "categories": {
      "features": [
        "feat(services): support icon search and image media",
        "feat(snapshot): add bundled homepage demo runtime",
        "feat(product-categories): add quick category generation",
        "feat(product-categories): refine CTA and layout spacing",
        "feat(product-categories): add subtitle and header alignment",
        "feat(product-categories): boost high-contrast accent tokens",
        "feat(product-categories): replace layouts with shared responsive runtime"
      ],
      "improvements": [
        "chore(lint): remove unused product categories code",
        "[Spec] Cho ph p zalo nh n zalo me url ho c s i n tho i trong contact social links",
        "[Spec] Ho n thi n productcategories cta count spacing labels",
        "[Spec] Ho n thi n productcategories equal height v b commit gi code",
        "[Spec] Ng b compact list mobile site theo preview ng",
        "[Spec] Productcategories modern high contrast accent colors",
        "[Spec] Productcategories one row swipe v auto generate all eligible",
        "[Spec] Reset commit gi code v s a preview square grid kh ng b c border",
        "[Spec] Spec a snapshot demo bundle m nh cho home components kh ng ng d li u th t",
        "[Spec] T ch c n l title subtitle kh i cta productcategories",
        "[Spec] T ch d ng cta kh i title subtitle productcategories",
        "[Spec] Th m n t sinh nhanh cho productcategories",
        "[Spec] Th m subtitle v c n l cho productcategories",
        "[Spec] Thay 6 layout productcategories theo danhmucnoibat"
      ],
      "fixes": [
        "fix(images): allow Bean Spa remote assets",
        "fix(product-categories): restore responsive parity",
        "fix(product-categories): balance row typography",
        "fix(product-categories): tune book row controls",
        "fix(product-categories): separate header CTA row",
        "fix(product-categories): preserve header alignment",
        "fix(product-categories): pin header CTA to edge",
        "fix(product-categories): align header CTA labels",
        "fix(contact): accept zalo phone or zalo.me link",
        "[Spec] Fix compact list preview mobile width parity",
        "[Spec] Fix compact list preview only basis site kh ng sai",
        "[Spec] Fix productcategories book row v cover cards responsive parity",
        "[Spec] Fix productcategories swipe preview sizing v smoothness"
      ]
    }
  },
  {
    "date": "2026-04-24",
    "phase": "Unified IA & Bookings",
    "title": "Audit blog preview parity drift and author gating",
    "categories": {
      "features": [
        "fix(blog): reimplement layout4 wrapper parity",
        "feat(trust-pages): streamline admin publish flow",
        "feat(blog): align admin and site layouts from source",
        "feat(faq): refresh admin layouts from showcase patterns",
        "feat(testimonials): upgrade showcase layouts"
      ],
      "improvements": [
        "chore: checkpoint remaining local changes",
        "[Spec] Audit blog preview parity drift and author gating",
        "[Spec] Audit d t i m layout 4 mobile v n l ch ph i site",
        "[Spec] Audit y p d ng ghi admin trust pages",
        "[Spec] Blog home component rollout from source",
        "[Spec] Chu n h a chi u cao item layout 6 blog theo pattern layout 1",
        "[Spec] Chu n h a layout 4 blog nav theo item count v kh n ng click",
        "[Spec] Chu n h a layout1 blog categories v l m clickable n t xem t t c cho 6 layout",
        "[Spec] Chu n h a parity preview site cho blog layouts 1 2 3 5 6 theo pattern layout4",
        "[Spec] Chu n h a preview blog testimonials v faq theo pattern hero stats",
        "[Spec] Chu n h a site blog theo preview cap layout h t l ch preview site",
        "[Spec] Kh a l i header text wrapper cho layout 4 mobile",
        "[Spec] M r ng admin trust pages bulk b t m c t t h i tr ng th i xu t b n sticky footer",
        "[Spec] N ng c p testimonials b ng 6 layout showcase",
        "[Spec] Refactor blog theo pattern hero parity guard l y site runtime l m source of trut",
        "[Spec] Spec blog preview parity drift pattern",
        "[Spec] Spec parity preview blog",
        "[Spec] Spec upgrade faq admin ui from testimonials patterns",
        "[Spec] T m root cause blog site render desktop b co nh mobile d preview ng",
        "[Spec] T o skill home component parity guard t commit history ch a push",
        "[Spec] Th m border cho khung thumbnail c a blog layout 4"
      ],
      "fixes": [
        "fix(ui): remove unused blog runtime vars",
        "fix(blog): equalize layout 6 card heights",
        "fix(blog): paginate layout 5 and 6 navigation",
        "fix(blog): paginate layout 4 navigation",
        "fix(blog): use real categories and wire view-all links",
        "fix(blog): restore layout 4 mobile header alignment",
        "fix(blog): restore layout 4 mobile card ui",
        "fix(blog): lock layout 4 mobile left alignment",
        "fix(blog): left align layout 4 mobile content",
        "fix(blog): remove layout 4 header divider",
        "fix(blog): align mobile layout 4 header",
        "fix(blog): add border to layout 4 thumbnails",
        "fix(blog): guard author toggle by posts module state",
        "fix(blog): align preview mobile spacing",
        "fix(blog): tighten mobile spacing",
        "fix(blog): unify preview breakpoints",
        "fix(blog): restore desktop container parity",
        "fix(blog): unify layout4 preview shell parity",
        "fix(blog): restore layout4 desktop preview container",
        "fix(blog): align layout4 preview context",
        "fix(blog): restore layout4 preview width",
        "fix(blog): complete layout4 parity",
        "fix(blog): restore layout4 parity",
        "fix(blog): align responsive preview with demo shell",
        "fix(blog): reduce preview parity drift",
        "fix(trust-pages): create missing pages on apply",
        "fix(blog): use exact layout1-layout6 mapping",
        "fix(faq): align preview layouts with showcase parity",
        "fix(home-components): preserve local color override state",
        "fix(home-components): use button for color toggle",
        "fix(testimonials): unblock custom color toggle",
        "fix(testimonials): match desktop preview grid",
        "fix(testimonials): improve preview spacing",
        "fix(testimonials): tighten layout containers",
        "[Spec] Fix blog preview responsive all layouts",
        "[Spec] Fix breakpoint preview desktop cho blog layout4",
        "[Spec] Fix d t i m layout4 blog preview desktop v n ra 2 c t",
        "[Spec] Fix layout4 blog preview desktop v n b 2 c t",
        "[Spec] Fix parity mobile header blog layout 4 gi a preview v site",
        "[Spec] Fix to n b blog preview b c t 6 layout",
        "[Spec] Kh i ph c card ui layout 4 mobile ch gi fix c n tr i header",
        "[Spec] Spec fix blog layout4 desktop preview parity",
        "[Spec] Spec fix blog layout4 parity",
        "[Spec] Spec fix blog layout4 preview final parity",
        "[Spec] Spec fix blog layout4 true parity",
        "[Spec] Spec fix blog preview parity drift"
      ]
    }
  },
  {
    "date": "2026-04-23",
    "phase": "Unified IA & Bookings",
    "title": "Add convex real data ops playbook",
    "categories": {
      "features": [
        "feat(skills): add convex real data ops playbook",
        "feat(home-components): recommend partners component"
      ],
      "improvements": [],
      "fixes": [
        "fix(posts): restore generator settings signature",
        "fix(lint): clear remaining warnings",
        "fix(lint): address safe repo warnings",
        "fix(snapshot): remove unused helpers"
      ]
    }
  },
  {
    "date": "2026-04-22",
    "phase": "Unified IA & Bookings",
    "title": "A partners v source faithful v b spacing th a",
    "categories": {
      "features": [
        "feat(home-components): add create search combobox",
        "feat(home-components): highlight more popular create options",
        "feat(partners): add oversized logo display modes",
        "feat(partners): roll out new partner logo layouts",
        "feat(homepage): add snapshot profiles and bin cleanup",
        "feat(homepage): replace quick create with snapshot flow",
        "feat(system): add module shortcut to smart wizard guide",
        "feat(system): add smart wizard guide",
        "feat(system): expand guides hub structure",
        "feat(system): add guides hub scaffold",
        "[Spec] Spec rewrite b i smart wizard theo h ng how to d hi u",
        "[Spec] Spec th m b i h ng d n smart wizard trong system huong dan",
        "[Spec] Thay smart wizard b ng home component snapshot export import zip fallback t nh"
      ],
      "improvements": [
        "refactor(homepage): viet hoa smart wizard copy",
        "refactor(system): simplify smart wizard guide copy",
        "refactor(system): simplify smart wizard guide",
        "refactor(system): compact guides navigation UI",
        "[Spec] A partners v source faithful v b spacing th a",
        "[Spec] Audit homepage realtime after home components crud",
        "[Spec] B sung skill t o v s a d li u convex cho saas n y",
        "[Spec] Chu n h a 4 layout partners theo source partner logos section",
        "[Spec] Chu n h a image mode runtime cho to n b partners kh p preview",
        "[Spec] Chu n h a sizing contract cho marquee badge carousel clean theo grid divider",
        "[Spec] G image first sai cho 4 layout partners v tr v sizing icon like ng source",
        "[Spec] Gi m spacing d preview partners grid v l m logo l n h n ng nh p",
        "[Spec] K o 4 layout partners v sizing source faithful t partner logos section",
        "[Spec] L m n i b t th m c c home component ph bi n trong nh m g i cho b n",
        "[Spec] M r ng image first occupancy cho 5 layout partners c n l i",
        "[Spec] M r ng snapshot nhi u profile giao di n d n bin d sau import quick snapshot syst",
        "[Spec] Rollout layout m i cho home component partners theo source partner logos section",
        "[Spec] Spec refactor system huong dan th nh kho b i vi t c ch ng m c ti u m c search n ",
        "[Spec] Spec refine ui system huong dan theo accordion compact enterprise",
        "[Spec] Spec t o khung system huong dan sidebar",
        "[Spec] T ng k ch th c logo partners v th m mode hi n t n ho c ch logo",
        "[Spec] Y logo grid g n full card theo ar v gi spacing t i thi u"
      ],
      "fixes": [
        "fix(partners): increase logo occupancy within frames",
        "fix(partners): normalize source-faithful logo sizing",
        "fix(partners): shrink oversized compact layouts",
        "fix(partners): restore source-faithful sizing",
        "fix(partners): tighten sizing contract for marquee badge carousel clean",
        "fix(partners): expand image-first occupancy",
        "fix(partners): align runtime image mode with preview",
        "fix(partners): maximize grid logo occupancy",
        "fix(partners): tighten sparse grid spacing",
        "fix(partners): restore source-faithful spacing",
        "fix(homepage): subscribe live home components on site",
        "fix(homepage): sync create overrides without refresh",
        "[Spec] Fix home component create realtime refresh"
      ]
    }
  },
  {
    "date": "2026-04-19",
    "phase": "Unified IA & Bookings",
    "title": "Keep hook order stable on detail page",
    "categories": {
      "features": [],
      "improvements": [],
      "fixes": [
        "fix(posts): keep hook order stable on detail page"
      ]
    }
  },
  {
    "date": "2026-04-17",
    "phase": "Unified IA & Bookings",
    "title": "Spec toggle custom link cho productcategories create edit preview site render",
    "categories": {
      "features": [
        "feat(footer): rebalance auto-generated legal links",
        "feat(footer): generate trust-aware footer columns",
        "feat(settings): add trust pages feature toggle with cleanup flow"
      ],
      "improvements": [
        "[Spec] Spec toggle custom link cho productcategories create edit preview site render",
        "[Spec] Th m toggle enabletrustpages t i system modules settings cleanup d li u trust kh",
        "[Spec] V2 sync trust toggle generate c t menu footer chu n bct google",
        "[Spec] V3 t i thi t k footer auto generate theo layout c n b ng c t 1 lo i tr ng ch gi "
      ],
      "fixes": [
        "fix(footer): remove unused generator types",
        "fix(sidebar): hide trust pages when disabled"
      ]
    }
  },
  {
    "date": "2026-04-16",
    "phase": "Unified IA & Bookings",
    "title": "C p nh t readme md ng n g n theo hi n tr ng d n",
    "categories": {
      "features": [
        "feat(speed-dial): add global visibility and default-open controls"
      ],
      "improvements": [
        "refactor(readme): simplify README.md for quick local setup in Vietnamese",
        "[Spec] C p nh t readme md ng n g n theo hi n tr ng d n",
        "[Spec] Spec m r ng speeddial to n site default m ng"
      ],
      "fixes": [
        "fix(ia-routing): unify detail links and resolve products runtime href typo",
        "fix(readme): remove unnecessary period from project privacy note",
        "fix(bookings): ẩn cấu hình đặt lịch ở services khi tắt module",
        "[Spec] 2026 04 16 spec fix ia unified links products posts services sweep",
        "[Spec] Fix hi n th sync booking khi t t module bookings admin services",
        "[Spec] Fix products referenceerror getdetailhref not defined"
      ]
    }
  },
  {
    "date": "2026-04-15",
    "phase": "Unified IA & Bookings",
    "title": "B tr ng th i s p y v chu n ho m u tr ng th i book",
    "categories": {
      "features": [
        "feat(bookings): add slot template presets with service overrides",
        "feat(bookings): add service-level booking toggle and hide disabled services in admin schedules",
        "feat(bookings): disable month navigation outside booking range",
        "feat(bookings): make public booking customer fields preset-driven",
        "feat(bookings): collapse /book form before service selection",
        "feat(bookings): upgrade /book service selector to combobox"
      ],
      "improvements": [
        "docs: add hotfix documentation for Convex validator mismatch in getBookingSettings",
        "chore(lint): stabilize oxlint type-check run and clear warnings",
        "refactor(bookings): remove near-full state from public booking availability",
        "refactor(services): simplify booking editor UI and collapse advanced slots",
        "refactor(services): move preview action into sticky footer",
        "refactor(posts): move preview action into sticky footer",
        "refactor(admin): unify sticky footer behavior with sidebar collapse",
        "refactor(bookings): simplify service booking field labels for clarity",
        "[Spec] B tr ng th i s p y v chu n ho m u tr ng th i book",
        "[Spec] Di chuy n n t xem tr n web c a post edit xu ng sticky footer",
        "[Spec] Ng b sticky footer admin theo source of truth hero",
        "[Spec] Refactor ui t l ch d ch v t i gi n ch n n ng cao d i xu ng d i n i dung"
      ],
      "fixes": [
        "fix(bookings): hiển thị màu còn chỗ và đã đầy đúng trạng thái ở /book",
        "fix(bookings): smooth admin search and keep filters stable",
        "fix(bookings): wire sticky footer save click on settings page",
        "[Spec] Fix gi t input search admin bookings ch reload ph n danh s ch",
        "[Spec] Fix m u tr ng th i c n ch y book"
      ]
    }
  },
  {
    "date": "2026-04-14",
    "phase": "Unified IA & Bookings",
    "title": "2026 04 14 bookings owner realignment system vs admin settings",
    "categories": {
      "features": [
        "feat(bookings): add preset advance-day select and sticky save footer",
        "feat(bookings): refine operating hours dial readability",
        "feat(bookings): support overnight operating hours settings",
        "feat(bookings): move booking settings to admin and refactor calendar UX",
        "feat(bookings): improve module settings UI and sidebar",
        "feat(bookings): add mvp booking module",
        "feat(homepage): simplify smart wizard to 2 steps",
        "feat(seed): replace wizard with industry templates",
        "feat(homepage): add smart wizard v3",
        "feat(lexical): add floating link editor",
        "feat(lexical): add undo redo link youtube",
        "feat(trust-pages): improve autogen structure and formatting",
        "feat(trust-pages): enrich autogen with rich formatting",
        "feat(trust-pages): add overwrite autogen option",
        "feat(trust-pages): enhance autogen content and admin flows",
        "feat(ia): complete unified route mode and slug conflict governance",
        "feat(admin-media): open file in new tab",
        "feat(media): store extension and backfill script",
        "feat(menu): enhance menu depth handling and improve layout responsiveness",
        "[Spec] Homepage smart wizard v3 module experience aware full component questioning 8 te",
        "[Spec] Implement bookings settings overnight hours dial dual slider convex wrap window",
        "[Spec] Implement tablet menu anti clipping v2 no vertical scroll no hardcoded xem th m",
        "[Spec] Refine admin wizard scope b c nh b o system only admin home components",
        "[Spec] Refine admin wizard scope hide system only readiness blocks on admin home compon"
      ],
      "improvements": [
        "Revert \"feat(seed): replace wizard with industry templates\"",
        "style(trust-pages): viet hoa UI va mo tab moi",
        "style(lexical): highlight links in editor and site",
        "chore(media): add extension check script",
        "[Spec] 2026 04 14 bookings owner realignment system vs admin settings",
        "[Spec] 2026 04 14 chuan hoa lexical insert link parity playground toan site",
        "[Spec] 2026 04 14 link color parity editor site blue",
        "[Spec] Audit chu n h a lexical toolbar output undo redo link youtube to n site admin",
        "[Spec] Audit chu n ho render richcontent to n site kh p lexical editor",
        "[Spec] Audit s u l i youtube gi t reset localhost dev chromium v k ho ch harden nh",
        "[Spec] Booking slot template tick override global theo th theo d ch v",
        "[Spec] Chu n h a dynamic booking customer fields theo coc",
        "[Spec] I gi m ng sang v ng k o 2 tay h tr ca qua ng y cho bookings settings",
        "[Spec] I maxadvancedays sang dropdown th m sticky save footer cho bookings settings",
        "[Spec] Kh a ui l ch book theo maxadvancedays v bi n th ng",
        "[Spec] Mvp booking spa first no login 3 public visibility modes",
        "[Spec] N ng c p ch n d ch v book t dropdown sang combobox",
        "[Spec] Refactor booking chuy n c u h nh v admin ui cu n l ch cho admin public",
        "[Spec] Refine operatinghoursdial to clock style with clear ticks",
        "[Spec] Tablet header menu anti clipping plan",
        "[Spec] Tablet menu anti clipping v2 no vertical scroll no hardcoded xem th m",
        "[Spec] Thu g n book khi ch a ch n d ch v",
        "[Spec] Toggle t l ch theo d ch v hi n c u h nh khi b t"
      ],
      "fixes": [
        "fix(bookings): restore settings ownership between system and admin",
        "fix(header): remove mega menu vertical scroll",
        "fix(header): prevent tablet menu clipping",
        "fix(bookings): ensure module appears for existing data",
        "fix(images): normalize localhost proxy urls",
        "fix(homepage): use allowed unsplash image url",
        "fix(homepage): hide system-only actions in admin wizard",
        "fix(rich-content): stabilize youtube iframe render",
        "fix(rich-content): prevent youtube reset on scroll",
        "fix(lexical): guard youtube node registration",
        "fix(posts): improve related-posts fallback without thumbnail",
        "fix(rich-content): normalize site render contract to match lexical",
        "fix(rich-content): prevent prose overrides on richtext",
        "fix(rich-content): drop prose for richtext render",
        "fix(rich-content): align site styles with lexical output",
        "fix(trust-pages): enforce inline styles for consistent site render",
        "fix(trust-pages): overwrite deletes policy posts before regen",
        "chore(convex): remove unused ConvexError imports",
        "fix(migration-bundle): map mime by image url",
        "fix(media): allow backfill pagination",
        "fix(migration-bundle): infer mime from storage ids",
        "fix(migration-bundle): preserve media mime types",
        "[Spec] Fix bookings settings sticky footer save not clickable",
        "[Spec] Fix youtube iframe reset khi scroll tr n site th c",
        "[Spec] Hotfix convex validator mismatch cho getbookingsettings"
      ]
    }
  },
  {
    "date": "2026-04-13",
    "phase": "Unified IA & Bookings",
    "title": "Spec full implement trust pages auto generate tu du lieu thuc",
    "categories": {
      "features": [
        "[Spec] Spec full implement trust pages auto generate tu du lieu thuc"
      ],
      "improvements": [
        "[Spec] Spec port 1 1 commit feat menu t kdc sang system vietadmin nextjs",
        "[Spec] Spec v2 unified default ia hub ch ng xung t slug t ng t thao t c admin"
      ],
      "fixes": [
        "[Spec] I u tra bin trong migration bundle media k ho ch fix mime extension g c"
      ]
    }
  },
  {
    "date": "2026-04-11",
    "phase": "Unified IA & Bookings",
    "title": "Refactor hover safe mega menu t ng 5 kh ng hi n s m",
    "categories": {
      "features": [
        "feat(system-data): add migration bundle export/import for 6 core modules",
        "feat(menus): support mega menu depth up to five levels"
      ],
      "improvements": [
        "refactor(menus): simplify admin layout and compact stats panel",
        "[Spec] Refactor hover safe mega menu t ng 5 kh ng hi n s m",
        "[Spec] Spec ai friendly migration bundle 6 modules",
        "[Spec] Spec mega menu cho menu s u 4 5 t ng",
        "[Spec] Tinh ch nh interaction mega menu theo best practice hover safe"
      ],
      "fixes": [
        "fix(migration-bundle): address lint warnings for value formatting and composite keys",
        "fix(menus): enforce contiguous menu depth structure in editor",
        "fix(menus): hard-cap menu items to 500 and remove per-page setting",
        "fix(modules): avoid disabling system linked fields on feature toggle",
        "fix(menus): allow recreating header menu after data clear",
        "fix(header): restore legacy shallow menu dropdowns",
        "fix(header): split shallow and deep menu desktop behavior",
        "fix(menus): clamp menu items when reducing max depth",
        "fix(header): improve deep-menu hover-safe corridor",
        "fix(header): add hover-safe progressive reveal",
        "fix(header): place level-5 flyout below level-4",
        "fix(header): refine mega menu hover behavior",
        "fix(menus): show depth 4-5 cues in admin editor"
      ]
    }
  },
  {
    "date": "2026-04-10",
    "phase": "Unified IA & Bookings",
    "title": "B preview kh i product supplemental content settings",
    "categories": {
      "features": [
        "feat(products): thêm template nội dung bổ sung chi tiết",
        "feat(admin): add functional header autocomplete search",
        "feat(site): restore realtime public shell updates"
      ],
      "improvements": [
        "docs(agents): thêm guideline thao tác dữ liệu Convex thật",
        "refactor(admin): giảm spacing supplemental content settings",
        "refactor(admin): gom section supplemental content thành collapse",
        "refactor(products): gộp supplemental content và làm gọn FAQ UI",
        "refactor(products): bỏ preview ở supplemental content settings",
        "refactor(admin): full-width layout cho supplemental content",
        "refactor(agents): chuẩn hóa spec output contract",
        "refactor(admin): co spacing section khi ẩn group title",
        "refactor(admin): gọn hơn sidebar điều hướng",
        "[Spec] B preview kh i product supplemental content settings",
        "[Spec] B sung ch c n ng x a template supplemental content trong admin settings",
        "[Spec] Gom section product supplemental content settings th nh collapse g n ui",
        "[Spec] Refactor supplemental content tr n trang chi ti t s n ph m"
      ],
      "fixes": [
        "fix(products): thêm action xóa template supplemental content",
        "fix(products): ẩn setting khung viền khi tắt",
        "fix(admin): simplify search input actions"
      ]
    }
  },
  {
    "date": "2026-04-09",
    "phase": "Unified IA & Bookings",
    "title": "Chu n h a spec th t c nh nh s thu t ng song ng",
    "categories": {
      "features": [],
      "improvements": [
        "[Spec] Chu n h a spec th t c nh nh s thu t ng song ng",
        "[Spec] Chuy n public shell t cache 60s sang realtime theo pattern kdc",
        "[Spec] Products module n form khung vi n s n ph m khi t t",
        "[Spec] Products supplemental content templates cho chi ti t s n ph m",
        "[Spec] Refactor ui trang product supplemental content sang full width sticky footer",
        "[Spec] T i u header admin gi m spacing 15 search autocomplete fuzzy menu list edit",
        "[Spec] T i u ui ux sidebar admin n title group n i dashboard scrollbar m nh gi m spacin",
        "[Spec] Tinh ch nh search input admin b icon tr ng v th m n t clear nhanh",
        "[Spec] Tinh ch nh spacing sidebar khi n group title co theo i u ki n m c v a 35"
      ],
      "fixes": []
    }
  },
  {
    "date": "2026-04-07",
    "phase": "Unified IA & Bookings",
    "title": "Apply public image policies",
    "categories": {
      "features": [
        "feat(site): apply public image policies",
        "feat(site): optimize public image policy",
        "feat(admin): disable image optimization in admin",
        "feat(product-frames): validate custom overlay aspect ratio",
        "feat(product-frames): enable draggable logo position",
        "feat(product-frames): add logo preview sliders",
        "feat(product-frames): use site logo for logo frames"
      ],
      "improvements": [],
      "fixes": [
        "fix(product-frames): remove unused handlers",
        "fix(product-frames): localize aspect ratio label",
        "fix(product-detail): remove preview frame",
        "fix(product-detail): isolate preview frames",
        "fix(product-frames): keep frame in lightbox",
        "fix(product-detail): lift main image frame layer",
        "fix(product-detail): apply frames to related cards"
      ]
    }
  },
  {
    "date": "2026-04-06",
    "phase": "Unified IA & Bookings",
    "title": "Audit ch nh public ang t n quota nh ng kh ng c n optimize",
    "categories": {
      "features": [
        "feat(product-frames): refine line frame controls",
        "feat(product-frames): simplify line controls and fixed fit",
        "feat(settings): simplify product frames UX",
        "feat(admin): split settings pages",
        "feat(products): add product image frames",
        "feat(products): centralize image aspect ratio",
        "feat(product-detail): add fullscreen image lightbox toggle",
        "[Spec] Implement fix drag logo lightbox frame parity",
        "[Spec] Implement full spec ux khung line color preview inset b contain cover",
        "[Spec] Implement ux khung line ornamental dashed shadow slider m r ng range"
      ],
      "improvements": [
        "chore(guidelines): add spec elaboration blocks",
        "chore(guidelines): chuan hoa mermaid defaults",
        "[Spec] Audit ch nh public ang t n quota nh ng kh ng c n optimize",
        "[Spec] B sung section gi i th ch s u cho spec trong agents",
        "[Spec] C i ti n guideline mermaid trong agents",
        "[Spec] C p nh t ux khung line ornamental dashed shadow slider m r ng range inset v d y",
        "[Spec] Chu n h a ux khung logo theo pattern khung line",
        "[Spec] Gi m m nh image optimization quota vercel hobby m v n m t",
        "[Spec] I khung logo sang 1 logo k o th l u t a 1",
        "[Spec] I khung logo sang 1 logo k o th l u t a",
        "[Spec] Khung vi n s n ph m theo ar v i preset m a v v custom admin",
        "[Spec] N ng c p spec khung vi n s n ph m theo ar",
        "[Spec] N productframemanager khi t t enableproductframes",
        "[Spec] Ng b logo khung s n ph m v i site_logo trong admin settings",
        "[Spec] Refactor ux product frames sticky save cho to n b admin settings",
        "[Spec] Remove product detail preview frame 1",
        "[Spec] Remove product detail preview frame",
        "[Spec] Source of truth ar nh s n ph m t i system modules products",
        "[Spec] Spec th m modal xem nh full screen cho product detail d ng chung 3 layout",
        "[Spec] T ch admin settings th nh 4 trang dropdown sidebar n i r ng max w 7xl",
        "[Spec] T i u public image quota theo ki u saas resource constrained 1",
        "[Spec] T i u public image quota theo ki u saas resource constrained",
        "[Spec] T i u ux lo i khung line color preview inset r ngh a b contain cover"
      ],
      "fixes": [
        "fix(products): hide frame manager when disabled",
        "fix(product-frames): normalize frame wiring",
        "fix(product-detail): keep description toggle after expand",
        "[Spec] Audit fix product detail preview frame overflow",
        "[Spec] Fix drag logo m t v gi khung trong lightbox product detail",
        "[Spec] Fix l i typecheck runtime c a product frame",
        "[Spec] Fix product description toggle",
        "[Spec] Fix product detail image frames for main image and related products",
        "[Spec] Fix product detail main image frame layering"
      ]
    }
  },
  {
    "date": "2026-04-05",
    "phase": "Unified IA & Bookings",
    "title": "L m m t thumbnail gallery b ng css crossfade preload",
    "categories": {
      "features": [],
      "improvements": [
        "[Spec] L m m t thumbnail gallery b ng css crossfade preload"
      ],
      "fixes": [
        "fix(product-detail): smooth main image transition with crossfade preload",
        "fix(product-detail): advance thumbnail selection",
        "[Spec] Fix gi t khi b m m i t n thumbnail rail i lu n nh active"
      ]
    }
  },
  {
    "date": "2026-04-04",
    "phase": "Unified IA & Bookings",
    "title": "Spec gom image aspect ratio dung chung 3 layout",
    "categories": {
      "features": [
        "feat(product-detail): add full image section below description",
        "feat(product-detail): support 7 image aspect ratios across layouts",
        "feat(system): add expiring super admin trials and admin countdown",
        "[Spec] Spec them toggle section toan bo anh duoi mo ta product detail"
      ],
      "improvements": [
        "[Spec] Spec gom image aspect ratio dung chung 3 layout",
        "[Spec] Spec gom section toan bo anh vao cung khoi mo ta",
        "[Spec] Spec gop expand chung mo ta va anh",
        "[Spec] Spec product detail 7 ar cho 3 layout"
      ],
      "fixes": [
        "fix(product-detail): sync thumbnail rail height",
        "fix(product-detail): unify description and images expand behavior",
        "fix(product-detail): inline all-images block into description section",
        "fix(product-detail): share image aspect ratio across layouts",
        "fix(product-detail): emphasize buy now CTA default",
        "fix(product-detail): enhance buy now CTA states",
        "fix(product-detail): remove modern benefits block under highlights",
        "fix(product-detail): remove duplicate highlights in modern split",
        "fix(posts): sync edit slug with title",
        "[Spec] Fix l ch nh ph vs nh ch nh cho product detail 7 ar site preview"
      ]
    }
  },
  {
    "date": "2026-04-03",
    "phase": "Unified IA & Bookings",
    "title": "Posts edit slug sync spec",
    "categories": {
      "features": [
        "feat(products): add copy and bulk status actions"
      ],
      "improvements": [
        "chore(products): viet hoa bulk action labels",
        "[Spec] Posts edit slug sync spec",
        "[Spec] Spec admin products copy va bulk status actions",
        "[Spec] Spec super admin trial c th i h n countdown admin",
        "[Spec] Spec viet hoa bulk actions products"
      ],
      "fixes": [
        "[Spec] Fix product detail modern benefits dup with highlights",
        "[Spec] Fix product detail modern highlights dup",
        "[Spec] Spec fix product detail buy now cta premium hover"
      ]
    }
  },
  {
    "date": "2026-04-01",
    "phase": "Unified IA & Bookings",
    "title": "Convex cli export db storage v th m c local",
    "categories": {
      "features": [],
      "improvements": [
        "[Spec] Convex cli export db storage v th m c local"
      ],
      "fixes": []
    }
  },
  {
    "date": "2026-03-27",
    "phase": "Calendar & Custom Colors",
    "title": "Audit read only ssh key v agent github",
    "categories": {
      "features": [
        "feat(site): cache public settings and revalidate SEO"
      ],
      "improvements": [
        "perf(homepage): lazy load non-critical hero slides",
        "perf(homepage): cut critical runtime for hero and stats",
        "perf(homepage): trim startup runtime and fallback paths",
        "perf(homepage): keep server seeded components stable",
        "refactor(homepage): introduce typed runtime registry",
        "perf(homepage): defer critical runtime on mobile",
        "perf(homepage): defer telemetry and header data",
        "perf(homepage): prioritize critical render",
        "[Spec] Audit read only ssh key v agent github",
        "[Spec] Audit t i u fcp lcp ttfb cho trang ch",
        "[Spec] Ch n o n l i git push permission denied",
        "[Spec] Checklist x c minh speed insights ch y tr n production",
        "[Spec] K ho ch port ch nh l ch t ktec sang system vietadmin nextjs",
        "[Spec] Ki n tr c l i homepage t mobile 90 server first tr nh v l",
        "[Spec] Pha 3 y mobile homepage l n 90 c c m nh r i ro th p",
        "[Spec] Pha ch t y mobile t m c hi n t i l n 90 b ng defer m nh nh ng kh ng i t nh n ng",
        "[Spec] Pha ti p theo t mobile 69 l n 90 song song a b commit nh kh ng i t nh n ng",
        "[Spec] S a vercel deploy fail do peer conflict c a speed insights",
        "[Spec] Spec s u homepage first performance strategy cho next",
        "[Spec] Spec tinh ch nh mobile first sau deploy homepage",
        "[Spec] T ch h p vercel speed insights cho public site"
      ],
      "fixes": [
        "fix(homepage): restore hero ssr render path",
        "fix(seo): tolerate site url fetch failures at build",
        "fix(site): wrap useCart within provider",
        "fix(build): allow legacy peer deps",
        "[Spec] Fix build vercel eresolve cho vercel speed insights",
        "[Spec] Fix nhanh robots sitemap kh ng c p nh t domain sau khi i trong settings module",
        "[Spec] Fix push ng repo infoktecvina code scope repo hi n t i",
        "[Spec] Fix runtime usecart ngo i cartprovider trong siteshell"
      ]
    }
  },
  {
    "date": "2026-03-26",
    "phase": "Calendar & Custom Colors",
    "title": "Port th c ng 3 commit m i nh t t system nhan sang system vietadmin nextjs",
    "categories": {
      "features": [
        "feat(posts): support scheduled publish flow",
        "feat: port product detail seo and related modes",
        "feat(analytics): add Vercel Analytics",
        "feat(seo): sync metadata and revalidation"
      ],
      "improvements": [
        "[Spec] Port th c ng 3 commit m i nh t t system nhan sang system vietadmin nextjs",
        "[Spec] Port th c ng 6 commit m i t system nhan sang system vietadmin nextjs"
      ],
      "fixes": [
        "fix: remove unused sale mode query",
        "fix: add ws for convex cli",
        "[Spec] Fix warning oxlint salemodesetting unused product detail layout"
      ]
    }
  },
  {
    "date": "2026-03-25",
    "phase": "Calendar & Custom Colors",
    "title": "Port 3 commit seo m i nh t t system nhan sang system vietadmin nextjs",
    "categories": {
      "features": [
        "feat(posts): enforce CoC generator presets",
        "feat(posts): improve SEO headings and sanitize content",
        "feat(posts): apply flat gallery rules and CTA polish",
        "feat(posts): add gallery strip and modal preview",
        "feat(posts): tighten generator editorial flow",
        "feat(posts): polish generator html layout",
        "feat(posts): upgrade auto generator html-first",
        "feat(posts): allow manual top product selection",
        "feat(posts): make generator form CoC by template"
      ],
      "improvements": [
        "refactor(posts): simplify generator field set",
        "build(deps): update convex dependency from 1.31.2 to 1.34.0",
        "[Spec] Port 3 commit seo m i nh t t system nhan sang system vietadmin nextjs",
        "[Spec] Spec ch n x s n ph m th c ng cho template top ranking",
        "[Spec] Spec coc dynamic generator form cho admin posts create",
        "[Spec] Spec v2 n ng c p auto generator data driven s u h n html first seo chu n",
        "[Spec] Spec v3 n ng c p html output auto generator layout chuy n nghi p responsive affi",
        "[Spec] Spec v4 tinh g n editorial generator ti u c th b i li n m ch b faq c ng",
        "[Spec] Spec v5 polish gallery ui b table kh ng c n thi t nh 1 h ng n v modal i u h ng",
        "[Spec] Spec v6 flat enterprise polish gallery rule m i text only compare table cta s ng",
        "[Spec] Spec v7 seo content quality heading t nhi n narrative cu n h t hashtag ng ng int",
        "[Spec] Spec v8 coc first auto generator kh a preset create system ch c n 1 toggle"
      ],
      "fixes": [
        "fix: await image remove handler",
        "fix(posts): use relative seo import",
        "[Spec] Fix l i convex cli thi u module ws",
        "[Spec] Fix ts2307 import alias trong generator assembler"
      ]
    }
  },
  {
    "date": "2026-03-24",
    "phase": "Calendar & Custom Colors",
    "title": "Chu n h a source of truth cho naming nh upload trong admin",
    "categories": {
      "features": [
        "feat(posts): add auto post generator",
        "feat(admin): standardize image upload naming"
      ],
      "improvements": [
        "[Spec] Chu n h a source of truth cho naming nh upload trong admin",
        "[Spec] Spec p d ng i m m i t system nhan v o system vietadmin nextjs",
        "[Spec] Spec v2 auto post generator a d ng m nh cho posts module"
      ],
      "fixes": [
        "fix(site): guard product detail images",
        "fix(media): slug naming and cleanup refs",
        "fix(site): stabilize brand colors and hero priority",
        "[Spec] Fix naming slug based cleanup media theo reference cho products posts services",
        "[Spec] Fix product detail crash khi nh r ng invalid src"
      ]
    }
  },
  {
    "date": "2026-03-21",
    "phase": "Calendar & Custom Colors",
    "title": "So sanh system ruou vang vs core portable features",
    "categories": {
      "features": [
        "feat(core): port footer/benefits/hero seed options",
        "feat(speed-dial): add toggle default closed",
        "[Spec] So sanh system ruou vang vs core portable features"
      ],
      "improvements": [
        "chore(assets): update bct logo image",
        "chore(assets): switch bct logo to webp"
      ],
      "fixes": [
        "fix(oxlint): dọn unused imports và state",
        "fix(speed-dial): tighten site offsets",
        "fix(speed-dial): clean preview signals",
        "fix(speed-dial): align closed state to edge",
        "fix(speed-dial): anchor closed state to edge",
        "fix(speed-dial): tighten spacing near scrollbar"
      ]
    }
  },
  {
    "date": "2026-03-20",
    "phase": "Calendar & Custom Colors",
    "title": "Add homepage category hero category avatar size and icon mode",
    "categories": {
      "features": [
        "feat(speed-dial): refresh 6 layouts",
        "feat(contact-inbox): viet hoa va hoan thien admin",
        "feat(homepage-category-hero): add avatar size and icon mode",
        "feat(homepage-category-hero): add layout variants",
        "feat(homepage-category-hero): add auto-generate and hover menu",
        "feat(homepage-category-hero): add mega menu structure",
        "feat(homepage-category-hero): add layout styles"
      ],
      "improvements": [
        "refactor(homepage-category-hero): simplify generate actions",
        "refactor(homepage-category-hero): trim redundant menu copy",
        "refactor(homepage-category-hero): collapse category menu editor",
        "refactor(homepage-category-hero): tighten category menu grid",
        "refactor(homepage-category-hero): simplify real-data menu flow",
        "refactor(homepage-category-hero): clone responsive sample layout",
        "refactor(homepage-category-hero): simplify coc and align wolf",
        "refactor(homepage-category-hero): align wolf layout",
        "chore(agents): prioritize sub-agent delegation",
        "refactor(homepage-category-hero): drop experience wiring",
        "chore(spec): clarify spec output contract",
        "[Spec] Add homepage category hero category avatar size and icon mode",
        "[Spec] Audit homepage category hero dual brand system support",
        "[Spec] Refine homepage category hero dual mode secondary visibility",
        "[Spec] Refine homepage category hero generate logic to match user rule",
        "[Spec] Refine homepage category hero root child product allocation",
        "[Spec] Rollback lexical root alias startup crash",
        "[Spec] Spec contact inbox viet hoa va hoan thien admin",
        "[Spec] Spec gi speed dial d nh m p ph i c khi ch a c back to top",
        "[Spec] Spec home components sticky footer align like products",
        "[Spec] Spec ng b speed dial 6 layout cho create edit v site render",
        "[Spec] Spec p site render speed dial s t m p h n preview",
        "[Spec] Spec p speed dial closed state s t m p ph i th c s",
        "[Spec] Spec s a preview speed dial theo evidence m i t nh",
        "[Spec] Spec th m toggle ng m m c nh n cho speed dial",
        "[Spec] Spec tinh g n back to top v p speed dial s t m p ph i",
        "[Spec] Stabilize lexical dev by opting out of turbopack",
        "[Spec] Th m 5 layout cho homepage category hero t source zip b dark layout"
      ],
      "fixes": [
        "fix(homepage-category-hero): avoid dup group title",
        "fix(home-components): sync footer offset with sidebar",
        "fix(home-components): align sticky footer to products layout",
        "fix(homepage-category-hero): scale container and soften radius",
        "fix(lexical): restore monolithic editor boundary",
        "fix(lexical): run dev with webpack",
        "fix(lexical): flatten imports for turbopack hmr",
        "fix(lexical): rollback turbopack root alias",
        "fix(lexical): stabilize turbopack resolve aliases",
        "fix(lexical): transpile packages for turbopack",
        "fix(lexical): isolate editor client boundary",
        "fix(home-components): sticky footer and hero avatar shape",
        "fix(homepage-category-hero): boost secondary visibility",
        "fix(homepage-category-hero): apply dual-brand tokens",
        "fix(homepage-category-hero): wire dual brand accents",
        "fix(homepage-category-hero): stabilize dirty state deps",
        "fix(homepage-category-hero): track style dirty state",
        "fix(homepage-category-hero): fallback to root products when children empty",
        "fix(homepage-category-hero): enforce deterministic tiered generation",
        "fix(homepage-category-hero): guard missing hero query",
        "fix(homepage-category-hero): regenerate tree with product fallback",
        "fix(homepage-category-hero): add auto-generate feedback",
        "fix(homepage-category-hero): use subtree stats for hide-empty",
        "fix(homepage-category-hero): honor hide-empty option during generation",
        "fix(homepage-category-hero): stabilize generate toggle state",
        "fix(homepage-category-hero): restore menu depth without duplicate headings",
        "fix(homepage-category-hero): skip duplicate fallback links",
        "fix(homepage-category-hero): preserve hover state for first item",
        "fix(homepage-category-hero): restore hover for empty categories",
        "fix(homepage-category-hero): relax admin layout breakpoints",
        "fix(homepage-category-hero): stabilize effect deps in preview",
        "fix(homepage-category-hero): stabilize slider and category CTAs",
        "fix(homepage-category-hero): improve hover slider and CTA",
        "[Spec] Audit fix homepage category hero regenerate tree product fallback",
        "[Spec] Fix dirty state homepagecategoryhero khi i layout",
        "[Spec] Fix homepage category hero auto generate no feedback",
        "[Spec] Fix homepage category hero dual brand color system parity",
        "[Spec] Fix homepage category hero dup shape sticky footer and lexical hmr",
        "[Spec] Fix homepage category hero missing convex hero query guard",
        "[Spec] Fix lexical hmr runtime next16 turbopack keep turbopack",
        "[Spec] Fix lexical hmr runtime next16 turbopack",
        "[Spec] Fix lexical turbopack hmr option a",
        "[Spec] Fix lexical turbopack hmr with flatter graph",
        "[Spec] Fix oxlint type aware full repo",
        "[Spec] Fix useeffect dependency array changed size homepagecategoryheroeditpage",
        "[Spec] Spec fix home components sticky footer sidebar collapse offset",
        "[Spec] Spec fix homepage category hero auto generate dup group title",
        "[Spec] Spec fix homepage category hero scale maxw radius mobile preview"
      ]
    }
  },
  {
    "date": "2026-03-19",
    "phase": "Calendar & Custom Colors",
    "title": "Audit homepage category hero layout gap",
    "categories": {
      "features": [
        "feat(homepage-hero): add category hero experience and component",
        "feat(header): tach sticky desktop mobile",
        "feat(product-detail): refine mobile layout",
        "feat(product-detail): optimize mobile gallery",
        "feat(product-detail): improve desktop thumbnail rail"
      ],
      "improvements": [
        "[Spec] Audit homepage category hero layout gap",
        "[Spec] Clone updated musical instruments sample for homepage category hero",
        "[Spec] Clone wolf homepage category hero structure",
        "[Spec] Homepage category hero hover auto generator productization",
        "[Spec] N ng c p spec mode output r r ng ki u feynman",
        "[Spec] Refactor homepage category hero to wolf pattern",
        "[Spec] Refine homepage category hero to match wolf and simplify coc",
        "[Spec] Spec homepage category hero remove experience and standardize component",
        "[Spec] U ti n sub agent cho task t trung b nh tr l n trong agents"
      ],
      "fixes": [
        "fix(homepage-hero): align preview and runtime behavior",
        "[Spec] Fix homepage category hero hover slider scroll ngang v auto nh theo danh m c",
        "[Spec] Fix hover slider and category cta for homepage category hero"
      ]
    }
  },
  {
    "date": "2026-03-18",
    "phase": "Calendar & Custom Colors",
    "title": "I u ch nh l i thang spacing header v 7 n c g n h n",
    "categories": {
      "features": [
        "feat(loading): preload header and refine hero skeleton",
        "feat(experience): add loading states skeleton config",
        "feat(header): tinh chỉnh thang spacing gọn",
        "feat(header): thêm cấu hình spacing header",
        "feat(header): thêm biến thể border logo",
        "feat(header): thêm tuỳ chọn border logo"
      ],
      "improvements": [
        "refactor(loading): remove loading states experience",
        "[Spec] I u ch nh l i thang spacing header v 7 n c g n h n",
        "[Spec] M r ng border logo flat design cho menu experience",
        "[Spec] Spec audit v n ng c p loading homepage header above the fold",
        "[Spec] Spec b loading states v chuy n sang coc loading m c nh ki u saas",
        "[Spec] Spec c i thi n nh ph desktop cho product detail",
        "[Spec] Spec h th ng loading skeleton t i d ng cho homepage v nhi u page",
        "[Spec] Spec homepage category hero special home component",
        "[Spec] Spec t i u mobile cho product detail",
        "[Spec] Spec tinh ch nh mobile product detail sau v ng 2",
        "[Spec] T ch sticky header desktop mobile cho experience menu",
        "[Spec] Th m c u h nh spacing tr n d i cho header menu",
        "[Spec] Th m tu ch n border logo c nh n n logo trong menu experience"
      ],
      "fixes": []
    }
  },
  {
    "date": "2026-03-15",
    "phase": "Calendar & Custom Colors",
    "title": "Spec gallery stories mobile gi ng desktop",
    "categories": {
      "features": [
        "feat(header): thêm tùy chọn nền logo và cải thiện giao diện bài viết",
        "feat(admin/menus): thêm bulk action xóa hàng loạt menu items",
        "feat(products): thêm tùy chọn cắt ảnh 1:1 khi upload ảnh đại diện",
        "[Spec] Full implement fix 4 seo gaps safe optimized"
      ],
      "improvements": [
        "refactor(faq): nâng cấp 6 layout theo chuẩn SaaS enterprise",
        "refactor(posts-detail): dùng chung một bộ thiết lập hiển thị cho mọi layout",
        "[Spec] Spec gallery stories mobile gi ng desktop",
        "[Spec] Spec parity gallery stories gi a preview v site"
      ],
      "fixes": [
        "fix(header): avoid brand background behind logo",
        "fix(header): allow mobile root menu navigation",
        "fix(hero): remove fullscreen letterboxing",
        "fix(gallery): parity stories layout on site",
        "fix(gallery): align stories mobile layout",
        "fix(products-list): tối ưu bộ lọc mobile",
        "fix(hero): ẩn nút slider trên mobile ở site render",
        "fix(hero): ẩn nút điều hướng slider trên mobile preview",
        "fix(faq): guard APCA cho badge va icon solid",
        "fix(admin/footer): thêm gợi ý cấu hình cột và link",
        "fix(seo): normalize hreflang, site schema, and landing images",
        "fix(admin/menus): giữ draft item khi menu đang rỗng",
        "fix(admin/menus): reset pagination khi danh sách rỗng",
        "fix(settings): ẩn verification fields khỏi admin settings",
        "fix(posts-detail): ẩn ảnh đại diện khi thiếu và thêm toggle hiển thị ảnh chi tiết",
        "fix(product-detail): bỏ badge giảm giá trùng ở minimal",
        "fix(product-detail): giảm khoảng trắng dư ở layout Minimal",
        "fix(product-detail): chuẩn hoá layout Minimal 1:1, typography và badge giảm giá",
        "fix(product-detail): sửa badge giảm giá bị ảnh đè ở modern hero",
        "fix(product-detail): hiển thị lại badge giảm giá ở ảnh chính",
        "fix(product-detail): tối ưu layout Modern gallery, badge giảm giá và spacing",
        "fix(products): bỏ nút edit ảnh và giữ nút x chỉ để xóa",
        "fix(products): ưu tiên ảnh đại diện đã crop ở trang chi tiết",
        "fix(products): đảm bảo crop 1:1 cho ảnh chính và thư viện",
        "[Spec] Fix hero fullscreen d kho ng tr n d i preview site runtime",
        "[Spec] Fix mobile hamburger menu t ng 0 kh ng click c site render 3 layouts",
        "[Spec] Fix n n d i logo kh ng vu ng header"
      ]
    }
  },
  {
    "date": "2026-03-14",
    "phase": "Calendar & Custom Colors",
    "title": "Add editable site verification tokens",
    "categories": {
      "features": [
        "feat(system-seo): add editable site verification tokens",
        "feat(seo): make site verification configurable",
        "feat: enhance system seo overview and checklist UX",
        "feat: auto sync seo landings from source changes",
        "feat: streamline system seo actions and prompt",
        "feat: upgrade system seo checklist center"
      ],
      "improvements": [
        "chore: remove seo prompt studio from system seo"
      ],
      "fixes": [
        "fix(seo): render verification metadata for bots",
        "fix: set root metadataBase for app metadata",
        "fix: resolve seo checklist hook lint warnings",
        "fix: make seo landing auto generation evidence-first"
      ]
    }
  },
  {
    "date": "2026-03-13",
    "phase": "Calendar & Custom Colors",
    "title": "Audit icon zalo tiktok contact create edit theo footer",
    "categories": {
      "features": [
        "feat: sync public light mode and logo sizing",
        "feat: add rich content render options",
        "feat: sync admin editor and hero updates",
        "feat: sync pricing and convex errors from dien-tran"
      ],
      "improvements": [
        "docs: add branch cleanup plan",
        "[Spec] Audit icon zalo tiktok contact create edit theo footer",
        "[Spec] K ho ch gom to n b v master v x a nh nh ph",
        "[Spec] K ho ch ng b core t system dien tran b ng merge base rebase",
        "[Spec] Ng b t ng size footer gi a preview admin v site th t",
        "[Spec] Spec c i t ui ux progress seo cho system seo",
        "[Spec] Spec c i ti n ux system seo _blank data th t prompt studio",
        "[Spec] Spec system seo th nh seo checklist center th c d ng d hi u thao t c nhanh",
        "[Spec] T ng 20 icon social v logo bct cho footer home component",
        "[Spec] T ng th m 30 k ch th c footer cho preview v site th t"
      ],
      "fixes": [
        "fix: scale footer social and BCT sizes further",
        "fix: sync footer social and BCT sizes on site",
        "fix: increase footer social and BCT logo sizes",
        "fix: align contact social icons with footer",
        "fix: raise fullscreen dots above content",
        "fix: keep fullscreen hero content above overlay",
        "fix: bring hero fullscreen content above overlay",
        "[Spec] Fix dots fullscreen kh ng click c site preview",
        "[Spec] Fix hero fullscreen overlay ch trong create edit",
        "[Spec] Fix layering fullscreen hero tr n site renderer khi chuy n slide",
        "[Spec] Hotfix system seo b progress bar d kh i ph c click tab"
      ]
    }
  },
  {
    "date": "2026-03-11",
    "phase": "Calendar & Custom Colors",
    "title": "2026 03 11 implement full 9 home components custom font",
    "categories": {
      "features": [
        "feat: refine seo sitemaps and schemas",
        "feat: enrich seo internal links",
        "feat: expand public seo coverage",
        "feat: add nextjs seo guideline skill",
        "feat: move landing pages to system seo",
        "feat: add bulk status actions for landing pages",
        "feat: auto-generate seo landing pages",
        "feat: enhance seo with llms and hub links",
        "feat: add geo seo monolithic skill",
        "feat: add custom font support for Footer",
        "feat: add custom font support for Career",
        "feat: add custom font support for Contact",
        "feat: add custom font support for Video",
        "feat: add custom font support for Team",
        "feat: add custom font support for About",
        "feat: add custom font support for FAQ",
        "feat: add custom font support for Countdown",
        "feat: add custom font support for VoucherPromotions",
        "[Spec] 2026 03 11 implement full 9 home components custom font",
        "[Spec] Spec full implement 4 h ng m c seo geo robots llms metadata heading schema inter"
      ],
      "improvements": [
        "[Spec] 80 20 competitive seo sprint kiotviet haravan sapo",
        "[Spec] Chuy n qu n l landing pages sang system seo theo tab",
        "[Spec] Spec auto seo landing theo modules data coc kh ng d ng ai b n th 3",
        "[Spec] Spec n ng c p full seo cho to n b public site b ng nextjs seo guideline",
        "[Spec] Spec phase ti p theo n ng cao rich results internal links",
        "[Spec] Spec t o skill monolithic geo seo full scope trong factory skills",
        "[Spec] Spec t o skill seo guideline t 5 next js seo repos",
        "[Spec] Th m bulk action status m trang seo nhanh admin landing pages"
      ],
      "fixes": [
        "fix: remove hardcoded post detail links",
        "fix: avoid multi paginate in landing plan",
        "[Spec] Fix l i convex multi paginate trong landingpages auto generate"
      ]
    }
  },
  {
    "date": "2026-03-10",
    "phase": "Calendar & Custom Colors",
    "title": "Custom font system cho home components system admin site",
    "categories": {
      "features": [
        "feat: add custom font support for Pricing",
        "feat: add custom font support for CTA",
        "feat: add custom font support for Clients",
        "feat: add custom font support for Gallery",
        "feat: add custom font support for CaseStudy",
        "feat: add custom font support for Testimonials",
        "feat: add custom font support for Process",
        "feat: add custom font support for Services",
        "feat: add custom font support for Features",
        "feat: add custom font support for Benefits",
        "feat: add custom font support for Blog",
        "feat: add custom font support for ServiceList",
        "feat: add custom font support for CategoryProducts",
        "feat: add custom font support for ProductGrid",
        "feat: add custom font support for ProductList",
        "feat: add custom font support for ProductCategories",
        "feat: add custom font support for TrustBadges",
        "feat: add custom font support for Partners",
        "feat: add custom font support for Stats",
        "feat: add custom font support for Hero",
        "feat: add font override foundation for home components",
        "feat: complete SEO zero-config full implementation",
        "feat: full SEO zero-config platform + full SaaS landing surface (CoC, world-class)",
        "feat: refactor dynamic SEO metadata engine",
        "feat: bulk hide unused home component types"
      ],
      "improvements": [
        "[Spec] Custom font system cho home components system admin site",
        "[Spec] S a bulk action n hi n system home components",
        "[Spec] Ti p t c rollout custom font cho c c home components c n l i t process tr i",
        "[Spec] Ti p t c rollout custom font cho c c home components c n l i"
      ],
      "fixes": [
        "fix: add bulk show selected home components",
        "fix: align classic mobile header actions",
        "fix: align mobile header actions spacing",
        "fix: resolve all tsc + oxlint errors in admin landing pages",
        "[Spec] Fix l ch c m search hamburger tr n mobile header site theo parity v i preview",
        "[Spec] Fix mobile header classic ch a s t ph i tr n trang site"
      ]
    }
  },
  {
    "date": "2026-03-09",
    "phase": "Calendar & Custom Colors",
    "title": "2026 03 10 saas seo strategy convex vercel free best practices",
    "categories": {
      "features": [
        "feat: improve partners layouts UX",
        "feat: add fullscreen hero content toggle",
        "feat: expand module runtime sync",
        "feat: add module config sync",
        "feat: add tax id to contact settings",
        "feat: add cascading menu url picker",
        "feat: auto-sort categories by hierarchy",
        "feat: show category hierarchy in admin list",
        "feat(contact): improve admin field editors",
        "[Spec] Full implement seo zero config blueprint coc saas surface convex next js 16",
        "[Spec] Thi t k c ch smart sync cho module fields features settings"
      ],
      "improvements": [
        "docs: update guidelines on linting and audit protocols in CLAUDE.md and sync to AGENTS.md",
        "docs: update agent guidelines on linting and audit protocols",
        "docs: add backport spec",
        "refactor(color-system): replace harmony-based color logic with automatic secondary generation",
        "refactor(contact): add dynamic rows",
        "refactor(contact): clarify label vs data fields",
        "refactor(contact): keep edit sections expanded",
        "refactor(contact): streamline edit UX",
        "chore: add clean-by-construction policy",
        "[Spec] 2026 03 10 saas seo strategy convex vercel free best practices",
        "[Spec] 2026 03 10 technical seo dynamic architecture plan",
        "[Spec] Audit l i smart sync category module v convex module path",
        "[Spec] B sung tr ng m s thu v o module settings",
        "[Spec] Backport 42 commits t system nhan v core system vietadmin nextjs",
        "[Spec] Bulk action n home component ch a d ng",
        "[Spec] Cascading dropdown pattern cho menu url picker",
        "[Spec] Contact admin form ng icon picker popup 10x10",
        "[Spec] I u ch nh tri t l code s ch kh ng ch y test t ng",
        "[Spec] M r ng smart sync to n h th ng v i icon m s thu contact",
        "[Spec] Ng b grid partners gi a create edit v x l ch ng item",
        "[Spec] Ng b seo placeholder v dirty state cho services",
        "[Spec] Refactor contact rows ng ng b social dropdown",
        "[Spec] Spec auto sort categories theo hierarchy tree khi enablecategoryhierarchy b t",
        "[Spec] Spec hi n th hierarchy cha con trong admin categories khi enablecategoryhierarch",
        "[Spec] T i u ux partners layouts overflow marquee mono smooth",
        "[Spec] Th m toggle n hi n n i dung hero cho layout fullscreen"
      ],
      "fixes": [
        "fix: align partners create/edit grid layout",
        "fix: use relative orders status import",
        "fix: harden module sync category handling",
        "fix: align seo placeholders and services dirty state",
        "fix: persist admin list page size",
        "fix: resolve oxlint warnings",
        "fix: align site sections with harmony removals",
        "fix(contact): wire layout selection on edit",
        "[Spec] Fix 5 oxlint warnings",
        "[Spec] Fix l i import alias orders config khi convex typecheck",
        "[Spec] Fix pagesize persistence across f5 for admin list pages"
      ]
    }
  },
  {
    "date": "2026-03-08",
    "phase": "Calendar & Custom Colors",
    "title": "Audit best practice plan refactor contact home component 6 layouts m u s c map f",
    "categories": {
      "features": [
        "feat(contact): refresh layouts, shared form, map parity",
        "feat(contact): add contact inbox storage"
      ],
      "improvements": [
        "refactor: streamline agent rules",
        "docs: add UI text economy guardrail",
        "docs: add practical UI UX guardrails",
        "[Spec] Audit best practice plan refactor contact home component 6 layouts m u s c map f",
        "[Spec] Audit layout contact edit kh ng i c",
        "[Spec] B sung 1 bullet text economy cho ui text microcopy trong agents",
        "[Spec] B sung tri t l ui ux th c d ng v o agents md k m mirror claude md",
        "[Spec] Chu n h a toggle form map cho 6 layout tr n contact create edit",
        "[Spec] Gi i th ch quan h field contact text info v i preview",
        "[Spec] Ho n t t x a harmony cho to n b home components",
        "[Spec] I u ch nh ux contact edit b dropdown m to n b section",
        "[Spec] Ki m tra tr ng th i x a harmony trong spec",
        "[Spec] Refactor agents md theo h ng evidence over opinion askuser m nh h n",
        "[Spec] Spec tri n khai l m r quan h field contact text info v i preview",
        "[Spec] T i u ux trang contact edit kh ng i t nh n ng",
        "[Spec] X a to n b harmony kh i admin home components"
      ],
      "fixes": [
        "fix(contact): avoid nested preview form",
        "fix(contact): normalize form map toggles",
        "fix(contact): stretch grid map and full-width minimal",
        "fix(contact): full-width map and form layout",
        "fix(admin): stabilize dashboard inbox hooks",
        "fix(admin): finalize contact inbox hook order",
        "fix(admin): stabilize contact inbox hooks",
        "fix(site): normalize customer auth provider boundary",
        "fix(admin): clarify sales sidebar label and move product SEO",
        "fix(admin): add copy action for product name",
        "fix(admin): add export selected for products",
        "fix(admin): clarify bulk selection scope",
        "fix(admin): improve excel actions and product import",
        "fix(experiences): add toggles for topbar contact info",
        "fix(experiences): always use contact settings in header topbar",
        "[Spec] Audit b sung fix form map ch a full cho 6 contact layouts",
        "[Spec] Fix build career default harmony export",
        "[Spec] Fix build video harmony import c n s t",
        "[Spec] Fix grid cards map height v minimal form map width",
        "[Spec] Fix nested form trong contact preview admin m kh ng nh h ng runtime submit",
        "[Spec] Spec audit fix tri t hook order contactinbox",
        "[Spec] Spec fix hook order contactinbox"
      ]
    }
  },
  {
    "date": "2026-03-07",
    "phase": "Calendar & Custom Colors",
    "title": "2026 03 07 category slug duplicate validation create edit sonner",
    "categories": {
      "features": [
        "feat(skill): add viet seo product description",
        "feat(experiences): an danh muc rong tren public lists",
        "feat(products): use category combobox on create/edit"
      ],
      "improvements": [
        "chore(guidelines): add audit-first rules",
        "[Spec] 2026 03 07 category slug duplicate validation create edit sonner",
        "[Spec] Audit spec b toggle contact setting experience menu topbar search",
        "[Spec] Audit spec th m toggle hi n th hotline v email cho header menu",
        "[Spec] Audit toggle an danh muc rong cho products services posts list",
        "[Spec] Audit ux businesslogic excel actions admin products",
        "[Spec] Audit v s a n t chia s product detail",
        "[Spec] Bulk selection gmail pattern spec",
        "[Spec] Chu n h a provider boundary customerauth cho to n b site",
        "[Spec] I danh m c s n ph m sang combobox autocomplete",
        "[Spec] I nh n sidebar b n h ng v a seo xu ng cu i form s n ph m admin",
        "[Spec] N ng c p agents claude sang audit first",
        "[Spec] Products excel export selected vs filtered spec",
        "[Spec] Spec contact inbox kh ng email ng b system experience data",
        "[Spec] Spec dirty state products edit chu n ho semantics gi products experiences",
        "[Spec] Spec skill viet seo product description",
        "[Spec] Th m n t copy t n s n ph m trang edit product"
      ],
      "fixes": [
        "fix(admin): localize slug errors and category links",
        "fix(product-detail): enable share toggle and copy",
        "fix(products): align price semantics and saved state",
        "fix(stock): hide out-of-stock UI when inventory disabled",
        "fix(products): repair category combobox toggle",
        "fix(categories): localize duplicate slug error",
        "fix(categories): auto regenerate slug from title on edit",
        "[Spec] 2026 03 07 fix category edit auto regenerate slug from title",
        "[Spec] Fix combobox danh m c s n ph m ang b c ng",
        "[Spec] Fix t t qu n l kho cta lu n active n m i ui t n kho tr n public",
        "[Spec] Fix ux l i slug tr ng s a url xem category tr n web",
        "[Spec] Spec hotfix hook order cho dashboard inbox widget"
      ]
    }
  },
  {
    "date": "2026-03-06",
    "phase": "Calendar & Custom Colors",
    "title": "B ctrl s l u nh p h y b v tr ng th i n t l u cho posts create edit",
    "categories": {
      "features": [
        "feat(search): add lightweight fuzzy ranking on Convex search results",
        "feat(product-detail): unify highlights settings",
        "feat(product-detail): add highlights to all layouts"
      ],
      "improvements": [
        "refactor(search): unify list queries to Convex search indexes",
        "Revert \"fix(category-products): align site colors with preview\"",
        "refactor(posts-admin): simplify action bar and add dirty-state save",
        "[Spec] B ctrl s l u nh p h y b v tr ng th i n t l u cho posts create edit",
        "[Spec] Chu n ho action bar products theo posts edit dirty state h y b coc",
        "[Spec] Khuy n ngh stack search cho convex free vercel free",
        "[Spec] P d ng c u h nh hi n th cho 6 layout productcategories",
        "[Spec] Spec s a c nh b o oxlint no new array trong convex lib search",
        "[Spec] Spec tri n khai convex search ng b cho products services posts header autocomple"
      ],
      "fixes": [
        "fix(search): replace no-new-array pattern in fuzzy scorer",
        "fix(products-services): dong bo filter danh muc",
        "fix(posts): dong bo filter danh muc theo url",
        "fix(footer): add x and pinterest icons runtime",
        "fix(category-products): align site colors with preview tokens",
        "fix(category-products): align site colors with preview",
        "fix(home-components): show contact price for zero price",
        "fix(product-categories): make carousel circular columns responsive",
        "fix(product-categories): apply display config to all layouts",
        "fix(products-edit): add dirty-state save button with saved state",
        "fix(posts-admin): remove unused router",
        "fix(products): show contact label for zero price",
        "fix(products): realtime price helper text",
        "fix(product-detail): hide empty rating summary and lock stars to yellow",
        "fix(products): reset sale price on zero",
        "fix(products): align pricing by sale mode",
        "[Spec] Fix gi 0 gi li n h cho affiliate contact admin site",
        "[Spec] Fix impact c t cho carousel circular ch ng v ui minimal productcategories",
        "[Spec] Fix l i icon x pinterest footer site runtime",
        "[Spec] Fix ng b filter danh m c posts theo url catpost",
        "[Spec] Fix ng b filter url cho products v services",
        "[Spec] Fix parity m u categoryproducts gi a preview v site single dual custom",
        "[Spec] Fix warning no unused vars post edit page"
      ]
    }
  },
  {
    "date": "2026-03-05",
    "phase": "Calendar & Custom Colors",
    "title": "B weekstartson calendar setting kh o s t seed wizard",
    "categories": {
      "features": [
        "feat(menus): auto sync label on quick pick",
        "feat(menus): switch quick link picker to centered modal",
        "feat(menus): add category quick links by enabled modules",
        "feat(menus): add module-aware quick relative link picker",
        "feat(menu): remove ellipsis and localize More",
        "feat(header): boost logo scale and fix classic overflow",
        "feat(header): add logo size slider and refine overflow",
        "feat(header): add brand name toggle",
        "feat(menu): handle overflow with More",
        "feat(settings): add open-google-map shortcut for embed mode",
        "feat(settings): add map provider options for contact map",
        "feat(header): align allbirds topbar with classic",
        "feat(experiences): move slogan toggle",
        "feat(experiences): add topbar slogan controls",
        "feat(settings): add topbar slogan toggle",
        "feat(calendar): add quick customer and date helpers",
        "feat(footer): add X and Pinterest social icons",
        "feat(calendar): simplify renewal reminders and link entities",
        "[Spec] B weekstartson calendar setting kh o s t seed wizard",
        "[Spec] Calendar b features i gia h n t o task m i",
        "[Spec] X a calendarfeaturestep dead code"
      ],
      "improvements": [
        "refactor(settings): unify slogan field",
        "refactor(subscriptions): rename calendar module",
        "chore(seed-wizard): remove dead CalendarFeatureStep",
        "refactor(calendar): remove weekStartsOn setting (CoC default monday)",
        "refactor(calendar): simplify renewal flow",
        "refactor(calendar): auto-heal module config",
        "refactor(calendar): cleanup schema and add warning days",
        "refactor(calendar): simplify renewal reminders",
        "[Spec] Chu n h a coc t i nh n khi ch n quick url trong admin menus",
        "[Spec] Chu n ho highlights d ng chung cho 3 layout product detail",
        "[Spec] Ho n th nh migration calendar subscriptions",
        "[Spec] I 0 th nh gi li n h admin products khi salemode contact affiliate",
        "[Spec] I dropdown g i url th nh popup modal ux h n",
        "[Spec] I n t m google maps th nh shortcut l y iframe cho admin",
        "[Spec] I t n module calendar subscriptions",
        "[Spec] I u ch nh gi kho products theo salemode hi n th gi li n h",
        "[Spec] M r ng highlights cho c 3 layout product detail experience",
        "[Spec] M r ng quick link menu v i danh m c theo module b t",
        "[Spec] S a helper text gi realtime product create edit",
        "[Spec] Spec allbirds topbar parity 100 v i classic topbar",
        "[Spec] Spec b ellipsis label menu desktop i more th nh ti ng vi t",
        "[Spec] Spec c p nh t th m control slogan tr c ti p trong system experiences menu u ti n",
        "[Spec] Spec ch t b h n topbar_slogan d ng 1 field slogan duy nh t",
        "[Spec] Spec chuy n quy n b t t t slogan sang experience settings ch l u text",
        "[Spec] Spec m r ng header menu experience toggle brand name u ti n n i kh ng gian menu",
        "[Spec] Spec n rating fallback c nh sao v ng cho product detail",
        "[Spec] Spec slider 5 n c k ch th c logo thu t to n overflow classic ch nh x c",
        "[Spec] Spec t ng r slider logo s a overflow more c n d ch classic desktop",
        "[Spec] Spec topbar slogan t admin settings toggle b t t t bmad",
        "[Spec] Spec ux 2026 lo i b scrollbar trong menu x l overflow b ng more",
        "[Spec] Spec ux n ng c p admin menus t i u classic menu render",
        "[Spec] Th m 2 option map cho admin settings v render ng contact",
        "[Spec] Th m n t m google maps _blank khi ch n map nh ng",
        "[Spec] Th m quick link relative theo module b t cho admin menus"
      ],
      "fixes": [
        "fix(lint): resolve oxlint warnings",
        "fix(settings): make google maps button a direct embed shortcut",
        "fix(lint): remove unused import and BOM",
        "fix(modules): migrate calendar key to subscriptions",
        "fix(calendar): mark renewed tasks",
        "fix(calendar): seed module config",
        "[Spec] 2026 03 05 fix calendar stale module key causing system modules 404",
        "[Spec] Fix 2 oxlint warnings t i thi u",
        "[Spec] Fix kh ng l u c khi saleprice 0 products create edit",
        "[Spec] Fix task c sau gia h n ph i l renewed",
        "[Spec] Spec fix oxlint warnings unused import irregular whitespace"
      ]
    }
  },
  {
    "date": "2026-03-04",
    "phase": "Calendar & Custom Colors",
    "title": "Auto heal calendar module config cleanup seed wizard",
    "categories": {
      "features": [
        "feat(footer): add CoC toggle and fix fallback",
        "feat(footer): add BCT badge logo support",
        "feat(products): add value-based combination filters for quick variant generation",
        "[Spec] Auto heal calendar module config cleanup seed wizard",
        "[Spec] Brainstorm calendar full cleanup schema c t s p h t h n seeder",
        "[Spec] Footer bct logo b c ng th ng badge feature"
      ],
      "improvements": [
        "chore: add factory commands and bmad directories",
        "refactor(footer): align centered BCT with copyright",
        "refactor(footer): group BCT with socials",
        "docs: update CLAUDE.md with commit guidelines and spec mode rules",
        "docs: add parity upgrade spec",
        "[Spec] Calendar nh c gia h n ai n gi n h a th m kh ch sp calendar views",
        "[Spec] Footer bct logo social icons gom s t nhau",
        "[Spec] Footer centered bct ngang v i copyright",
        "[Spec] Footer centered copyright tr i social bct ph i",
        "[Spec] N ng c p full parity 26 commit t system dien tran",
        "[Spec] Refactor calendar nh c kh ch mua h ng kiss dry",
        "[Spec] Th m x v pinterest v o footer social links"
      ],
      "fixes": [
        "fix(product-detail): move minimal description below",
        "fix(product-detail): unify related products layouts",
        "fix(product-detail): add expandable descriptions",
        "fix(product-detail): preserve image ratio and blur background",
        "fix(products): reduce single-action CTA height on product cards",
        "fix(products): stabilize product card CTA layout and authoritative counts",
        "fix(products): allow null variantMinPrice in admin query",
        "fix(seed): remove unused seedModule in wizard",
        "fix(products): align pricing labels and variant fallback",
        "fix(products): improve option value labels in combination filter grid",
        "[Spec] Fix calendar form kh ch l quick add customer s n ph m link quick date",
        "[Spec] Fix calendar seedallmodulesconfig thi u seedcalendarmodule",
        "[Spec] Footer coc toggle fix bug vs"
      ]
    }
  },
  {
    "date": "2026-03-03",
    "phase": "Calendar & Custom Colors",
    "title": "Auto heal preset cho system modules products kh ng c n seed wizard",
    "categories": {
      "features": [
        "feat(products): revamp variant quick-create matrix and respect SKU toggle",
        "feat(products): add barcode toggle and quick-add option values",
        "feat(products): derive price and stock from active variants",
        "feat(products): align pricing and type settings for variants",
        "feat(products): add category hierarchy toggle with enforced parentId policy",
        "[Spec] Auto heal preset cho system modules products kh ng c n seed wizard",
        "[Spec] Fix l i feature not found khi l u module config harden to n h",
        "[Spec] Fix oxlint no unused vars seedwizarddialog",
        "[Spec] Fix seed wizard l i feature not found t i system data",
        "[Spec] Spec fix l i feature not found khi save module config",
        "[Spec] T t b t danh m c cha con cho products b ng feature toggle"
      ],
      "improvements": [
        "[Spec] B sung ch n gi tr theo t ng option tr c khi sinh t h p variants",
        "[Spec] C p nh t ux logic variants theo module settings sku t o nhanh b ng t h p",
        "[Spec] C p nh t ux variants create edit label n th ng tin phi n b n",
        "[Spec] Chu n h a ng ngh a gi products variants fallback gi khi b t variantpricing",
        "[Spec] Hi n th r t n gi tr trong block ch n t h p variants",
        "[Spec] I chi u 4 commit g n nh t system dien tran v k ho ch s a ng b a b",
        "[Spec] Rollout auto heal to n b system modules silent ch khi thi u khung config",
        "[Spec] S a tri t products list v ui cta h t h ng l ch th ng k pagination",
        "[Spec] Spec b label modern th m xem th m cho m t d i 3 layout site preview",
        "[Spec] Spec c i thi n 3 layout product detail site preview",
        "[Spec] Spec c p nh t ux logic products module admin products variants",
        "[Spec] Spec chu n ho barcode toggle gi base th m nhanh gi tr option trong variant form",
        "[Spec] Spec minimal d i m t xu ng d i site preview theo ui t i gi n 2026",
        "[Spec] Spec ng b s n ph m li n quan cho modern minimal theo classic b hover to n b",
        "[Spec] Spec s a t n kho gi theo phi n b n cho products list detail",
        "[Spec] Tinh g n popup t o nhanh variants gi i h n chi u cao scroll vi t h a helper text"
      ],
      "fixes": [
        "fix(products): compact quick-create modal and add price helpers",
        "fix(products): update variant pricing label and hide identity section",
        "fix(modules): rollout silent auto-heal for missing module config",
        "fix(modules): auto-heal module config khi thiếu preset",
        "fix(seed-wizard): seed module config trước khi sync",
        "fix(modules): auto-create missing feature on toggle",
        "fix: chuẩn hóa contact settings và zalo",
        "fix(seed-wizard): handle missing module features safely",
        "fix(seed-wizard,contact): chuẩn hóa toggle feature và contact",
        "[Spec] Fix returnsvalidationerror variantminprice null trong products listadminwithoffs",
        "[Spec] Spec c p nh t chu n h a contact fix z index b n contact"
      ]
    }
  },
  {
    "date": "2026-03-02",
    "phase": "Calendar & Custom Colors",
    "title": "Audit parity custom colors home components k ho ch full rollout strict alphabet",
    "categories": {
      "features": [
        "feat(home-components): use white social icons",
        "feat(home-components): apply original social backgrounds",
        "feat(home-components): toggle original footer icon colors",
        "feat(home-components): rollout custom colors across admin",
        "feat(skills): expand custom color rollout playbook",
        "feat(hero-create): add custom color config parity with edit"
      ],
      "improvements": [
        "chore(settings): bỏ dọn dẹp ảnh",
        "refactor(upload): chuẩn hóa pipeline ảnh WebP 85 cho admin",
        "docs(skill): update custom color contract",
        "[Spec] Audit parity custom colors home components k ho ch full rollout strict alphabet",
        "[Spec] Chu n h a stats theo skill custom colors full parity",
        "[Spec] I logo t n sidebar admin theo settings v i fallback",
        "[Spec] L m r contract hi n th panel m u custom hero gi a system create edit",
        "[Spec] M r ng toggle m u g c cho footer icon background c n b ng dual brand",
        "[Spec] N ng c p skill apply home component custom colors theo contract hero m i",
        "[Spec] S a font topbar allbirds b h th ng c a h ng trong menu experience",
        "[Spec] S a l i create custom color m c nh theo settings nh ng kh ng lock toggle",
        "[Spec] Spec full rollout custom colors to n b home components ng b system admin create ",
        "[Spec] Spec n ng c p skill apply home component custom colors b n r t chi ti t full rol",
        "[Spec] Spec s a tri t isolation custom m u per home component kh ng li n k t ch o",
        "[Spec] Th m toggle d ng m u icon g c cho footer create edit runtime"
      ],
      "fixes": [
        "fix(seed-wizard): toggle features after seed",
        "fix: skip enableMail toggle",
        "fix(admin): remove unused imports",
        "fix(home-components): áp dụng custom color footer ở site",
        "fix(seed): clear storage on system data reset",
        "fix(seed): clear orphan storage on clearAll",
        "fix(seed-wizard): đồng bộ module theo trạng thái mới nhất sau reset",
        "fix(menu-experience): unify allbirds topbar typography and remove store-system option",
        "fix(admin): use settings branding for sidebar",
        "fix(home-components): seed create custom from settings for empty types",
        "fix(home-components): restore create custom toggle behavior",
        "fix(home-components): lock create custom until type exists",
        "fix(home-components): align features custom colors",
        "fix(home-components): align benefits custom colors",
        "fix(home-components): align blog custom colors",
        "fix(home-components): align service-list custom colors",
        "fix(home-components): align category-products custom colors",
        "fix(home-components): align product-grid custom colors",
        "fix(home-components): align trust-badges custom colors",
        "fix(home-components): align partners custom colors",
        "fix(home-components): align footer custom colors",
        "fix(home-components): align faq custom colors",
        "fix(home-components): align cta custom colors",
        "fix(home-components): align product-list custom colors",
        "fix(home-components): align stats custom colors",
        "fix(home-components): align hero custom colors",
        "fix(home-components): align product-categories custom colors",
        "fix(home-components): decouple system color panel",
        "fix(home-components): sync create preview colors",
        "fix(home-components): sync fallback colors",
        "fix(home-components): guard type override writes",
        "fix(home-components): hide secondary color in single mode and compact hero custom card",
        "fix(home-components): prevent type color override state update loop",
        "[Spec] Fix create default color theo settings khi type ch a c component 30 home compone",
        "[Spec] Fix fallback m u theo admin settings cho to n b home component create edit",
        "[Spec] Fix ng requirement cho to n b 30 home components kh ng lock toggle",
        "[Spec] Fix realtime sync preview theo toggle custom cho to n b create pages"
      ]
    }
  },
  {
    "date": "2026-03-01",
    "phase": "Calendar & Custom Colors",
    "title": "B b t bu c tr ng u ti n calendar h tr b t t t y",
    "categories": {
      "features": [
        "feat(skills): add apply-home-component-custom-colors",
        "feat(system): add toast on home-components toggles",
        "feat(system): refine home components table",
        "feat(system): add home components control center",
        "feat(calendar): add bulk delete dropdown for overdue cleanup",
        "feat(seed-wizard): add calendar feature toggle step",
        "feat(calendar): enable edit and delete actions in overdue and due-soon cards",
        "feat(calendar): add delete and bulk delete tasks",
        "feat(calendar): add multi-view modal and recurrence UX",
        "feat(calendar): add internal calendar module",
        "feat(system): enable ctrl+k global search for modules and experiences",
        "feat(system): manage multiple super admins",
        "[Spec] Cho ph p t t tr ng u ti n theo feature calendar",
        "[Spec] Fix crash systemglobalsearch khi event key undefined trong seed wizard",
        "[Spec] Fix loop render calendar b sung seed wizard cho calendar",
        "[Spec] Th m step calendar feature toggle trong seed wizard"
      ],
      "improvements": [
        "docs(readme): fix aspect ratio formatting in image size guide",
        "docs: add spec for calendar priority UI",
        "refactor(system-layout): remove status footer from /system",
        "chore(lint): unblock build and deploy checks",
        "[Spec] B b t bu c tr ng u ti n calendar h tr b t t t y",
        "[Spec] B footer tr ng th i trong system layout",
        "[Spec] B prod console v2 5 v gi m spacing header system",
        "[Spec] B t xem s a x a task trong 2 box qu h n s p n h n",
        "[Spec] K ho ch b t ctrl k global search cho system modules experiences",
        "[Spec] N to n b ui assignee khi t t field assigneeid trong calendar",
        "[Spec] Ph n t ch l i cannot disable system field",
        "[Spec] Spec full rollout custom colors cho 29 home component c n l i tr hero",
        "[Spec] Spec m r ng calendar module admin calendar all in one modal",
        "[Spec] Spec module calendar n i b m i system modules admin calendar",
        "[Spec] Spec n to n b ui u ti n theo field priority",
        "[Spec] Spec refactor table system home components bulk actions coc hero edit v3",
        "[Spec] Spec t o skill apply home component custom colors rollout to n b home components",
        "[Spec] Spec th m x a task bulk delete cho admin calendar",
        "[Spec] Spec tri n khai system home components pilot hero custom m u",
        "[Spec] Th m dropdown x a to n b x a task c t i admin calendar"
      ],
      "fixes": [
        "fix(home-components): apply hero custom colors on site",
        "fix(calendar): remove unused create/edit forms",
        "fix(system): guard keydown key in global search",
        "fix(calendar): keep week view and show day details on click",
        "fix(calendar): hide assignee UI when field disabled",
        "fix(calendar): allow demoting priority system field",
        "fix(calendar): make priority optional and respect field toggle",
        "fix(calendar): allow disabling priority field",
        "fix(calendar): add status badges and remove timezone config",
        "fix(calendar): show priority badges in month view",
        "fix(calendar): show high priority badge in month view",
        "fix(calendar): remove 60s tick and refresh on actions",
        "fix(calendar): stabilize now tick and seed wizard",
        "fix(system): remove header prod badge and tighten spacing",
        "fix(system-modules): stabilize module card toggle layout on tablet",
        "fix(seed): sync favicon and seo og image",
        "[Spec] Fix l i cannot disable system field cho calendar priority",
        "[Spec] Fix responsive toggle system modules tablet a k ch th c",
        "[Spec] Fix week view click behavior in admin calendar",
        "[Spec] Spec fix b gi t 60s admin calendar",
        "[Spec] Spec fix root cause site hero ch a n custom color t i gi n ui custom"
      ]
    }
  },
  {
    "date": "2026-02-28",
    "phase": " SMTP & ExcelJS Tools",
    "title": "Full implement module ch nh 404 noindex module ph auto off toggle sync preview p",
    "categories": {
      "features": [
        "feat(seed): add admin permission mode step",
        "feat(experiences): add system error pages",
        "feat(integrations): add smtp center and email test",
        "feat(settings): add contact quick link",
        "[Spec] Full implement module ch nh 404 noindex module ph auto off toggle sync preview p",
        "[Spec] Spec c p nh t seed wizard x l ph n quy n ngay trong wizard kh ng c n link ngo i ",
        "[Spec] Spec fix l i convex bundling node fs node path trong posts seeder",
        "[Spec] Spec s a seed wizard ch n duplicate super admin fix nh seed fallback admin",
        "[Spec] Spec tinh ch nh seed wizard service picsum favicon ng b logo seo theo ng nh og l"
      ],
      "improvements": [
        "chore(agents): require .factory/docs in commits",
        "docs(agents): update spec mode rules with user clarification guidelines",
        "chore(docs): add documentation files for experience menu fix and UI improvements",
        "refactor(product-detail): restore pre-seo UI structure for product slug page",
        "refactor(site): remove hardcoded copy on list/detail pages",
        "chore(docs): add documentation files for brand config, SEO, SMTP integration, and Excel template features",
        "[Spec] M r ng system admin config qu n l nhi u super admin",
        "[Spec] Root cause l i cannot disable core module",
        "[Spec] Spec fallback posts khi module posts t t",
        "[Spec] Spec s a l i ng y u c u super admin theo step seed_mau c th d ng thi u th picsum",
        "[Spec] Spec th m experience trang l i h th ng 10 m l i 3 layout dual brand",
        "[Spec] X l b t t t module roles kh ng xung t d li u"
      ],
      "fixes": [
        "fix(seed): ensure super admin and seed_mau fallback",
        "fix(seed): harden seed images and admin fallbacks",
        "fix(users): lock super admin deletion",
        "fix(roles): keep admin full access when toggled",
        "fix(seeders): remove node built-ins in posts seeder",
        "fix(modules): normalize toggle errors",
        "fix(modules): stabilize module toggles",
        "fix(modules): block core disable error",
        "fix(modules): auto-repair roles core",
        "fix(modules): normalize roles core state",
        "fix(modules): unlock roles toggle",
        "fix(seed): fallback thumbnails for posts",
        "fix(services): apply APCA badge text",
        "fix(experiences): sync toggles with module state",
        "fix(experiences): enforce module guards and toggle sync",
        "fix(posts): guard public posts when module disabled",
        "fix(routing): apply public not-found experience at root",
        "fix(site): make global error static",
        "fix(site-product-detail): hide wishlist in modern header when disabled",
        "fix(site-product-detail): gate rating by comments module",
        "fix(experience-product-detail): default comments off when module disabled",
        "fix(experience-product-detail): default wishlist off when module disabled",
        "fix(site): restore products posts services ui",
        "fix(experience-menu): make allbirds separator full-width on desktop",
        "fix(lint): resolve type-aware oxlint warnings for build readiness",
        "[Spec] Fix badge text en tr ng theo apca cho services list preview site",
        "[Spec] Fix d t i m l i cannot disable core module toggle cascade",
        "[Spec] Fix kh a x a super admin ui nh n di n admin users",
        "[Spec] Fix p d ng error experience cho to n b public routes ngo i admin v system",
        "[Spec] Fix seed posts m t nh t i system data",
        "[Spec] Fix to n b experiences module ph off ph i hi n toggle off ngay disable save p fa",
        "[Spec] Fix toggle module n nh kh ng l i h nh vi h p l",
        "[Spec] Spec fix b core th t cho roles system modules v b t toggle c ngay",
        "[Spec] Spec fix best practice t t roles an to n migrate b core t n g c d ng cascade th ",
        "[Spec] Spec fix d t i m l i core khi t t roles auto repair bypass guard theo key"
      ]
    }
  },
  {
    "date": "2026-02-27",
    "phase": " SMTP & ExcelJS Tools",
    "title": "B cta brand config trong menu experience theo coc",
    "categories": {
      "features": [
        "feat(settings): add logo-to-favicon actions and seed wizard favicon",
        "feat(products): support semicolon-separated gallery urls in excel import",
        "feat(products): expand excel template examples",
        "feat(products): add excel toggle setting",
        "feat(products): add excel template import export",
        "feat(seo): improve public page indexing",
        "[Spec] Fix favicon public routes b sung c u h nh favicon trong seed wizard",
        "[Spec] Full implement seo upgrade public pages vi vn app router"
      ],
      "improvements": [
        "docs(skill): resolve guideline conflicts",
        "docs(skill): strengthen system extension guideline",
        "docs(skill): add system extension guideline",
        "docs: add documentation files for system modules and SEO improvements",
        "refactor(system-modules): split modules page into focused components",
        "refactor(system-modules): localize module UI text and use dynamic config routes",
        "[Spec] B cta brand config trong menu experience theo coc",
        "[Spec] B tr ng seo d note tab li n h",
        "[Spec] Chu n h a trang system integrations th nh smtp center i18n",
        "[Spec] Import nh i di n nh ph t 1 c t url ph n t ch",
        "[Spec] K ho ch dare exceljs template import export cho admin products theo chu n module",
        "[Spec] K ho ch dare n ng c p file excel m u products v i y case sheet l i m u",
        "[Spec] K ho ch dare th m setting module b t t t t nh n ng excel products",
        "[Spec] Kh c ph c kh ng th y toggle cta login menu experience",
        "[Spec] Kh i ph c ui trang chi ti t s n ph m v tr c commit seo",
        "[Spec] Lo i b hardcode text v ngh a 6 route site",
        "[Spec] Qa dare system modules",
        "[Spec] Seo audit m r ng g m trang chi ti t",
        "[Spec] Spec d n tech debt v t ch module page",
        "[Spec] Spec r so t m u thu n route home components vs experiences",
        "[Spec] Spec s a p1 cho system modules",
        "[Spec] Spec s a p2 cho system modules",
        "[Spec] Spec skill guideline chi ti t m r ng h th ng module experience home component se",
        "[Spec] X c nh commit g y hardcode v k ho ch g th ng k hardcode"
      ],
      "fixes": [
        "fix(settings): simplify contact tab and seo fields",
        "fix(favicon): normalize redirect url and cache bust",
        "fix(menu): align experience layout and preview with homepage behavior",
        "fix(menu): stabilize toggle visibility",
        "fix(menu): restore cta toggle",
        "fix(menu): enforce brand and cta defaults",
        "fix(products): keep excel template examples at top rows",
        "fix(products): ensure excel template has examples",
        "fix(home): remove hardcoded hero section",
        "fix(order): avoid stock overage throws",
        "fix(cart): return stock errors without throwing",
        "fix(cart): handle stock errors without dev overlay",
        "fix(stock): enforce inventory checks for cart and checkout",
        "fix(system-modules): validate preset deps, guard disabled config, stabilize ordering",
        "fix(modules): enforce dependencies and cascade disable",
        "fix(routing): replace san-pham product detail links",
        "[Spec] Fix allbirds bottom line full width experience menu",
        "[Spec] Fix chu n best practice 6 v d hi n ngay u sheet products",
        "[Spec] Fix favicon public kh ng c p nh t d set trong admin settings",
        "[Spec] Fix ki m tra t n kho sonner cho cart checkout buy again",
        "[Spec] Fix sheet products tr ng d li u m u khi t i excel template",
        "[Spec] Fix sonner l i t n kho kh ng b t dev overlay",
        "[Spec] Spec fix tri t route chi ti t s n ph m kh ng redirect"
      ]
    }
  },
  {
    "date": "2026-02-24",
    "phase": " SMTP & ExcelJS Tools",
    "title": "Dare root cause audit cho seed wizard system data",
    "categories": {
      "features": [
        "docs: add audit and planning documents for dual brand color system implementation",
        "[Spec] Dare root cause audit cho seed wizard system data",
        "[Spec] Fix ng b superadmin gi a seed wizard v system admin config to n module wizard",
        "[Spec] Fix seed wizard step extras kh ng n item khi click root cause d ch v t b t",
        "[Spec] Spec fix seed wizard fallback m u nh services th m step admin config",
        "[Spec] Spec fix to n di n seed wizard system data services posts variant scope kanban o",
        "[Spec] Spec s a seed wizard analytics dependency auto login kh ch cho customers experie"
      ],
      "improvements": [
        "docs: add root cause analysis and fix specifications for seed wizard system"
      ],
      "fixes": [
        "fix(seed-wizard): keep extras visible and prevent unintended services enable",
        "fix(seed-wizard): sync superadmin credentials on reseed",
        "fix(seed-wizard): add admin config and fallbacks",
        "fix(seed): ensure customers seed required fields",
        "fix(seed-wizard): add analytics config + login dependency",
        "fix(seed-wizard): ổn định seed services và variants",
        "fix: render ProductGrid on site",
        "fix: clean up unused vars and lint warnings",
        "fix(promotions-list): apply dual-brand tokens for preview + site",
        "fix(checkout): apply dual-brand tokens for preview + site",
        "fix(checkout): apply dual-brand color tokens for preview + site",
        "fix(cart): apply dual-brand tokens for experience + site",
        "fix(account-profile): boost secondary accents",
        "fix(account-profile): apply dual-brand tokens",
        "fix(account-orders): boost secondary accents in card layouts",
        "fix(account-orders): apply dual-brand tokens for preview + site",
        "fix(wishlist): apply dual-brand tokens for experience + site",
        "fix(menu): boost secondary usage in header tokens",
        "fix(menu): apply dual-brand token system for experience and site header sync",
        "fix(product-detail): apply dual-brand token system for preview and site sync",
        "[Spec] Audit fix dual brand cho account orders",
        "[Spec] Audit fix dual brand cho promotions list",
        "[Spec] Audit fix dual brand color system cho experience checkout",
        "[Spec] Audit fix dual brand color system cho wishlist experience",
        "[Spec] Plan audit fix dual brand cho experience cart",
        "[Spec] Plan audit fix dual brand cho experience checkout"
      ]
    }
  },
  {
    "date": "2026-02-23",
    "phase": " SMTP & ExcelJS Tools",
    "title": "Audit chu n ho m u posts list theo dual brand color system",
    "categories": {
      "features": [
        "feat(experiences): sync contact colors with brand settings",
        "feat: integrate OpenStreetMap (Leaflet) for contact page - 100% free",
        "[Spec] Plan chi ti t full implement dual brand color system cho contact experience"
      ],
      "improvements": [
        "docs(skill): upgrade dual-brand-color-system to v13.0.0",
        "[Spec] Audit chu n ho m u posts list theo dual brand color system",
        "[Spec] K ho ch kh i ph c y ch c n ng b n b m t commit",
        "[Spec] T ng hi n h u m u ch nh cho dual brand services list preview site"
      ],
      "fixes": [
        "fix(products-list): apply dual-brand tokens",
        "fix(services-detail): apply dual-brand tokens",
        "fix(posts-list): apply dual-brand tokens and links",
        "fix(services-list): boost primary presence in dual mode",
        "fix(services-list): apply dual brand colors on site",
        "fix(services-list): align experience colors with dual-brand system",
        "fix(posts-detail): apply dual brand colors to preview and site",
        "fix(posts-detail): align experience colors with dual-brand",
        "fix(contact): apply dual brand colors on preview and site",
        "fix(contact): restore OpenStreetMap map flow",
        "[Spec] Audit fix dual brand cho product detail",
        "[Spec] Audit fix dual brand cho products list experience site",
        "[Spec] Audit fix dual brand cho services detail",
        "[Spec] Audit fix dual brand color system cho experience menu",
        "[Spec] Audit plan fix dual brand color system cho system experiences posts detail",
        "[Spec] Audit plan fix dual brand color system cho system experiences services list"
      ]
    }
  },
  {
    "date": "2026-02-21",
    "phase": " SMTP & ExcelJS Tools",
    "title": "Career dual brand color system compliance",
    "categories": {
      "features": [
        "feat(career): implement dual-brand-color-system compliance",
        "feat(contact): replace JSON editor with structured form and balance primary/secondary colors",
        "feat(contact): update ContactEditPage to use ConfigEditor with validation",
        "feat(contact): cân bằng primary/secondary color trong getContactColorTokens - Task 7.1",
        "feat(contact): implement ConfigEditor component with 6 cards (Map Settings, Contact Info, Form Settings, Social Links, Color Harmony, Text Customization)",
        "feat(contact): tạo DynamicTextFields component cho text customization theo style",
        "feat(contact): tạo SocialLinksManager component với validation real-time",
        "feat(contact): tạo FormFieldsSelector component với minimum constraint",
        "feat(contact): add validation utilities for URL, email, phone",
        "feat(contact): implement dual-brand-color-system v11.6.7 fixes",
        "feat(video): tăng visibility của secondary color trong dual mode",
        "feat: replace hexagon with modern bento grid layout for Team component",
        "feat(clients): thêm heading cho subtleMarquee layout để có 2 màu dual",
        "feat(clients): thêm UI form config texts cho từng layout",
        "refactor(clients): implement SaaS-style layouts - simpleGrid/compactInline/subtleMarquee",
        "refactor(clients): implement compact uniform layouts - marquee/dualFlow/fadeScroll",
        "feat(gallery): tang visibility mau phu - accent bar h-0.5 to h-1, corner decorations w-3 to w-6, title decoration w-12 to w-16",
        "feat(gallery): enhance secondary color in Grid and Masonry layouts",
        "feat(gallery): enhance secondary color visibility in Spotlight, Grid, Masonry",
        "feat(gallery): apply dual-brand color system to all 6 layouts",
        "feat(gallery): move title rendering to correct position in GallerySection runtime",
        "feat(gallery): add title prop to GalleryPreview in Edit page",
        "feat(gallery): add title prop to GalleryPreview in Create page",
        "feat(gallery): add title rendering to all GalleryPreview style functions",
        "feat(gallery): thêm config tiêu đề hiển thị trong preview và runtime",
        "[Spec] Contact implementation summary"
      ],
      "improvements": [
        "refactor(speed-dial): remove color validation warning UI",
        "docs: add Career dual-brand-color-system compliance report",
        "refactor(team): đơn giản hóa bento layout - chỉ avatar tròn + text, bỏ card background",
        "refactor(team): cải thiện bento layout theo UI mẫu - avatar nổi lên trên card",
        "refactor: improve bento layout with floating avatar design",
        "docs(skill): thêm checklist D1 Text Config vào dual-brand-color-system",
        "refactor(clients): xóa ColorInfoPanel, thêm secondary color cho 3 layouts, thêm texts config",
        "refactor(clients): remove grayscale filter and hover effects",
        "refactor(clients): replace marquee/dualRow/wave with bento/staggered/spotlight layouts",
        "style(gallery): center align title text",
        "[Spec] Career dual brand color system compliance",
        "[Spec] Contact dual brand color review"
      ],
      "fixes": [
        "fix: resolve oxlint warnings and build errors",
        "fix(speed-dial): tuân thủ dual-brand-color-system v11.6.7 + form validation + DRY refactor",
        "fix: remove onValidationChange prop to fix dependency array size error",
        "fix: remove onValidationChange from useEffect deps to prevent infinite loop in SocialLinksManager",
        "fix: correct @fast-check/vitest syntax in property tests",
        "fix(contact): remove duplicate code in renderCentered",
        "fix(video): hiển thị secondary color trong fullwidth và cinema",
        "fix(video): áp dụng dual-brand color system chuẩn",
        "fix: apply dual-brand-color-system v11.6.7 to Video component",
        "fix: thêm error handling cho thumbnail image",
        "fix: guard empty videoUrl trong VideoEmbed",
        "fix: thêm YouTube domains vào next/image config",
        "fix: thêm hiển thị bio trong 5 layouts (cards, carousel, bento, timeline, spotlight)",
        "fix(team): thêm wrapper overflow-hidden để contain avatar trong khung tròn",
        "fix(team): sửa avatar bị tràn khỏi khung tròn trong bento layout",
        "fix(team): khôi phục bento layout đúng theo HTML mẫu - avatar nổi lên trên card xám",
        "fix: correct bento layout structure with proper floating avatar",
        "fix: show only filled social icons individually in Team component",
        "fix: remove dark overlay and hide empty social buttons in Team component",
        "fix: apply dual-brand-color-system skill v11.6.7 to Team component",
        "fix: bỏ hover effect cho icon mạng xã hội trong Team Grid layout",
        "fix: move useId hooks to component top-level in TeamSectionShared",
        "fix(about): center image in timeline layout",
        "fix(about): apply dual-brand-color-system v11.6.7 compliance",
        "fix(countdown): refactor site render dùng CountdownSectionShared",
        "fix(countdown): xóa redirect sau khi lưu ở edit page",
        "fix(countdown): áp dụng đầy đủ dual-brand-color-system v11.6.7",
        "fix(voucher-promotions): bỏ ConfigJsonForm và thêm empty state message",
        "fix(voucher-promotions): thêm form fields đàng hoàng vào edit page",
        "fix(voucher-promotions): áp dụng đầy đủ dual-brand-color-system skill",
        "fix(pricing): properly fix billing toggle layout and alignment",
        "fix(pricing): remove flex-wrap from billing toggle to prevent text overlap",
        "fix(pricing): fix billing toggle UI overflow issue",
        "fix(pricing): remove APCA warning messages from UI",
        "fix(pricing): remove APCA warnings by fixing badge soft text logic",
        "fix(pricing): apply full dual-brand-color-system skill v11.6.7",
        "fix(clients): tuân thủ dual-brand-color-system v11.6.7",
        "fix: loại bỏ check items.length <= 3 trong removeItem để cho phép xóa logo với bất kỳ số lượng nào",
        "fix: loại bỏ logic disable không đúng của nút xóa logo",
        "fix(clients): hiển thị placeholder cho slots chưa có ảnh",
        "fix(gallery): make secondary color more visible in Spotlight layout",
        "fix(gallery): move title rendering to correct position - before accent bar in preview",
        "fix: remove duplicate GalleryPreview declaration and add title param"
      ]
    }
  },
  {
    "date": "2026-02-20",
    "phase": "Màu kép OKLCH & APCA",
    "title": "Implement full dual-brand Clients flow across create/edit/runtime.",
    "categories": {
      "features": [
        "Implement full dual-brand Clients flow across create/edit/runtime."
      ],
      "improvements": [],
      "fixes": [
        "fix(gallery): restore esc and fix lightbox click boundaries",
        "fix(gallery): remove ESC key and add backdrop onClick for lightbox close",
        "fix(gallery): simplify preview cues and lightbox dismiss",
        "fix(gallery): move sizing hint, add dual accents and draggable marquee",
        "fix(gallery): remove warning UI and streamline marquee",
        "fix(renderer): resolve runtime wiring and create-form typing",
        "Fix countdown runtime to use shared dual-brand renderer and mode flow.",
        "fix(countdown-video): align create flow with shared dual-brand modules",
        "fix(contact): unify dual-brand create/edit/preview/runtime parity",
        "fix(gallery): preserve harmony parity in preview payloads",
        "fix(gallery): enforce dual-brand parity across create edit runtime",
        "[Spec] Fix gallery lightbox close issue"
      ]
    }
  },
  {
    "date": "2026-02-19",
    "phase": "Màu kép OKLCH & APCA",
    "title": "Unify dual-brand preview/runtime parity",
    "categories": {
      "features": [],
      "improvements": [],
      "fixes": [
        "fix(case-study): unify dual-brand preview/runtime parity",
        "fix(testimonials): redesign slider and quote enterprise UI parity",
        "fix(testimonials): keep rating stars always yellow",
        "fix(testimonials): align dual-brand preview/runtime safeguards",
        "fix(features): drop color warnings and normalize color panel placement",
        "fix(benefits): auto-guard icon contrast and silence APCA warning copy",
        "fix(trust-badges): center marquee track container",
        "fix(admin-home-components): remove harmony selectors from admin forms",
        "fix(product-list): disable save button when form is pristine",
        "fix(product-categories): make circular pagination dots dynamic",
        "fix(stats): make dual secondary visible in minimal and circle styles",
        "fix(color-system): normalize APCA pipeline and enforce ensure guards"
      ]
    }
  },
  {
    "date": "2026-02-18",
    "phase": "Màu kép OKLCH & APCA",
    "title": "C p nh t policy skill dual brand cho gallery trustbadges no block auto heal",
    "categories": {
      "features": [
        "feat(preview): add color info panel"
      ],
      "improvements": [
        "refactor(gallery): elevate marquee visual",
        "docs(skill): add color adjacency rule",
        "docs(skill): add color info panel example",
        "docs(skill): add color info panel guidance",
        "style(partners): enlarge badge items by 30 percent",
        "refactor(partners): neutralize badge and featured surfaces",
        "refactor(partners): compact featured spacing and remove hover interactions",
        "[Spec] C p nh t policy skill dual brand cho gallery trustbadges no block auto heal",
        "[Spec] Dare review gallery trustbadges dual brand color system compliance",
        "[Spec] Dare review gallery vs dual brand color system skill",
        "[Spec] N ng c p gallery marquee th nh scroll v h n",
        "[Spec] N ng c p layout marquee gallery sang tr ng auto scroll v h n",
        "[Spec] T i u marquee layout b duplicate gallery edit",
        "[Spec] Th m colorinfopanel cho c c home component c brand colors dual mode",
        "[Spec] Th m nh n 1 m u 2 m u v o previewwrapper info cho c c home component",
        "[Spec] Vi t h a color info panel trong ctapreview v faqpreview"
      ],
      "fixes": [
        "fix(gallery): keep marquee auto-scrolling",
        "fix(gallery): infinite marquee loop",
        "fix(gallery): keep marquee looping",
        "fix(gallery): align marquee with partners layout",
        "fix(gallery): reduce marquee item duplication",
        "fix(gallery): reduce marquee duplication and stabilize loop keys",
        "fix(trustbadges): show preview heading in render",
        "fix(gallery): align homepage render with preview",
        "fix(colors): remove apca auto-fix to neutral",
        "fix(gallery): rebalance dual-brand accents",
        "fix(gallery): auto-heal colors without blocking save",
        "fix(gallery): put trust badge texts on white",
        "fix(gallery): align tokens with color adjacency rule",
        "fix(gallery): add primary accent bar",
        "fix(gallery): reinforce primary accents",
        "fix(preview): them nhan 1-2 mau",
        "fix(cta,faq): viet hoa thong tin mau preview",
        "fix(colors): auto-adjust text contrast",
        "fix(gallery): expose APCA details in validation",
        "fix(gallery): align preview empty states and save label",
        "fix(gallery): align validation and render colors",
        "fix(gallery): apply dual-brand tokens and validation",
        "fix(partners): sync grid preview and render",
        "fix: stabilize partners grid preview",
        "fix(partners): apply dual-brand colors across layouts",
        "fix(partners): stabilize featured grid with fixed +N slot",
        "fix(partners): unify featured preview and flat layout",
        "[Spec] Fix gallery apca hi n th chi ti t l i thay v block save m qu ng",
        "[Spec] Fix gallery marquee auto scroll kh ng d ng sau 1 v ng",
        "[Spec] Fix gallery render parity v i preview 6 layouts",
        "[Spec] Fix gallery trustbadges apca validation single mode preview render sync",
        "[Spec] Fix ph n ph i dual brand cho gallery 6 layouts",
        "[Spec] Spec fix gallery theo color adjacency v11",
        "[Spec] Spec n ng c p skill dual brand color system tr c khi fix gallery"
      ]
    }
  },
  {
    "date": "2026-02-17",
    "phase": "Màu kép OKLCH & APCA",
    "title": "C nh b c c featured 1 l n 5 nh n cu i",
    "categories": {
      "features": [
        "feat(cta): flat design (no opacity/shadow) + responsive upgrade",
        "Implement CTA dual-brand safety and edit save-state parity",
        "feat(faq): full dual-brand spec for harmony, apca, and save-state parity",
        "feat(product-categories): full dual-brand mode propagation and dirty-save parity",
        "feat(faq): áp dụng dual-brand color system cho create/edit/preview/site",
        "feat(cta): full align CTA with dual-brand-color-system (oklch/apca/harmony)",
        "feat(skill): nâng cấp dual brand color system v11",
        "[Spec] C nh b c c featured 1 l n 5 nh n cu i",
        "[Spec] Implement full dual brand color fix for partners 6 layouts",
        "[Spec] Ng b featured partners gi a preview render redesign flat enterprise ux",
        "[Spec] Refine m u badge featured partners theo h ng professional",
        "[Spec] Spec fix full implement cta dual brand color system",
        "[Spec] Tinh ch nh featured compact gi m spacing m nh t ng icon v a b hover"
      ],
      "improvements": [
        "docs: spec DARE review FAQ dual-brand 6 layouts",
        "docs(spec): add detailed FAQ dual-brand plan for 6 layouts across create edit preview and site render",
        "[Spec] Cta flat design mobile first responsive dual brand skill v11",
        "[Spec] Dare review spec s a dual brand cho gallery edit",
        "[Spec] Kh i ph c footer form ui cho create edit",
        "[Spec] N ng c p dual brand color system skill v11 2 v11",
        "[Spec] Ng b grid partners gi a preview v render",
        "[Spec] Nh gi cta component theo dual brand color system v11",
        "[Spec] Refine partners preview aesthetics premium subtle mobile first",
        "[Spec] Root cause l i useeffect trong partners edit page",
        "[Spec] S a marquee partners b dup v ng nh t preview render",
        "[Spec] Spec chu n ho dual brand cho footer create edit preview render",
        "[Spec] Spec dare review cta 6 layouts dual brand color system gaps",
        "[Spec] Spec dare review faq create preview render dual brand color system v2",
        "[Spec] Spec faq dual brand color system 6 layouts create edit preview site",
        "[Spec] Spec product categories dual brand color system create edit preview render",
        "[Spec] Spec product list dual brand color system 6 layouts create edit preview render",
        "[Spec] Spec review footer theo dual brand color system v11 4",
        "[Spec] T ng k ch th c item layout badge th m 30 b ng c ch ch nh scale t i partnersbadge",
        "[Spec] Ux warning cho duplicate product categories"
      ],
      "fixes": [
        "fix(partners): unify carousel preview and site render",
        "fix(partners): align badge render with preview",
        "fix(partners): improve marquee motion and disable save when unchanged",
        "fix(partners): unify marquee preview and site render",
        "fix(partners): mark edit page as client component",
        "fix(footer): surface secondary accents in dual mode",
        "fix(footer): align dual-brand preview and render",
        "fix(footer): align dual-brand colors",
        "fix(home-components): restore footer form editor",
        "fix(home-components): hide warnings in single mode previews",
        "fix(cta): hide harmony warning in single mode preview",
        "fix(cta): skip harmony validation in single mode (v11.4)",
        "fix(cta): enforce single mode monochromatic",
        "fix(faq): apca threshold 600 + single mode ui",
        "fix(faq): enforce single mode monochromatic",
        "fix(faq): align single mode with hero pattern",
        "fix(faq): align tabActive APCA weight",
        "fix(faq): align single mode with hero/stats",
        "fix(faq): improve single mode harmony and preview checks",
        "fix(faq): single mode harmony + tab text accessibility",
        "fix(faq): comply with dual-brand colors",
        "fix(cta): align preview responsive with container",
        "fix(cta): improve mobile spacing in preview layouts",
        "fix(cta): cải thiện gradient accessibility và responsive",
        "fix(product-categories): warn on duplicate selections",
        "fix(footer-preview): ensure unique keys for footer columns",
        "fix(footer): avoid duplicate social keys in preview and add DARE spec",
        "fix stats single-mode colors crash and save dirty state",
        "fix(cta): align banner description APCA threshold with rendered text size",
        "fix(cta): pass APCA checks for primary and secondary buttons",
        "fix(cta): correct APCA calculation and preview accessibility checks",
        "fix(product-list): use primary accents for prices and ctas",
        "fix(product-categories): boost primary accents in dual mode",
        "[Spec] Fix cta gradient accessibility responsive preview",
        "[Spec] Fix cta harmony warning n ng c p skill v11",
        "[Spec] Fix cta preview responsive container queries",
        "[Spec] Fix faq component dual brand color system v11 2 compliance",
        "[Spec] Fix faq single mode accessibility h c hero pattern",
        "[Spec] Fix faq single mode harmony accessibility",
        "[Spec] Fix faq tabbed accessibility single mode ui",
        "[Spec] Fix footer preview dual mode ch a th hi n secondary",
        "[Spec] Fix layout grid partners b r t d ng khi nhi u item",
        "[Spec] Fix marquee m t h n disable n t l u khi ch a thay i partners edit",
        "[Spec] Fix mismatch partners badge gi a preview v site render",
        "[Spec] Fix mismatch partners carousel gi a preview v site render",
        "[Spec] Spec dare review footer 6 layouts dual brand color system va fix footerpreview key",
        "[Spec] Spec fix responsive mobile cho cta layouts banner floating minimal",
        "[Spec] Spec upgrade dual brand color system va fix stats single mode save button runtime"
      ]
    }
  },
  {
    "date": "2026-02-16",
    "phase": "Màu kép OKLCH & APCA",
    "title": "C p nh t dual brand color system skill v9 component color map experiences",
    "categories": {
      "features": [
        "feat(skill): improve dual-brand distribution rules",
        "feat(hero): apply dual-brand colors to remaining layouts"
      ],
      "improvements": [
        "chore(skill): update primary usage rules v10",
        "docs(skill): cập nhật dual-brand color map v9",
        "docs(skill): simplify dual-brand system",
        "chore(skill): update dual-brand rules",
        "docs(skill): add accent prominence engine",
        "docs(skill): add nav arrow contrast guidance",
        "docs(skill): refine dual-brand pagination/placeholder rules",
        "chore: update commit workflow and add dual brand color system docs",
        "docs(skills): update dual-brand-color-system",
        "[Spec] C p nh t dual brand color system skill v9 component color map experiences",
        "[Spec] Dare review hero 6 layouts vs dual brand color system skill",
        "[Spec] Dare review product categories 6 layouts dual brand color system",
        "[Spec] Dare review productcategories dual brand color system",
        "[Spec] Dare review stats 6 layouts dual brand color system",
        "[Spec] Ho n thi n hero component theo dual brand color system",
        "[Spec] N ng c p dual brand color system v11",
        "[Spec] N ng c p productcategories 6 layouts theo dual brand color system v10",
        "[Spec] N ng c p skill dual brand color system redesign stats 6 layouts",
        "[Spec] N ng c p skill dual brand color system v7 0 accent prominence engine",
        "[Spec] N ng c p skill dual brand color system v7",
        "[Spec] N ng c p skill dual brand color system v8 g n g ng t ng qu t kh ng dry",
        "[Spec] T ng m u ch o cho product categories dual mode 6 styles"
      ],
      "fixes": [
        "fix(product-categories): sync grid and circular UI",
        "fix(product-categories): add primary heading color",
        "fix(product-categories): show primary heading color",
        "fix(product-categories): refine dual-brand accents",
        "fix(product-categories): tránh duplicate key",
        "fix(product-categories): chuẩn hóa màu dual-brand",
        "fix(stats): refine enterprise UI + dual-brand rules",
        "fix(stats): dong bo mau dual-brand",
        "fix(hero): adjust slider accents",
        "fix(hero): add slider dual-brand accents",
        "fix(hero): align bento placeholder colors",
        "fix(hero): sync site colors with preview",
        "fix(hero): align dual-brand indicators",
        "fix(hero): ensure badge text contrast",
        "fix(hero): update placeholders and harmony",
        "fix(hero): refine placeholder colors",
        "fix(hero): respect placeholder color",
        "fix(hero): migrate colors to OKLCH + preview swatch + hasChanges tracking",
        "fix(hero): correct apca import",
        "fix(hero): align slider colors with dual-brand system",
        "fix(home-components): align edit save actions",
        "[Spec] Fix badge text visibility in hero fullscreen and all layouts with badges",
        "[Spec] Fix duplicate key trong productcategoriessection",
        "[Spec] Fix hero bento placeholder colors sync render v i preview",
        "[Spec] Fix hero componentrenderer ng b m u s c v i heropreview theo dual brand color sy",
        "[Spec] Fix hero slider dual brand color th m primary visibility",
        "[Spec] Fix product categories heading kh ng c m u ch nh primary color",
        "[Spec] Fix productcategories thi u m u ch o theo dual brand color system",
        "[Spec] Fix productlist dual brand colors",
        "[Spec] N ng c p dual brand color system skill v10 fix primary underuse"
      ]
    }
  },
  {
    "date": "2026-02-15",
    "phase": "Màu kép OKLCH & APCA",
    "title": "Full implement cleanup migrate refactor 18 components",
    "categories": {
      "features": [
        "feat(home-components): split hero edit route",
        "feat(home-components): add type query to edit url",
        "feat(settings): add brand color mode toggle",
        "feat(home-components): add shared BrandColorHelpers and fix About component type bugs",
        "feat(skills): upgrade dual brand color system playbook",
        "feat(skills): expand dual brand color system guidance",
        "feat(skills): add dual brand color system best practices",
        "[Spec] Full implement cleanup migrate refactor 18 components",
        "[Spec] Hero component reference implementation cho dual brand color system",
        "[Spec] Refactor hero component t ch code theo feature based pattern"
      ],
      "improvements": [
        "refactor(hero): apply dual-brand color scheme",
        "refactor(home-components): migrate remaining editors",
        "refactor(home-components): add legacy editor routes",
        "refactor(home-components): route product categories editor",
        "refactor(home-components): split home components into modules",
        "refactor(home-components): split stats module",
        "docs(skills): add refactor-home-component",
        "docs(skills): upgrade dual brand color system v4.0",
        "[Spec] N ng c p skill dual brand color system v4 0 executable playbook",
        "[Spec] Nang cap skill dual brand color system v6 0 content aware color distribution",
        "[Spec] Nh gi to n b home components theo chu n refactor home component",
        "[Spec] P d ng dual brand color system cho 5 hero layouts c n l i",
        "[Spec] P d ng dual brand color system v o hero slider layout",
        "[Spec] Refactor 18 home components lo i b legacy editor ho n to n",
        "[Spec] Refactor stats component theo pattern hero",
        "[Spec] Review refactor partners component",
        "[Spec] Skill refactor home component t ch t monolithic file",
        "[Spec] Spec t ch blog home component",
        "[Spec] Spec t ch home component gallery",
        "[Spec] Spec t ch home component partners theo pattern refactor home component",
        "[Spec] Spec t ch home component productlist theo pattern hero",
        "[Spec] Spec t ch home component servicelist",
        "[Spec] Spec th m toggle 1 m u 2 m u v o settings module",
        "[Spec] T ch 19 home components c n l i theo pattern hero",
        "[Spec] T o skill dual brand color system oklch apca harmony",
        "[Spec] Th m query param type v o url edit home components"
      ],
      "fixes": [
        "fix(cta): set centered background to white",
        "fix(cta): align preview banner centered gradient styles",
        "fix(cta): rebalance primary and secondary colors in 3 layouts",
        "fix(product-list): rebalance primary and secondary colors",
        "fix(product-list): align preview colors and data",
        "fix(product-categories): use secondary for preview count",
        "fix(product-categories): align grid preview hover accent",
        "fix(product-categories): rebalance grid colors",
        "fix(product-categories): restore grid secondary accent",
        "fix(product-categories): remove grid overlay",
        "fix(product-categories): drop showcase layout and align grid accents",
        "fix(product-categories): rebalance preview color accents",
        "fix(stats): align primary and secondary colors",
        "fix(home-components): align secondary accents in previews",
        "fix(home-components): align secondary tint usage",
        "fix(product-categories): align primary/secondary accents",
        "fix(stats): apply dual brand colors to 6 layouts",
        "fix(hero): align remaining layouts with secondary accents",
        "fix(hero): apply secondary badge tints",
        "fix(home-components): uu tien mau chinh cho cta",
        "[Spec] Fix 3 issues hero colors oklch migration preview secondary display save button h",
        "[Spec] Fix cta preview mismatch banner centered gradient",
        "[Spec] Fix dual brand colors cho 6 productlist layouts",
        "[Spec] Fix dual brand colors cho cta component 3 layouts",
        "[Spec] Fix dual brand colors cho product categories grid layout",
        "[Spec] Fix dual brand colors grid x a showcase layout",
        "[Spec] Fix hero fade layout color display",
        "[Spec] Fix ux n t l u v link edit cho home components",
        "[Spec] K ho ch c i thi n dual brand color system v fix layout fade",
        "[Spec] Nh gi fix dual brand colors cho product categories component",
        "[Spec] Nh gi v fix dual brand colors cho stats component",
        "[Spec] Review fix dual brand colors productlist 6 layouts"
      ]
    }
  },
  {
    "date": "2026-02-14",
    "phase": "Màu kép OKLCH & APCA",
    "title": "Dual brand color system best practices skill creation",
    "categories": {
      "features": [
        "feat(home-components): apply dual brand colors",
        "feat(settings): add primary/secondary brand colors",
        "feat(seed): sync site logo and partner logos",
        "feat(seed): add logo picker and storage cleanup",
        "feat(seed): reuse hero/products for posts and gallery",
        "feat(seed): add done products image",
        "feat(seed): add image in logos",
        "[Spec] Full implementation dual brand color system 156 layouts",
        "[Spec] Logo wizard enhancement site logo partners split",
        "[Spec] Seed wizard enhancement logo selection convex storage cleanup",
        "[Spec] Spec fix 3 seed wizard bugs 100 accurate root cause analysis"
      ],
      "improvements": [
        "[Spec] Dual brand color system best practices skill creation",
        "[Spec] Dual brand colors cho hero preview 6 styles",
        "[Spec] Dual color design system cho vietadmin",
        "[Spec] Full refactor dual brand color system 23 components 138 layouts",
        "[Spec] N ng c p dual brand color system skill v3",
        "[Spec] P d ng dual brand color system cho 24 26 home components",
        "[Spec] P d ng dual brand color system cho hero component 6 layouts",
        "[Spec] Spec n ng c p skill dual brand color system v2",
        "[Spec] Spec p d ng dual brand color system cho stats component 6 layouts",
        "[Spec] Spec p d ng dual brand colors v o to n b home components",
        "[Spec] Spec t i u h a seed posts gallery tr nh seed th c ng",
        "[Spec] Spec v2 p d ng dual brand colors v o to n b home components"
      ],
      "fixes": [
        "fix(home-components): dong bo mau phu cho hero preview",
        "fix(seed): stabilize wizard step and website type",
        "[Spec] Fix m u ph secondary chi m ng 10 follow 60 30 10 ui rule"
      ]
    }
  },
  {
    "date": "2026-02-13",
    "phase": "Màu kép OKLCH & APCA",
    "title": "Websearch download nh seed_mau cho 44 ng nh",
    "categories": {
      "features": [
        "feat(seed): add seed image keyword map and verifier",
        "feat(seed): add extensive hero image assets for multiple industry templates",
        "feat(seed): add webp conversion script"
      ],
      "improvements": [
        "chore(seed): regenerate templates and assets",
        "[Spec] Websearch download nh seed_mau cho 44 ng nh"
      ],
      "fixes": []
    }
  },
  {
    "date": "2026-02-12",
    "phase": "Hệ thống Quản trị & Seed",
    "title": "C i thi n ux trang admin home components create simplified",
    "categories": {
      "features": [
        "feat(seed-home): randomize hero, gallery, logo assets",
        "feat(seed-wizard): add industry templates and seeding",
        "feat(home-components): add circular product categories style",
        "feat(home-components): add product image option",
        "feat(home-components): improve create UX",
        "feat(voucher-promotions): add four new layouts",
        "feat(home-components): nang cap voucher promotions enterprise auto from promotions",
        "feat(home-components): add voucher promotions component for CoC",
        "[Spec] Seed wizard v2 full implementation 44 industries"
      ],
      "improvements": [
        "docs: increase recommended seed image counts",
        "docs: add recommended seed image counts",
        "docs: add seed image size guidance",
        "docs: add seed template generation step",
        "chore(seed-templates): allow any asset filenames",
        "chore(seed-templates): switch sample assets to webp",
        "docs(agents): update Vietnamese language rule with tone specification",
        "[Spec] C i thi n ux trang admin home components create simplified",
        "[Spec] Lo i b tr ng l p gi a g i cho b n v t t c",
        "[Spec] Spec c i thi n ux trang admin home components create",
        "[Spec] T o script python convert nh sang webp v x a file g c",
        "[Spec] Th m option t s n ph m cho product categories image selector",
        "[Spec] Th m style circular style 7 cho product categories",
        "[Spec] Th m style circular v o componentrenderer trang ch"
      ],
      "fixes": [
        "fix(home-components): render circular categories on site",
        "fix(home-components): avoid duplicate recommended list",
        "fix(admin): honor disable avatar feature",
        "fix(kanban): capture original column for drag save"
      ]
    }
  },
  {
    "date": "2026-02-11",
    "phase": "Hệ thống Quản trị & Seed",
    "title": "Auto save crud c t kanban review amp confirm",
    "categories": {
      "features": [
        "feat(kanban): remove manual save button, show toast after auto-save",
        "feat: them nut luu thu cong kanban",
        "feat: tu luu kanban va sua task",
        "feat: cai thien keo tha kanban",
        "feat: them kanban module cho admin",
        "feat: them profile admin va dropdown logout",
        "docs: add documentation files for factory reset and digital products implementation",
        "feat: nang cap users/roles va auth admin"
      ],
      "improvements": [
        "docs: them rule spec mode vao agents",
        "[Spec] Auto save crud c t kanban review amp confirm",
        "[Spec] Auto save kanban debounce keo tha edit task dialog",
        "[Spec] C i thi n ux kanban auto save v i toast th ng b o",
        "[Spec] N gi n h a system login plain text password trong env",
        "[Spec] Th m n t save th c ng cho kanban board"
      ],
      "fixes": [
        "fix(kanban): use original drag column for move",
        "fix(kanban): simplify drag move save payload",
        "fix(kanban): dong bo source column khi keo task",
        "fix: don gian hoa system login env",
        "fix: them nut seed lai modules he thong",
        "fix: dong bo permission roles theo modules",
        "fix: dong bo bcryptjs trong convex",
        "[Spec] Fix auto save k o task sang c t kh c root cause th c s",
        "[Spec] Fix auto save khi k o task sang c t kh c kanban"
      ]
    }
  },
  {
    "date": "2026-02-10",
    "phase": "Hệ thống Quản trị & Seed",
    "title": "Admin user profile dropdown menu logout",
    "categories": {
      "features": [
        "feat: nang cap seed wizard v2",
        "feat: them seed wizard cho data command center",
        "feat: them sale mode contact/affiliate cho products",
        "feat: them nut mo nhanh /admin o header system",
        "feat: them nut xem tren web o trang edit posts va services",
        "feat: them nut xem tren web o trang edit product",
        "[Spec] Fix dashboard b block sau seed wizard do thi u module analytics",
        "[Spec] Seed wizard t ch h p ch b n h ng digital products",
        "[Spec] Seed wizard v2 care modules experiences settings coc dare"
      ],
      "improvements": [
        "refactor: remove redundant search experience page",
        "[Spec] Admin user profile dropdown menu logout",
        "[Spec] C i thi n k o th kanban m t h n",
        "[Spec] Dare analysis roles permissions system data",
        "[Spec] Kanban module cho admin spec chi ti t",
        "[Spec] N ng c p to n di n users roles module",
        "[Spec] Th m sale mode cho products module contact affiliate",
        "[Spec] Thay icon shield header system b ng n t m admin",
        "[Spec] Them rule spec mode vao agents"
      ],
      "fixes": [
        "fix: them host api.dicebear.com cho next/image",
        "fix: giu analytics sau seed wizard",
        "fix: xu ly module khong ton tai khi toggle cascade",
        "fix: cap nhat seo description theo setting excerpt",
        "[Spec] Fix module kanban khong hien thi tren system modules",
        "[Spec] Fix next image unconfigured host api dicebear",
        "[Spec] Fix togglemodulewithcascade module not found error"
      ]
    }
  },
  {
    "date": "2026-02-09",
    "phase": "Hệ thống Quản trị & Seed",
    "title": "Auto fill seo fields t title description khi b tr ng",
    "categories": {
      "features": [
        "feat: support digital products with credentials delivery",
        "feat: them factory reset 2 buoc",
        "feat: gom data command center va bo tab data module",
        "[Spec] Data command center full implementation checklist",
        "[Spec] Digital products support vietadmin full implementation",
        "[Spec] Fix orderseeder skip khi thi u dependencies"
      ],
      "improvements": [
        "[Spec] Auto fill seo fields t title description khi b tr ng",
        "[Spec] Factory reset v i x c nh n 2 b c",
        "[Spec] Seo description d a tr n module settings",
        "[Spec] Th m n t m web frontend v o trang edit product"
      ],
      "fixes": [
        "fix: cho phep reorder khi keo tha tren item",
        "fix: cap nhat reorder khi keo tha thu vien anh",
        "fix: dong bo items moi nhat khi upload nhieu anh",
        "fix: hien thi thu vien anh trong admin products",
        "fix: tu dong dien seo title/description khi bo trong",
        "fix: dieu huong thanh toan trong cart drawer",
        "fix: skip seeders khi thieu dependencies",
        "fix: seed config only sau factory reset",
        "fix: khoi tao lai module config sau factory reset",
        "fix: chia nho factory reset de tranh qua gioi han read",
        "[Spec] Fix 3 v n sau factory reset",
        "[Spec] Fix drag drop reorder stale closure bug",
        "[Spec] Fix factory reset ch seed config kh ng seed data",
        "[Spec] Fix factory reset t ch th nh nhi u steps",
        "[Spec] Fix multiimageuploader stale closure bug",
        "[Spec] Fix n t thanh to n trong cartdrawer"
      ]
    }
  },
  {
    "date": "2026-02-08",
    "phase": "Hệ thống Quản trị & Seed",
    "title": "B 2 toggle d th a account profile",
    "categories": {
      "features": [
        "feat: them metadata cho tat ca cac trang con thieu va cap nhat sitemap",
        "feat: mo rong seo va toi uu filter admin",
        "feat: add cascade delete previews for key modules",
        "feat: add cascade delete confirmations",
        "feat: sync account profile layouts",
        "feat: update account profile preview layouts",
        "feat: them drawer chi tiet don hang",
        "feat: dong bo loc va phan trang compact timeline",
        "feat: them icon dropdown loc trang thai",
        "feat: doi loc trang thai sang dropdown",
        "feat: an cau hinh huy don trong account orders",
        "feat: them crud trang thai don hang",
        "feat: dong bo trang thai don hang theo module",
        "feat: dong bo account orders tabs va pagination",
        "feat: them pagination va loc trang thai cho account orders",
        "feat: them anh san pham cho don hang",
        "feat: nang cap account orders enterprise ui",
        "feat: dong bo account orders layout voi preview",
        "feat: apply corporate contact form-only layout",
        "feat: redesign account orders preview layouts",
        "feat: enhance account experience settings"
      ],
      "improvements": [
        "chore: add documentation files for QA tickets and system improvements",
        "style: increase contrast for corporate contact sidebar",
        "refactor: share contact display blocks",
        "align contact experience preview and module status with existing patterns",
        "refactor contact experience to shared config and live preview",
        "[Spec] B 2 toggle d th a account profile",
        "[Spec] B loyalty badge kh i account profile",
        "[Spec] Cascade delete coverage report",
        "[Spec] Cascade delete v i confirmation dialog vietadmin best practices",
        "[Spec] Dare analysis account profile experience qa",
        "[Spec] Dare analysis ng b compact timeline v i cards",
        "[Spec] Database bandwidth index audit dare framework analysis",
        "[Spec] Ph n t ch 2 t c v thanh to n v c i t trong account profile",
        "[Spec] Redesign compact layout account profile experience",
        "[Spec] Seo system audit vietadmin core dare framework analysis",
        "[Spec] Spec refactor contact experience e2e",
        "[Spec] Sync account profile page with preview 3 enterprise layouts"
      ],
      "fixes": [
        "fix: toggle mobile search for classic/topbar",
        "fix: show mobile search input via responsive css",
        "fix: toggle mobile search in classic/topbar",
        "fix: refine compact account profile layout",
        "fix: remove unused account profile actions",
        "fix: remove loyalty badge",
        "fix: remove unused member info toggles",
        "fix: align card preview with page",
        "fix: remove member info from card layout",
        "fix: cap nhat action va tracking timeline",
        "fix: dong bo timeline drawer theo trang thai",
        "[Spec] Dare analysis fix mobile search cho classic topbar layouts",
        "[Spec] Fix compact layout order detail drawer",
        "[Spec] Fix mobile search button cho classic v topbar layouts",
        "[Spec] Fix mobile search cho classic topbar trong header tsx th t",
        "[Spec] Fix mobile search thay device prop b ng css responsive"
      ]
    }
  },
  {
    "date": "2026-02-07",
    "phase": "Hệ thống Quản trị & Seed",
    "title": "B sung qa tickets cho experiences search",
    "categories": {
      "features": [
        "feat: optimize order flow and account experiences",
        "feat: show realtime cart expiry countdown",
        "feat: add promotions to custom seed dialog",
        "feat: add promotions seeder for bulk seed",
        "feat: add promotions customer page",
        "feat: expand promotions module and experience",
        "feat: add vietqr preview to orders config",
        "feat: refine orders config tabs",
        "feat: refine orders config layout",
        "feat: improve orders config ux",
        "feat: render VietQR image",
        "feat: enhance checkout flow config",
        "feat: complete checkout flow",
        "feat: add wizard accordion checkout style",
        "feat: add table layout to cart experience",
        "[Spec] Fix bulk seed system th m promotionsseeder a d ng",
        "[Spec] Implementation plan qa experiences search 13 tickets",
        "[Spec] M r ng module khuy n m i promotions full features"
      ],
      "improvements": [
        "docs: bổ sung QA tickets cho experiences search",
        "docs: add QA tickets for experiences search",
        "chore: add helper text for seed presets",
        "refactor: unify seed system with single source of truth",
        "refactor: unify seed manager usage",
        "refactor: unify seed registry",
        "chore(docs): add documentation files for UI enhancements and refactor tasks",
        "docs: upgrade problem-solving framework",
        "docs: add DFS problem-solving guidance",
        "[Spec] B sung qa tickets cho experiences search",
        "[Spec] C u h nh ng order statuses v i preset custom",
        "[Spec] Chuy n h ng sau khi t h ng th nh c ng",
        "[Spec] Coc kh i hi n th x a allowcancel v n theo module",
        "[Spec] Complete unified seed registry dry cleanup",
        "[Spec] Countdown realtime cho cart expiry",
        "[Spec] Custom seed dialog thi u promotions",
        "[Spec] Dare analysis account orders v account profile experiences",
        "[Spec] Dare analysis e commerce orders workflow optimization",
        "[Spec] Ki m tra t ng th ch promotions v admin promotions",
        "[Spec] Nang cap enterprise ui voi brand color va actions",
        "[Spec] Ng b account orders frontend v i 3 preview layouts",
        "[Spec] Ng b trang account orders v i preview tabs pagination",
        "[Spec] Pagination tab l c c i thi n ux cho account orders cards",
        "[Spec] Qa analysis seed system consistency dare framework",
        "[Spec] Redesign account orders preview 3 distinct layouts",
        "[Spec] Refactor contact experience shared config professional layouts",
        "[Spec] Root cause promotions kh ng hi n th d li u",
        "[Spec] T o trang promotions customer facing",
        "[Spec] Th m vietqr preview cho th ng tin ng n h ng",
        "[Spec] Thay form only b ng corporate split layout",
        "[Spec] Ui c i ti n order statuses crud v multi select experience",
        "[Spec] X c nh v n kho ng tr ng d trong c t c i t chung"
      ],
      "fixes": [
        "fix: redirect to account orders after checkout",
        "fix: keep checkout address input focus",
        "fix: stop skeleton when paginated data exhausted",
        "fix: align search experience config and module status",
        "fix: allow public promotions default display",
        "fix: restore required promotionType",
        "fix: allow optional promotionType during migration",
        "fix: add promotionType migration",
        "fix: rebalance orders general config layout",
        "fix: tighten spacing for general settings",
        "fix: remove redundant spacing in orders config",
        "fix: remove extra spacing in settings card title",
        "docs: add documentation for usesearchparams suspense boundary error fix",
        "fix: wrap checkout search params in suspense",
        "fix: align cart page with preview",
        "[Spec] Fix font ti ng vi t th m nh s n ph m ng b preview",
        "[Spec] Fix input m t focus khi g a ch giao h ng",
        "[Spec] Fix kho ng tr ng d trong ordersconfigtab",
        "[Spec] Fix kho ng tr ng d trong settingscard c t c i t chung",
        "[Spec] Fix schema validation thi u promotiontype",
        "[Spec] Fix skeleton loading m i do thi u check exhausted status"
      ]
    }
  },
  {
    "date": "2026-02-06",
    "phase": "Hệ thống Quản trị & Seed",
    "title": "C i ti n agents md v i advanced problem solving framework",
    "categories": {
      "features": [
        "feat: add masonry layout to wishlist page",
        "feat: add masonry layout to wishlist experience",
        "feat: add comments ratings to product detail",
        "feat: add experiences builder skill",
        "feat: add preview zoom slider",
        "feat: apply search module CoC in menu config",
        "feat: add module-based header search autocomplete",
        "feat: add customer account menu and pages",
        "feat: implement allbirds header layout",
        "feat: replace transparent header with centered style",
        "[Spec] Xu t wizard form checkout styles cho enterprise"
      ],
      "improvements": [
        "refactor: replace wishlist masonry with table layout",
        "refactor: apply vertical scroll layout to misc experiences",
        "refactor: apply vertical scroll layout to commerce experiences",
        "refactor: apply vertical scroll layout to detail experiences",
        "refactor: apply vertical scroll layout to list experiences",
        "style: tune experience settings grid",
        "chore: widen experience layout container",
        "refactor: use vertical scroll layout for posts list experience",
        "Revert \"feat: add preview zoom slider\"",
        "[Spec] C i ti n agents md v i advanced problem solving framework",
        "[Spec] Dare ho n thi n lu ng checkout",
        "[Spec] Dare v3 checkout experience 16 root causes analysis",
        "[Spec] Dfs problem solving pattern cho agents",
        "[Spec] Orders config ux enhancement v2",
        "[Spec] Orders config ux v3 dare framework",
        "[Spec] Orders module config ux enhancement",
        "[Spec] Refactor wishlist thay masonry b ng data table layout",
        "[Spec] Th m comments rating v o product detail theo pattern posts detail",
        "[Spec] Th m layout masonry pinterest cho wishlist experience",
        "[Spec] Th m table layout cho cart experience",
        "[Spec] Vietqr image generation"
      ],
      "fixes": [
        "fix: widen search autocomplete and allow single char",
        "fix: show allbirds search autocomplete dropdown",
        "fix: focus allbirds search autocomplete",
        "fix: add contact and tracking pages for header links",
        "fix: refine allbirds header typography and search",
        "fix: show cta in topbar header",
        "[Spec] Dare fix cart page vs preview ui inconsistency",
        "[Spec] Fix th m masonry layout v o trang wishlist th c t",
        "[Spec] Fix usesearchparams suspense boundary error"
      ]
    }
  },
  {
    "date": "2026-02-05",
    "phase": "Nền tảng E-Commerce",
    "title": "Coc x a toggle search theo lo i hi n th tr ng th i module",
    "categories": {
      "features": [
        "feat: add tags toggle to posts detail experience",
        "feat: add posts module status to posts detail experience",
        "feat: show variants status in product detail experience",
        "feat: add quick add variant modal for products list",
        "feat: seed product variants by preset",
        "feat: add variant selector to product detail",
        "feat: integrate variants into cart and orders",
        "feat: add product variant admin pages",
        "feat: add product option admin pages",
        "feat: add product variant settings config",
        "feat: add product variant core schema",
        "feat: show cart in classic header",
        "feat: show search in classic header",
        "feat: show topbar in classic header",
        "feat: restructure classic config layout",
        "feat: add sticky header toggle",
        "feat: add header separator options",
        "feat: add classic header background patterns",
        "feat: simplify header menu config and classic styling",
        "[Spec] Implement allbirds style header",
        "[Spec] Phase 5 6 implementation plan",
        "[Spec] Preview zoom feature cho experience editor"
      ],
      "improvements": [
        "refactor: align experience module status gating",
        "docs: expand experience module status skill",
        "docs: remove custom notification sound rule",
        "docs: update agent rule for custom notification sound",
        "docs: add notification sound rule",
        "chore: remove search placeholder config",
        "[Spec] Coc x a toggle search theo lo i hi n th tr ng th i module",
        "[Spec] Menu experience module based search v i autocomplete",
        "[Spec] Phase 1 review phase 2 detailed plan",
        "[Spec] Phase 2 review phase 3 detailed plan",
        "[Spec] Phase 3 review remaining phases overview",
        "[Spec] Phase 6 frontend experience variant selector",
        "[Spec] Product variants module full detailed spec v2",
        "[Spec] Refactor experience layout sang vertical scroll pattern",
        "[Spec] Refactor experiences 1 way module status compliance",
        "[Spec] Refactor posts detail experience tags comments 1 way ux redesign",
        "[Spec] Refactor to n b experiences sang vertical scroll layout",
        "[Spec] Smart variant seed v i 12 preset combos theo ng nh",
        "[Spec] T ch h p product variants v o products list experience",
        "[Spec] T i u search autocomplete dropdown r ng h n 1 k t",
        "[Spec] T ng max width experience layout l n max w 7xl",
        "[Spec] T o skill experience module status v p d ng v o posts detail",
        "[Spec] Th m d ng th ng b o m thanh trong agents",
        "[Spec] Th m th ng b o tr ng th i variants v o product detail experience",
        "[Spec] Thay th transparent style b ng centered style"
      ],
      "fixes": [
        "fix: sync header menu module gating",
        "fix: đồng bộ mặc định phân trang products",
        "fix: ổn định phân trang admin products",
        "fix: allow sticky header on site layout",
        "fix: ensure sticky header default",
        "fix: sync header config with frontend",
        "[Spec] Fix allbirds header font dropdown search",
        "[Spec] Fix allbirds search autocomplete tr n site th c",
        "[Spec] Fix allbirds search dropdown b overflow hidden c t m t",
        "[Spec] Fix bug ph n trang admin products hi n th 3 thay v 12",
        "[Spec] Fix header 404 links login and contact",
        "[Spec] Fix header user menu when logged in",
        "[Spec] Qa issues system experiences menu deep scan"
      ]
    }
  },
  {
    "date": "2026-02-04",
    "phase": "Nền tảng E-Commerce",
    "title": "B placeholder search convention over configuration",
    "categories": {
      "features": [
        "feat: add header menu experience",
        "feat: make product highlights configurable",
        "feat: add buy-now config for products list and detail",
        "feat: enhance add-to-cart UX and buy-now flow",
        "feat: implement login-required cart flow",
        "feat: sync Add to Cart visibility with Cart/Orders module status",
        "feat: add wishlist loading skeleton",
        "feat: implement customer wishlist flow",
        "feat: wire products list feature toggles",
        "feat: add bulk seed toggle",
        "feat: standardize notifications admin list",
        "feat: standardize users admin list",
        "feat: standardize reviews admin list",
        "feat: standardize services admin list",
        "feat: standardize comments admin list",
        "feat: standardize commerce admin lists",
        "feat: add admin list boilerplate skill",
        "feat: add sticky header to admin posts table"
      ],
      "improvements": [
        "chore: clarify AGENTS validation guidance",
        "[Spec] B placeholder search convention over configuration",
        "[Spec] B sung ux add to cart mua ngay sonner login required",
        "[Spec] C i thi n classic background options v i pattern th c s",
        "[Spec] C i thi n menu experience classic config coc ux",
        "[Spec] C i thi n ux c u h nh classic header menu experience",
        "[Spec] Cart module simplified login required db only",
        "[Spec] Ng b classic background th m header separator options",
        "[Spec] Ng b modern minimal preview v i ui th c",
        "[Spec] Qa report product detail experience products module",
        "[Spec] T ch experience menu t admin menus full spec",
        "[Spec] Th m cart icon v o classic style",
        "[Spec] Th m search v o classic style preview v frontend",
        "[Spec] Th m t y ch n sticky header",
        "[Spec] Th m topbar v o classic style preview v frontend"
      ],
      "fixes": [
        "fix: add wishlist example link",
        "fix: remove modern preview tabs and highlights",
        "fix: align modern and minimal previews with live UI",
        "fix: merge classic highlights controls",
        "fix: align classic product detail preview with live UI",
        "fix: ensure legacy highlight setting has value",
        "fix: sync product detail experience config",
        "fix: wrap site with convex provider",
        "fix: mark checkout page as client component",
        "fix: sanitize wishlist product payload",
        "fix: use correct Header import casing",
        "fix: mark system module pages as client components",
        "fix: remove reset actions from admin lists",
        "fix: align admin list columns with module fields",
        "fix: sync post category fields with module config",
        "fix: persist admin posts table state",
        "[Spec] Debug sticky header v i console",
        "[Spec] Fix header menu config haschanges reset v sync frontend",
        "[Spec] Fix headersticky kh ng ho t ng tr n frontend",
        "[Spec] Fix sticky header overflow x hidden ph v sticky"
      ]
    }
  },
  {
    "date": "2026-02-03",
    "phase": "Nền tảng E-Commerce",
    "title": "Add cross-module toggles for products list",
    "categories": {
      "features": [
        "feat: add cross-module toggles for products list",
        "feat: sync services price field from experience toggle",
        "feat: add pagination to services page",
        "feat: apply pagination to products and services experiences",
        "feat: add experience pagination guide skill",
        "feat: update pagination UI and page size selector",
        "feat: pagination page numbers and skeleton loading",
        "feat: implement pagination and infinite scroll",
        "feat: add UI components for advanced seed system",
        "feat: implement advanced seed system with faker.js and dependency management",
        "feat: replace pagination toggle with paginationType selector for products and services lists",
        "feat: apply paginationType to all 3 layouts (fullwidth, sidebar, magazine) for preview and frontend"
      ],
      "improvements": [
        "perf: use cursor pagination cache for faster page changes",
        "style: apply brand color to pagination controls",
        "refactor: match elegant pagination layout and fix page reset",
        "refactor: use usePaginatedQuery for infinite scroll and URL params for pagination",
        "docs: add comprehensive seed system documentation",
        "refactor: replace pagination toggle with paginationType selector",
        "ExperienceQATesterSkill",
        "CompactHeaderPattern",
        "refactor(experiences): migrate to Full Preview + Floating Bottom Panel pattern",
        "chore: remove appearance tab from modules - use /system/experiences instead",
        "refactor(phase5): CoC module system - analytics module",
        "refactor(phase4): CoC module system - cart, media, notifications, promotions, settings",
        "refactor(phase3): CoC module system - products, services configs + DataTabs",
        "refactor(phase2): CoC module system - customers, users, roles, orders, menus",
        "refactor(phase1): CoC module system - comments, wishlist, homepage"
      ],
      "fixes": [
        "fix: enhance admin posts listing",
        "fix: improve products search coverage",
        "fix: enable products search in grid",
        "fix: normalize products category dropdown",
        "fix: simplify products grid filters",
        "fix: guard products list layout config",
        "fix: align products list layouts and seed typings",
        "fix: remove products list filter position toggle",
        "fix: make services module config page client",
        "fix: show classic service price in header",
        "fix: remove price from classic quick contact block",
        "fix services-detail experience config sync and minimal toggles",
        "fix: sync services sidebar layout with preview config (showSearch, showCategories)",
        "fix: show pagination for product list layouts",
        "fix: show skeleton while cursor pages load",
        "fix: use offset-based pagination query and improve pagination UI",
        "fix: resolve seed 0 records bug in BaseSeeder",
        "fix: resolve build errors and update seeder file names",
        "fix: hoan thien previews va cleanup lint"
      ]
    }
  },
  {
    "date": "2026-02-02",
    "phase": "Nền tảng E-Commerce",
    "title": "Coc module system implementation plan",
    "categories": {
      "features": [
        "feat: Modern/Minimal hiện nút thích và trả lời ở preview và frontend",
        "feat: thêm toggle like/replies cho Modern/Minimal + full-width khi không có related",
        "feat: refactor experience pages với Full Preview + Bottom Panel pattern",
        "feat: add Experience Editor UI/UX skill (Full Preview + Floating Bottom Panel pattern)",
        "feat: implement CoC module system infrastructure",
        "feat: add CoC Module System skill for reducing module config boilerplate",
        "feat: apply comments auto-approve and interactive replies",
        "feat: add comments like/reply toggles for classic",
        "feat: sync comments toggle across posts detail",
        "feat: use text author field for posts",
        "feat: add author selection and display for posts",
        "feat: show author in posts detail preview",
        "feat: ensure posts author field exists",
        "feat: link posts detail author toggle to module field",
        "feat: add prompt best practices",
        "feat: add toggle controls for modern contact section",
        "feat: add breadcrumb navigation to modern service detail style",
        "feat: add dynamic config for Modern and Minimal layouts",
        "feat: make classic quick contact button configurable",
        "feat: add classic quick contact config for service detail",
        "feat: connect services detail page to experience config",
        "feat: align service detail preview with site layout",
        "feat: add image fallbacks to previews and post detail",
        "feat: add image fallback guidelines to experience-preview-extractor skill",
        "feat: move magazine category into dropdown and align sort",
        "feat: add sort to sidebar and search/sort to magazine services layouts",
        "feat: connect /services page to experience config",
        "feat: extract UI skeleton for services-list preview (FullWidth, Sidebar, Magazine)",
        "feat: extract UI skeleton for posts-detail preview (Classic, Modern, Minimal)",
        "[Spec] Coc module system implementation plan"
      ],
      "improvements": [
        "refactor: CommentsSection với toggle like/unlike và replies",
        "refactor: frontend CommentsSection với modern design",
        "refactor: CommentsPreview gọn gàng và đẹp hơn",
        "refactor: update CommentsPreview với modern design theo reference",
        "refactor: posts module với CoC ModuleConfigPage (1168 → 32 dòng)",
        "style: refine comments layout",
        "style: align comments ui with redesign",
        "style: refine comments ui",
        "style: indent comment replies",
        "refactor: rely on comments default status",
        "refactor: update posts detail experience controls",
        "chore: refine prompt best practices",
        "refactor: simplify modern config - remove unused CTA section fields",
        "refactor: remove breadcrumb border and reduce padding",
        "refactor: apply shadcn/ui design principles to modern service detail style",
        "refactor: remove duplicate CTA and reduce heading size in modern service preview",
        "refactor: optimize modern hero UI for service detail preview",
        "refactor: move share toggle to classic config and remove unused blocks",
        "docs: update experience-preview-extractor with image fallback state tracking pattern",
        "refactor: simplify services-list experience config"
      ],
      "fixes": [
        "fix: like count không còn bị double",
        "fix: allow legacy author id in posts schema",
        "fix: ensure posts reset seeds author name",
        "fix: balance quick contact text size in classic service detail",
        "fix: harden image fallbacks for posts and services",
        "fix: rename list to sidebar and simplify grid layout preview",
        "fix: make button compact and align to right in Modern layout",
        "fix: improve button spacing and vertical centering in Modern layout",
        "fix: center align button text in Modern layout related posts",
        "fix: align button position in Modern layout related posts"
      ]
    }
  },
  {
    "date": "2026-02-01",
    "phase": "Nền tảng E-Commerce",
    "title": "Apply experience-preview-extractor to Sidebar & Magazine layouts",
    "categories": {
      "features": [
        "feat: apply experience-preview-extractor to Sidebar & Magazine layouts",
        "feat: upgrade experience-preview-extractor skill with 2026 best practices",
        "feat: add experience preview extractor skill",
        "feat: Refresh posts-list experience preview UI",
        "feat: Align posts-list experience with module preview",
        "feat: Sync experiences config with legacy module settings for real UI impact",
        "feat: Add realtime preview with auto-reload after save and config reading in site pages",
        "feat: Add LivePreview with iframe and ExampleLinks for real UI preview",
        "feat: Add 7 new experience pages with realtime previews for all 12 pages",
        "Add migration guide, architecture docs, and update README",
        "Add experience pages for wishlist, cart, checkout, comments/rating",
        "Add experience hub and product detail config",
        "feat(comments): add ratings",
        "feat(products): improve icon picker popup",
        "feat(products): popup icon picker",
        "feat(products): classic highlights toggle and icons",
        "feat(products): configurable classic highlights",
        "feat(skills): add react best practices and composition patterns",
        "feat(skills): add web-design-guidelines skill",
        "feat(products): align modern detail UI",
        "feat(products): tighten minimal spacing and add breadcrumb",
        "feat(products): refresh modern and minimal layouts",
        "feat(services): refresh modern and minimal layouts",
        "feat(services): add inline Contact Settings to config page",
        "feat(services): add QuickContact system with Zalo/Messenger",
        "feat(services): sync preview with config fields"
      ],
      "improvements": [
        "refactor: Revert to preview components instead of iframe for realtime preview",
        "refactor: Move preview to full-width for better desktop view, increase height to 800px",
        "docs: Add comprehensive Experiences System developer guide",
        "Refactor: Extract shared components and hooks for DRY experience pages",
        "chore: remove claude settings and update agent guidelines",
        "refactor(services): simplify modern minimal separators",
        "style(services): improve classic detail a11y",
        "style(services): improve magazine layout a11y",
        "chore(services): remove sidebar widgets",
        "style(services): improve full width a11y",
        "chore(uiux-skill): add concrete ratios and sources"
      ],
      "fixes": [
        "fix: show mobile filter button in posts preview",
        "fix: align posts mobile preview with site filters",
        "fix: always render compact filter panel in posts preview",
        "fix: apply responsive skeleton rules to posts preview",
        "fix: align posts fullwidth preview with site layout",
        "fix: align posts list preview filters and preview components",
        "fix(comments): ensure rating field seeded",
        "fix(services): move quick contact below related",
        "fix(services): simplify quick contact UI",
        "fix(services): add image error fallback for related",
        "fix(services): improve contact popup and fallbacks",
        "fix(services): reuse detail styles in preview",
        "fix(services): sync appearance preview with published data",
        "fix(services): add appearance settings to seed data",
        "fix(services): add missing dependencies to hasChanges detection",
        "fix(lint): resolve oxlint issues",
        "fix(services): improve sidebar a11y",
        "fix(services): keep list stable on search"
      ]
    }
  },
  {
    "date": "2026-01-31",
    "phase": "Khởi tạo Schema",
    "title": "Add uiux 2026 best practices skill",
    "categories": {
      "features": [
        "add uiux 2026 best practices skill"
      ],
      "improvements": [
        "style(posts-detail): move actions into hero and add related thumbs",
        "style(posts-detail): apply premium minimal principles",
        "style(posts-detail): refresh minimal with full-bleed cover",
        "style(posts-detail): rebuild minimal layout",
        "style(posts-detail): remove all-posts button and brand the see-more link",
        "style(posts-detail): remove dividers around all-posts button",
        "style(posts-detail): simplify meta row and enhance related cards",
        "style(posts-detail): refresh modern layout with cleaner hierarchy",
        "style(posts-detail): widen modern layout and use Noto Sans",
        "style(posts-detail): simplify modern layout hierarchy",
        "chore(docs): update AGENTS.md with pre-commit linting instruction",
        "style(admin-posts): refine table spacing",
        "chore(lint): silence warnings",
        "chore(lint): relax rules blocking lint",
        "style(posts-detail): expand content column",
        "style(posts-detail): soften classic related section",
        "style(posts-detail): soften classic image cards",
        "style(posts-detail): simplify layouts for cleaner hierarchy",
        "style(posts-detail): align classic/modern/minimal layouts"
      ],
      "fixes": [
        "fix: allow picsum images and resolve lint hook order",
        "chore(lint): fix oxlint errors"
      ]
    }
  },
  {
    "date": "2026-01-29",
    "phase": "Khởi tạo Schema",
    "title": "Style(posts-magazine): remove trending section, add search/sort/filter bar, comp...",
    "categories": {
      "features": [],
      "improvements": [
        "style(posts-magazine): remove trending section, add search/sort/filter bar, compact design",
        "style(posts-sidebar): optimize sidebar layout - remove widgets, add sort, compact design, and skeleton",
        "style(posts-filter): optimize filter bar layout - dropdown category, right-aligned sort, compact design",
        "style(posts-frontend): optimize fullwidth layout - remove view toggle, compact spacing, modern design",
        "style(posts): optimize admin list layout - compact spacing and cleaner design"
      ],
      "fixes": [
        "fix(posts-search): add 300ms debounce and remove skeleton flash on filter/search"
      ]
    }
  },
  {
    "date": "2026-01-15",
    "phase": "Khởi tạo Schema",
    "title": "Enhance carousel sections with navigation arrows and drag scrolling",
    "categories": {
      "features": [
        "feat(components): enhance carousel sections with navigation arrows and drag scrolling",
        "feat(ServiceListSection): add carousel navigation arrows and mouse drag scrolling",
        "feat(ProductListSection): add carousel navigation arrows and drag scrolling",
        "feat(Clients): optimize logo sizes +20%, remove grayscale, compact spacing",
        "feat(Countdown): popup shows once per session, dismissable",
        "feat(Countdown): implement 6 styles with best practices",
        "feat(Team): add mouse drag scroll for Carousel on desktop"
      ],
      "improvements": [
        "style(home-components): update component display text",
        "docs(skill): add type=button requirement for preview buttons to prevent form submission",
        "docs(skill): add complete Carousel pattern with navigation + mouse drag",
        "docs(skill): add Contained Marquee/Carousel pattern to create-home-component",
        "refactor(Team): redesign Overlap to Marquee style - modern infinite scroll",
        "refactor(Features): optimize Alternating and Timeline styles spacing",
        "refactor(Team): redesign Carousel and Hexagon styles with Best Practices - Carousel: horizontal scroll with partial peek, fade edges, snap-scroll - Hexagon->Overlap: stacked avatars with hover tooltips, bento cards - Better UX patterns based on 2024 carousel design guidelines",
        "refactor(CategoryProducts): redesign Magazine style to Editorial Grid layout"
      ],
      "fixes": [
        "fix(Countdown): popup style now uses fixed overlay over entire page",
        "fix(Countdown): sync popup style between preview and homepage",
        "fix(Countdown): add type=button to prevent form submission",
        "fix(Countdown): fix popup style overlay issue in preview/edit",
        "fix(ProductCategories): contain marquee within max-w-7xl like other styles",
        "fix(layout): add overflow-x-hidden to site layout to prevent marquee overflow",
        "fix(Team): fix hexagon/marquee style overflow with proper container constraints",
        "fix(ProductCategories): fix marquee overflow with proper overflow-hidden containers",
        "fix(Team): sync carousel preview 100% with ComponentRenderer",
        "fix(Team): apply contained carousel pattern + sync preview with ComponentRenderer",
        "fix(Features): add navigation buttons and mouse wheel scroll to Carousel",
        "fix(Features): change Carousel from grid to horizontal scroll",
        "fix(Team): contain marquee within max-w-7xl to prevent overflow",
        "fix(Features): sync ComponentRenderer with Preview - add +N pattern",
        "fix(Team): sync ComponentRenderer với preview + fix overlap real-time rendering",
        "fix(CategoryProducts): change Magazine category link to /products?category=",
        "fix(ProductCategories): change links from /danh-muc/slug to /products?category=slug",
        "fix(ProductCategories): use unique itemId key to prevent duplicate key error"
      ]
    }
  },
  {
    "date": "2026-01-14",
    "phase": "Khởi tạo Schema",
    "title": "Apply best practices with drag&drop, equal height cards, brandColor empty states...",
    "categories": {
      "features": [
        "feat(CategoryProducts): apply best practices with drag&drop, equal height cards, brandColor empty states, image size guidelines",
        "feat(ProductCategories): add 6 styles, drag-drop, best practices - Add 3 new styles: minimal, showcase, marquee (total 6) - Add drag & drop reordering for categories - Add monochromatic hover effects with brandColor - Add image size recommendations in preview info bar - Add +N pattern for many items, centered for few items - Add line-clamp, responsive spacing - Update ComponentRenderer with all 6 styles",
        "feat(SpeedDial): upgrade to 6 styles with full best practices",
        "feat(CaseStudy): apply Best Practice - 6 styles, dynamic image info, equal height cards, edge cases",
        "feat(Career): upgrade to 6 styles with Best Practices",
        "feat(Gallery): show optimal image sizes in preview info bar",
        "feat(Pricing): upgrade to 6 styles + best practices",
        "feat(Testimonials): upgrade to 6 styles + drag&drop + best practices",
        "feat(Gallery): add 6 styles + keyboard nav lightbox + best practices",
        "feat(Services): add 6 styles + icon selector + drag & drop",
        "feat(Benefits): upgrade to 6 styles + best practices",
        "feat(Footer,About): implement Best Practice - 6 styles each",
        "feat(FAQ): add configurable CTA for two-column style - description, buttonText, buttonLink fields - form shows when style = two-column - remove hardcoded button text",
        "feat(FAQ): add FaqEditSection component with drag & drop for edit page",
        "feat(CTA): add 3 new styles (floating, gradient, minimal) + badge field + best practices",
        "feat(blog-section): sync frontend with 6 styles from BlogPreview",
        "feat(blog-preview): upgrade to 6 styles with full Best Practice compliance",
        "feat(partners): add 2 new styles (carousel, featured) + best practices improvements",
        "feat(service-list-frontend): sync brandColor to all 6 styles matching preview",
        "feat(service-list-preview): add brandColor to all 6 styles (grid, bento, list, carousel, minimal, showcase)",
        "feat(service-list): add 2 new styles (minimal, showcase) + use brandColor for monochromatic design"
      ],
      "improvements": [
        "refactor(Contact): remove form UI, use contact info cards for minimal/centered styles",
        "perf: parallel upload multiple images with Promise.all",
        "docs(skill): add Dynamic Image Size Info requirement to create-home-component",
        "improve(Gallery): enhance image size guidelines with detailed layout info",
        "docs(skill): add Dependent Fields section - style-specific config pattern to avoid hardcode",
        "refactor(CTA): redesign Split style to differentiate from Banner",
        "refactor(partners): compact spacing, larger logos (+10%), remove hover effects",
        "docs(skill): add Equal Height Cards section - fix cards với excerpt/description khác nhau gây grid không đều",
        "docs(skill): add Spacing & Density Best Practices section with responsive patterns, touch targets, whitespace balance",
        "docs(skill): add WebSearch best practices section with component-specific search queries and checklist output format",
        "docs(skill): update create-home-component - require 6 styles, add monochromatic color system, image guidelines, typography rules",
        "refactor(skill): DRY - reduce from ~900 lines to ~200 lines, remove duplications",
        "docs(skill): add brandColor sync guidelines for preview-frontend consistency"
      ],
      "fixes": [
        "docs(skill): add warning about ComponentRenderer style fallback order bug",
        "fix(Contact): move minimal/centered styles before default return so they actually render",
        "fix(Contact): add getSocialIcon helper to ComponentRenderer for minimal/centered styles",
        "fix(Contact): change form preview to pure UI (avoid nested form error)",
        "fix(Career): Timeline style - đánh số job 1,2,3 thay vì số lượng",
        "fix(TrustBadges): sync carousel/cards/wall with preview exactly",
        "fix(TrustBadges): remove grayscale, sync preview with homepage",
        "fix(Benefits): Carousel style with scroll arrows + hidden scrollbar",
        "fix(Footer): use shadeColor instead of darkenColor for brand-based background",
        "fix(Footer): add centered and stacked styles to DynamicFooter",
        "fix(Footer): sync ComponentRenderer with previews.tsx styling",
        "fix(About): fix 3 new styles not rendering + redesign showcase style",
        "fix(Footer): use brandColor shades instead of hardcoded dark colors",
        "fix(blog-section): improve Magazine + Carousel layouts",
        "fix(blog-section): hide horizontal scrollbar in Carousel style",
        "fix(partners): improve form UX - use vertical layout with 2 columns instead of cramped 4-col horizontal",
        "fix(partners): move useState to component level to fix React Hooks rules",
        "fix(service-list-showcase): wider button + add 10% brandColor usage (prices, borders, shadows, accents)",
        "fix(service-list-preview): sync title between preview and frontend",
        "fix(service-list-create): show real-time preview for manual selection mode"
      ]
    }
  },
  {
    "date": "2026-01-13",
    "phase": "Khởi tạo Schema",
    "title": "Add real-time preview for manually selected services",
    "categories": {
      "features": [
        "feat(service-list): add real-time preview for manually selected services",
        "feat(product-list): add dynamic text config to edit page",
        "feat(product-list): add dynamic text config (subTitle, buttonText)",
        "feat(product-list): add 3 new styles - carousel, compact, showcase",
        "feat(product-list): add manual/auto selection mode for create page",
        "feat(stats): add 3 new styles - gradient, minimal, counter",
        "feat(hero): add image size guidelines for each style in preview",
        "feat(hero): add dynamic content form for fullscreen, split, parallax styles",
        "feat(hero): add 3 new styles (fullscreen, split, parallax) for Hero component",
        "feat(home-components): add Countdown/Promotion create page",
        "feat(home-components): add Video/Media component with YouTube/Vimeo support",
        "feat(home-components): add Clients Marquee component with auto-scroll logo animation (4 styles: marquee, dual-row, wave, logo-wall)",
        "feat(home-components): add Process/HowItWorks component with 4 styles (timeline, steps, cards, zigzag)",
        "feat(home-components): add Features component with icon grid, alternating, and compact styles",
        "feat(skill): add create-home-component skill with best practices and checklist",
        "feat(team): add 3 new creative styles (hexagon, timeline, spotlight)",
        "feat(team): use ImageFieldWithUpload for avatar with drag-drop, WebP 85%, slugify",
        "fix(home-components): add Team support to edit page with form and preview",
        "feat(home-components): add Team component with 3 styles (grid, cards, carousel) and social links",
        "feat(category-products): add 3 creative styles - bento, magazine, showcase with responsive design",
        "feat(home-components): add CategoryProducts component - products by category sections with view category button",
        "fix(product-categories): add icon rendering support in frontend ComponentRenderer",
        "feat(product-categories): add CategoryImageSelector with 4 modes (default/icon/upload/url) and 75+ Lucide icons",
        "feat(home-components): add ProductCategories edit support with form and preview",
        "feat(home-components): add ProductCategories component with 3 styles (grid, carousel, cards)",
        "feat(frontend): implement SpeedDial component for homepage rendering",
        "feat(home-components): add SpeedDial component with 3 styles (FAB, Vertical, Arc)",
        "feat(contact): add 4 professional styles (modern, floating, grid, elegant) to ContactPreview and ContactSection"
      ],
      "improvements": [
        "docs(skill): add Image Size Guidelines section for create-home-component",
        "refactor(hero): simplify image size guidelines to one-liner format",
        "docs(skill): add comprehensive drag & drop reorder patterns for items",
        "refactor(clients): compact form UI with inline thumbnail grid, hover controls, and smaller inputs",
        "docs(skill): add Form UI/UX optimization and Preview edge cases guidelines",
        "refactor(team): compact UI with inline avatar, social icons popover, collapsible bio",
        "refactor(speed-dial): improve UX with 3 cleaner styles (FAB, Sidebar, Pills) - always open"
      ],
      "fixes": [
        "fix(service-list-preview): ensure mock data always shows in preview",
        "fix(product-list): change buttonText to sectionTitle for main heading config",
        "fix(product-list): remove useState from render function to fix hooks error",
        "fix(clients): remove hardcoded stats from Wave style in ComponentRenderer",
        "fix(clients): use saveImage mutation to get proper storage URL",
        "fix(clients): use correct api.storage.generateUploadUrl",
        "fix(clients): remove hardcoded stats in Wave preview, add URL input option for logos",
        "fix(ImageFieldWithUpload): remove WebP badge after upload",
        "fix(category-products): stack price display vertically to prevent UI overflow across all 6 styles"
      ]
    }
  },
  {
    "date": "2026-01-12",
    "phase": "Khởi tạo Schema",
    "title": "Add 3 styles (cards, horizontal, minimal) to frontend PricingSection",
    "categories": {
      "features": [
        "feat(pricing): add 3 styles (cards, horizontal, minimal) to frontend PricingSection",
        "fix(pricing): add style selection for create and edit pages with full form support",
        "feat(gallery): add 3 professional gallery styles (Spotlight, Explore, Stories) from pure-visual-gallery",
        "feat(home-components): add TrustBadges preview with 4 professional styles (grid, cards, marquee, wall) and lightbox modal",
        "feat(home-components): add name field for TrustBadges items in create and edit forms",
        "feat(footer): apply monochromatic color scheme to admin preview (FooterPreview)",
        "feat(footer): use monochromatic color scheme from brandColor setting",
        "feat(footer): add proper social media icons (Facebook, Instagram, Youtube, TikTok, Zalo)",
        "feat(footer): add 'Load từ Settings' button to Footer edit page",
        "feat(footer): add full form for Footer edit page with logo, columns, and social links management",
        "feat(footer): add 4 professional preview styles (Classic Dark, Modern Center, Corporate, Minimal)",
        "feat(footer): add logo, social links config and load from settings button",
        "feat(footer): add menu columns configuration to match preview",
        "feat(partners): add 4 professional UI styles (Grid, Marquee, Mono, Badge) from partner-&-logo-manager reference"
      ],
      "improvements": [
        "style(partners): increase logo size by ~20% in all 4 styles",
        "style(productList): use fluid typography for Commerce Card button on mobile",
        "refactor(productList): replace 3 old styles with new UI from BrandStory"
      ],
      "fixes": [
        "fix(career): add 3 styles (cards, list, minimal) to frontend CareerSection",
        "fix(contact): add mapEmbed field to create contact form",
        "fix(career): add style selection for create and edit pages with preview tabs",
        "fix(home-components): add style selection for CaseStudy and Career components",
        "fix(gallery): improve upload UI with vertical layout, 2 columns and video aspect ratio",
        "fix(trust-badges): prevent modal from rendering with empty image url",
        "fix(trust-badges): simplify UI - remove medal icons, use monochromatic brandColor for titles",
        "fix(home-components): improve TrustBadges UX with vertical card layout",
        "fix(site): add 3 styles (cards, slider, masonry) for TestimonialsSection to match admin preview",
        "fix(home-components): add TestimonialsPreview and style selector for Testimonials edit page",
        "fix(footer): increase social icon size, reduce padding",
        "fix(footer): reduce social icon background size by half",
        "fix(footer): add white background for social icons in all footer styles",
        "fix(footer): use white text colors with opacity for all footer text",
        "fix(footer): use white background for social media icons",
        "fix(footer): lighten background colors for better visibility",
        "fix(footer): use neutral text colors and brand colors for social icons",
        "fix(footer): reduce spacing significantly for all 4 footer styles",
        "fix(footer): optimize monochromatic colors for better contrast and darker background",
        "fix(footer): add fallback key for columns to fix React warning",
        "fix(footer): use simple monochrome Zalo icon from Simple Icons",
        "fix(footer): use official Zalo logo SVG icon",
        "fix(footer): add fallback key for social links to fix React warning",
        "fix(productList): prevent button text wrapping on mobile"
      ]
    }
  },
  {
    "date": "2026-01-11",
    "phase": "Khởi tạo Schema",
    "title": "Upgrade Services UI/UX with 3 new variants (Elegant Grid, Modern List, Big Numbe...",
    "categories": {
      "features": [
        "feat(services): upgrade Services UI/UX with 3 new variants (Elegant Grid, Modern List, Big Number)",
        "feat(about): apply monochromatic color scheme with brandColor tints/shades for all 3 variants",
        "feat(about): add ImageFieldWithUpload with drag-drop, WebP 85% compression for About image",
        "feat(about): upgrade About component UI/UX with brand-story design (3 variants: classic, bento, minimal)",
        "feat(services): upgrade ServiceList UI/UX with luxury services gallery design (4 variants)",
        "feat(blog): upgrade Blog component UI/UX with modern news feed design",
        "feat(products): upgrade ProductList UI/UX with elegant showcase design",
        "feat(stats): upgrade Stats component UI/UX with professional design",
        "feat(home-components): add drag & drop reorder using @dnd-kit",
        "feat(seo): add dynamic SEO with sitemap, robots, JSON-LD and metadata",
        "feat(home-components): add manual selection and real data for ProductList/ServiceList",
        "feat(products): add public pages, appearance config, and fix TypeScript errors",
        "feat(services): add complete services module with admin, public pages, and system config"
      ],
      "improvements": [
        "refactor(benefits): replace 3 old styles with 4 new professional UI styles",
        "style(hero): add 5% brandColor accent for Monochromatic design",
        "style(services): reduce spacing in Modern List for compact look",
        "refactor(services): simplify Modern List layout with big numbers"
      ],
      "fixes": [
        "fix(services): remove 'Chi tiết' button from Elegant Grid (not in form)",
        "fix(services): apply brandColor consistently and remove hover effects for mobile",
        "fix(services): improve carousel UX with snap-start, scroll-smooth, and best practices",
        "fix(services): wire ServiceListPreview to admin create/edit pages with 4 variants"
      ]
    }
  },
  {
    "date": "2026-01-10",
    "phase": "Khởi tạo Schema",
    "title": "Add manual post selection for Blog component",
    "categories": {
      "features": [
        "feat(home-components): add manual post selection for Blog component",
        "feat(posts): redesign posts listing with 3 layouts and filter/search/sort",
        "feat(blog): add public posts pages with 3 style variants and style selector",
        "feat(home-components): add multi-style support with preview selector for all components",
        "feat(footer): replace hardcoded footer with dynamic footer from home-components",
        "feat(settings): integrate SEO and General settings to homepage",
        "feat(scrollbar): custom 2px thin scrollbar with brand color sync",
        "feat(hero-banner): add multi-style support with slider, fade and bento layouts",
        "feat(header): add semi-transparent overlay for transparent style"
      ],
      "improvements": [],
      "fixes": [
        "fix(posts): wrap useSearchParams in Suspense boundary for SSG",
        "refactor(posts): fix bugs, optimize spacing and improve UX",
        "fix(menu-preview): deep merge config to prevent uncontrolled input error"
      ]
    }
  },
  {
    "date": "2026-01-09",
    "phase": "Khởi tạo Schema",
    "title": "Add 'Apply to Site' button to save header style to settings",
    "categories": {
      "features": [
        "feat(menus): add 'Apply to Site' button to save header style to settings",
        "feat(site): implement public homepage with dynamic components",
        "feat(preview): use dynamic brandColor from settings instead of hardcode",
        "feat(home-components): migrate to Convex, fix create/edit pages and improve drag-drop UX",
        "feat(menus): add MenuPreview with 3 styles and drag-drop reorder",
        "feat(settings): add TagInput component for SEO keywords - Enter to add tag, Backspace to remove, blue pill-style UI",
        "feat(images): add MultiImageUploader and migrate to Convex Storage",
        "feat(settings): add image upload and cleanup functionality",
        "feat(usageStats): add bandwidth usage tracking with real data and i18n support",
        "feat(config): enable Turbopack file system cache for improved build performance",
        "fix(qa): Implement 18 QA fixes - bandwidth optimization, keyboard shortcuts, and UX improvements"
      ],
      "improvements": [],
      "fixes": [
        "fix(auth): prevent login flash on page refresh - add isSessionVerified state to wait for Convex session query before redirect decision",
        "fix(modules): Improve toggle feature/field logic - toggle field independently without affecting feature state - auto-disable feature only when all linked fields are disabled - auto-enable feature when any linked field is enabled - fix ESLint errors (no-assign-module-variable, unused imports)",
        "fix(qa): Data Manager page - DRY refactor, error handling, loading states",
        "fix(qa): Batch operations and pagination for system modules",
        "fix(theme): Enable class-based dark mode for Tailwind v4"
      ]
    }
  },
  {
    "date": "2026-01-08",
    "phase": "Khởi tạo Schema",
    "title": "Implement 15 QA fixes for system and admin modules",
    "categories": {
      "features": [
        "feat(qa): Implement 15 QA fixes for system and admin modules",
        "fix(users): Implement all 10 QA fixes for Users module",
        "feat(analytics): Add real-time traffic tracking and improve dashboard"
      ],
      "improvements": [
        "refactor(posts): Add model layer and optimize queries for Posts module"
      ],
      "fixes": [
        "fix(qa): Fix 10 QA issues for 6 system modules",
        "docs(qa): Update QA report - all 10 issues fixed",
        "fix(customers): Optimize database queries and fix 10 QA issues",
        "docs(qa): Add QA review report for Users module - 10 issues found",
        "fix(wishlist): Optimize database queries and fix 10 QA issues",
        "fix(cart): Optimize database queries and fix 12 QA issues",
        "fix(orders): Add model layer and optimize database queries for Orders module",
        "fix: Auto-generate slug and remove strict return validators for pagination queries",
        "fix: Add empty args object to all listAll query calls",
        "fix(products): Optimize database queries and fix 12 QA issues",
        "fix(comments): Replace .collect() with .take() and add pagination to reviews page"
      ]
    }
  },
  {
    "date": "2026-01-07",
    "phase": "Khởi tạo Schema",
    "title": "Add promotions, analytics modules and improve admin pages",
    "categories": {
      "features": [
        "feat: Add promotions, analytics modules and improve admin pages",
        "feat(users,orders): Add pagination, null checks and cascade helpers",
        "feat(customers): Add cascade delete and improve admin pages",
        "feat(wishlist): Improve admin page and backend mutations",
        "feat(cart): Add admin pages with pagination and feature toggles",
        "feat: Add resizable image support in LexicalEditor",
        "feat: Products module QA fixes + LexicalEditor image upload improvements",
        "feat: Add image compression 85% on Media upload",
        "feat: Add Admin Media pages with full CRUD, upload, grid/list view",
        "feat: Add module-qa-tester skill, Comments CRUD, pagination for Posts/Comments",
        "feat: Add image upload, module guards, and Posts module improvements",
        "feat: Add Orders, Wishlist, Notifications, Promotions modules with TypeScript fixes",
        "feat: Add Products module with full CRUD, system config sync, reviews page",
        "feat: Add Posts module CRUD, system config sync, and module-creator skill"
      ],
      "improvements": [
        "docs: Add LexicalEditor ImageNode best practices to module-qa-tester skill"
      ],
      "fixes": [
        "fix: Check module dependencies in Sidebar visibility",
        "fix: Add exportDOM to ImageNode for HTML persistence",
        "fix: ImageNode as separate file with command pattern",
        "fix: LexicalEditor image insertion with proper ImageNode",
        "fix: Hide folder/alt fields in Admin Media when features disabled"
      ]
    }
  },
  {
    "date": "2026-01-05",
    "phase": "Khởi tạo Schema",
    "title": "Convex schema cho admin system 2 levels system admin",
    "categories": {
      "features": [
        "feat: Add i18n support for /system pages (Vietnamese/English)",
        "feat: Add View Details modal for Storage & Bandwidth cards",
        "feat: Add interactive time range tabs to Traffic Trend chart",
        "feat: Make /system/modules page dynamic with Convex",
        "feat: Add comprehensive Convex functions for all 20 schema tables",
        "feat: Add comprehensive Convex schema with 20 tables and optimized indexes",
        "feat: Integrate Convex backend",
        "feat: Enhance users and roles pages with filters and advanced features",
        "feat: Enhance products, categories, customers, and settings pages",
        "feat: Add LexicalEditor and enhance posts/categories pages",
        "feat: Replace menus page with MenuBuilder and MenuPreview",
        "feat: Add complete admin panel with home components management"
      ],
      "improvements": [
        "refactor: Replace /system page with bandwidth chart and Convex Dashboard config",
        "chore: add .factory directory to project",
        "refactor: Split home-components create into separate routes",
        "[Spec] Convex schema cho admin system 2 levels system admin"
      ],
      "fixes": [
        "fix: Fix TypeScript errors in i18n translations"
      ]
    }
  },
  {
    "date": "2026-01-04",
    "phase": "Khởi tạo Schema",
    "title": "Add /system admin console with module management",
    "categories": {
      "features": [
        "feat: Add /system admin console with module management"
      ],
      "improvements": [
        "Initial commit from Create Next App"
      ],
      "fixes": []
    }
  }
];
