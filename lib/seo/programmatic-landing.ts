export type LandingType =
  | 'feature'
  | 'use-case'
  | 'solution'
  | 'compare'
  | 'integration'
  | 'template'
  | 'guide';

export type ModuleSeed = {
  category: 'content' | 'commerce' | 'user' | 'system' | 'marketing';
  description: string;
  key: string;
  name: string;
};

export type ProgrammaticLandingItem = {
  content: string;
  faqItems?: Array<{ question: string; answer: string }>;
  landingType: LandingType;
  order?: number;
  primaryIntent?: string;
  relatedProductSlugs?: string[];
  relatedServiceSlugs?: string[];
  relatedSlugs?: string[];
  slug: string;
  summary: string;
  title: string;
};

export type ProgrammaticLandingPlan = {
  items: ProgrammaticLandingItem[];
};

export type ProgrammaticLandingSeed = {
  homeComponents: Array<{ title: string; type: string }>;
  modules: ModuleSeed[];
  posts: Array<{ slug: string; title: string }>;
  products: Array<{ name: string; slug: string }>;
  services: Array<{ slug: string; title: string }>;
  siteName: string;
};

type LandingInput = ProgrammaticLandingSeed;

const CATEGORY_LABELS: Record<ModuleSeed['category'], string> = {
  commerce: 'Bán hàng & thương mại',
  content: 'Quản lý nội dung',
  marketing: 'Marketing & tăng trưởng',
  system: 'Vận hành hệ thống',
  user: 'Quản trị người dùng',
};

const CATEGORY_PROBLEMS: Record<ModuleSeed['category'], string[]> = {
  commerce: [
    'Dữ liệu sản phẩm và dịch vụ rời rạc giữa các bước bán hàng.',
    'Đội ngũ khó theo dõi nội dung nào đang hỗ trợ chuyển đổi.',
    'Nhiều trang bán hàng được tạo nhưng thiếu điểm khác biệt rõ ràng.',
  ],
  content: [
    'Nội dung tăng nhanh nhưng cấu trúc chủ đề và internal link chưa đồng bộ.',
    'Trang mới lên chậm vì thiếu thực thể và bằng chứng từ dữ liệu sẵn có.',
    'Biên tập viên dễ lặp ý khi phải tạo nhiều landing cùng lúc.',
  ],
  marketing: [
    'Chiến dịch cần trang đích nhanh nhưng khó giữ chất lượng nội dung ổn định.',
    'Thông điệp marketing bị chung chung nếu không bám dữ liệu thật của website.',
    'Keyword dễ bị dồn vào một cụm thay vì phủ theo intent và hành trình người dùng.',
  ],
  system: [
    'Các luồng vận hành thường có nhiều điểm chạm nhưng thiếu trang giải thích rõ.',
    'Tài liệu tích hợp nằm rải rác nên người dùng khó tự tra cứu.',
    'Đội triển khai cần trang hướng dẫn bám đúng module đang bật trên hệ thống.',
  ],
  user: [
    'Nhiều tác vụ người dùng cần quy trình rõ nhưng nội dung hiện tại chưa chỉ ra bối cảnh cụ thể.',
    'Các trang mô tả tính năng dễ trùng lặp nếu không neo vào luồng sử dụng thực tế.',
    'Thiếu liên kết giữa use-case, solution và guide khiến trải nghiệm khám phá bị đứt quãng.',
  ],
};

const slugify = (value: string): string => value
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[đĐ]/g, 'd')
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-|-$/g, '');

const dedupe = (items: string[]): string[] => Array.from(new Set(items.filter(Boolean)));

const buildList = (items: string[]): string => {
  if (items.length === 0) {
    return '<p>Hiện chưa có dữ liệu để hiển thị.</p>';
  }
  return `<ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>`;
};

const buildSection = (title: string, content: string): string => (
  `<h2>${title}</h2>${content}`
);

const buildParagraph = (content: string): string => `<p>${content}</p>`;

const joinNames = (items: string[], fallback: string): string => {
  if (items.length === 0) {
    return fallback;
  }
  return items.join(', ');
};

const sentenceCase = (value: string): string => {
  if (!value.trim()) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const buildDataSnapshot = (input: LandingInput): string[] => {
  const moduleNames = input.modules.slice(0, 4).map((module) => module.name);
  const productNames = input.products.slice(0, 3).map((product) => product.name);
  const serviceNames = input.services.slice(0, 3).map((service) => service.title);
  const postTitles = input.posts.slice(0, 3).map((post) => post.title);

  return [
    `${input.siteName} hiện có ${input.modules.length} module đang bật, ${input.products.length} sản phẩm, ${input.services.length} dịch vụ và ${input.posts.length} bài viết đã xuất bản làm nguồn thực thể cho landing page.`,
    `Các thực thể nổi bật đang có trên website gồm: module ${joinNames(moduleNames, 'đang được cập nhật')}; sản phẩm ${joinNames(productNames, 'chưa có sản phẩm nổi bật')}; dịch vụ ${joinNames(serviceNames, 'chưa có dịch vụ nổi bật')}.`,
    `Nguồn nội dung tham chiếu gần nhất trên site gồm: ${joinNames(postTitles, 'chưa có bài viết tham chiếu')}.`,
  ];
};

const buildProofPoints = (items: string[], emptyMessage: string): string => {
  if (items.length === 0) {
    return `<p>${emptyMessage}</p>`;
  }
  return buildList(items);
};

const buildEvidenceFooter = (label: string, items: string[], emptyMessage: string): string => (
  buildSection(label, buildProofPoints(items, emptyMessage))
);

const buildEntityCoverage = (input: LandingInput, module?: ModuleSeed): string[] => {
  const moduleNames = input.modules
    .filter((item) => !module || item.key !== module.key)
    .slice(0, 4)
    .map((item) => item.name);
  const productNames = input.products.slice(0, 3).map((item) => item.name);
  const serviceNames = input.services.slice(0, 3).map((item) => item.title);
  const postTitles = input.posts.slice(0, 2).map((item) => item.title);

  return dedupe([
    module ? `Module liên quan đang bật: ${joinNames(moduleNames, 'chưa có module bổ trợ rõ ràng')}.` : '',
    `Sản phẩm có thể liên quan tới intent này: ${joinNames(productNames, 'chưa có sản phẩm liên quan')}.`,
    `Dịch vụ có thể hỗ trợ triển khai: ${joinNames(serviceNames, 'chưa có dịch vụ liên quan')}.`,
    `Bài viết tham chiếu để mở rộng chủ đề: ${joinNames(postTitles, 'chưa có bài viết liên quan')}.`,
  ]);
};

export const estimateContentLength = (content: string): number => (
  content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length
);

const attachRelatedSlugs = (items: ProgrammaticLandingItem[]): ProgrammaticLandingItem[] => {
  const grouped = new Map<LandingType, string[]>();
  for (const item of items) {
    const list = grouped.get(item.landingType) ?? [];
    list.push(item.slug);
    grouped.set(item.landingType, list);
  }

  return items.map((item) => {
    const candidates = (grouped.get(item.landingType) ?? []).filter((slug) => slug !== item.slug);
    return {
      ...item,
      relatedSlugs: candidates.slice(0, 4),
    };
  });
};

const buildFeatureItems = (input: LandingInput): ProgrammaticLandingItem[] => {
  const { modules, siteName, products, services } = input;

  return modules.map((module, index) => {
    const productSlugs = products.slice(0, 3).map((item) => item.slug);
    const serviceSlugs = services.slice(0, 3).map((item) => item.slug);
    const content = [
      buildSection(
        `Vai trò của ${module.name} trong ${siteName}`,
        buildParagraph(`${sentenceCase(module.description || `${module.name} là một phần của hệ thống`)}. Landing này được sinh từ dữ liệu thật đang có trên website để mô tả đúng phạm vi tính năng, thay vì viết lại nội dung mẫu chung chung.`)
      ),
      buildSection(
        'Tín hiệu dữ liệu đang có trên website',
        buildList(buildDataSnapshot(input))
      ),
      buildSection(
        'Khi nào nên dùng tính năng này',
        buildList([
          `Khi đội ngũ cần một trang riêng giải thích rõ ${module.name.toLowerCase()} đang giải quyết nhu cầu gì.`,
          `Khi muốn phủ intent tìm kiếm liên quan đến ${module.name.toLowerCase()} nhưng vẫn bám sản phẩm, dịch vụ và bài viết hiện có.`,
          `Khi cần tạo internal link từ page tính năng sang solution, guide và use-case cùng cụm chủ đề.`,
        ])
      ),
      buildSection(
        'Thực thể và nội dung liên quan',
        buildList(buildEntityCoverage(input, module))
      ),
      buildSection(
        'Cách triển khai trang để tránh nội dung mỏng',
        buildList([
          'Giữ đúng một intent chính cho mỗi trang, không nhồi nhiều biến thể từ khóa vào cùng đoạn mô tả.',
          'Ưu tiên đưa tên module, sản phẩm, dịch vụ và bài viết thật vào đúng ngữ cảnh thay vì lặp cụm lợi ích chung.',
          'Chỉ publish sau khi kiểm tra summary, nội dung chi tiết và FAQ đều phản ánh dữ liệu thật của website.',
        ])
      ),
      buildEvidenceFooter(
        'Nguồn bằng chứng hiện dùng cho trang này',
        dedupe([
          `Module gốc: ${module.name} (${module.key}).`,
          ...productSlugs.map((slug) => `Sản phẩm liên quan: ${slug}.`),
          ...serviceSlugs.map((slug) => `Dịch vụ liên quan: ${slug}.`),
        ]),
        'Chưa có nguồn bằng chứng bổ sung.'
      ),
    ].join('');

    return {
      content,
      faqItems: [
        {
          question: `${module.name} giải quyết nhu cầu gì?`,
          answer: module.description || `${module.name} được dùng để xử lý một phần quy trình vận hành đang có trên hệ thống.`,
        },
        {
          question: `Trang này lấy dữ liệu từ đâu để viết nội dung?`,
          answer: `Nội dung được neo theo module, sản phẩm, dịch vụ và bài viết đang có trên ${siteName}, sau đó biên tập lại theo một intent chính để tránh trùng lặp và nhồi từ khóa.`,
        },
        {
          question: `Có nên publish ngay sau khi tạo tự động không?`,
          answer: 'Nên rà lại summary, ví dụ thực thể và FAQ trước khi publish để bảo đảm trang phản ánh đúng dữ liệu thật của website.',
        },
      ],
      landingType: 'feature',
      order: index + 1,
      primaryIntent: `${module.name} ${siteName}`,
      relatedProductSlugs: productSlugs,
      relatedServiceSlugs: serviceSlugs,
      slug: `feature-${slugify(module.key)}`,
      summary: module.description || `${module.name} là tính năng trong ${siteName}, được mô tả dựa trên dữ liệu thật của hệ thống và các thực thể liên quan.`,
      title: `Tính năng ${module.name}`,
    };
  });
};

const buildUseCaseItems = (input: LandingInput): ProgrammaticLandingItem[] => {
  const grouped = input.modules.reduce<Record<string, ModuleSeed[]>>((acc, module) => {
    acc[module.category] = acc[module.category] ?? [];
    acc[module.category].push(module);
    return acc;
  }, {});

  return Object.entries(grouped).map(([category, list], index) => {
    const normalizedCategory = category as ModuleSeed['category'];
    const label = CATEGORY_LABELS[normalizedCategory];
    const problems = CATEGORY_PROBLEMS[normalizedCategory];
    const moduleNames = list.map((module) => module.name);
    const content = [
      buildSection(
        `Bối cảnh sử dụng cho ${label.toLowerCase()}`,
        buildParagraph(`Trang này gom các use-case mà ${input.siteName} có thể phục vụ trong nhóm ${label.toLowerCase()}, dựa trên ${list.length} module đang bật thuộc cùng danh mục.`)
      ),
      buildSection('Vấn đề người dùng thường gặp', buildList(problems)),
      buildSection(
        'Những module đang hỗ trợ use-case này',
        buildList(list.map((module) => `${module.name}: ${module.description || 'đang hoạt động trên hệ thống.'}`))
      ),
      buildSection(
        'Tín hiệu thực thể nên xuất hiện trên landing',
        buildList([
          `Cụm chủ đề này đang có ${list.length} module trực tiếp liên quan: ${joinNames(moduleNames.slice(0, 5), 'đang cập nhật')}.`,
          `Website hiện có ${input.products.length} sản phẩm và ${input.services.length} dịch vụ có thể dùng làm bằng chứng triển khai.`,
          `Nội dung supporting từ blog hiện có ${input.posts.length} bài, giúp mở rộng semantic coverage mà không phải lặp lại cùng một mô tả.`,
        ])
      ),
      buildSection(
        'Cách phân phối keyword an toàn hơn',
        buildList([
          `Dùng ${label.toLowerCase()} làm topic cluster, sau đó tách câu hỏi, nhu cầu và giải pháp thành từng heading riêng.`,
          'Không lặp exact-match keyword ở mọi heading; thay bằng thực thể thật, bước triển khai và ngữ cảnh sử dụng.',
          'Ưu tiên liên kết sang feature và guide cụ thể thay vì cố dồn toàn bộ thông tin vào một trang.',
        ])
      ),
    ].join('');

    return {
      content,
      faqItems: [
        {
          question: `Trang use-case ${label} khác gì trang tính năng?`,
          answer: 'Trang use-case tập trung vào bối cảnh, vấn đề và kết quả cần đạt; trang tính năng tập trung vào một module hoặc capability cụ thể.',
        },
        {
          question: `Làm sao để trang này không bị đánh giá là generic?`,
          answer: `Cần giữ các chi tiết thật như tên module, số lượng thực thể, bài viết liên quan và luồng triển khai thay vì chỉ mô tả lợi ích chung.`,
        },
      ],
      landingType: 'use-case',
      order: index + 1,
      primaryIntent: `${label} ${input.siteName}`,
      slug: `use-case-${slugify(category)}`,
      summary: `Use-case ${label.toLowerCase()} của ${input.siteName}, được xây từ các module thật đang bật và thực thể hiện có trên website.`,
      title: `Trường hợp sử dụng: ${label}`,
    };
  });
};

const buildSolutionItems = (input: LandingInput): ProgrammaticLandingItem[] => {
  const grouped = input.modules.reduce<Record<string, ModuleSeed[]>>((acc, module) => {
    acc[module.category] = acc[module.category] ?? [];
    acc[module.category].push(module);
    return acc;
  }, {});

  return Object.entries(grouped).map(([category, list], index) => {
    const normalizedCategory = category as ModuleSeed['category'];
    const label = CATEGORY_LABELS[normalizedCategory];
    const content = [
      buildSection(
        `Giải pháp ${label.toLowerCase()} đang hình thành từ dữ liệu nào`,
        buildParagraph(`${input.siteName} hiện có ${list.length} module trong nhóm ${label.toLowerCase()}. Trang solution này dùng chính các module đang bật làm khung giải pháp, rồi gắn thêm sản phẩm, dịch vụ và nội dung hỗ trợ từ website.`)
      ),
      buildSection('Thành phần giải pháp hiện có', buildList(list.map((module) => `${module.name} (${module.key})`))),
      buildSection(
        'Bằng chứng giúp trang có giá trị hơn',
        buildList([
          `Có ${input.products.length} sản phẩm và ${input.services.length} dịch vụ để nối solution với offer thật, thay vì chỉ nói về lợi ích trừu tượng.`,
          `Có ${input.posts.length} bài viết đã xuất bản để làm nguồn tham chiếu, giúp mở rộng topical depth cho solution này.`,
          `Có ${input.homeComponents.length} home component đang hoạt động, cho phép tái dùng các section thật nếu cần dựng lại landing theo chiến dịch.`,
        ])
      ),
      buildSection(
        'Khuyến nghị biên tập sau khi auto-generate',
        buildList([
          'Thêm ví dụ triển khai cụ thể từ dữ liệu nội bộ hoặc case thực tế nếu có.',
          'Rà lại title và summary để chắc rằng mỗi solution chỉ phục vụ một nhu cầu chính.',
          'Bổ sung internal link sang feature, guide và template có cùng intent để tăng giá trị khám phá.',
        ])
      ),
    ].join('');

    return {
      content,
      faqItems: [
        {
          question: `Trang solution ${label} nên nhắm mục tiêu gì?`,
          answer: 'Nên nhắm vào nhu cầu tổng thể và outcome người dùng muốn đạt, sau đó chứng minh bằng module và thực thể đang có trên website.',
        },
        {
          question: 'Vì sao solution page cần dữ liệu thật?',
          answer: 'Vì solution page rất dễ trở thành trang chung chung nếu chỉ nêu lợi ích. Dữ liệu thật giúp trang có phạm vi rõ, đáng tin và ít lặp với các trang khác.',
        },
      ],
      landingType: 'solution',
      order: index + 1,
      primaryIntent: `${label} solution ${input.siteName}`,
      slug: `solution-${slugify(category)}`,
      summary: `Giải pháp ${label.toLowerCase()} của ${input.siteName}, ghép từ module thật, sản phẩm, dịch vụ và nội dung đang có trên website.`,
      title: `Giải pháp ${label}`,
    };
  });
};

const buildCompareItems = (input: LandingInput): ProgrammaticLandingItem[] => {
  const moduleNames = input.modules.slice(0, 8).map((module) => module.name);
  const content = [
    buildSection(
      'So sánh giữa trang tự viết chung chung và trang bám dữ liệu thật',
      buildParagraph(`Khi ${input.siteName} tạo landing page chỉ bằng mẫu copy, trang rất dễ trùng ý và thiếu tín hiệu tin cậy. Khi sinh từ module, sản phẩm, dịch vụ và bài viết đang có, nội dung sẽ bám thực thể thật hơn.`)
    ),
    buildSection(
      'Dữ liệu đang sẵn sàng để làm khác biệt',
      buildList([
        `Module hiện có: ${joinNames(moduleNames, 'đang cập nhật')}.`,
        `Sản phẩm hiện có: ${input.products.length}. Dịch vụ hiện có: ${input.services.length}. Bài viết hiện có: ${input.posts.length}.`,
        `Home component đang hoạt động: ${input.homeComponents.length}, có thể tái dùng để dựng section có mục đích rõ ràng.`,
      ])
    ),
    buildSection(
      'Nguyên tắc so sánh nên thể hiện trên trang',
      buildList([
        'So sánh theo độ cụ thể của thực thể, khả năng mở rộng nội dung và mức độ nhất quán internal link.',
        'Cho thấy điểm mạnh là có dữ liệu gốc từ chính website, không phải chỉ thay từ khóa trong cùng một template.',
        'Giữ tone factual, tránh tuyên bố tuyệt đối nếu chưa có bằng chứng đo lường.',
      ])
    ),
  ].join('');

  return [
    {
      content,
      faqItems: [
        {
          question: 'Thế nào là một landing page dễ bị xem là spam?',
          answer: 'Thường là trang lặp cấu trúc, lặp thông điệp, ít chi tiết gốc và không cho thấy vì sao trang đó tồn tại riêng biệt so với các trang còn lại.',
        },
        {
          question: 'Trang compare này nên giữ vai trò gì?',
          answer: 'Nó nên giúp người đọc hiểu vì sao cách làm bám dữ liệu thật tạo ra landing page có giá trị hơn cách chỉ sinh theo keyword hoặc template trống.',
        },
      ],
      landingType: 'compare',
      primaryIntent: `${input.siteName} landing page comparison`,
      slug: 'compare-modules',
      summary: `So sánh giữa cách sinh landing page chung chung và cách bám dữ liệu thật của ${input.siteName}.`,
      title: `So sánh cách tạo landing page trong ${input.siteName}`,
    },
  ];
};

const buildIntegrationItems = (input: LandingInput): ProgrammaticLandingItem[] => {
  const candidates = input.modules.filter((module) => (
    module.category === 'system'
    || module.key.includes('integration')
    || module.key.includes('analytics')
    || module.key.includes('notification')
  ));

  return candidates.map((module, index) => {
    const content = [
      buildSection(
        `Tích hợp ${module.name} đang hỗ trợ điều gì`,
        buildParagraph(`${sentenceCase(module.description || `${module.name} là một tích hợp trong hệ thống`)}. Nội dung của trang này được sinh quanh tên tích hợp, module liên quan và các thực thể sẵn có để tránh lặp khuôn mẫu giữa nhiều integration page.`)
      ),
      buildSection(
        'Bối cảnh dữ liệu liên quan',
        buildList([
          `Hiện có ${input.modules.length} module đang bật, trong đó ${candidates.length} module có khả năng là integration/system.`,
          `Trang có thể liên kết sang ${input.services.length} dịch vụ triển khai và ${input.posts.length} bài viết hướng dẫn hoặc kiến thức liên quan.`,
          `Nếu có sản phẩm liên quan, danh sách hiện tại gồm ${joinNames(input.products.slice(0, 3).map((item) => item.name), 'chưa có sản phẩm liên quan rõ ràng')}.`,
        ])
      ),
      buildSection(
        'Checklist xuất bản integration page',
        buildList([
          'Xác nhận mô tả tích hợp phản ánh đúng tác vụ hoặc dữ liệu được đồng bộ.',
          'Bổ sung ít nhất một heading nêu trường hợp sử dụng hoặc bước kích hoạt cụ thể.',
          'Không dùng cùng một đoạn “đồng bộ dữ liệu và báo cáo” cho mọi tích hợp mà không sửa theo ngữ cảnh.',
        ])
      ),
    ].join('');

    return {
      content,
      faqItems: [
        {
          question: `Tích hợp ${module.name} có cần trang riêng không?`,
          answer: 'Có, nếu người dùng thật có nhu cầu tìm kiếm hoặc cần một trang riêng để hiểu nhanh cách tích hợp này kết nối với hệ thống và nội dung liên quan.',
        },
        {
          question: 'Làm sao để các integration page không bị trùng nhau?',
          answer: 'Mỗi trang cần nêu rõ tên tích hợp, ngữ cảnh sử dụng, dữ liệu được đồng bộ và liên kết sang tài nguyên hoặc dịch vụ thật liên quan.',
        },
      ],
      landingType: 'integration',
      order: index + 1,
      primaryIntent: `${module.name} integration ${input.siteName}`,
      slug: `integration-${slugify(module.key)}`,
      summary: `Trang tích hợp ${module.name} của ${input.siteName}, được viết theo dữ liệu thật và ngữ cảnh sử dụng hiện có trên website.`,
      title: `Tích hợp ${module.name}`,
    };
  });
};

const buildTemplateItems = (input: LandingInput): ProgrammaticLandingItem[] => {
  return input.homeComponents.slice(0, 6).map((component, index) => {
    const content = [
      buildSection(
        `Template ${component.title} dùng khi nào`,
        buildParagraph(`Template này được lấy từ home component ${component.title} (${component.type}) đang hoạt động trên website. Vì vậy nó phản ánh cấu trúc thực tế đang được dùng, thay vì mô tả một mẫu landing giả định.`)
      ),
      buildSection(
        'Dữ liệu thật có thể kéo vào template',
        buildList([
          `Có thể gắn với ${input.products.length} sản phẩm, ${input.services.length} dịch vụ và ${input.posts.length} bài viết đang có trên site.`,
          `Có ${input.modules.length} module đang bật để map CTA, lợi ích và luồng hành động phù hợp với từng chiến dịch.`,
          'Nên chọn đúng một nhóm intent cho mỗi template để tránh một mẫu bị tái sử dụng quá rộng.',
        ])
      ),
      buildSection(
        'Cách giữ template page có giá trị SEO',
        buildList([
          'Gắn template với loại chiến dịch hoặc nhóm người dùng cụ thể.',
          'Mô tả section thật sẽ xuất hiện trên template thay vì chỉ liệt kê “CTA, hero, social proof”.',
          'Chèn internal link tới guide hoặc feature phù hợp để tăng chiều sâu thông tin.',
        ])
      ),
    ].join('');

    return {
      content,
      faqItems: [
        {
          question: `Template ${component.title} có nên dùng cho mọi chiến dịch không?`,
          answer: 'Không nên. Mỗi template page cần gắn với một nhóm intent và dữ liệu cụ thể để tránh trùng lặp giữa các landing page.',
        },
        {
          question: 'Nguồn dữ liệu của template page đến từ đâu?',
          answer: `Từ home component đang hoạt động trên website, kết hợp với module, sản phẩm, dịch vụ và bài viết hiện có để mô tả một template có ngữ cảnh thật.`,
        },
      ],
      landingType: 'template',
      order: index + 1,
      primaryIntent: `${component.title} template ${input.siteName}`,
      slug: `template-${slugify(component.type)}`,
      summary: `Template ${component.title} của ${input.siteName}, bám cấu trúc thật từ home component đang hoạt động và dữ liệu hiện có trên website.`,
      title: `Template ${component.title}`,
    };
  });
};

const buildGuideItems = (input: LandingInput): ProgrammaticLandingItem[] => {
  return input.modules.slice(0, 6).map((module, index) => {
    const relatedPosts = input.posts.slice(0, 3).map((post) => `${post.title} (${post.slug})`);
    const content = [
      buildSection(
        `Hướng dẫn triển khai ${module.name}`,
        buildParagraph(`Guide này không chỉ nhắc lại tên module. Nó dùng ${module.name}, danh sách bài viết hiện có và thực thể liên quan trên website để tạo ra một trang hướng dẫn có thể tiếp tục biên tập thành tài nguyên thật cho người dùng.`)
      ),
      buildSection(
        'Các bước nên xuất hiện trong trang guide',
        buildList([
          `Giới thiệu đúng vai trò của ${module.name} trong ${input.siteName}.`,
          'Mô tả điều kiện dữ liệu tối thiểu trước khi bật hoặc cấu hình.',
          'Liên kết tới bài viết, dịch vụ hoặc trang tính năng liên quan để người đọc đi tiếp thay vì dừng ở một trang mỏng.',
        ])
      ),
      buildSection(
        'Nguồn tham chiếu hiện có trên website',
        buildProofPoints(relatedPosts, 'Chưa có bài viết tham chiếu để gắn vào guide này.')
      ),
      buildSection(
        'Tiêu chí pass trước khi publish',
        buildList([
          'Guide phải có ít nhất một phần giải thích bối cảnh sử dụng và một phần chỉ ra dữ liệu/nguồn lực liên quan.',
          'Summary cần nói rõ người đọc sẽ học được gì, không chỉ lặp lại tên module.',
          'FAQ nên trả lời câu hỏi thực tế về triển khai hoặc phạm vi áp dụng, không chỉ là câu marketing chung.',
        ])
      ),
    ].join('');

    return {
      content,
      faqItems: [
        {
          question: `Guide ${module.name} dành cho ai?`,
          answer: `Dành cho người cần hiểu nhanh cách dùng hoặc triển khai ${module.name} trong ${input.siteName}, với ngữ cảnh bám đúng dữ liệu và tài nguyên đang có trên website.`,
        },
        {
          question: 'Sau khi tạo tự động thì cần chỉnh gì thêm?',
          answer: 'Nên thêm bước thao tác cụ thể, ảnh chụp hoặc ví dụ dữ liệu thật nếu có để guide có giá trị sử dụng cao hơn.',
        },
      ],
      landingType: 'guide',
      order: index + 1,
      primaryIntent: `${module.name} guide ${input.siteName}`,
      slug: `guide-${slugify(module.key)}`,
      summary: `Hướng dẫn ${module.name} trong ${input.siteName}, được dựng từ module thật và tài nguyên đã có trên website để tránh nội dung chung chung.`,
      title: `Hướng dẫn ${module.name}`,
    };
  });
};

export const buildProgrammaticLandingPlan = (input: LandingInput): ProgrammaticLandingPlan => {
  const modules = input.modules.slice(0, 24);
  const items: ProgrammaticLandingItem[] = [
    ...buildFeatureItems({ ...input, modules }),
    ...buildUseCaseItems({ ...input, modules }),
    ...buildSolutionItems({ ...input, modules }),
    ...buildCompareItems({ ...input, modules }),
    ...buildIntegrationItems({ ...input, modules }),
    ...buildTemplateItems(input),
    ...buildGuideItems({ ...input, modules }),
  ];

  return {
    items: attachRelatedSlugs(items),
  };
};
