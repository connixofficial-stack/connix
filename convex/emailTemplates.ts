import { Doc } from "./_generated/dataModel";

const formatPrice = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

export function getOtpTemplate(otpCode: string, brandName: string = "YourBrand"): string {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #4f46e5; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">${brandName.toUpperCase()}</h1>
        <p style="color: #64748b; margin: 4px 0 0 0; font-size: 14px;">Hệ thống cửa hàng ${brandName}</p>
      </div>
      <div style="border-top: 1px solid #f1f5f9; padding-top: 24px;">
        <h2 style="color: #1e293b; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 12px; text-align: center;">Xác Minh Tài Khoản</h2>
        <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
          Xin chào quý khách, quý khách đã yêu cầu tạo mật khẩu cho tài khoản liên kết với email này trên cửa hàng của chúng tôi.
        </p>
        <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
          Mã xác minh (OTP) của quý khách là:
        </p>
        <div style="background-color: #f8fafc; padding: 18px; text-align: center; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #4f46e5; border: 2px dashed #e2e8f0; border-radius: 12px; margin: 24px 0;">
          ${otpCode}
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.6; margin-top: 20px;">
          Mã này có hiệu lực trong vòng 10 phút. Nếu quý khách không yêu cầu thiết lập lại mật khẩu, vui lòng bỏ qua email này một cách an toàn.
        </p>
      </div>
      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
      <div style="text-align: center;">
        <p style="font-size: 12px; color: #94a3b8; margin: 0;">Đây là email tự động, vui lòng không phản hồi trực tiếp email này.</p>
        <p style="font-size: 12px; color: #94a3b8; margin: 6px 0 0 0;">&copy; ${new Date().getFullYear()} ${brandName}. All rights reserved.</p>
      </div>
    </div>
  `;
}

const formatImageUrl = (src: string | undefined | null, siteUrl: string) => {
  if (!src) return "";
  const trimmed = src.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const cleanSrc = trimmed.startsWith("/") ? trimmed.substring(1) : trimmed;
  const base = siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`;
  return `${base}${cleanSrc}`;
};

const formatSiteUrl = (siteUrl: string) => {
  const trimmed = siteUrl.trim();
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
};

export function getOrderPlacedCustomerTemplate(order: Doc<"orders">, siteUrl: string, brandName: string = "YourBrand"): string {
  const itemsHtml = order.items
    .map(
      (item) => `
    <tr style="border-bottom: 1px solid #f1f5f9;">
      <td style="padding: 12px 0; vertical-align: top; width: 60px;">
        ${
          item.productImage
            ? `<img src="${formatImageUrl(item.productImage, siteUrl)}" alt="${item.productName}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0; display: block;" />`
            : `<div style="width: 50px; height: 50px; background-color: #f1f5f9; border-radius: 8px; border: 1px solid #e2e8f0; display: block;"></div>`
        }
      </td>
      <td style="padding: 12px 12px 12px 0; vertical-align: top;">
        <div style="font-weight: 600; color: #1e293b; font-size: 14px;">${item.productName}</div>
        ${item.variantTitle ? `<div style="font-size: 12px; color: #64748b; margin-top: 2px;">${item.variantTitle}</div>` : ""}
        <div style="font-size: 12px; color: #94a3b8; margin-top: 2px;">Số lượng: ${item.quantity}</div>
      </td>
      <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #1e293b; font-size: 14px; vertical-align: top;">
        ${formatPrice(item.price * item.quantity)}
      </td>
    </tr>
  `
    )
    .join("");

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #4f46e5; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">${brandName.toUpperCase()}</h1>
        <p style="color: #64748b; margin: 4px 0 0 0; font-size: 14px;">Cảm ơn quý khách đã đặt hàng!</p>
      </div>
      
      <div style="border-top: 1px solid #f1f5f9; padding-top: 24px; margin-bottom: 24px;">
        <h2 style="color: #1e293b; font-size: 18px; font-weight: 700; margin-top: 0; margin-bottom: 16px;">Đơn hàng #${order.orderNumber}</h2>
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">
          Xin chào, đơn hàng của quý khách đã được tiếp nhận và đang chờ xác nhận từ hệ thống. Dưới đây là thông tin chi tiết đơn hàng:
        </p>
      </div>

      <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <h3 style="color: #475569; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0; margin-bottom: 12px;">Thông tin giao hàng</h3>
        <p style="color: #334155; font-size: 14px; margin: 4px 0; line-height: 1.5;"><strong>Địa chỉ:</strong> ${order.shippingAddress ?? "N/A"}</p>
        <p style="color: #334155; font-size: 14px; margin: 4px 0; line-height: 1.5;"><strong>Phương thức thanh toán:</strong> ${order.paymentMethod ?? "COD"}</p>
      </div>

      <div style="margin-bottom: 24px;">
        <h3 style="color: #475569; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Chi tiết sản phẩm</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-bottom: 24px;">
        <table style="width: 100%; font-size: 14px; color: #475569; line-height: 2.0;">
          <tr>
            <td>Tạm tính:</td>
            <td style="text-align: right; font-weight: 600; color: #1e293b;">${formatPrice(order.subtotal)}</td>
          </tr>
          ${order.discountAmount ? `
          <tr>
            <td>Giảm giá:</td>
            <td style="text-align: right; font-weight: 600; color: #dc2626;">-${formatPrice(order.discountAmount)}</td>
          </tr>
          ` : ""}
          <tr>
            <td>Phí vận chuyển:</td>
            <td style="text-align: right; font-weight: 600; color: #1e293b;">${formatPrice(order.shippingFee)}</td>
          </tr>
          <tr style="font-size: 18px; font-weight: 800; color: #1e293b; border-top: 1px dashed #e2e8f0;">
            <td style="padding-top: 12px;">Tổng cộng:</td>
            <td style="text-align: right; padding-top: 12px; color: #4f46e5;">${formatPrice(order.totalAmount)}</td>
          </tr>
        </table>
      </div>

      <div style="background-color: #eef2ff; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 24px;">
        <h4 style="color: #4f46e5; margin: 0 0 6px 0; font-size: 15px; font-weight: 700;">Theo dõi & Quản lý đơn hàng</h4>
        <p style="color: #4338ca; margin: 0 0 12px 0; font-size: 13px; line-height: 1.4;">Quý khách có thể kích hoạt tài khoản bằng Email/Số điện thoại để theo dõi lịch trình giao hàng trực tuyến và dễ dàng thực hiện hủy đơn.</p>
        <a href="${formatSiteUrl(siteUrl)}/tra-cuu-don-hang?orderNumber=${order.orderNumber}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 10px 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);">Xem đơn hàng của bạn</a>
      </div>

      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
      <div style="text-align: center;">
        <p style="font-size: 12px; color: #94a3b8; margin: 0;">Quý khách có bất kỳ câu hỏi nào? Vui lòng phản hồi trực tiếp email này hoặc liên hệ hotline của chúng tôi.</p>
        <p style="font-size: 12px; color: #94a3b8; margin: 6px 0 0 0;">&copy; ${new Date().getFullYear()} ${brandName}. All rights reserved.</p>
      </div>
    </div>
  `;
}

export function getOrderPlacedShopTemplate(order: Doc<"orders">, customer: Doc<"customers">, siteUrl: string, _brandName: string = "YourBrand"): string {
  const itemsHtml = order.items
    .map(
      (item) => `
    <tr style="border-bottom: 1px solid #f1f5f9;">
      <td style="padding: 12px 0; vertical-align: top; width: 60px;">
        ${
          item.productImage
            ? `<img src="${formatImageUrl(item.productImage, siteUrl)}" alt="${item.productName}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0; display: block;" />`
            : `<div style="width: 50px; height: 50px; background-color: #f1f5f9; border-radius: 8px; border: 1px solid #e2e8f0; display: block;"></div>`
        }
      </td>
      <td style="padding: 12px 12px 12px 0; vertical-align: top;">
        <div style="font-weight: 600; color: #1e293b; font-size: 14px;">${item.productName}</div>
        ${item.variantTitle ? `<div style="font-size: 12px; color: #64748b; margin-top: 2px;">${item.variantTitle}</div>` : ""}
        <div style="font-size: 12px; color: #94a3b8; margin-top: 2px;">Số lượng: ${item.quantity}</div>
      </td>
      <td style="padding: 12px 0; text-align: right; font-weight: 600; color: #1e293b; font-size: 14px; vertical-align: top;">
        ${formatPrice(item.price * item.quantity)}
      </td>
    </tr>
  `
    )
    .join("");

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <div style="text-align: center; margin-bottom: 24px; border-bottom: 2px solid #ef4444; padding-bottom: 16px;">
        <h1 style="color: #ef4444; margin: 0; font-size: 24px; font-weight: 800;">ĐƠN HÀNG MỚI ĐÃ ĐẶT!</h1>
        <p style="color: #64748b; margin: 4px 0 0 0; font-size: 14px;">Mã đơn: #${order.orderNumber}</p>
      </div>

      <div style="background-color: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <h3 style="color: #475569; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0; margin-bottom: 12px;">Khách hàng</h3>
        <p style="color: #334155; font-size: 14px; margin: 4px 0; line-height: 1.5;"><strong>Họ tên:</strong> ${customer.name}</p>
        <p style="color: #334155; font-size: 14px; margin: 4px 0; line-height: 1.5;"><strong>Số điện thoại:</strong> ${customer.phone}</p>
        <p style="color: #334155; font-size: 14px; margin: 4px 0; line-height: 1.5;"><strong>Email:</strong> ${customer.email}</p>
        <p style="color: #334155; font-size: 14px; margin: 4px 0; line-height: 1.5;"><strong>Địa chỉ nhận:</strong> ${order.shippingAddress ?? "N/A"}</p>
        <p style="color: #334155; font-size: 14px; margin: 4px 0; line-height: 1.5;"><strong>Ghi chú:</strong> ${order.note ?? "Không có"}</p>
      </div>

      <div style="margin-bottom: 24px;">
        <h3 style="color: #475569; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Danh sách sản phẩm</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-bottom: 24px;">
        <table style="width: 100%; font-size: 14px; color: #475569; line-height: 2.0;">
          <tr>
            <td>Tạm tính:</td>
            <td style="text-align: right; font-weight: 600; color: #1e293b;">${formatPrice(order.subtotal)}</td>
          </tr>
          ${order.discountAmount ? `
          <tr>
            <td>Giảm giá:</td>
            <td style="text-align: right; font-weight: 600; color: #dc2626;">-${formatPrice(order.discountAmount)}</td>
          </tr>
          ` : ""}
          <tr>
            <td>Phí vận chuyển:</td>
            <td style="text-align: right; font-weight: 600; color: #1e293b;">${formatPrice(order.shippingFee)}</td>
          </tr>
          <tr style="font-size: 18px; font-weight: 800; color: #1e293b; border-top: 1px dashed #e2e8f0;">
            <td style="padding-top: 12px;">Tổng doanh thu:</td>
            <td style="text-align: right; padding-top: 12px; color: #ef4444;">${formatPrice(order.totalAmount)}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${formatSiteUrl(siteUrl)}/admin/orders/${order._id}/edit" style="display: inline-block; background-color: #ef4444; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 12px 24px; border-radius: 8px; box-shadow: 0 2px 4px rgba(239, 68, 68, 0.2);">Xem và Xử lý trên Admin Panel</a>
      </div>
    </div>
  `;
}

export function getOrderDeliveredTemplate(order: Doc<"orders">, siteUrl: string, brandName: string = "YourBrand"): string {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #4f46e5; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">${brandName.toUpperCase()}</h1>
        <p style="color: #10b981; margin: 4px 0 0 0; font-size: 15px; font-weight: 700;">✓ Đơn hàng đã giao thành công!</p>
      </div>

      <div style="border-top: 1px solid #f1f5f9; padding-top: 24px; margin-bottom: 24px;">
        <h2 style="color: #1e293b; font-size: 18px; font-weight: 700; margin-top: 0; margin-bottom: 12px;">Mã đơn hàng: #${order.orderNumber}</h2>
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">
          Xin chào quý khách, đơn hàng của quý khách đã được giao thành công tới địa chỉ đăng ký. Hy vọng quý khách sẽ hài lòng với sản phẩm từ ${brandName}!
        </p>
      </div>

      <div style="background-color: #f0fdf4; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 24px; border: 1px solid #bbf7d0;">
        <h3 style="color: #166534; margin: 0 0 6px 0; font-size: 15px; font-weight: 700;">Góp ý & Đánh giá</h3>
        <p style="color: #15803d; margin: 0 0 12px 0; font-size: 13px; line-height: 1.4;">Ý kiến đóng góp của quý khách là động lực to lớn giúp chúng tôi hoàn thiện sản phẩm và dịch vụ tốt hơn.</p>
        <a href="${formatSiteUrl(siteUrl)}/account/orders" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 10px 20px; border-radius: 8px;">Đánh giá sản phẩm</a>
      </div>

      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
      <div style="text-align: center;">
        <p style="font-size: 12px; color: #94a3b8; margin: 0;">&copy; ${new Date().getFullYear()} ${brandName}. All rights reserved.</p>
      </div>
    </div>
  `;
}

export function getOrderCancelledTemplate(order: Doc<"orders">, siteUrl: string, brandName: string = "YourBrand", reason?: string): string {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #4f46e5; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em;">${brandName.toUpperCase()}</h1>
        <p style="color: #ef4444; margin: 4px 0 0 0; font-size: 15px; font-weight: 700;">✕ Đơn hàng đã bị hủy</p>
      </div>

      <div style="border-top: 1px solid #f1f5f9; padding-top: 24px; margin-bottom: 24px;">
        <h2 style="color: #1e293b; font-size: 18px; font-weight: 700; margin-top: 0; margin-bottom: 12px;">Mã đơn hàng: #${order.orderNumber}</h2>
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">
          Xin chào quý khách, đơn hàng của quý khách đã được ghi nhận hủy thành công trên hệ thống. 
        </p>
        ${reason ? `<p style="color: #334155; font-size: 14px; margin-top: 8px;"><strong>Lý do hủy:</strong> ${reason}</p>` : ""}
        <p style="color: #64748b; font-size: 14px; margin-top: 12px; line-height: 1.5;">
          Nếu đây là một sự nhầm lẫn hoặc quý khách muốn tiếp tục đặt mua sản phẩm khác, vui lòng ghé thăm website của chúng tôi để tạo đơn hàng mới.
        </p>
      </div>

      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${formatSiteUrl(siteUrl)}/products" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 11px 24px; border-radius: 8px;">Tiếp tục mua sắm</a>
      </div>

      <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 30px 0;" />
      <div style="text-align: center;">
        <p style="font-size: 12px; color: #94a3b8; margin: 0;">&copy; ${new Date().getFullYear()} ${brandName}. All rights reserved.</p>
      </div>
    </div>
  `;
}
