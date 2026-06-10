import type { MutationCtx, QueryCtx } from './_generated/server';
import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';
import { slugify } from '../lib/image/uploadNaming';
import { TRUST_PAGE_SLOTS, type TrustPageKey } from '../lib/ia/trust-pages';
import * as PostCategoriesModel from './model/postCategories';
import * as PostsModel from './model/posts';

type SettingsMap = Map<string, unknown>;

type TrustPageAction = 'disabled' | 'mapped' | 'suggested' | 'draft';

const IA_GROUP = 'ia';

const resolveBoolean = (value: unknown, fallback = true) =>
  typeof value === 'boolean' ? value : fallback;

const resolveString = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : null;

const resolvePostId = (value: unknown) =>
  typeof value === 'string' && value.trim() ? (value.trim() as Id<'posts'>) : null;

const toSearchable = (value?: string | null) =>
  (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036f]/g, '')
    .replaceAll(/đ/g, 'd');

const buildSettingsMap = async (ctx: QueryCtx | MutationCtx) => {
  const settings = await ctx.db.query('settings').take(500);
  return new Map(settings.map((setting: { key: string; value: unknown }) => [setting.key, setting.value]));
};

const getPolicyCategory = async (
  ctx: QueryCtx | MutationCtx,
  createIfMissing: boolean,
): Promise<{ id: Id<'postCategories'>; name: string; slug: string } | null> => {
  const categories = await ctx.db.query('postCategories').take(200);
  const normalized = categories.map((category: { _id: Id<'postCategories'>; name: string; slug: string }) => ({
    id: category._id,
    name: category.name,
    slug: category.slug,
    searchable: toSearchable(`${category.name} ${category.slug}`),
  }));
  const found = normalized.find((category) =>
    category.searchable.includes('chinh sach') || category.searchable.includes('policy')
  );
  if (found) {
    return { id: found.id, name: found.name, slug: found.slug };
  }
  if (!createIfMissing) {
    return null;
  }
  const name = 'Chính sách';
  const slug = slugify(name);
  const id = await PostCategoriesModel.create(ctx as MutationCtx, { name, slug, active: true });
  return { id, name, slug };
};

const findMatchingPost = (
  posts: { _id: Id<'posts'>; title: string; slug: string; status: string }[],
  slot: (typeof TRUST_PAGE_SLOTS)[number],
) => {
  const keywords = slot.keywords.map(toSearchable);
  return posts.find((post) => {
    const target = toSearchable(`${post.title} ${post.slug}`);
    return keywords.some((keyword) => target.includes(keyword));
  });
};

const buildDraftPayload = (
  slot: (typeof TRUST_PAGE_SLOTS)[number],
  settingsMap: SettingsMap,
  categoryName?: string,
) => {
  const siteName = resolveString(settingsMap.get('site_name')) ?? 'Website';
  const siteUrl = resolveString(settingsMap.get('site_url')) ?? '';
  const email = resolveString(settingsMap.get('contact_email')) ?? 'support@example.com';
  const phone = resolveString(settingsMap.get('contact_phone')) ?? '';
  const address = resolveString(settingsMap.get('contact_address')) ?? '';
  const taxId = resolveString(settingsMap.get('contact_tax_id')) ?? '';
  const zalo = resolveString(settingsMap.get('contact_zalo')) ?? '';
  const messenger = resolveString(settingsMap.get('contact_messenger')) ?? '';
  const facebook = resolveString(settingsMap.get('social_facebook')) ?? '';

  const policyLabel = slot.defaultTitle;
  const excerpt = `${policyLabel} áp dụng cho khách hàng mua sắm tại ${siteName}, giúp minh bạch quyền lợi và trách nhiệm đôi bên, đảm bảo trải nghiệm mua sắm trực tuyến an toàn và chuyên nghiệp.`;
  
  // Xây dựng thông tin liên hệ đa dạng
  const contactLines: string[] = [];
  if (address) contactLines.push(`Địa chỉ: ${address}`);
  if (phone) contactLines.push(`Hotline: ${phone}`);
  if (email) contactLines.push(`Email: ${email}`);
  if (taxId) contactLines.push(`Mã số thuế: ${taxId}`);
  if (zalo) {
    const zaloUrl = zalo.startsWith('http') ? zalo : `https://zalo.me/${zalo}`;
    contactLines.push(`<a href="${zaloUrl}" target="_blank" rel="noopener noreferrer">Zalo hỗ trợ</a>`);
  }
  if (messenger) {
    const fbUrl = messenger.startsWith('http') ? messenger : `https://m.me/${messenger}`;
    contactLines.push(`<a href="${fbUrl}" target="_blank" rel="noopener noreferrer">Messenger hỗ trợ</a>`);
  }
  if (facebook) {
    const fbPage = facebook.startsWith('http') ? facebook : `https://facebook.com/${facebook}`;
    contactLines.push(`<a href="${fbPage}" target="_blank" rel="noopener noreferrer">Facebook Page</a>`);
  }

  const resolvedContact = contactLines.length > 0 
    ? contactLines.join(' | ') 
    : 'Thông tin liên hệ của bộ phận chăm sóc khách hàng đang được cập nhật.';

  const emphasize = (text: string, keywords: string[]) =>
    keywords.reduce((acc, keyword) => {
      // Tránh thay thế nếu keyword trống hoặc trùng với thẻ HTML
      if (!keyword || keyword.length < 2) return acc;
      try {
        return acc.replaceAll(keyword, `<strong>${keyword}</strong>`);
      } catch {
        return acc;
      }
    }, text);

  const baseKeywords = [siteName, policyLabel, 'hỗ trợ', 'khách hàng'];
  const slotKeywords: Record<TrustPageKey, string[]> = {
    privacy: ['bảo mật', 'dữ liệu cá nhân', 'Nghị định 13/2023/NĐ-CP', 'thu thập', 'bảo vệ'],
    returnPolicy: ['đổi trả', 'hoàn tiền', 'lỗi kỹ thuật', 'điều kiện', 'quy trình'],
    shipping: ['vận chuyển', 'giao hàng', 'đồng kiểm', 'hỏa tốc', 'phí vận chuyển'],
    payment: ['thanh toán', 'chuyển khoản', 'COD', 'xác nhận thanh toán', 'hóa đơn VAT'],
    terms: ['điều khoản', 'quy định', 'tuổi hợp pháp', 'bản quyền', 'tranh chấp'],
    about: ['tầm nhìn', 'sứ mệnh', 'giá trị cốt lõi', 'chính hãng', 'chất lượng'],
    faq: ['câu hỏi', 'đặt hàng', 'bảo quản', 'hành trình đơn hàng', 'liên hệ'],
  };
  const keywords = [...baseKeywords, ...(slotKeywords[slot.key] ?? [])];

  const sections: {
    title: string;
    paragraphs?: string[];
    items?: string[];
    qa?: { q: string; a: string }[];
    listType?: 'ul' | 'ol';
    callout?: string;
  }[] = [];

  if (slot.key === 'privacy') {
    sections.push(
      {
        title: '1. Cam kết chung về bảo mật thông tin cá nhân',
        paragraphs: [
          `Chào mừng bạn đến với ${siteName}. Chúng tôi tuyệt đối tôn trọng quyền riêng tư và cam kết bảo vệ dữ liệu cá nhân của khách hàng khi tham gia mua sắm và sử dụng dịch vụ trên website.`,
          'Chính sách bảo mật này tuân thủ đầy đủ các quy định pháp luật hiện hành của Việt Nam, đặc biệt là các quy định về bảo vệ dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP, nhằm minh bạch hóa hoạt động thu thập, lưu trữ, sử dụng và chia sẻ thông tin cá nhân của bạn.',
        ],
      },
      {
        title: '2. Phạm vi thu thập dữ liệu cá nhân',
        paragraphs: [
          'Để thực hiện giao dịch và cung cấp dịch vụ tốt nhất, chúng tôi thu thập các loại dữ liệu cá nhân sau:',
        ],
        items: [
          'Thông tin liên hệ trực tiếp: Họ tên, số điện thoại, địa chỉ email, địa chỉ giao hàng và địa chỉ thanh toán.',
          'Thông tin giao dịch: Lịch sử đặt hàng, giá trị giao dịch, phương thức thanh toán lựa chọn, thông tin xuất hóa đơn VAT (nếu có).',
          'Thông tin kỹ thuật tự động: Địa chỉ IP, loại thiết bị truy cập, trình duyệt web sử dụng, hệ điều hành và các dữ liệu thu thập qua cookie nhằm tối ưu hóa và cá nhân hóa trải nghiệm duyệt web của bạn.',
        ],
      },
      {
        title: '3. Mục đích sử dụng thông tin cá nhân',
        paragraphs: [
          'Thông tin cá nhân thu thập được từ khách hàng sẽ được sử dụng hợp pháp cho các mục đích cụ thể sau:',
        ],
        items: [
          'Xử lý đơn hàng: Xác nhận thông tin đơn đặt hàng, giao nhận sản phẩm và hỗ trợ các vấn đề sau bán hàng (bảo hành, đổi trả).',
          'Chăm sóc khách hàng: Giải đáp thắc mắc, tiếp nhận khiếu nại, tư vấn sản phẩm và cải thiện chất lượng dịch vụ tổng thể.',
          'Thông tin tiếp thị (khi được đồng ý): Gửi các thông báo về trạng thái đơn hàng, thông tin cập nhật sản phẩm mới, chương trình ưu đãi, khuyến mãi và khảo sát ý kiến khách hàng.',
          'Bảo mật hệ thống: Ngăn ngừa các hành vi truy cập trái phép, giả mạo tài khoản, lừa đảo trực tuyến hoặc các hoạt động phá hoại hệ thống an ninh của website.',
        ],
      },
      {
        title: '4. Thời gian lưu trữ và bảo vệ dữ liệu',
        paragraphs: [
          'Dữ liệu cá nhân của bạn sẽ được lưu trữ an toàn trong suốt thời gian hoạt động của website hoặc cho đến khi có yêu cầu hợp lệ từ phía khách hàng về việc xóa bỏ dữ liệu.',
          'Chúng tôi áp dụng các biện pháp bảo mật kỹ thuật tiêu chuẩn (như giao thức mã hóa dữ liệu truyền tải SSL/TLS, tường lửa bảo vệ, phân quyền truy cập nội bộ chặt chẽ) nhằm ngăn chặn tối đa các rủi ro liên quan đến truy cập trái phép, tiết lộ thông tin ngoài ý muốn, thất lạc hoặc hư hỏng dữ liệu.',
        ],
      },
      {
        title: '5. Chia sẻ thông tin cá nhân cho bên thứ ba',
        paragraphs: [
          'Chúng tôi cam kết không bán, không cho thuê, không trao đổi thông tin cá nhân của bạn cho bất kỳ bên thứ ba nào vì mục đích thương mại riêng của họ. Dữ liệu chỉ được chia sẻ trong các trường hợp giới hạn sau:',
        ],
        items: [
          'Đơn vị vận chuyển và chuyển phát nhanh: Cung cấp họ tên, số điện thoại và địa chỉ giao hàng để thực hiện vận chuyển và giao nhận sản phẩm đến tay khách hàng.',
          'Đối tác thanh toán và ngân hàng: Cung cấp thông tin cần thiết để thực hiện giao dịch thanh toán trực tuyến an toàn.',
          'Yêu cầu pháp lý bắt buộc: Chia sẻ thông tin với cơ quan nhà nước có thẩm quyền khi có yêu cầu bằng văn bản và tuân thủ đúng quy trình tố tụng của pháp luật Việt Nam.',
        ],
      },
      {
        title: '6. Quyền lợi của chủ thể dữ liệu (Khách hàng)',
        paragraphs: [
          'Khách hàng có toàn quyền kiểm soát và định đoạt đối với dữ liệu cá nhân của mình, bao gồm các quyền sau:',
        ],
        items: [
          'Quyền truy cập và điều chỉnh: Xem, cập nhật, sửa đổi hoặc bổ sung thông tin cá nhân bằng cách đăng nhập vào tài khoản trên website hoặc liên hệ trực tiếp với bộ phận chăm sóc khách hàng.',
          'Quyền yêu cầu xóa thông tin: Yêu cầu chúng tôi xóa bỏ hoàn toàn hoặc một phần dữ liệu cá nhân đang lưu trữ trên hệ thống (ngoại trừ các trường hợp bắt buộc phải lưu trữ theo luật thuế hoặc quy định pháp luật liên quan).',
          'Quyền rút lại sự đồng ý: Từ chối nhận các thông tin quảng cáo, bản tin khuyến mãi bất kỳ lúc nào bằng cách click vào link hủy đăng ký ở cuối email tiếp thị hoặc yêu cầu qua hotline/email.',
        ],
      },
      {
        title: '7. Thông tin liên hệ và xử lý khiếu nại bảo mật',
        paragraphs: [
          'Mọi thắc mắc, yêu cầu điều chỉnh hoặc phản ánh liên quan đến chính sách bảo mật thông tin cá nhân, vui lòng liên hệ trực tiếp với bộ phận quản trị dữ liệu của chúng tôi theo thông tin dưới đây:',
        ],
        callout: resolvedContact,
      },
    );
  }

  if (slot.key === 'returnPolicy') {
    sections.push(
      {
        title: '1. Quy định chung về chính sách đổi trả sản phẩm',
        paragraphs: [
          `Với mục tiêu mang lại sự hài lòng cao nhất cho khách hàng khi trải nghiệm mua sắm tại ${siteName}, chúng tôi xây dựng chính sách đổi trả hàng hóa rõ ràng, minh bạch và tuân thủ đúng quy định bảo vệ quyền lợi người tiêu dùng.`,
          'Sản phẩm mua tại website được hỗ trợ đổi trả linh hoạt khi phát hiện lỗi từ phía nhà sản xuất hoặc hư hại trong quá trình vận chuyển giao nhận.',
        ],
      },
      {
        title: '2. Điều kiện tiêu chuẩn để đổi trả hàng',
        paragraphs: [
          'Để được tiếp nhận và xử lý yêu cầu đổi trả sản phẩm thành công, sản phẩm hoàn trả cần đáp ứng đầy đủ các tiêu chuẩn kỹ thuật sau:',
        ],
        items: [
          'Sản phẩm còn nguyên trạng ban đầu khi nhận hàng: đầy đủ nhãn mác, tem niêm phong, màng co bảo vệ của nhà sản xuất hoặc của website (nếu có).',
          'Bao bì, vỏ hộp đựng sản phẩm không bị rách nát, tẩy xóa hoặc hư hỏng nặng (trừ trường hợp hư hại phát sinh do bên vận chuyển giao hàng).',
          'Sản phẩm chưa qua sử dụng, chưa có dấu hiệu của việc can thiệp vật lý làm thay đổi kết cấu, chất lượng hoặc biến dạng bên ngoài.',
          'Khách hàng cung cấp đầy đủ chứng từ chứng minh giao dịch đặt mua hợp lệ: Hóa đơn bán hàng, email xác nhận đơn hàng hoặc mã đơn hàng hiển thị trên hệ thống.',
          'Chúng tôi khuyến khích khách hàng quay lại video quá trình mở hộp (unboxing) sản phẩm để làm bằng chứng xác thực hỗ trợ giải quyết khiếu nại nhanh chóng nhất.',
        ],
      },
      {
        title: '3. Các trường hợp hỗ trợ đổi trả miễn phí',
        paragraphs: [
          'Khách hàng sẽ được hỗ trợ đổi trả sản phẩm hoàn toàn miễn phí (không phải chịu phí vận chuyển thu hồi và giao lại) trong các trường hợp sau:',
        ],
        items: [
          'Sản phẩm bị lỗi kỹ thuật, lỗi chất lượng hoặc tỳ vết nghiêm trọng phát sinh từ phía nhà sản xuất trước khi xuất xưởng.',
          'Sản phẩm bị nứt, vỡ, móp méo, rò rỉ hoặc hư hỏng vật lý nghiêm trọng xảy ra trong quá trình vận chuyển giao nhận đơn hàng.',
          'Sản phẩm bàn giao không đúng với đơn đặt hàng đã được xác nhận (sai chủng loại, sai mẫu mã, sai niên hạn hoặc không đúng mô tả kỹ thuật công bố trên website).',
        ],
      },
      {
        title: '4. Thời hạn tiếp nhận yêu cầu đổi trả',
        listType: 'ol',
        items: [
          'Đối với các lỗi hư hại ngoại quan do vận chuyển (nứt, vỡ, móp méo) hoặc giao sai hàng: Khách hàng cần thông báo và gửi bằng chứng hình ảnh/video cho bộ phận CSKH của chúng tôi trong vòng 24 giờ kể từ thời điểm nhận hàng thành công.',
          'Đối với các lỗi chất lượng kỹ thuật phát sinh bên trong sản phẩm khi sử dụng: Tiếp nhận khiếu nại đổi trả trong vòng 7 ngày kể từ ngày nhận hàng (hoặc theo quy định bảo hành riêng được đính kèm tùy dòng sản phẩm).',
        ],
      },
      {
        title: '5. Quy trình đổi trả hàng hóa',
        listType: 'ol',
        items: [
          `Liên hệ qua Hotline, gửi email về ${email} hoặc liên hệ trực tiếp qua Zalo/Messenger để gửi yêu cầu đổi trả kèm theo mã đơn hàng và bằng chứng hình ảnh/video sản phẩm.`,
          'Bộ phận CSKH kiểm tra tính hợp lệ của yêu cầu trong vòng 24 giờ làm việc và hướng dẫn khách hàng cách thức đóng gói, bàn giao sản phẩm thu hồi.',
          'Chúng tôi tiến hành thẩm định sản phẩm thực tế nhận lại và phản hồi kết quả giải quyết (đổi sản phẩm mới hoặc hoàn tiền) cho khách hàng trong vòng 1-3 ngày làm việc tiếp theo.',
        ],
      },
      {
        title: '6. Phương thức hoàn tiền và thời gian thực hiện',
        paragraphs: [
          'Trong trường hợp đổi trả dẫn đến hoàn tiền cho khách hàng, quy định cụ thể như sau:',
        ],
        items: [
          'Phương thức hoàn tiền: Chuyển khoản ngân hàng trực tiếp vào số tài khoản của khách hàng hoặc hoàn tiền qua ví điện tử/thẻ tùy theo thỏa thuận thống nhất giữa hai bên.',
          'Thời gian hoàn tiền: Từ 3 đến 7 ngày làm việc kể từ ngày chúng tôi xác nhận tiếp nhận sản phẩm hoàn trả đủ điều kiện tiêu chuẩn quy định.',
        ],
      },
      {
        title: '7. Thông tin hỗ trợ và tiếp nhận đổi trả',
        paragraphs: [
          'Nếu quý khách có bất kỳ thắc mắc nào về quy trình hoặc cần hỗ trợ tạo phiếu đổi trả sản phẩm nhanh, vui lòng liên hệ trực tiếp:',
        ],
        callout: resolvedContact,
      },
    );
  }

  if (slot.key === 'shipping') {
    sections.push(
      {
        title: '1. Phạm vi và hình thức vận chuyển giao nhận',
        paragraphs: [
          `Để đưa sản phẩm chất lượng tốt nhất đến tay khách hàng trên mọi miền tổ quốc, ${siteName} hợp tác chặt chẽ cùng các đơn vị vận chuyển chuyên nghiệp và uy tín hàng đầu tại Việt Nam.`,
        ],
        items: [
          'Hỗ trợ dịch vụ giao hàng tiêu chuẩn trên phạm vi toàn quốc (đến tất cả các tỉnh thành, quận huyện và xã phường có mạng lưới bưu cục hoạt động).',
          'Cung cấp dịch vụ giao hàng hỏa tốc trong nội thành các thành phố lớn (Hà Nội, TP. Hồ Chí Minh...) nhận hàng ngay trong vòng 1 - 2 giờ làm việc kể từ thời điểm đơn hàng được xác nhận.',
        ],
      },
      {
        title: '2. Thời gian giao hàng dự kiến',
        paragraphs: [
          'Thời gian vận chuyển được tính từ thời điểm đơn hàng được bộ phận CSKH gọi điện/nhắn tin xác nhận và đóng gói bàn giao cho đơn vị chuyển phát:',
        ],
        items: [
          'Giao hàng nội thành hỏa tốc: Từ 1 - 2 giờ làm việc.',
          'Giao hàng khu vực nội thành (Hà Nội / TP.HCM) tiêu chuẩn: Từ 1 - 2 ngày làm việc.',
          'Giao hàng ngoại thành và các tỉnh thành khác: Từ 2 - 5 ngày làm việc tùy thuộc vào địa lý nhận hàng của bưu cục đích.',
          'Lưu ý: Thời gian giao nhận thực tế có thể thay đổi trong các trường hợp bất khả kháng nằm ngoài kiểm soát (thiên tai bão lũ, dịch bệnh phong tỏa, sự cố kỹ thuật bưu chính nghiêm trọng). Chúng tôi sẽ chủ động cập nhật hành trình và hỗ trợ đẩy nhanh tiến độ giao nhận.',
        ],
      },
      {
        title: '3. Cước phí vận chuyển',
        paragraphs: [
          'Cước phí vận chuyển đơn hàng được tính toán minh bạch dựa trên tổng trọng lượng đóng gói, kích thước vật lý của hộp sản phẩm và khoảng cách bưu cục.',
        ],
        items: [
          'Phí vận chuyển chính xác sẽ được hiển thị công khai và chi tiết tại trang thanh toán (checkout) của website trước khi bạn xác nhận đặt mua.',
          'Chúng tôi thường xuyên áp dụng các chương trình ưu đãi giảm phí giao hàng hoặc miễn phí vận chuyển (Free Ship) toàn quốc cho các đơn đặt hàng có tổng giá trị đạt hạn mức tối thiểu theo quy định trong từng thời kỳ khuyến mãi.',
        ],
      },
      {
        title: '4. Quy trình đóng gói và bảo đảm an toàn hàng hóa',
        paragraphs: [
          'Mọi sản phẩm của chúng tôi trước khi rời kho đều được đóng gói theo tiêu chuẩn an toàn nghiêm ngặt đối với từng loại mặt hàng:',
          'Sử dụng các lớp bọc bóng khí chống sốc nhiệt, chống va đập vật lý, đặt trong thùng carton cứng chuyên dụng và dán băng keo niêm phong bảo vệ. Đảm bảo chất lượng sản phẩm còn nguyên trạng, không bị ảnh hưởng bởi các yếu tố tác động bên ngoài hay thời tiết khắc nghiệt trong suốt chặng đường vận chuyển.',
        ],
      },
      {
        title: '5. Quy trình đồng kiểm hàng hóa khi nhận hàng (Bắt buộc bảo vệ quyền lợi)',
        paragraphs: [
          'Do một số nhóm mặt hàng TMĐT có đặc tính dễ tổn tổn thương hoặc có giá trị cao, chúng tôi yêu cầu và khuyến khích khách hàng thực hiện quy trình đồng kiểm:',
        ],
        items: [
          'Mở gói hàng và kiểm tra ngoại quan cùng nhân viên giao nhận ngay khi bưu tá giao hàng đến địa chỉ nhận.',
          'Kiểm tra kỹ các thông tin: Số lượng sản phẩm nhận thực tế so với phiếu mua hàng, đúng chủng loại, quy cách đóng gói nguyên vẹn, sản phẩm không có dấu hiệu nứt vỡ, móp méo hoặc rò rỉ chất lỏng.',
          'Trường hợp phát hiện sự cố ngoại quan (nứt, vỡ, móp méo hoặc thiếu sản phẩm): Quý khách vui lòng từ chối nhận đơn hàng từ shipper, lập biên bản ghi nhận tình trạng thực tế cùng shipper (nếu có), chụp ảnh/quay video lại hiện trạng sản phẩm và liên hệ ngay bộ phận CSKH của chúng tôi để được giải quyết giao bù hoặc đổi mới hỏa tốc.',
        ],
      },
      {
        title: '6. Theo dõi hành trình đơn hàng và liên hệ hỗ trợ',
        paragraphs: [
          `Sau khi đơn hàng được gửi đi, mã bưu chính (mã vận đơn) sẽ được gửi đến email hoặc số điện thoại đăng ký mua hàng của bạn. Quý khách có thể truy cập ${siteUrl ? siteUrl : 'website'} hoặc sử dụng mã vận đơn tra cứu trực tiếp trên hệ thống định vị của đơn vị chuyển phát để biết chính xác vị trí đơn hàng của mình.`,
        ],
        callout: resolvedContact,
      },
    );
  }

  if (slot.key === 'payment') {
    sections.push(
      {
        title: '1. Các phương thức thanh toán hỗ trợ giao dịch',
        paragraphs: [
          `Nhằm tạo điều kiện mua sắm thuận tiện và an toàn tuyệt đối cho khách hàng, ${siteName} cung cấp đa dạng các hình thức thanh toán phổ biến tại Việt Nam:`,
        ],
        items: [
          'Thanh toán trực tiếp khi nhận hàng (COD - Cash on Delivery): Khách hàng thanh toán bằng tiền mặt cho nhân viên giao nhận bưu chính sau khi nhận hàng và thực hiện đồng kiểm hoàn tất.',
          'Thanh toán chuyển khoản ngân hàng trực tiếp: Chuyển khoản số tiền tương ứng đơn đặt hàng qua ứng dụng ngân hàng di động (Internet Banking) vào tài khoản chính thức của chúng tôi trước khi gửi hàng.',
          'Thanh toán trực tuyến bảo mật: Tích hợp thanh toán qua thẻ nội địa (ATM), thẻ quốc tế (Visa/Mastercard) hoặc ví điện tử lớn (Momo, ZaloPay...) đã được liên kết chính thức trên website.',
        ],
      },
      {
        title: '2. Quy định chuyển khoản ngân hàng và xác nhận giao dịch',
        paragraphs: [
          'Đối với hình thức chuyển khoản ngân hàng trực tiếp, để đảm bảo đơn hàng được phê duyệt nhanh chóng và không xảy ra nhầm lẫn:',
        ],
        items: [
          'Thông tin số tài khoản ngân hàng chính thức cùng cú pháp chuyển khoản chuẩn (bao gồm Mã đơn hàng và Số điện thoại đặt hàng) sẽ được hiển thị công khai trên màn hình sau bước đặt hàng và được gửi vào email xác nhận đơn hàng.',
          'Sau khi thực hiện giao dịch chuyển khoản thành công, quý khách vui lòng chụp màn hình biên lai giao dịch thành công gửi cho chúng tôi qua Zalo hoặc Messenger để hỗ trợ bộ phận kế toán xác minh giao dịch.',
          'Sau khi tiền nổi vào tài khoản (thường trong vòng 5 - 15 phút làm việc), trạng thái đơn hàng trên hệ thống sẽ tự động cập nhật thành "Đã thanh toán" và gửi email thông báo hoàn tất xác nhận đơn hàng cho bạn.',
        ],
      },
      {
        title: '3. Cam kết an toàn và bảo mật giao dịch',
        paragraphs: [
          'Hệ thống thanh toán trực tuyến trên website của chúng tôi được bảo vệ theo các chuẩn mã hóa bảo mật cao nhất hiện nay, đảm bảo thông tin tài khoản ngân hàng và thông tin thẻ thanh toán của bạn luôn được bảo vệ tuyệt đối chống lại mọi hành vi gian lận hoặc đánh cắp dữ liệu.',
          'Khuyến cáo an toàn: Để bảo vệ tài sản cá nhân, quý khách vui lòng tuyệt đối không chia sẻ mã xác thực dùng một lần (OTP) hoặc thông tin mật khẩu tài khoản ngân hàng cho bất kỳ ai, bao gồm cả nhân viên hỗ trợ của chúng tôi.',
        ],
      },
      {
        title: '4. Chính sách hỗ trợ xuất hóa đơn tài chính (Hóa đơn VAT)',
        paragraphs: [
          'Chúng tôi hỗ trợ phát hành hóa đơn điện tử VAT cho khách hàng cá nhân và doanh nghiệp có nhu cầu theo đúng quy định của Luật quản lý thuế Việt Nam hiện hành:',
        ],
        items: [
          'Quý khách vui lòng cung cấp đầy đủ thông tin xuất hóa đơn (Tên Công Ty, Địa chỉ đăng ký kinh doanh hợp pháp, Mã số thuế) tại ghi chú đơn hàng khi đặt hàng trực tuyến.',
          'Trường hợp quên cung cấp thông tin tại trang checkout, quý khách cần liên hệ thông báo cho bộ phận kế toán của chúng tôi qua Hotline hoặc Email hỗ trợ trong vòng tối đa 24 giờ kể từ thời điểm đặt hàng thành công để được xử lý kịp thời.',
        ],
      },
      {
        title: '5. Thông tin liên hệ giải đáp thắc mắc thanh toán',
        paragraphs: [
          'Mọi trường hợp gặp lỗi khi thực hiện giao dịch thanh toán hoặc cần tra soát trạng thái số dư đơn hàng, quý khách vui lòng liên hệ ngay với bộ phận tài chính - kế toán của chúng tôi:',
        ],
        callout: resolvedContact,
      },
    );
  }

  if (slot.key === 'terms') {
    sections.push(
      {
        title: '1. Chấp nhận các điều khoản sử dụng dịch vụ',
        paragraphs: [
          `Chào mừng bạn đến với website thương mại điện tử của chúng tôi. Bằng cách truy cập website, đăng ký thành viên hoặc tiến hành thực hiện các giao dịch đặt hàng trực tuyến trên hệ thống của ${siteName}, khách hàng đồng ý tuân thủ và chịu sự ràng buộc bởi các điều khoản sử dụng này.`,
          'Chúng tôi bảo lưu quyền cập nhật, thay đổi hoặc điều chỉnh một phần hoặc toàn bộ các điều khoản sử dụng dịch vụ này bất kỳ lúc nào để phù hợp với quy định của pháp luật và nhu cầu vận hành thực tế. Bản cập nhật mới nhất sẽ có hiệu lực ngay khi được đăng tải công khai trên website và việc bạn tiếp tục sử dụng website đồng nghĩa với việc chấp nhận các thay đổi đó.',
        ],
      },
      {
        title: '2. Quy định về độ tuổi và năng lực hành vi dân sự',
        paragraphs: [
          'Khách hàng truy cập và thực hiện giao dịch trên website cam kết có đầy đủ năng lực hành vi dân sự theo quy định của pháp luật Việt Nam hiện hành.',
          'Đối với một số sản phẩm hoặc dịch vụ có giới hạn độ tuổi người tiêu dùng hoặc yêu cầu các điều kiện đặc thù theo quy định riêng biệt của pháp luật (ví dụ: các mặt hàng hạn chế quảng cáo hoặc bán lẻ có điều kiện), khách hàng cam kết đáp ứng đủ điều kiện về độ tuổi hợp pháp mới tiến hành thực hiện giao dịch mua bán. Chúng tôi có quyền từ chối cung cấp dịch vụ, khóa tài khoản thành viên hoặc từ chối giao hàng nếu phát hiện có sự vi phạm về cam kết độ tuổi này.',
        ],
      },
      {
        title: '3. Quyền sở hữu trí tuệ và bảo quyền nội dung',
        paragraphs: [
          'Toàn bộ nội dung hiển thị trên website (bao gồm nhưng không giới hạn ở hình ảnh sản phẩm, thiết kế giao diện đồ họa, logo thương hiệu, khẩu hiệu, video giới thiệu, mã nguồn lập trình, bài viết mô tả sản phẩm và các tài liệu hướng dẫn) đều thuộc quyền sở hữu trí tuệ hợp pháp của chúng tôi hoặc các đối tác cấp phép liên quan.',
          'Nghiêm cấm mọi hành vi sao chép, trích dẫn, sửa đổi, phân phối hoặc sử dụng lại bất kỳ nội dung nào trên website cho mục đích thương mại riêng biệt khi chưa có sự đồng ý chính thức bằng văn bản xác nhận từ đại diện hợp pháp của chúng tôi.',
        ],
      },
      {
        title: '4. Chính sách giá cả và thông tin sản phẩm công bố',
        paragraphs: [
          'Chúng tôi nỗ lực cung cấp mô tả kỹ thuật sản phẩm, niên hạn, nguồn gốc xuất xứ và giá bán một cách chính xác nhất. Tuy nhiên, hình ảnh sản phẩm thực tế có thể có sự khác biệt nhỏ về sắc độ màu do góc chụp, điều kiện ánh sáng hoặc đặc tính hiển thị của từng màn hình thiết bị khách hàng sử dụng.',
          'Tất cả các mức giá bán được niêm yết công khai trên website được coi là giá bán cuối cùng (đã bao gồm thuế VAT nếu có) và chưa bao gồm cước phí vận chuyển bưu điện (phí vận chuyển sẽ được hiển thị riêng tại trang thanh toán trước khi xác nhận đơn).',
        ],
      },
      {
        title: '5. Quyền và nghĩa vụ của người sử dụng (Khách hàng)',
        paragraphs: [
          'Khi tham gia hoạt động trên website, khách hàng có các nghĩa vụ sau:',
        ],
        items: [
          'Cung cấp thông tin liên hệ, số điện thoại, địa chỉ nhận hàng chính xác và đầy đủ khi thực hiện giao dịch đặt đơn hàng bưu chính.',
          'Thanh toán đầy đủ và đúng hạn giá trị đơn hàng theo phương thức thanh toán đã lựa chọn.',
          'Sử dụng sản phẩm và dịch vụ mua sắm trực tuyến tuân thủ đúng quy định của pháp luật, hướng dẫn sử dụng của nhà sản xuất.',
          'Không sử dụng các công cụ, phần mềm can thiệp trái phép vào hệ thống dữ liệu hoặc làm ảnh hưởng đến hiệu suất hoạt động bình thường của website.',
        ],
      },
      {
        title: '6. Cơ chế giải quyết tranh chấp và pháp luật áp dụng',
        paragraphs: [
          'Các điều khoản sử dụng này được giải thích và điều chỉnh theo quy định của pháp luật nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.',
          'Mọi tranh chấp phát sinh từ hoặc liên quan đến việc sử dụng dịch vụ và thực hiện các giao dịch mua sắm trên website sẽ được ưu tiên giải quyết thông qua cơ chế thương lượng thiện chí và hòa giải giữa hai bên.',
          'Trường hợp không thể đạt được sự thống nhất chung thông qua hòa giải thương lượng, tranh chấp sẽ được đưa ra tòa án nhân dân có thẩm quyền tại Việt Nam để phán quyết và giải quyết theo đúng trình tự tố tụng pháp luật.',
        ],
      },
      {
        title: '7. Thông tin hỗ trợ pháp lý và giải đáp điều khoản',
        paragraphs: [
          'Nếu quý khách cần làm rõ bất kỳ điều khoản sử dụng nào hoặc có yêu cầu giải đáp pháp lý liên quan, vui lòng liên hệ trực tiếp:',
        ],
        callout: resolvedContact,
      },
    );
  }

  if (slot.key === 'about') {
    sections.push(
      {
        title: '1. Câu chuyện thương hiệu và sứ mệnh của chúng tôi',
        paragraphs: [
          `Chào mừng bạn đến với ${siteName} - nền tảng mua sắm trực tuyến uy tín được thiết kế để mang đến trải nghiệm tiện lợi, an tâm và vượt trội cho khách hàng.`,
          'Chúng tôi tin rằng mỗi sản phẩm không chỉ đơn thuần là một món hàng, mà còn chứa đựng cam kết về chất lượng, nguồn gốc xuất xứ rõ ràng và sự tận tâm của đội ngũ vận hành đằng sau. Với tinh thần chính trực và uy tín đặt lên hàng đầu, chúng tôi tự hào đồng hành cùng gia đình Việt trong việc nâng tầm giá trị cuộc sống hàng ngày.',
        ],
      },
      {
        title: '2. Tầm nhìn chiến lược phát triển',
        paragraphs: [
          'Trở thành hệ thống thương mại điện tử đáng tin cậy hàng đầu tại Việt Nam trong lĩnh vực cung cấp các sản phẩm chất lượng cao, chính hãng và tối ưu hóa quy trình dịch vụ.',
          'Chúng tôi không ngừng đổi mới công nghệ, tối giản chuỗi cung ứng và nâng cao chất lượng nguồn nhân lực để mang lại trải nghiệm mua sắm mượt mà, thông minh và mang giá trị bền vững lâu dài cho toàn bộ cộng đồng người tiêu dùng.',
        ],
      },
      {
        title: '3. Sứ mệnh cốt lõi hoạt động',
        paragraphs: [
          'Chúng tôi xác định và cam kết theo đuổi ba sứ mệnh cốt lõi sau:',
        ],
        items: [
          'Đối với khách hàng: Đảm bảo mang đến các sản phẩm chất lượng tốt nhất, kiểm soát nguồn gốc nghiêm ngặt, giá thành hợp lý và dịch vụ khách hàng chuyên nghiệp, chu đáo nhất.',
          'Đối với đối tác liên kết: Xây dựng mối quan hệ hợp tác dựa trên sự minh bạch, tôn trọng lẫn nhau, cùng phát triển và tạo lập chuỗi cung ứng hàng hóa bền vững, hiệu quả.',
          'Đối với cộng đồng xã hội: Hoạt động kinh doanh tuân thủ nghiêm túc pháp luật hiện hành, có trách nhiệm bảo vệ môi trường, tiết kiệm tài nguyên và tích cực đóng góp vào các chương trình phúc lợi xã hội.',
        ],
      },
      {
        title: '4. Giá trị cốt lõi làm nên thương hiệu',
        paragraphs: [
          'Tại đây, chúng tôi hành động mỗi ngày dựa trên các giá trị nền tảng:',
        ],
        items: [
          'Chất lượng là danh dự: Nói không với hàng giả, hàng nhái, hàng kém chất lượng hoặc không rõ nguồn gốc xuất xứ. Từng sản phẩm đều được kiểm định chất lượng ngoại quan và điều kiện lưu kho trước khi giao nhận.',
          'Khách hàng làm trung tâm: Lắng nghe từng ý kiến đóng góp từ khách hàng, không ngừng cải tiến giao diện web và quy trình CSKH để mang lại trải nghiệm mua sắm hài lòng nhất.',
          'Chính trực & Minh bạch: Công bố giá bán rõ ràng, thông tin sản phẩm chuẩn xác, cam kết bảo hành và đổi trả minh bạch, đảm bảo không phát sinh các loại chi phí ẩn gây thiệt hại cho khách hàng.',
        ],
      },
      {
        title: '5. Cam kết lưu trữ và bảo quản sản phẩm tiêu chuẩn',
        paragraphs: [
          'Nhằm đảm bảo sản phẩm luôn duy trì trạng thái hoàn hảo nhất khi đến tay bạn, toàn bộ hàng hóa trong kho của chúng tôi đều được quản lý và bảo quản theo tiêu chuẩn kỹ thuật nghiêm ngặt đối với từng nhóm ngành hàng.',
          'Quy trình đóng gói vận chuyển chuyên nghiệp, sử dụng thùng bảo vệ và màng bọc chống va đập chuyên dụng giúp giảm thiểu tối đa rủi ro hư hỏng vật lý hoặc tác động xấu của thời tiết trong suốt quá trình giao nhận bưu chính.',
        ],
      },
      {
        title: '6. Thông tin liên hệ và kết nối mạng xã hội',
        paragraphs: [
          'Hãy kết nối trực tiếp với chúng tôi để cập nhật những sản phẩm mới nhất, nhận thông tin ưu đãi độc quyền hoặc gửi yêu cầu tư vấn nhanh từ đội ngũ Sommelier và CSKH chuyên nghiệp:',
        ],
        callout: resolvedContact,
      },
    );
  }

  if (slot.key === 'faq') {
    sections.push(
      {
        title: 'Bộ Câu hỏi thường gặp khi mua sắm trực tuyến',
        qa: [
          { 
            q: 'Làm sao để tôi đặt mua hàng trực tiếp trên website?', 
            a: 'Quý khách chỉ cần chọn sản phẩm yêu thích, bấm "Thêm vào giỏ hàng" hoặc "Mua ngay", sau đó điền thông tin người nhận, địa chỉ giao hàng và chọn phương thức thanh toán phù hợp tại trang checkout để hoàn tất. Bạn cũng có thể liên hệ trực tiếp qua Zalo/Messenger hiển thị trên trang để được nhân viên hỗ trợ lên đơn nhanh chóng.' 
          },
          { 
            q: 'Sản phẩm mua về cần được bảo quản như thế nào để đảm bảo chất lượng tốt nhất?', 
            a: 'Mỗi sản phẩm sẽ có hướng dẫn bảo quản chi tiết của nhà sản xuất được in trên bao bì. Nhìn chung, để giữ sản phẩm luôn bền đẹp và duy trì chất lượng tối ưu, quý khách nên bảo quản ở nơi khô ráo, thoáng mát, tránh tiếp xúc trực tiếp với nguồn nhiệt cao hoặc ánh nắng mặt trời chiếu trực tiếp.' 
          },
          { 
            q: 'Tôi cần xử lý thế nào nếu nhận được sản phẩm bị vỡ, hỏng hoặc sai mẫu mã?', 
            a: 'Quý khách hãy yêu cầu nhân viên giao nhận lập biên bản đồng kiểm hàng ghi nhận lỗi ngoại quan và từ chối nhận hàng. Sau đó chụp ảnh/quay video hiện trạng gửi cho bộ phận CSKH của chúng tôi để được xác nhận và xử lý gửi lại sản phẩm mới hoàn toàn miễn phí hoặc hoàn tiền nhanh chóng trong vòng 3 ngày làm việc.' 
          },
          { 
            q: 'Website của shop có hỗ trợ xuất hóa đơn tài chính (VAT) cho doanh nghiệp không?', 
            a: 'Có, chúng tôi hỗ trợ xuất hóa đơn điện tử VAT đầy đủ theo quy định của pháp luật Việt Nam. Quý khách vui lòng cung cấp thông tin xuất hóa đơn gồm: Tên công ty, Địa chỉ và Mã số thuế hợp pháp vào phần "Ghi chú đơn hàng" khi đặt hàng hoặc liên hệ CSKH của chúng tôi trong vòng 24 giờ kể từ khi đặt đơn để được kế toán hỗ trợ xử lý.' 
          },
          { 
            q: 'Làm sao để tôi kiểm tra được hành trình giao nhận đơn hàng của mình?', 
            a: 'Sau khi đơn hàng được gửi đi qua đối tác bưu chính, hệ thống sẽ gửi một mã vận đơn cùng đường link tra cứu hành trình về số điện thoại hoặc email của bạn. Quý khách cũng có thể đăng nhập tài khoản trên website để kiểm tra tiến trình di chuyển của đơn hàng theo thời gian thực.' 
          },
        ],
      },
    );
  }

  const htmlBody = `
    <h1 style="text-align:center;">${policyLabel}</h1>
    <p style="text-align:center;">Áp dụng tại ${emphasize(siteName, keywords)} · Cập nhật định kỳ để đảm bảo minh bạch</p>
    <p>${emphasize(excerpt, keywords)}</p>
    <hr />
    ${sections
      .map((section) => {
        const paragraphs = section.paragraphs?.map((p) => `<p>${emphasize(p, keywords)}</p>`).join('') ?? '';
        const listTag = section.listType ?? 'ul';
        const items = section.items?.length
          ? `<${listTag}>${section.items.map((item) => `<li>${emphasize(item, keywords)}</li>`).join('')}</${listTag}>`
          : '';
        const callout = section.callout
          ? `<blockquote><strong>Thông tin liên hệ chính thức:</strong><br/>${emphasize(section.callout, keywords)}</blockquote>`
          : '';
        const qa = section.qa?.length
          ? section.qa
            .map((item) => `<h3>${emphasize(item.q, keywords)}</h3><p>${emphasize(item.a, keywords)}</p>`)
            .join('')
          : '';
        const title = section.title
          .replaceAll(siteName, `<strong>${siteName}</strong>`)
          .replaceAll(policyLabel, `<strong>${policyLabel}</strong>`);
        return `<h2>${title}</h2>${paragraphs}${items}${qa}${callout}`;
      })
      .join('')}
    ${siteUrl ? `<p style="text-align:right;">Website chính thức: <a href="${siteUrl}">${siteUrl}</a></p>` : ''}
    ${categoryName ? `<p style="text-align:right;">Danh mục lưu trữ: <strong>${categoryName}</strong></p>` : ''}
  `.trim();

  return {
    title: policyLabel,
    slug: `policy-${slugify(policyLabel)}`,
    excerpt,
    metaTitle: `${policyLabel} | ${siteName}`,
    metaDescription: excerpt,
    content: htmlBody,
  };
};

const buildAutoGeneratePlan = async (ctx: QueryCtx | MutationCtx) => {
  const settingsMap = await buildSettingsMap(ctx);
  const policyCategory = await getPolicyCategory(ctx, false);
  const posts = policyCategory
    ? await PostsModel.listByCategory(ctx, { categoryId: policyCategory.id, limit: 200 })
    : await PostsModel.listWithLimit(ctx, { limit: 200 });

  const slots = TRUST_PAGE_SLOTS.map((slot) => {
    const enabled = resolveBoolean(settingsMap.get(slot.iaKey), true);
    const mappedPostId = resolvePostId(settingsMap.get(slot.mappingKey));
    if (!enabled) {
      return { action: 'disabled' as TrustPageAction, enabled, slot };
    }
    if (mappedPostId) {
      const post = posts.find((item) => item._id === mappedPostId);
      if (post) {
        return {
          action: 'mapped' as TrustPageAction,
          enabled,
          slot,
          postId: mappedPostId,
          postTitle: post.title,
          postStatus: post.status,
        };
      }
      const payload = buildDraftPayload(slot, settingsMap, policyCategory?.name);
      return {
        action: 'draft' as TrustPageAction,
        enabled,
        slot,
        payload,
      };
    }

    const matched = findMatchingPost(posts, slot);
    if (matched) {
      return {
        action: 'suggested' as TrustPageAction,
        enabled,
        slot,
        postId: matched._id,
        postTitle: matched.title,
        postStatus: matched.status,
      };
    }

    const payload = buildDraftPayload(slot, settingsMap, policyCategory?.name);
    return {
      action: 'draft' as TrustPageAction,
      enabled,
      slot,
      payload,
    };
  });

  return {
    policyCategory,
    settingsMap,
    slots,
  };
};

const ensureFeatureEnabled = async (ctx: QueryCtx | MutationCtx) => {
  const feature = await ctx.db
    .query('moduleFeatures')
    .withIndex('by_module_feature', (q) => q.eq('moduleKey', 'settings').eq('featureKey', 'enableTrustPagesAutoGenerate'))
    .unique();
  if (!feature?.enabled) {
    throw new Error('Tính năng tự sinh Trust Pages đang tắt');
  }
};

export const previewAutoGenerate = query({
  args: {},
  handler: async (ctx) => {
    await ensureFeatureEnabled(ctx);
    const plan = await buildAutoGeneratePlan(ctx);
    return {
      policyCategory: plan.policyCategory ?? undefined,
      slots: plan.slots.map((slot) => ({
        key: slot.slot.key,
        label: slot.slot.label,
        slug: slot.slot.slug,
        action: slot.action,
        enabled: slot.enabled,
        postId: slot.postId ?? null,
        postTitle: slot.postTitle ?? null,
        postStatus: slot.postStatus ?? null,
      })),
    };
  },
  returns: v.object({
    policyCategory: v.optional(v.object({ id: v.id('postCategories'), name: v.string(), slug: v.string() })),
    slots: v.array(
      v.object({
        key: v.string(),
        label: v.string(),
        slug: v.string(),
        action: v.union(
          v.literal('disabled'),
          v.literal('mapped'),
          v.literal('suggested'),
          v.literal('draft'),
        ),
        enabled: v.boolean(),
        postId: v.union(v.id('posts'), v.null()),
        postTitle: v.union(v.string(), v.null()),
        postStatus: v.union(v.string(), v.null()),
      })
    ),
  }),
});

export const applyAutoGenerate = mutation({
  args: {
    overwrite: v.optional(v.boolean()),
    status: v.optional(v.union(v.literal('Draft'), v.literal('Published'))),
  },
  handler: async (ctx, args) => {
    await ensureFeatureEnabled(ctx);
    const plan = await buildAutoGeneratePlan(ctx);
    const overwrite = args.overwrite === true;
    const desiredStatus = args.status === 'Published' ? 'Published' : 'Draft';
    const policyCategory = plan.policyCategory ?? (await getPolicyCategory(ctx, true));
    if (!policyCategory) {
      throw new Error('Không thể tạo danh mục chính sách');
    }

    const settings = await ctx.db.query('settings').take(500);
    const settingsMap = new Map(settings.map((setting: { key: string }) => [setting.key, setting]));
    const updates: { key: string; value: unknown }[] = [];
    const results: {
      key: string;
      action: TrustPageAction;
      postId?: Id<'posts'> | null;
      postTitle?: string | null;
      postStatus?: string | null;
    }[] = [];
    let deletedCount = 0;
    let createdCount = 0;
    let keptCount = 0;
    let disabledCount = 0;

    if (overwrite) {
      const existingPosts = await PostsModel.listByCategory(ctx, { categoryId: policyCategory.id, limit: 1000 });
      for (const post of existingPosts) {
        await PostsModel.remove(ctx, { cascade: true, id: post._id });
        deletedCount += 1;
      }
    }

    for (const slot of plan.slots) {
      if (!slot.enabled) {
        results.push({ key: slot.slot.key, action: 'disabled' });
        disabledCount += 1;
        if (overwrite) {
          updates.push({ key: slot.slot.mappingKey, value: null });
        }
        continue;
      }

      if (overwrite) {
        const payload = buildDraftPayload(slot.slot, plan.settingsMap, policyCategory.name);
        const postId = await PostsModel.create(ctx, {
          title: payload.title,
          slug: payload.slug,
          content: payload.content,
          renderType: 'content',
          excerpt: payload.excerpt,
          metaTitle: payload.metaTitle,
          metaDescription: payload.metaDescription,
          categoryId: policyCategory.id,
          status: desiredStatus,
          publishImmediately: desiredStatus === 'Published',
        });
        updates.push({ key: slot.slot.mappingKey, value: postId });
        results.push({
          key: slot.slot.key,
          action: 'draft',
          postId,
          postTitle: payload.title,
          postStatus: desiredStatus,
        });
        createdCount += 1;
        continue;
      }

      if (slot.action === 'mapped') {
        updates.push({ key: slot.slot.mappingKey, value: slot.postId ?? null });
        results.push({
          key: slot.slot.key,
          action: slot.action,
          postId: slot.postId ?? null,
          postTitle: slot.postTitle ?? null,
          postStatus: slot.postStatus ?? null,
        });
        keptCount += 1;
        continue;
      }

      if ((slot.action === 'draft' || slot.action === 'suggested') && slot.payload) {
        const postId = await PostsModel.create(ctx, {
          title: slot.payload.title,
          slug: slot.payload.slug,
          content: slot.payload.content,
          renderType: 'content',
          excerpt: slot.payload.excerpt,
          metaTitle: slot.payload.metaTitle,
          metaDescription: slot.payload.metaDescription,
          categoryId: policyCategory.id,
          status: desiredStatus,
          publishImmediately: desiredStatus === 'Published',
        });
        updates.push({ key: slot.slot.mappingKey, value: postId });
        results.push({
          key: slot.slot.key,
          action: 'draft',
          postId,
          postTitle: slot.payload.title,
          postStatus: desiredStatus,
        });
        createdCount += 1;
      }
    }

    updates.push({ key: 'trust_page_last_autogen_at', value: Date.now() });

    for (const update of updates) {
      const existing = settingsMap.get(update.key) as { _id: Id<'settings'> } | undefined;
      if (existing) {
        await ctx.db.patch(existing._id, { group: IA_GROUP, value: update.value });
      } else {
        await ctx.db.insert('settings', { group: IA_GROUP, key: update.key, value: update.value });
      }
    }

    return {
      mode: overwrite ? ('overwrite' as const) : ('apply' as const),
      policyCategory,
      results,
      summary: {
        createdCount,
        deletedCount,
        disabledCount,
        keptCount,
      },
      updatedSettings: updates.reduce<Record<string, unknown>>((acc, update) => {
        acc[update.key] = update.value;
        return acc;
      }, {}),
    };
  },
  returns: v.object({
    mode: v.union(v.literal('apply'), v.literal('overwrite')),
    policyCategory: v.object({ id: v.id('postCategories'), name: v.string(), slug: v.string() }),
    results: v.array(
      v.object({
        key: v.string(),
        action: v.union(
          v.literal('disabled'),
          v.literal('mapped'),
          v.literal('suggested'),
          v.literal('draft'),
        ),
        postId: v.optional(v.union(v.id('posts'), v.null())),
        postTitle: v.optional(v.union(v.string(), v.null())),
        postStatus: v.optional(v.union(v.string(), v.null())),
      })
    ),
    summary: v.object({
      createdCount: v.number(),
      deletedCount: v.number(),
      disabledCount: v.number(),
      keptCount: v.number(),
    }),
    updatedSettings: v.record(v.string(), v.any()),
  }),
});
