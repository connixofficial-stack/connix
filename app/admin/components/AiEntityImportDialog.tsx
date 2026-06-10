'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Bot, Check, Copy, FileText, X } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  cn,
  Checkbox,
} from './ui';

export type AiEntityImportKind = 'product' | 'service' | 'post' | 'course';

export type AiEntityImportPayload = {
  name?: string;
  title?: string;
  slug?: string;
  sku?: string;
  description?: string;
  content?: string;
  excerpt?: string;
  markdownRender?: string;
  htmlRender?: string;
  metaTitle?: string;
  metaDescription?: string;
  image?: string;
  thumbnail?: string;
  price?: number;
  salePrice?: number;
  stock?: number;
  duration?: string;
  durationText?: string;
  authorName?: string;
  instructorName?: string;
  level?: string;
  pricingType?: string;
  priceNote?: string;
  comparePriceAmount?: number;
  isPriceVisible?: boolean;
  introVideoType?: string;
  introVideoUrl?: string;
  featured?: boolean;
  combos?: any[];
  attributeTermIds?: string[];
  attributeRangeValues?: Record<string, string>;
  newAttributes?: Record<string, string[]>;
};

type ParseResult = {
  item: AiEntityImportPayload | null;
  errors: string[];
};

const ENTITY_COPY: Record<AiEntityImportKind, {
  rootKey: string;
  title: string;
  description: string;
  sample: string;
}> = {
  product: {
    rootKey: 'product',
    title: 'Nhập sản phẩm bằng AI',
    description: 'Copy prompt, nhờ AI tạo JSON sản phẩm, dán kết quả để preview rồi áp dụng vào form.',
    sample: `{
  "product": {
    "name": "Giá kệ góc liên hoàn inox 304",
    "slug": "gia-ke-goc-lien-hoan-inox-304",
    "description": "Giá kệ góc liên hoàn inox 304 giúp tận dụng góc tủ bếp khó dùng, phù hợp gia đình muốn tăng không gian lưu trữ xoong nồi, chén đĩa và vật dụng bếp hằng ngày.",
    "content": "<h2>Tổng quan giá kệ góc liên hoàn inox 304</h2><p>Giá kệ góc liên hoàn inox 304 là giải pháp lưu trữ cho khoang góc tủ bếp, nơi thường khó thao tác và dễ bị bỏ trống. Sản phẩm phù hợp với gia đình muốn sắp xếp xoong nồi, chén đĩa hoặc đồ dùng bếp theo cách gọn hơn mà vẫn dễ lấy khi nấu nướng.</p><h3>Điểm nổi bật khi sử dụng</h3><ul><li>Tận dụng tốt khu vực góc tủ, giảm lãng phí không gian lưu trữ.</li><li>Thiết kế kéo mở giúp quan sát và lấy vật dụng thuận tiện hơn so với để đồ sâu trong góc tủ.</li><li>Chất liệu inox 304 phù hợp môi trường bếp ẩm, dễ lau chùi và hạn chế bám mùi.</li></ul><h3>Ứng dụng và thông số cần kiểm tra</h3><p>Trước khi chọn mua, nên kiểm tra kích thước khoang tủ, hướng mở cánh, tải trọng sử dụng và kiểu ray trượt đi kèm. Nếu dùng cho nồi lớn hoặc vật nặng, hãy đối chiếu tải trọng theo thông tin nhà cung cấp.</p><h3>Phù hợp với ai?</h3><p>Sản phẩm phù hợp với căn bếp có tủ chữ L, tủ góc hoặc gia đình cần tăng không gian lưu trữ nhưng không muốn thay đổi toàn bộ hệ tủ.</p><h3>Lưu ý khi chọn mua</h3><ul><li>Đo đúng chiều rộng, chiều sâu và chiều cao khoang tủ trước khi đặt hàng.</li><li>Kiểm tra hướng mở trái/phải để tránh lắp sai cấu hình.</li><li>Hỏi rõ phụ kiện đi kèm, chính sách lắp đặt và điều kiện bảo hành nếu có.</li></ul><p>Nếu bạn đang cải thiện khu vực góc tủ bếp, hãy ưu tiên mẫu có kích thước khớp khoang tủ và tải trọng phù hợp nhu cầu dùng hằng ngày.</p>",
    "markdownRender": "## Tổng quan giá kệ góc liên hoàn inox 304\\n\\nGiá kệ góc liên hoàn inox 304 là giải pháp lưu trữ cho khoang góc tủ bếp, nơi thường khó thao tác và dễ bị bỏ trống. Sản phẩm phù hợp với gia đình muốn sắp xếp xoong nồi, chén đĩa hoặc đồ dùng bếp theo cách gọn hơn mà vẫn dễ lấy khi nấu nướng.\\n\\n### Điểm nổi bật khi sử dụng\\n\\n- Tận dụng tốt khu vực góc tủ, giảm lãng phí không gian lưu trữ.\\n- Thiết kế kéo mở giúp quan sát và lấy vật dụng thuận tiện hơn so với để đồ sâu trong góc tủ.\\n- Chất liệu inox 304 phù hợp môi trường bếp ẩm, dễ lau chùi và hạn chế bám mùi.\\n\\n### Ứng dụng và thông số cần kiểm tra\\n\\nTrước khi chọn mua, nên kiểm tra kích thước khoang tủ, hướng mở cánh, tải trọng sử dụng và kiểu ray trượt đi kèm. Nếu dùng cho nồi lớn hoặc vật nặng, hãy đối chiếu tải trọng theo thông tin nhà cung cấp.\\n\\n### Phù hợp với ai?\\n\\nSản phẩm phù hợp với căn bếp có tủ chữ L, tủ góc hoặc gia đình cần tăng không gian lưu trữ nhưng không muốn thay đổi toàn bộ hệ tủ.\\n\\n### Lưu ý khi chọn mua\\n\\n- Đo đúng chiều rộng, chiều sâu và chiều cao khoang tủ trước khi đặt hàng.\\n- Kiểm tra hướng mở trái/phải để tránh lắp sai cấu hình.\\n- Hỏi rõ phụ kiện đi kèm, chính sách lắp đặt và điều kiện bảo hành nếu có.",
    "htmlRender": "<h2>Tổng quan giá kệ góc liên hoàn inox 304</h2><p>Giá kệ góc liên hoàn inox 304 là giải pháp lưu trữ cho khoang góc tủ bếp, nơi thường khó thao tác và dễ bị bỏ trống. Sản phẩm phù hợp với gia đình muốn sắp xếp xoong nồi, chén đĩa hoặc đồ dùng bếp theo cách gọn hơn mà vẫn dễ lấy khi nấu nướng.</p><h3>Điểm nổi bật khi sử dụng</h3><ul><li>Tận dụng tốt khu vực góc tủ, giảm lãng phí không gian lưu trữ.</li><li>Thiết kế kéo mở giúp quan sát và lấy vật dụng thuận tiện hơn so với để đồ sâu trong góc tủ.</li><li>Chất liệu inox 304 phù hợp môi trường bếp ẩm, dễ lau chùi và hạn chế bám mùi.</li></ul><h3>Ứng dụng và thông số cần kiểm tra</h3><p>Trước khi chọn mua, nên kiểm tra kích thước khoang tủ, hướng mở cánh, tải trọng sử dụng và kiểu ray trượt đi kèm. Nếu dùng cho nồi lớn hoặc vật nặng, hãy đối chiếu tải trọng theo thông tin nhà cung cấp.</p><h3>Phù hợp với ai?</h3><p>Sản phẩm phù hợp với căn bếp có tủ chữ L, tủ góc hoặc gia đình cần tăng không gian lưu trữ nhưng không muốn thay đổi toàn bộ hệ tủ.</p><h3>Lưu ý khi chọn mua</h3><ul><li>Đo đúng chiều rộng, chiều sâu và chiều cao khoang tủ trước khi đặt hàng.</li><li>Kiểm tra hướng mở trái/phải để tránh lắp sai cấu hình.</li><li>Hỏi rõ phụ kiện đi kèm, chính sách lắp đặt và điều kiện bảo hành nếu có.</li></ul>",
    "metaTitle": "Giá kệ góc liên hoàn inox 304",
    "metaDescription": "Giá kệ góc inox 304 bền đẹp, tối ưu góc tủ và phù hợp nội thất bếp cao cấp.",
    "image": "https://example.com/product.jpg",
    "price": 3500000,
    "salePrice": 4200000,
    "stock": 10
  }
}`,
  },
  service: {
    rootKey: 'service',
    title: 'Nhập dịch vụ bằng AI',
    description: 'Copy prompt, nhờ AI tạo JSON dịch vụ, dán kết quả để preview rồi áp dụng vào form.',
    sample: `{
  "service": {
    "title": "Tư vấn thiết kế tủ bếp",
    "slug": "tu-van-thiet-ke-tu-bep",
    "excerpt": "Tư vấn giải pháp tủ bếp tối ưu theo không gian thực tế.",
    "content": "<h2>Tư vấn thiết kế tủ bếp giải quyết vấn đề gì?</h2><p>Dịch vụ giúp gia chủ xác định bố cục, vật liệu và công năng tủ bếp trước khi thi công, giảm rủi ro phát sinh do đo đạc hoặc chọn sai phụ kiện.</p><h3>Quy trình tư vấn</h3><ol><li>Trao đổi nhu cầu sử dụng và ngân sách dự kiến.</li><li>Khảo sát kích thước, thói quen nấu nướng và điểm bất tiện hiện tại.</li><li>Đề xuất phương án bố trí, vật liệu và phụ kiện phù hợp.</li></ol>",
    "markdownRender": "## Tư vấn thiết kế tủ bếp giải quyết vấn đề gì?\\n\\nDịch vụ giúp gia chủ xác định bố cục, vật liệu và công năng tủ bếp trước khi thi công, giảm rủi ro phát sinh do đo đạc hoặc chọn sai phụ kiện.\\n\\n### Quy trình tư vấn\\n\\n1. Trao đổi nhu cầu sử dụng và ngân sách dự kiến.\\n2. Khảo sát kích thước, thói quen nấu nướng và điểm bất tiện hiện tại.\\n3. Đề xuất phương án bố trí, vật liệu và phụ kiện phù hợp.",
    "htmlRender": "<h2>Tư vấn thiết kế tủ bếp giải quyết vấn đề gì?</h2><p>Dịch vụ giúp gia chủ xác định bố cục, vật liệu và công năng tủ bếp trước khi thi công, giảm rủi ro phát sinh do đo đạc hoặc chọn sai phụ kiện.</p><h3>Quy trình tư vấn</h3><ol><li>Trao đổi nhu cầu sử dụng và ngân sách dự kiến.</li><li>Khảo sát kích thước, thói quen nấu nướng và điểm bất tiện hiện tại.</li><li>Đề xuất phương án bố trí, vật liệu và phụ kiện phù hợp.</li></ol>",
    "metaTitle": "Tư vấn thiết kế tủ bếp chuyên nghiệp",
    "metaDescription": "Dịch vụ tư vấn thiết kế tủ bếp tối ưu công năng, thẩm mỹ và ngân sách.",
    "thumbnail": "https://example.com/service.jpg",
    "price": 500000,
    "duration": "60 phút"
  }
}`,
  },
  course: {
    rootKey: 'course',
    title: 'Nhập khóa học bằng AI',
    description: 'Copy prompt, nhờ AI tạo JSON khóa học, dán kết quả để preview rồi áp dụng vào form.',
    sample: `{
  "course": {
    "title": "Lộ trình Next.js thực chiến cho website bán hàng",
    "slug": "lo-trinh-nextjs-thuc-chien-cho-website-ban-hang",
    "excerpt": "Khóa học hướng dẫn xây dựng website bán hàng bằng Next.js theo lộ trình thực tế, phù hợp người đã biết React cơ bản và muốn làm sản phẩm có thể triển khai.",
    "content": "<h2>Khóa học Next.js thực chiến giúp bạn làm được gì?</h2><p>Khóa học tập trung vào cách xây dựng website bán hàng có cấu trúc rõ ràng, tối ưu trải nghiệm người dùng và dễ mở rộng khi dữ liệu, sản phẩm hoặc nội dung tăng lên.</p><h3>Bạn sẽ học theo lộ trình nào?</h3><ol><li>Nắm kiến trúc dự án Next.js và cách chia route, component, data flow.</li><li>Xây dựng trang danh sách, chi tiết sản phẩm, giỏ hàng và nội dung SEO.</li><li>Tối ưu form, trạng thái tải, xử lý lỗi và trải nghiệm mobile.</li></ol><h3>Khóa học phù hợp với ai?</h3><p>Phù hợp với developer đã biết React cơ bản, chủ shop có đội kỹ thuật nội bộ hoặc freelancer muốn nâng cấp năng lực làm web thương mại.</p>",
    "markdownRender": "## Khóa học Next.js thực chiến giúp bạn làm được gì?\\n\\nKhóa học tập trung vào cách xây dựng website bán hàng có cấu trúc rõ ràng, tối ưu trải nghiệm người dùng và dễ mở rộng khi dữ liệu, sản phẩm hoặc nội dung tăng lên.\\n\\n### Bạn sẽ học theo lộ trình nào?\\n\\n1. Nắm kiến trúc dự án Next.js và cách chia route, component, data flow.\\n2. Xây dựng trang danh sách, chi tiết sản phẩm, giỏ hàng và nội dung SEO.\\n3. Tối ưu form, trạng thái tải, xử lý lỗi và trải nghiệm mobile.\\n\\n### Khóa học phù hợp với ai?\\n\\nPhù hợp với developer đã biết React cơ bản, chủ shop có đội kỹ thuật nội bộ hoặc freelancer muốn nâng cấp năng lực làm web thương mại.",
    "htmlRender": "<h2>Khóa học Next.js thực chiến giúp bạn làm được gì?</h2><p>Khóa học tập trung vào cách xây dựng website bán hàng có cấu trúc rõ ràng, tối ưu trải nghiệm người dùng và dễ mở rộng khi dữ liệu, sản phẩm hoặc nội dung tăng lên.</p><h3>Bạn sẽ học theo lộ trình nào?</h3><ol><li>Nắm kiến trúc dự án Next.js và cách chia route, component, data flow.</li><li>Xây dựng trang danh sách, chi tiết sản phẩm, giỏ hàng và nội dung SEO.</li><li>Tối ưu form, trạng thái tải, xử lý lỗi và trải nghiệm mobile.</li></ol><h3>Khóa học phù hợp với ai?</h3><p>Phù hợp với developer đã biết React cơ bản, chủ shop có đội kỹ thuật nội bộ hoặc freelancer muốn nâng cấp năng lực làm web thương mại.</p>",
    "metaTitle": "Khóa học Next.js thực chiến",
    "metaDescription": "Học Next.js qua dự án website bán hàng thực tế, có lộ trình rõ và bài học dễ áp dụng.",
    "thumbnail": "https://example.com/course.jpg",
    "pricingType": "paid",
    "price": 2500000,
    "comparePriceAmount": 3500000,
    "priceNote": "Học trọn đời",
    "instructorName": "Dohy Academy",
    "level": "Trung cấp",
    "durationText": "12 giờ học",
    "introVideoType": "youtube",
    "introVideoUrl": "https://youtube.com/watch?v=example"
  }
}`,
  },
  post: {
    rootKey: 'post',
    title: 'Nhập bài viết bằng AI',
    description: 'Copy prompt, nhờ AI tạo JSON bài viết, dán kết quả để preview rồi áp dụng vào form.',
    sample: `{
  "post": {
    "title": "Cách chọn phụ kiện tủ bếp bền đẹp",
    "slug": "cach-chon-phu-kien-tu-bep-ben-dep",
    "excerpt": "Gợi ý tiêu chí chọn phụ kiện tủ bếp theo chất liệu, tải trọng và thói quen sử dụng.",
    "content": "<h2>Vì sao phụ kiện tủ bếp quan trọng?</h2><p>Phụ kiện tốt giúp tối ưu lưu trữ, tăng độ bền và cải thiện trải nghiệm sử dụng.</p><h2>Tiêu chí nên kiểm tra</h2><ul><li><strong>Chất liệu:</strong> ưu tiên inox 304 hoặc ray trượt chịu tải tốt.</li><li><strong>Kích thước:</strong> đo đúng khoang tủ trước khi chọn.</li><li><strong>Thói quen dùng:</strong> chọn phụ kiện theo vật dụng dùng hằng ngày.</li></ul>",
    "metaTitle": "Cách chọn phụ kiện tủ bếp bền đẹp",
    "metaDescription": "Hướng dẫn chọn phụ kiện tủ bếp theo chất liệu, tải trọng và nhu cầu sử dụng thực tế.",
    "thumbnail": "https://example.com/post.jpg",
    "authorName": "Biên tập viên"
  }
}`,
  },
};

const FIELD_SPECS: Record<AiEntityImportKind, Record<string, string>> = {
  product: {
    name: '"name": "string bắt buộc, tên sản phẩm tự nhiên, có keyword chính và thuộc tính quan trọng"',
    slug: '"slug": "string optional, lowercase-kebab-case không dấu"',
    sku: '"sku": "không sinh field này cho sản phẩm; hệ thống admin tự sinh SKU theo danh mục"',
    description: '"description": "string, 120-240 ký tự, chốt rõ sản phẩm là gì + lợi ích chính + đối tượng phù hợp"',
    content: '"content": "string bắt buộc nếu field này có trong schema; nội dung bán hàng đầy đủ, có tổng quan, lợi ích, thông số/ứng dụng, lưu ý chọn"',
    markdownRender: '"markdownRender": "string bắt buộc nếu field này có trong schema; markdown đầy đủ tương đương content"',
    htmlRender: '"htmlRender": "string bắt buộc nếu field này có trong schema; HTML semantic đầy đủ tương đương content, không className/style/script"',
    metaTitle: '"metaTitle": "string <= 60 ký tự, có keyword chính + lợi ích mua hàng, không clickbait"',
    metaDescription: '"metaDescription": "string <= 160 ký tự, nêu sản phẩm + lợi ích cụ thể + lý do click"',
    image: '"image": "URL http/https hoặc path bắt đầu /, optional, không dùng base64"',
    price: '"price": "number optional, giá bán thực tế"',
    salePrice: '"salePrice": "number optional, giá so sánh nếu có, phải lớn hơn price"',
    stock: '"stock": "number optional, tồn kho"',
  },
  service: {
    title: '"title": "string bắt buộc, tên dịch vụ rõ ngành + lợi ích"',
    slug: '"slug": "string optional, lowercase-kebab-case không dấu"',
    excerpt: '"excerpt": "string, 120-220 ký tự, nói rõ dịch vụ giúp ai và giải quyết vấn đề gì"',
    content: '"content": "string bắt buộc nếu field này có trong schema; nội dung dịch vụ đầy đủ, có vấn đề, giải pháp, quy trình, đầu ra, ai phù hợp"',
    markdownRender: '"markdownRender": "string bắt buộc nếu field này có trong schema; markdown đầy đủ tương đương content"',
    htmlRender: '"htmlRender": "string bắt buộc nếu field này có trong schema; HTML semantic đầy đủ tương đương content, không className/style/script"',
    metaTitle: '"metaTitle": "string <= 60 ký tự, có keyword dịch vụ + lợi ích chính"',
    metaDescription: '"metaDescription": "string <= 160 ký tự, có vấn đề khách gặp + lợi ích + đối tượng phù hợp"',
    thumbnail: '"thumbnail": "URL http/https hoặc path bắt đầu /, optional, không dùng base64"',
    price: '"price": "number optional, giá tham khảo nếu phù hợp"',
    duration: '"duration": "string optional, ví dụ 60 phút / 2-3 ngày / Theo dự án"',
  },
  course: {
    title: '"title": "string bắt buộc, tên khóa học rõ kỹ năng/lộ trình + kết quả học được"',
    slug: '"slug": "string optional, lowercase-kebab-case không dấu"',
    excerpt: '"excerpt": "string, 120-220 ký tự, nói rõ khóa học dành cho ai và giúp đạt kết quả gì"',
    content: '"content": "string bắt buộc nếu field này có trong schema; nội dung khóa học đầy đủ, có tổng quan, lộ trình, kết quả, ai phù hợp, điều kiện đầu vào"',
    markdownRender: '"markdownRender": "string bắt buộc nếu field này có trong schema; markdown đầy đủ tương đương content"',
    htmlRender: '"htmlRender": "string bắt buộc nếu field này có trong schema; HTML semantic đầy đủ tương đương content, không className/style/script"',
    metaTitle: '"metaTitle": "string <= 60 ký tự, có keyword khóa học + lợi ích chính"',
    metaDescription: '"metaDescription": "string <= 160 ký tự, nêu kỹ năng học được + đối tượng phù hợp + lý do click"',
    thumbnail: '"thumbnail": "URL http/https hoặc path bắt đầu /, optional, không dùng base64"',
    pricingType: '"pricingType": "free | paid | contact"',
    price: '"price": "number optional, giá bán khi pricingType là paid"',
    comparePriceAmount: '"comparePriceAmount": "number optional, giá gốc để hiển thị gạch ngang nếu có, phải lớn hơn price"',
    priceNote: '"priceNote": "string optional, ví dụ Học trọn đời / Bao gồm tài liệu"',
    instructorName: '"instructorName": "string optional, tên giảng viên/đơn vị đào tạo"',
    level: '"level": "Cơ bản | Trung cấp | Nâng cao"',
    durationText: '"durationText": "string optional, thời lượng hiển thị, ví dụ 12 giờ học / 6 tuần"',
    introVideoType: '"introVideoType": "none | youtube | drive | external"',
    introVideoUrl: '"introVideoUrl": "URL video giới thiệu optional, chỉ dùng khi introVideoType khác none"',
  },
  post: {
    title: '"title": "string bắt buộc, cụ thể, có góc nhìn rõ, không chung chung"',
    slug: '"slug": "string optional, lowercase-kebab-case không dấu"',
    excerpt: '"excerpt": "string, 130-220 ký tự, tóm tắt insight chính và lý do nên đọc"',
    content: '"content": "string bắt buộc, bài đầy đủ để đưa vào editor; HTML semantic sạch h2,h3,p,ul,ol,li,strong,blockquote,table; không className/style/script"',
    markdownRender: '"markdownRender": "string bắt buộc nếu field này có trong schema; markdown đầy đủ tương đương content, có heading, list/table khi phù hợp"',
    htmlRender: '"htmlRender": "string bắt buộc nếu field này có trong schema; HTML semantic đầy đủ tương đương content, không được ngắn hơn/khác ý"',
    metaTitle: '"metaTitle": "string <= 60 ký tự, có keyword chính + lợi ích đọc, không clickbait"',
    metaDescription: '"metaDescription": "string <= 160 ký tự, nêu insight cụ thể + lý do click, không mơ hồ"',
    thumbnail: '"thumbnail": "URL http/https hoặc path bắt đầu /, optional, không dùng base64"',
    authorName: '"authorName": "string optional"',
  },
};

const CORE_FIELDS: Record<AiEntityImportKind, string[]> = {
  product: ['name', 'slug', 'price'],
  service: ['title', 'slug', 'content'],
  post: ['title', 'slug', 'content'],
  course: ['title', 'slug', 'content', 'pricingType'],
};

const OPTIONAL_FIELD_MAP: Record<AiEntityImportKind, Record<string, string[]>> = {
  product: {
    description: ['description', 'content'],
    htmlRender: ['htmlRender'],
    markdownRender: ['markdownRender'],
    metaTitle: ['metaTitle'],
    metaDescription: ['metaDescription'],
    image: ['image'],
    images: ['image'],
    salePrice: ['salePrice'],
    stock: ['stock'],
  },
  service: {
    content: ['content'],
    excerpt: ['excerpt'],
    htmlRender: ['htmlRender'],
    markdownRender: ['markdownRender'],
    metaTitle: ['metaTitle'],
    metaDescription: ['metaDescription'],
    thumbnail: ['thumbnail'],
    price: ['price'],
    duration: ['duration'],
  },
  course: {
    content: ['content'],
    excerpt: ['excerpt'],
    htmlRender: ['htmlRender'],
    markdownRender: ['markdownRender'],
    metaTitle: ['metaTitle'],
    metaDescription: ['metaDescription'],
    thumbnail: ['thumbnail'],
    pricingType: ['pricingType'],
    priceAmount: ['price'],
    comparePriceAmount: ['comparePriceAmount'],
    priceNote: ['priceNote'],
    instructorName: ['instructorName'],
    level: ['level'],
    durationText: ['durationText'],
    introVideoType: ['introVideoType'],
    introVideoUrl: ['introVideoUrl'],
  },
  post: {
    content: ['content'],
    excerpt: ['excerpt'],
    htmlRender: ['htmlRender'],
    markdownRender: ['markdownRender'],
    metaTitle: ['metaTitle'],
    metaDescription: ['metaDescription'],
    thumbnail: ['thumbnail'],
    author_name: ['authorName'],
    authorName: ['authorName'],
  },
};

const STYLE_GUIDE = `Nguyên tắc chất lượng bắt buộc:
- Nội dung phải dùng được ngay trên website thật, không phải demo.
- Viết tiếng Việt tự nhiên, cụ thể, có thông tin ra quyết định; tránh câu chung chung kiểu "chất lượng cao, giá tốt".
- Không "AI styling": không emoji, không icon trang trí, không lạm dụng dấu !!!, không dùng giọng thổi phồng như "số 1", "tốt nhất" nếu không có bằng chứng.
- Web 2.0: benefit-first, đoạn ngắn, bullet rõ, dễ scan mobile, có use case, objection handling, CTA mềm.
- Học pattern tốt từ Shopify/Amazon/Shopee/Lazada/web affiliate: thông tin ra quyết định trước, câu chữ rõ, không trang trí thừa.
- Không bịa chứng nhận, bảo hành, xuất xứ, khuyến mãi, cam kết 100% nếu input không cung cấp.
- SEO human-first: keyword xuất hiện tự nhiên ở tiêu đề/mở đầu/heading/meta; phủ semantic entities, câu hỏi liên quan và intent phụ, tuyệt đối không keyword stuffing.
- Mỗi heading phải có nhiệm vụ rõ: trả lời câu hỏi, đưa tiêu chí, so sánh, checklist, lỗi thường gặp hoặc bước hành động; không dùng heading sáo rỗng.
- E-E-A-T an toàn: nêu điều kiện áp dụng, trade-off, lưu ý kiểm chứng; không bịa số liệu, nghiên cứu, chứng nhận, thương hiệu, case study hoặc cam kết nếu input không cung cấp.
- Format sạch: nếu dùng htmlRender thì chỉ dùng thẻ semantic đơn giản, không className, không style inline, không script, không iframe.`;

const KIND_GUIDE: Record<AiEntityImportKind, string> = {
  product: `Riêng sản phẩm:
- Tuyệt đối không sinh "sku", kể cả khi field sku đang bật; để admin/system tự sinh SKU theo danh mục và cấu hình biến thể.
- Viết theo intent mua hàng: sản phẩm là gì, dành cho ai, giải quyết nhu cầu gì, điểm khác biệt, chất liệu/thông số/cách dùng.
- Trước khi viết, tự xác định focus keyword, search intent mua hàng, chân dung khách và tiêu chí ra quyết định; thể hiện tự nhiên trong name, mô tả, heading và meta.
- Nội dung phải cụ thể như ecommerce/affiliate tốt: lợi ích, ứng dụng, thông số nếu có, điểm cần kiểm tra, lưu ý chọn mua, phản biện mối lo của khách.
- Nếu input thiếu thông số, không tự bịa số đo/chất liệu/xuất xứ/bảo hành; dùng cách diễn đạt an toàn như "tùy cấu hình" hoặc "kiểm tra theo thông tin nhà cung cấp".
- Cấu trúc nên có: H2 tổng quan, H3 điểm nổi bật, H3 thông số/ứng dụng, H3 phù hợp với ai, H3 lưu ý khi chọn, CTA mềm.`,
  service: `Riêng dịch vụ:
- Viết theo intent thuê dịch vụ: vấn đề khách đang gặp, dịch vụ xử lý như thế nào, đầu ra nhận được là gì, ai phù hợp và kỳ vọng thực tế.
- Trước khi viết, tự xác định focus keyword, search intent thuê dịch vụ, nhóm khách mục tiêu và góc tư vấn; thể hiện tự nhiên trong title, excerpt, heading và meta.
- Nội dung phải cho thấy năng lực qua quy trình, phạm vi, tiêu chí triển khai, lưu ý trước khi bắt đầu; không chỉ nói "chuyên nghiệp/uy tín".
- Không cam kết kết quả tuyệt đối, không bịa chứng chỉ, case study, số liệu, khách hàng lớn hoặc thời gian hoàn thành nếu input không cung cấp.
- Cấu trúc nên có: H2 tổng quan, H3 vấn đề khách gặp, H3 cách triển khai, H3 đầu ra, H3 ai phù hợp, H3 lưu ý/chi phí/thời gian nếu có, CTA mềm.`,
  course: `Riêng khóa học:
- Viết theo intent đăng ký học: người học sẽ đạt năng lực gì, lộ trình học ra sao, cần nền tảng nào, học xong áp dụng được vào tình huống nào.
- Trước khi viết, tự xác định focus keyword, search intent học tập, chân dung học viên và outcome chính; thể hiện tự nhiên trong title, excerpt, heading và meta.
- Nội dung phải rõ như landing khóa học tốt: kết quả học được, module/chủ đề chính, bài tập/thực hành nếu có, ai phù hợp, điều kiện đầu vào, lưu ý trước khi đăng ký.
- Không bịa chứng chỉ, cam kết việc làm, số giờ học, số bài học, giảng viên nổi tiếng hoặc bảo đảm hoàn tiền nếu input không cung cấp.
- Cấu trúc nên có: H2 tổng quan, H3 bạn sẽ học gì, H3 lộ trình, H3 ai phù hợp, H3 điều kiện đầu vào, H3 cách học/đầu ra, CTA mềm.`,
  post: `Riêng bài viết:
- Viết theo chuẩn SEO 2026 nhưng ưu tiên người đọc trước: thỏa intent, có thông tin ra quyết định, không generic, không nhồi keyword.
- Trước khi viết, tự xác định focus keyword, search intent, người đọc mục tiêu và góc nhìn chính; thể hiện tự nhiên trong title, mở bài, heading và meta.
- Bài phải có insight cụ thể, ví dụ thực tế, tiêu chí chọn, lỗi thường gặp, checklist/steps/bảng so sánh khi phù hợp; tránh câu rỗng như "rất quan trọng" nếu không giải thích rõ.
- E-E-A-T an toàn: nêu điều kiện áp dụng, trade-off, lưu ý kiểm chứng; không bịa số liệu, nghiên cứu, chứng nhận, thương hiệu, case study hoặc cam kết nếu input không cung cấp.
- content là nguồn chính để admin editor hiển thị và chỉnh sửa; luôn sinh content đầy đủ, không chỉ sinh htmlRender.
- Cấu trúc nên gồm: mở bài nêu vấn đề, H2/H3 theo luận điểm rõ, phần tiêu chí/checklist/lỗi thường gặp, kết luận có CTA mềm.
- Nếu schema có markdownRender, bắt buộc sinh markdownRender đầy đủ tương đương content.
- Nếu schema có htmlRender, bắt buộc sinh htmlRender đầy đủ tương đương content bằng HTML semantic sạch.
- Nếu đồng thời có content, markdownRender và htmlRender, ba field phải cùng ý, cùng cấu trúc chính, không mâu thuẫn.`,
};

const buildFormatRules = (kind: AiEntityImportKind, enabledFields?: string[]) => {
  const enabled = new Set(enabledFields ?? []);
  const allowAllOptional = enabledFields === undefined;
  const hasContent = allowAllOptional || enabled.has('content') || (kind === 'product' && enabled.has('description'));
  const hasMarkdown = allowAllOptional || enabled.has('markdownRender');
  const hasHtml = allowAllOptional || enabled.has('htmlRender');
  if (!hasContent && !hasMarkdown && !hasHtml) {return '';}

  const label = kind === 'product' ? 'sản phẩm' : kind === 'service' ? 'dịch vụ' : kind === 'course' ? 'khóa học' : 'bài viết';
  const lines = [
    `Format rule riêng cho ${label}:`,
  ];

  if (hasContent) {
    lines.push('- Vì schema có "content", bắt buộc sinh "content" là bản nội dung chính đầy đủ để admin editor hiển thị/chỉnh sửa; với sản phẩm nên đủ sâu, không viết ngắn như mô tả.');
  }

  if (hasMarkdown) {
    lines.push('- Vì schema có "markdownRender", bắt buộc sinh "markdownRender" đầy đủ tương đương content, không chỉ tóm tắt.');
  }
  if (hasHtml) {
    lines.push('- Vì schema có "htmlRender", bắt buộc sinh "htmlRender" đầy đủ tương đương content bằng HTML semantic sạch.');
  }
  if (hasContent && hasMarkdown && hasHtml) {
    lines.push('- Khi có cả "content", "markdownRender" và "htmlRender", cả 3 bản phải nhất quán về ý, heading, ví dụ, lưu ý và CTA.');
  }

  return lines.join('\n');
};

const buildSchema = (
  kind: AiEntityImportKind,
  enabledFields?: string[],
  suggestCombos?: boolean,
  includeAttributes?: boolean
) => {
  const enabled = new Set(enabledFields ?? []);
  const allowAllOptional = enabledFields === undefined;
  const fieldNames = new Set(CORE_FIELDS[kind]);

  Object.entries(OPTIONAL_FIELD_MAP[kind]).forEach(([moduleField, schemaFields]) => {
    if (allowAllOptional || enabled.has(moduleField)) {
      schemaFields.forEach((field) => fieldNames.add(field));
    }
  });

  const lines = Array.from(fieldNames)
    .filter((field) => FIELD_SPECS[kind][field])
    .map((field) => `    ${FIELD_SPECS[kind][field]}`);

  if (kind === 'product' && suggestCombos) {
    lines.push(`    "combos": "mảng các object combo dạng standard (mỗi combo gồm: type: 'standard', name: 'tên combo', price?: number, standardConfig: { minQty: number, rewardType: 'discount_percent'|'discount_amount'|'gift_self', rewardValue?: number, giftQty?: number })"`);
  }

  if (kind === 'product' && includeAttributes) {
    lines.push(`    "attributeTermIds": "mảng các string ID của các thuộc tính lựa chọn (Standard) được chọn (ví dụ: [\\"term_id_1\\", \\"term_id_2\\"])"`);
    lines.push(`    "newAttributes": "đối tượng chứa các giá trị thuộc tính lựa chọn (Standard) mới chưa có sẵn trong danh sách dạng { \\"Tên nhóm thuộc tính\\": [\\"Giá trị mới 1\\"] } (ví dụ: { \\"Giống nho\\": [\\"Nho ABC\\"] })"`);
    lines.push(`    "attributeRangeValues": "đối tượng chứa các giá trị thuộc tính khoảng (Range) dạng { \\"Tên nhóm thuộc tính\\": \\"Giá trị + Đơn vị\\" } (ví dụ: { \\"Dung tích\\": \\"750ml\\", \\"%1abv\\": \\"13.5%\\" })"`);
  }

  return `{
  "${ENTITY_COPY[kind].rootKey}": {
${lines.join(',\n')}
  }
}`;
};

const buildSample = (
  kind: AiEntityImportKind,
  suggestCombos?: boolean,
  includeAttributes?: boolean,
  formConfig?: any
) => {
  if (kind !== 'product') {
    return ENTITY_COPY[kind].sample;
  }

  const baseProduct: any = {
    name: "Giá kệ góc liên hoàn inox 304",
    slug: "gia-ke-goc-lien-hoan-inox-304",
    description: "Giá kệ góc liên hoàn inox 304 giúp tận dụng góc tủ bếp khó dùng, phù hợp gia đình muốn tăng không gian lưu trữ xoong nồi, chén đĩa và vật dụng bếp hằng ngày.",
    content: "<h2>Tổng quan giá kệ góc liên hoàn inox 304</h2><p>Giá kệ góc liên hoàn inox 304 là giải pháp lưu trữ cho khoang góc tủ bếp, nơi thường khó thao tác và dễ bị bỏ trống. Sản phẩm phù hợp với gia đình muốn sắp xếp xoong nồi, chén đĩa hoặc đồ dùng bếp theo cách gọn hơn mà vẫn dễ lấy khi nấu nướng.</p><h3>Điểm nổi bật khi sử dụng</h3><ul><li>Tận dụng tốt khu vực góc tủ, giảm lãng phí không gian lưu trữ.</li><li>Thiết kế kéo mở giúp quan sát và lấy vật dụng thuận tiện hơn so với để đồ sâu trong góc tủ.</li><li>Chất liệu inox 304 phù hợp môi trường bếp ẩm, dễ lau chùi và hạn chế bám mùi.</li></ul><h3>Ứng dụng và thông số cần kiểm tra</h3><p>Trước khi chọn mua, nên kiểm tra kích thước khoang tủ, hướng mở cánh, tải trọng sử dụng và kiểu ray trượt đi kèm. Nếu dùng cho nồi lớn hoặc vật nặng, hãy đối chiếu tải trọng theo thông tin nhà cung cấp.</p><h3>Phù hợp với ai?</h3><p>Sản phẩm phù hợp với căn bếp có tủ chữ L, tủ góc hoặc gia đình cần tăng không gian lưu trữ nhưng không muốn thay đổi toàn bộ hệ tủ.</p><h3>Lưu ý khi chọn mua</h3><ul><li>Đo đúng chiều rộng, chiều sâu và chiều cao khoang tủ trước khi đặt hàng.</li><li>Kiểm tra hướng mở trái/phải để tránh lắp sai cấu hình.</li><li>Hỏi rõ phụ kiện đi kèm, chính sách lắp đặt và điều kiện bảo hành nếu có.</li></ul>",
    metaTitle: "Giá kệ góc liên hoàn inox 304",
    metaDescription: "Giá kệ góc inox 304 bền đẹp, tối ưu góc tủ và phù hợp nội thất bếp cao cấp.",
    image: "https://example.com/product.jpg",
    price: 3500000,
    salePrice: 4200000,
    stock: 10
  };

  if (suggestCombos) {
    baseProduct.combos = [
      {
        type: "standard",
        name: "Combo Mua Nhiều Giảm Giá",
        standardConfig: {
          minQty: 2,
          rewardType: "discount_percent",
          rewardValue: 10
        }
      }
    ];
  }

  if (includeAttributes && formConfig && formConfig.groups && formConfig.groups.length > 0) {
    const standardIds = formConfig.groups.filter((g: any) => g.filterType !== 'range').slice(0, 2).map((g: any) => g.terms[0]?._id).filter(Boolean);
    baseProduct.attributeTermIds = standardIds.length > 0 ? standardIds : ["sample_term_id_1", "sample_term_id_2"];

    const standardGroups = formConfig.groups.filter((g: any) => g.filterType !== 'range');
    if (standardGroups.length > 0) {
      baseProduct.newAttributes = {
        [standardGroups[0].name]: ["Giá trị mới 1"]
      };
    }

    const rangeGroups = formConfig.groups.filter((g: any) => g.filterType === 'range');
    if (rangeGroups.length > 0) {
      baseProduct.attributeRangeValues = {};
      rangeGroups.forEach((rg: any) => {
        baseProduct.attributeRangeValues[rg.name] = rg.name.toLowerCase().includes('dung tích') ? "750ml" : "13.5%";
      });
    }
  }

  return JSON.stringify({ product: baseProduct }, null, 2);
};

const buildPrompt = (
  kind: AiEntityImportKind,
  enabledFields?: string[],
  suggestCombos?: boolean,
  includeAttributes?: boolean,
  formConfig?: any
) => {
  const enabledLine = enabledFields
    ? enabledFields.length > 0
      ? `Các trường đang được kích hoạt: ${enabledFields.join(', ')}. Chỉ sinh các field tương ứng trong schema bên dưới.`
      : 'Hiện không có trường mở rộng nào được kích hoạt. Chỉ sinh các field bắt buộc/core trong schema bên dưới.'
    : 'Bám đúng schema bên dưới và không tự thêm field ngoài schema.';

  const comboPrompt = suggestCombos
    ? `
Riêng về Combo bán kèm (standard combo):
- Hãy chủ động đề xuất 1-2 combo bán kèm hợp lý (standard combo) cho sản phẩm này dựa trên tính chất của sản phẩm.
- Ví dụ: Mua số lượng nhiều giảm giá % hoặc tặng chính sản phẩm này.
- Quy tắc quan trọng: Chỉ chọn hình thức ưu đãi (rewardType) là "discount_percent", "discount_amount" hoặc "gift_self" (tặng chính sản phẩm này). TUYỆT ĐỐI không đề xuất loại "gift_other" (tặng sản phẩm khác) vì yêu cầu chọn sản phẩm khác có sẵn gây phiền phức cho admin. Đặt thông tin này vào trường "combos" trong JSON.`
    : '';

  let attributesPrompt = '';
  if (includeAttributes && formConfig && formConfig.groups && formConfig.groups.length > 0) {
    const standardGroups = formConfig.groups.filter((g: any) => g.filterType !== 'range');
    const rangeGroups = formConfig.groups.filter((g: any) => g.filterType === 'range');

    let standardPrompt = '';
    if (standardGroups.length > 0) {
      standardPrompt = `Các nhóm thuộc tính lựa chọn (Standard) - Hãy chọn các giá trị phù hợp nhất và điền mảng ID vào "attributeTermIds":\n` +
        standardGroups.map((group: any) => {
          const termList = group.terms.map((t: any) => `"${t.name}" (ID: "${t._id}")`).join(', ');
          const selectType = group.filterType === 'single' ? 'Chọn 1 giá trị duy nhất (Single Select / Radio)' : 'Chọn nhiều giá trị (Multi-Select / Checkbox)';
          return `- Nhóm "${group.name}" (Kiểu lọc: ${selectType}): Các giá trị có sẵn gồm: ${termList}`;
        }).join('\n');
    }

    let rangePrompt = '';
    if (rangeGroups.length > 0) {
      const parseLocalTermValue = (termName: string) => {
        const match = termName.match(/^([\d.]+)\s*(.*)$/);
        return match ? match[2].trim() : '';
      };
      
      rangePrompt = `Các nhóm thuộc tính khoảng số (Range) - Hãy điền trực tiếp giá trị kèm đơn vị vào đối tượng "attributeRangeValues":\n` +
        rangeGroups.map((group: any) => {
          const unitsSet = new Set<string>();
          group.terms.forEach((t: any) => {
            const u = parseLocalTermValue(t.name);
            if (u) {
              unitsSet.add(u);
            }
          });
          const listUnits = Array.from(unitsSet);
          const counts: Record<string, number> = {};
          group.terms.forEach((t: any) => {
            const u = parseLocalTermValue(t.name);
            if (u) {
              counts[u] = (counts[u] || 0) + 1;
            }
          });
          let dominantUnit = '';
          let maxCount = 0;
          Object.entries(counts).forEach(([u, count]) => {
            if (count > maxCount) {
              maxCount = count;
              dominantUnit = u;
            }
          });
          
          const unitStr = listUnits.length > 0 ? listUnits.join(', ') : 'Chưa có đơn vị nào';
          const sampleVal = group.name.toLowerCase().includes('dung tích') ? '750' : '13.5';
          const defaultUnit = dominantUnit || (group.name.toLowerCase().includes('dung tích') ? 'ml' : '%');
          return `- Nhóm "${group.name}" (Kiểu lọc: Khoảng số - Range): Các đơn vị đã có trong hệ thống là: ${unitStr} (Khuyên dùng đơn vị: "${defaultUnit}"). Hãy điền giá trị dạng số + đơn vị (ví dụ: "${sampleVal}${defaultUnit}"). AI có thể tự đề xuất đơn vị mới hợp lý nếu hệ thống chưa có.`;
        }).join('\n');
    }

    attributesPrompt = `
${standardPrompt}

${rangePrompt}

Riêng về Thuộc tính phân loại & bộ lọc:
- Bạn BẮT BUỘC phải phân tích sản phẩm này thật kỹ và đối chiếu với TẤT CẢ các nhóm thuộc tính Standard được liệt kê ở trên. TUYỆT ĐỐI không được bỏ sót bất kỳ nhóm thuộc tính nào.
- Với mỗi nhóm thuộc tính Standard:
  - Nếu sản phẩm có giá trị tương ứng ĐÃ CÓ SẴN trong danh sách của nhóm đó, hãy lấy đúng ID của giá trị đó và thêm vào mảng "attributeTermIds".
  - Nếu sản phẩm có giá trị tương ứng nhưng CHƯA CÓ SẴN trong danh sách liệt kê, bạn TUYỆT ĐỐI không được bỏ qua. Hãy để trống ID đó trong "attributeTermIds", và BẮT BUỘC phải điền tên giá trị mới này vào đối tượng "newAttributes" dưới dạng { "Tên nhóm thuộc tính": ["Giá trị mới"] }.
  - Với các nhóm liên quan cảm quan, vật liệu, quy cách, xuất xứ, thương hiệu hoặc cách đóng gói, hãy phân tích theo bản chất sản phẩm và điền đúng nhóm đang có trong danh sách, không tự tạo tên nhóm mới nếu nhóm tương ứng đã tồn tại.
- Đối với nhóm khoảng (Range) (Kiểu lọc: Khoảng số), điền giá trị dạng số kèm đơn vị vào đối tượng "attributeRangeValues" với key là đúng tên nhóm thuộc tính khoảng số.`;
  }

  return `Bạn là senior Vietnamese SEO & conversion copywriter cho website thương mại/dịch vụ/blog.

Nhiệm vụ: tạo nội dung ${kind === 'product' ? 'SẢN PHẨM' : kind === 'service' ? 'DỊCH VỤ' : kind === 'course' ? 'KHÓA HỌC' : 'BÀI VIẾT'} bằng tiếng Việt, có thể dùng ngay sau khi dán vào admin.

${enabledLine}
${comboPrompt}
${attributesPrompt}

Output rule:
- Chỉ trả về JSON hợp lệ.
- Không dùng markdown fence.
- Không giải thích ngoài JSON.
- Không tạo field ngoài schema.
- Nếu schema có "content", field này là nội dung chính; tuyệt đối không chỉ trả về "htmlRender" hoặc "markdownRender".
- Nếu thiếu dữ liệu đầu vào, tự suy luận hợp lý nhưng không bịa claim nhạy cảm/chứng nhận.

${STYLE_GUIDE}

${KIND_GUIDE[kind]}

${buildFormatRules(kind, enabledFields)}

Schema bắt buộc:
${buildSchema(kind, enabledFields, suggestCombos, includeAttributes)}`;
};

const cleanJsonInput = (raw: string) => {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced?.[1]?.trim() ?? trimmed;
};

const trimText = (value: unknown, maxLength: number) => {
  if (typeof value !== 'string' && typeof value !== 'number') { return ''; }
  return String(value).trim().slice(0, maxLength);
};

const normalizeAttributeText = (value: string) => {
  return value
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036f]/g, '')
    .replaceAll(/[đĐ]/g, 'd')
    .toLowerCase()
    .trim();
};

const parseNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) { return value; }
  if (typeof value !== 'string') { return undefined; }
  const normalized = value.replaceAll(/[^\d]/g, '');
  if (!normalized) { return undefined; }
  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseBoolean = (value: unknown) => {
  if (typeof value === 'boolean') {return value;}
  if (typeof value !== 'string') {return undefined;}
  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'có'].includes(normalized)) {return true;}
  if (['false', '0', 'no', 'không', 'khong'].includes(normalized)) {return false;}
  return undefined;
};

const isValidImageUrl = (value: string) => {
  if (!value) { return true; }
  if (value.startsWith('/')) { return true; }
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const parseAiEntity = (raw: string, kind: AiEntityImportKind): ParseResult => {
  const config = ENTITY_COPY[kind];
  let parsed: unknown;

  try {
    parsed = JSON.parse(cleanJsonInput(raw));
  } catch {
    return { errors: ['JSON chưa hợp lệ. Hãy dán object đúng schema.'], item: null };
  }

  const source = typeof parsed === 'object' && parsed !== null && config.rootKey in parsed
    ? (parsed as Record<string, unknown>)[config.rootKey]
    : parsed;

  if (typeof source !== 'object' || source === null || Array.isArray(source)) {
    return { errors: [`Root JSON phải là { "${config.rootKey}": { ... } } hoặc object.`], item: null };
  }

  const record = source as Record<string, unknown>;
  const title = trimText(record.title ?? record.name, 140);
  const errors: string[] = [];
  if (!title) {
    errors.push(kind === 'product' ? 'Thiếu name sản phẩm.' : 'Thiếu title.');
  }

  const image = trimText(record.image ?? record.thumbnail, 500);
  if (!isValidImageUrl(image)) {
    errors.push('Ảnh phải là URL http/https hoặc path bắt đầu bằng /.');
  }

  // parse combos
  let combos: any[] | undefined = undefined;
  if (kind === 'product' && Array.isArray(record.combos)) {
    combos = record.combos
      .filter((c: any) => c && typeof c === 'object' && c.type === 'standard')
      .map((c: any) => {
        const standardConfig = c.standardConfig || {};
        return {
          type: 'standard',
          name: trimText(c.name, 120) || undefined,
          price: parseNumber(c.price),
          standardConfig: {
            minQty: parseNumber(standardConfig.minQty) ?? 1,
            rewardType: (() => {
              const rType = trimText(standardConfig.rewardType, 40) || 'gift_self';
              if (rType === 'gift') {
                return standardConfig.giftProductQuery ? 'gift_other' : 'gift_self';
              }
              if (rType === 'gift_other') {
                return 'gift_self';
              }
              if (rType !== 'discount_percent' && rType !== 'discount_amount' && rType !== 'gift_self') {
                return 'gift_self';
              }
              return rType;
            })(),
            rewardValue: parseNumber(standardConfig.rewardValue),
            giftQty: parseNumber(standardConfig.giftQty) ?? 1,
            giftProductQuery: trimText(standardConfig.giftProductQuery, 140) || undefined,
          }
        };
      });
  }

  // parse attributeTermIds
  let attributeTermIds: string[] | undefined = undefined;
  if (kind === 'product' && Array.isArray(record.attributeTermIds)) {
    attributeTermIds = record.attributeTermIds
      .filter((id: unknown) => typeof id === 'string')
      .map((id: unknown) => id as string);
  }

  // parse attributeRangeValues
  let attributeRangeValues: Record<string, string> | undefined = undefined;
  if (kind === 'product' && record.attributeRangeValues && typeof record.attributeRangeValues === 'object' && !Array.isArray(record.attributeRangeValues)) {
    attributeRangeValues = {};
    const rawRanges = record.attributeRangeValues as Record<string, unknown>;
    Object.entries(rawRanges).forEach(([k, v]) => {
      if (typeof v === 'string' || typeof v === 'number') {
        attributeRangeValues![k] = String(v).trim();
      }
    });
  }

  // parse newAttributes
  let newAttributes: Record<string, string[]> | undefined = undefined;
  if (kind === 'product' && record.newAttributes && typeof record.newAttributes === 'object' && !Array.isArray(record.newAttributes)) {
    newAttributes = {};
    const rawNewAttrs = record.newAttributes as Record<string, unknown>;
    Object.entries(rawNewAttrs).forEach(([k, v]) => {
      if (Array.isArray(v)) {
        const list = v.filter(val => typeof val === 'string').map(val => String(val).trim()).filter(Boolean);
        if (list.length > 0) {
          newAttributes![k] = list;
        }
      }
    });
  }

  const item: AiEntityImportPayload = {
    authorName: trimText(record.authorName, 120),
    comparePriceAmount: parseNumber(record.comparePriceAmount),
    content: trimText(record.content, 20_000),
    description: trimText(record.description, 2_000),
    duration: trimText(record.duration, 80),
    durationText: trimText(record.durationText, 80),
    excerpt: trimText(record.excerpt, 300),
    featured: parseBoolean(record.featured),
    htmlRender: trimText(record.htmlRender, 40_000),
    image,
    instructorName: trimText(record.instructorName, 120),
    introVideoType: trimText(record.introVideoType, 40),
    introVideoUrl: trimText(record.introVideoUrl, 500),
    isPriceVisible: parseBoolean(record.isPriceVisible),
    level: trimText(record.level, 40),
    markdownRender: trimText(record.markdownRender, 40_000),
    metaDescription: trimText(record.metaDescription, 160),
    metaTitle: trimText(record.metaTitle, 60),
    name: kind === 'product' ? title : undefined,
    price: parseNumber(record.price),
    priceNote: trimText(record.priceNote, 120),
    pricingType: trimText(record.pricingType, 40),
    salePrice: parseNumber(record.salePrice),
    sku: kind === 'product' ? undefined : trimText(record.sku, 80),
    slug: trimText(record.slug, 160),
    stock: parseNumber(record.stock),
    thumbnail: image,
    title: kind !== 'product' ? title : undefined,
    combos,
    attributeTermIds,
    attributeRangeValues,
    newAttributes,
  };

  return { errors, item: errors.length > 0 ? null : item };
};

export function AiEntityImportDialog({
  buttonClassName,
  enabledFields,
  kind,
  onApply,
  enableProductTypes = false,
  enableCombos = false,
  formConfig,
  buttonLabel = 'Import AI',
}: {
  buttonClassName?: string;
  enabledFields?: Iterable<string>;
  kind: AiEntityImportKind;
  onApply: (item: AiEntityImportPayload) => void;
  enableProductTypes?: boolean;
  enableCombos?: boolean;
  formConfig?: any;
  buttonLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [rawInput, setRawInput] = useState('');
  const [lastCopied, setLastCopied] = useState<'prompt' | 'sample' | null>(null);

  // Trạng thái toggles mới
  const [suggestCombos, setSuggestCombos] = useState(false);
  const [includeAttributes, setIncludeAttributes] = useState(false);

  // Trạng thái cho việc tạo thuộc tính Standard mới
  const createAttributeTerm = useMutation(api.attributeTerms.create);
  const [createdTermIds, setCreatedTermIds] = useState<string[]>([]);
  const [addedNewAttrs, setAddedNewAttrs] = useState<Record<string, string[]>>({});
  const [isCreatingTerms, setIsCreatingTerms] = useState(false);

  // Reset trạng thái thuộc tính mới khi nội dung nhập AI thay đổi
  useEffect(() => {
    setCreatedTermIds([]);
    setAddedNewAttrs({});
  }, [rawInput]);

  const copy = ENTITY_COPY[kind];
  const enabledFieldList = useMemo(() => enabledFields ? Array.from(enabledFields).sort() : undefined, [enabledFields]);
  
  const prompt = useMemo(() => {
    return buildPrompt(kind, enabledFieldList, suggestCombos, includeAttributes, formConfig);
  }, [enabledFieldList, kind, suggestCombos, includeAttributes, formConfig]);

  const sample = useMemo(() => {
    return buildSample(kind, suggestCombos, includeAttributes, formConfig);
  }, [kind, suggestCombos, includeAttributes, formConfig]);

  const result = useMemo(() => parseAiEntity(rawInput, kind), [kind, rawInput]);
  const canApply = rawInput.trim().length > 0 && Boolean(result.item) && result.errors.length === 0;

  const copyText = async (value: string, type: 'prompt' | 'sample') => {
    await navigator.clipboard.writeText(value);
    setLastCopied(type);
    toast.success(type === 'prompt' ? 'Đã copy prompt' : 'Đã copy JSON mẫu');
    window.setTimeout(() => setLastCopied(null), 1500);
  };

  const generateSlug = (val: string) => {
    return val
      .toLowerCase()
      .normalize("NFD")
      .replaceAll(/[\u0300-\u036F]/g, "")
      .replaceAll(/[đĐ]/g, "d")
      .replaceAll(/[^a-z0-9\s-]/g, "")
      .trim()
      .replaceAll(/\s+/g, "-")
      .replaceAll(/-+/g, "-");
  };

  const detectedNewAttributes = useMemo(() => {
    if (kind !== 'product' || !result.item || !result.item.newAttributes || !formConfig || !formConfig.groups) {
      return [];
    }

    const list: { groupName: string; groupId: string; termName: string }[] = [];

    Object.entries(result.item.newAttributes).forEach(([groupName, values]) => {
      const normalizedGroupName = normalizeAttributeText(groupName);
      const group = formConfig.groups.find(
        (g: any) => normalizeAttributeText(g.name) === normalizedGroupName
      );
      if (group && group.filterType !== 'range') {
        values.forEach((val) => {
          const normalizedVal = normalizeAttributeText(val);
          // Kiểm tra xem termName đã có trong group.terms hay chưa
          const existsInDb = group.terms.some(
            (t: any) => normalizeAttributeText(t.name) === normalizedVal
          );
          // Kiểm tra xem đã được thêm thông qua state addedNewAttrs hay chưa
          const groupAddedAttrs = addedNewAttrs[group.name] || addedNewAttrs[groupName] || [];
          const alreadyAdded = groupAddedAttrs.some(
            (v) => normalizeAttributeText(v) === normalizedVal
          );

          if (!existsInDb && !alreadyAdded) {
            list.push({
              groupName: group.name,
              groupId: group._id,
              termName: val.normalize('NFC').trim(),
            });
          }
        });
      }
    });

    return list;
  }, [kind, result.item, formConfig, addedNewAttrs]);

  const handleCreateNewTerms = async () => {
    if (detectedNewAttributes.length === 0) return;
    setIsCreatingTerms(true);
    const newIds: string[] = [];
    const nextAdded = { ...addedNewAttrs };

    try {
      for (const attr of detectedNewAttributes) {
        const newId = await createAttributeTerm({
          groupId: attr.groupId as any,
          name: attr.termName,
          slug: generateSlug(attr.termName),
          active: true,
        });
        newIds.push(newId);

        if (!nextAdded[attr.groupName]) {
          nextAdded[attr.groupName] = [];
        }
        nextAdded[attr.groupName].push(attr.termName);
      }

      setCreatedTermIds((prev) => [...prev, ...newIds]);
      setAddedNewAttrs(nextAdded);
      toast.success(`Đã thêm thành công ${detectedNewAttributes.length} giá trị thuộc tính mới vào DB.`);
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi xảy ra khi tạo thuộc tính mới.');
    } finally {
      setIsCreatingTerms(false);
    }
  };

  const applyItem = () => {
    if (!canApply || !result.item) { return; }
    if (detectedNewAttributes.length > 0) {
      toast.warning('Vui lòng bấm "Đồng ý thêm vào DB" cho các thuộc tính mới trước khi áp dụng vào form.');
      return;
    }
    
    // Tìm các ID của các thuộc tính trong newAttributes mà thực tế ĐÃ CÓ SẴN trong DB
    const existingTermIdsFromNewAttrs: string[] = [];
    if (kind === 'product' && result.item.newAttributes && formConfig && formConfig.groups) {
      Object.entries(result.item.newAttributes).forEach(([groupName, values]) => {
        const normalizedGroupName = normalizeAttributeText(groupName);
        const group = formConfig.groups.find(
          (g: any) => normalizeAttributeText(g.name) === normalizedGroupName
        );
        if (group && group.filterType !== 'range') {
          values.forEach((val) => {
            const normalizedVal = normalizeAttributeText(val);
            const existingTerm = group.terms?.find(
              (t: any) => normalizeAttributeText(t.name) === normalizedVal
            );
            if (existingTerm) {
              existingTermIdsFromNewAttrs.push(existingTerm._id);
            }
          });
        }
      });
    }

    // Gộp attributeTermIds có sẵn từ AI, các termId mới tạo, và các termId đã có sẵn được tìm thấy
    const finalItem = {
      ...result.item,
      attributeTermIds: Array.from(new Set([
        ...(result.item.attributeTermIds || []),
        ...createdTermIds,
        ...existingTermIdsFromNewAttrs,
      ])),
    };
    
    onApply(finalItem);
    toast.success('Đã áp dụng nội dung AI và thuộc tính mới vào form');
    setOpen(false);
    setRawInput('');
    setCreatedTermIds([]);
    setAddedNewAttrs({});
  };

  return (
    <>
      <Button type="button" variant="outline" className={cn('gap-2', buttonClassName)} onClick={() => setOpen(true)}>
        <Bot size={16} /> {buttonLabel}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[94vw] max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{copy.title}</DialogTitle>
            <DialogDescription>{copy.description}</DialogDescription>
          </DialogHeader>

          {/* Khối toggles tùy chọn AI */}
          {kind === 'product' && (enableCombos || (enableProductTypes && formConfig && formConfig.groups && formConfig.groups.length > 0)) && (
            <div className="flex flex-wrap gap-4 items-center p-3 rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/30 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Tùy chọn Prompt AI:</span>
              
              {enableCombos && (
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <Checkbox
                    checked={suggestCombos}
                    onCheckedChange={(checked) => setSuggestCombos(checked)}
                  />
                  <span className="font-medium text-slate-600 dark:text-slate-400">Đề xuất Combo thường</span>
                </label>
              )}

              {enableProductTypes && formConfig && formConfig.groups && formConfig.groups.length > 0 && (
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <Checkbox
                    checked={includeAttributes}
                    onCheckedChange={(checked) => setIncludeAttributes(checked)}
                  />
                  <span className="font-medium text-slate-600 dark:text-slate-400">Điền thuộc tính lọc</span>
                </label>
              )}
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Label className="flex items-center gap-1.5">
                    <FileText size={14} /> Prompt chuẩn
                  </Label>
                  <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => void copyText(prompt, 'prompt')}>
                    {lastCopied === 'prompt' ? <Check size={12} /> : <Copy size={12} />}
                    Copy
                  </Button>
                </div>
                <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-md bg-white p-2 text-[11px] leading-5 text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                  {prompt}
                </pre>
              </div>

              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Label>JSON mẫu</Label>
                  <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={() => void copyText(sample, 'sample')}>
                    {lastCopied === 'sample' ? <Check size={12} /> : <Copy size={12} />}
                    Copy
                  </Button>
                </div>
                <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-slate-50 p-2 text-[11px] leading-5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {sample}
                </pre>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Dán kết quả AI</Label>
                <textarea
                  className="min-h-64 w-full rounded-md border border-slate-200 bg-white px-3 py-2 font-mono text-xs text-slate-800 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  placeholder={sample}
                  value={rawInput}
                  onChange={(event) => setRawInput(event.target.value)}
                />
              </div>

              {rawInput.trim().length > 0 && (
                <div className={cn(
                  'rounded-lg border p-3 text-sm',
                  result.errors.length > 0
                    ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-300'
                    : 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/60 dark:bg-green-950/20 dark:text-green-300'
                )}>
                  {result.errors.length > 0 ? (
                    <ul className="space-y-1">
                      {result.errors.map((error) => (
                        <li key={error} className="flex gap-1.5">
                          <X size={14} className="mt-0.5 shrink-0" />
                          <span>{error}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Check size={14} />
                      JSON hợp lệ, sẵn sàng áp dụng.
                    </div>
                  )}
                </div>
              )}

              {result.errors.length === 0 && detectedNewAttributes.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/60 dark:bg-amber-950/20 text-amber-900 dark:text-amber-300 text-xs space-y-2">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="flex items-center gap-1.5">
                      ⚠️ Phát hiện {detectedNewAttributes.length} giá trị thuộc tính mới từ AI:
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isCreatingTerms}
                      onClick={handleCreateNewTerms}
                      className="h-7 text-xs border-amber-300 bg-white hover:bg-amber-100 dark:bg-slate-900 dark:border-amber-800 text-amber-800 dark:text-amber-350 font-semibold"
                    >
                      {isCreatingTerms ? 'Đang tạo...' : 'Đồng ý thêm vào DB'}
                    </Button>
                  </div>
                  <div className="max-h-24 overflow-y-auto space-y-1 pl-2 border-l-2 border-amber-300 text-slate-700 dark:text-slate-350">
                    {detectedNewAttributes.map((attr, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <span className="font-medium text-slate-500">{attr.groupName}:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{attr.termName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.item && (
                <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Xem trước</div>
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">{result.item.name || result.item.title}</div>
                    {(result.item.excerpt || result.item.description || result.item.metaDescription) && (
                      <div className="line-clamp-3 text-slate-500">{result.item.excerpt || result.item.description || result.item.metaDescription}</div>
                    )}
                    {(result.item.image || result.item.thumbnail) && (
                      <div className="truncate text-xs text-slate-400">{result.item.image || result.item.thumbnail}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Đóng
            </Button>
            <Button type="button" variant="accent" disabled={!canApply} onClick={applyItem}>
              Áp dụng vào form
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

