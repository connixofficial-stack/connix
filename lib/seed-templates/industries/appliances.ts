import type { IndustryTemplate } from '../types';

export const industryTemplate: IndustryTemplate = {
  "key": "appliances",
  "name": "Điện máy",
  "icon": "📺",
  "description": "Điện máy gia dụng, bảo hành chính hãng.",
  "category": "retail",
  "websiteTypes": [
    "catalog",
    "ecommerce"
  ],
  "saleMode": "cart",
  "productType": "physical",
  "businessType": "ElectronicsStore",
  "brandColor": "#0d9488",
  "tags": [
    "điện máy",
    "gia dụng",
    "chính hãng"
  ],
  "assets": {
    "hero": [
      "/seed_mau/appliances/hero/1.webp",
      "/seed_mau/appliances/hero/2.webp",
      "/seed_mau/appliances/hero/3.webp",
      "/seed_mau/appliances/hero/4.webp",
      "/seed_mau/appliances/hero/5.webp",
      "/seed_mau/appliances/hero/6.webp",
      "/seed_mau/appliances/hero/7.webp"
    ],
    "products": [
      "/seed_mau/appliances/products/1.webp",
      "/seed_mau/appliances/products/10.webp",
      "/seed_mau/appliances/products/11.webp",
      "/seed_mau/appliances/products/12.webp",
      "/seed_mau/appliances/products/13.webp",
      "/seed_mau/appliances/products/14.webp",
      "/seed_mau/appliances/products/15.webp",
      "/seed_mau/appliances/products/16.webp",
      "/seed_mau/appliances/products/17.webp",
      "/seed_mau/appliances/products/18.webp",
      "/seed_mau/appliances/products/19.webp",
      "/seed_mau/appliances/products/2.webp",
      "/seed_mau/appliances/products/20.webp",
      "/seed_mau/appliances/products/21.webp",
      "/seed_mau/appliances/products/22.webp",
      "/seed_mau/appliances/products/23.webp",
      "/seed_mau/appliances/products/24.webp",
      "/seed_mau/appliances/products/25.webp",
      "/seed_mau/appliances/products/26.webp",
      "/seed_mau/appliances/products/27.webp",
      "/seed_mau/appliances/products/28.webp",
      "/seed_mau/appliances/products/29.webp",
      "/seed_mau/appliances/products/3.webp",
      "/seed_mau/appliances/products/30.webp",
      "/seed_mau/appliances/products/4.webp",
      "/seed_mau/appliances/products/5.webp",
      "/seed_mau/appliances/products/6.webp",
      "/seed_mau/appliances/products/7.webp",
      "/seed_mau/appliances/products/8.webp",
      "/seed_mau/appliances/products/9.webp"
    ],
    "posts": [
      "/seed_mau/appliances/posts/post-1.webp",
      "/seed_mau/appliances/posts/post-2.webp",
      "/seed_mau/appliances/posts/post-3.webp"
    ],
    "logos": [
      "/seed_mau/appliances/logos/1.webp",
      "/seed_mau/appliances/logos/10.webp",
      "/seed_mau/appliances/logos/11.webp",
      "/seed_mau/appliances/logos/12.webp",
      "/seed_mau/appliances/logos/13.webp",
      "/seed_mau/appliances/logos/14.webp",
      "/seed_mau/appliances/logos/3.webp",
      "/seed_mau/appliances/logos/4.webp",
      "/seed_mau/appliances/logos/7.webp",
      "/seed_mau/appliances/logos/8.webp",
      "/seed_mau/appliances/logos/9.webp"
    ],
    "gallery": [
      "/seed_mau/appliances/gallery/gallery-1.webp",
      "/seed_mau/appliances/gallery/gallery-2.webp",
      "/seed_mau/appliances/gallery/gallery-3.webp",
      "/seed_mau/appliances/gallery/gallery-4.webp"
    ]
  },
  "fakerTemplates": {
    "namePatterns": [
      "{{item}} {{variant}}",
      "{{brand}} {{item}}",
      "{{item}} {{feature}}"
    ],
    "descriptionPatterns": [
      "{{description}} {{feature}} phù hợp cho {{usage}}.",
      "{{description}} Thiết kế {{feature}} dành cho {{usage}}."
    ],
    "postTitlePatterns": [
      "Bí quyết chọn {{item}} phù hợp",
      "Top {{number}} {{item}} đáng mua {{year}}",
      "Kinh nghiệm sử dụng {{item}}",
      "Xu hướng {{industry}} {{year}}"
    ],
    "postExcerptPatterns": [
      "Tổng hợp xu hướng mới, gợi ý lựa chọn phù hợp nhu cầu.",
      "Chia sẻ kinh nghiệm thực tế và mẹo tối ưu."
    ],
    "serviceNamePatterns": [
      "Gói {{industry}} {{variant}}",
      "Tư vấn {{industry}}",
      "Dịch vụ {{industry}} {{feature}}"
    ],
    "categoryNames": [
      "Gia dụng",
      "Điện lạnh",
      "Nhà bếp",
      "Thiết bị thông minh",
      "Khuyến mãi"
    ],
    "postCategoryNames": [
      "Tin tức",
      "Hướng dẫn",
      "Khuyến mãi",
      "Kinh nghiệm",
      "Hỏi đáp"
    ],
    "serviceCategoryNames": [
      "Tư vấn",
      "Triển khai",
      "Bảo trì",
      "Đào tạo",
      "Tùy chỉnh"
    ],
    "tags": [
      "điện máy",
      "gia dụng",
      "chính hãng"
    ],
    "customFields": {
      "item": [
        "Tivi",
        "Tủ lạnh",
        "Máy giặt",
        "Máy lọc",
        "Nồi chiên"
      ],
      "category": [
        "Gia dụng",
        "Điện lạnh",
        "Nhà bếp",
        "Thiết bị thông minh",
        "Khuyến mãi"
      ],
      "brand": [
        "VietMart",
        "ZenHome",
        "Nova",
        "Lumia",
        "Sendo"
      ],
      "industry": [
        "Điện máy"
      ]
    }
  },
  "homeComponents": [
    {
      "type": "Hero",
      "title": "Hero Banner",
      "order": 0,
      "active": true,
      "config": {
        "style": "slider",
        "slides": [
          {
            "image": "/seed_mau/appliances/hero/1.webp",
            "link": "/products"
          },
          {
            "image": "/seed_mau/appliances/hero/2.webp",
            "link": "/products"
          }
        ],
        "content": {
          "badge": "Nổi bật",
          "heading": "Điện máy chất lượng",
          "description": "Điện máy gia dụng, bảo hành chính hãng.",
          "primaryButtonText": "Khám phá ngay",
          "secondaryButtonText": "Tìm hiểu thêm"
        }
      }
    },
    {
      "type": "ProductCategories",
      "title": "Danh mục sản phẩm",
      "order": 1,
      "active": true,
      "config": {
        "categories": [],
        "columnsDesktop": 4,
        "columnsMobile": 2,
        "showProductCount": true,
        "style": "grid"
      }
    },
    {
      "type": "ProductList",
      "title": "Sản phẩm nổi bật",
      "order": 2,
      "active": true,
      "config": {
        "heading": "Sản phẩm điện máy nổi bật",
        "subheading": "Gợi ý sản phẩm bán chạy",
        "limit": 8,
        "showButton": true,
        "showPrice": true
      }
    },
    {
      "type": "About",
      "title": "Giới thiệu",
      "order": 3,
      "active": true,
      "config": {
        "heading": "Về Điện máy",
        "content": "Điện máy gia dụng, bảo hành chính hãng.",
        "image": "/seed_mau/appliances/gallery/gallery-1.webp"
      }
    },
    {
      "type": "CTA",
      "title": "CTA",
      "order": 4,
      "active": true,
      "config": {
        "heading": "Sẵn sàng bắt đầu?",
        "description": "Liên hệ để nhận tư vấn nhanh.",
        "buttonText": "Liên hệ ngay",
        "buttonLink": "/lien-he"
      }
    },
    {
      "type": "Contact",
      "title": "Liên hệ",
      "order": 5,
      "active": true,
      "config": {
        "heading": "Liên hệ với chúng tôi",
        "subheading": "Đội ngũ hỗ trợ 24/7",
        "showForm": true,
        "showMap": false
      }
    },
    {
      "type": "Footer",
      "title": "Footer",
      "order": 6,
      "active": true,
      "config": {
        "style": "classic"
      }
    }
  ],
  "experiencePresetKey": "modern"
};

export default industryTemplate;
