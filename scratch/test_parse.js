const rawJson = `{
  "product": {
    "name": "Yamazaki 12 Year Old Single Malt Japanese Whisky 700ml",
    "slug": "yamazaki-12-year-old-single-malt-japanese-whisky-700ml",
    "price": 3450000,
    "salePrice": 3890000,
    "description": "Yamazaki 12 Year Old Single Malt Nhật Bản 700ml mang hương vị tinh tế, cân bằng, phù hợp cho người yêu whisky cao cấp và sưu tầm.",
    "content": "<h2>Tổng quan</h2>\\n<p>Yamazaki 12 Year Old Single Malt Japanese Whisky 700ml là dòng whisky Nhật Bản nổi tiếng, được ủ trong thùng gỗ sồi với thời gian 12 năm. Đây là lựa chọn lý tưởng cho người yêu thích whisky mượt mà, tinh tế và muốn trải nghiệm phong cách Nhật Bản.</p>\\n\\n<h3>Điểm nổi bật</h3>\\n<ul>\\n<li>Whisky single malt 12 năm tuổi, cân bằng giữa hương gỗ sồi và trái cây chín.</li>\\n<li>Phong cách Nhật Bản tinh tế, thích hợp để thưởng thức hoặc làm quà tặng sang trọng.</li>\\n<li>Dung tích 700ml, phù hợp cho sưu tầm hoặc chia sẻ trong những dịp đặc biệt.</li>\\n</ul>\\n\\n<h3>Thông số & Ứng dụng</h3>\\n<ul>\\n<li>Dung tích: 700ml</li>\\n<li>Loại: Single Malt Whisky</li>\\n<li>Xuất xứ: Nhật Bản</li>\\n<li>Thời gian ủ: 12 năm</li>\\n<li>Cách dùng: Thưởng thức nguyên chất, thêm đá hoặc kết hợp cocktail cao cấp.</li>\\n</ul>\\n\\n<h3>Phù hợp với ai</h3>\\n<ul>\\n<li>Người yêu thích whisky cao cấp, muốn trải nghiệm phong cách Nhật Bản.</li>\\n<li>Người tìm kiếm món quà sang trọng cho đối tác, bạn bè hoặc người thân.</li>\\n<li>Nhà sưu tầm whisky muốn bổ sung dòng Yamazaki nổi tiếng vào bộ sưu tập.</li>\\n</ul>\\n\\n<h3>Lưu ý khi chọn mua</h3>\\n<ul>\\n<li>Kiểm tra tem nhãn và nguồn gốc để đảm bảo sản phẩm chính hãng.</li>\\n<li>Bảo quản nơi khô ráo, tránh ánh sáng trực tiếp để giữ hương vị ổn định.</li>\\n<li>Thích hợp dùng trong các dịp đặc biệt, không khuyến khích sử dụng thường xuyên như đồ uống phổ thông.</li>\\n</ul>\\n\\n<p>Khám phá Yamazaki 12 Year Old Single Malt để cảm nhận sự tinh tế của whisky Nhật Bản. Đặt hàng ngay hôm nay để sở hữu chai whisky đẳng cấp này.</p>",
    "metaTitle": "Yamazaki 12 Year Old Single Malt Nhật Bản 700ml",
    "metaDescription": "Yamazaki 12 Year Old Single Malt Nhật Bản 700ml – whisky 12 năm tinh tế, cân bằng, phù hợp cho thưởng thức và quà tặng sang trọng.",
    "image": "/images/products/yamazaki-12yo-700ml.jpg",
    "stock": 15,
    "combos": [
      {
        "type": "standard",
        "name": "Mua 2 chai giảm 5%",
        "standardConfig": {
          "minQty": 2,
          "rewardType": "discount_percent",
          "rewardValue": 5
        }
      },
      {
        "type": "standard",
        "name": "Mua 6 chai tặng 1 chai",
        "standardConfig": {
          "minQty": 6,
          "rewardType": "gift_self",
          "giftQty": 1
        }
      }
    ],
    "attributeTermIds": [
      "v578awavg3dqvq32z5jqtr8s5x87dp7b"
    ],
    "newAttributes": {
      "Xuất xứ": ["Nhật Bản"],
      "Thương Hiệu": ["Yamazaki"]
    },
    "attributeRangeValues": {
      "Dung tích": "700ml",
      "Tuổi rượu": "12 năm"
    }
  }
}`;

// Copy logic của cleanJsonInput và parseAiEntity
const cleanJsonInput = (raw) => {
  let s = raw.trim();
  if (s.startsWith('```')) {
    s = s.replace(/^```[a-zA-Z0-9]*\n/, '');
    s = s.replace(/\n```$/, '');
  }
  return s.trim();
};

const parseAiEntity = (raw) => {
  let parsed;
  try {
    parsed = JSON.parse(cleanJsonInput(raw));
  } catch (e) {
    console.error("Parse error:", e);
    return null;
  }

  const source = parsed.product;
  const record = source;
  
  let attributeRangeValues = undefined;
  if (record.attributeRangeValues && typeof record.attributeRangeValues === 'object' && !Array.isArray(record.attributeRangeValues)) {
    attributeRangeValues = {};
    const rawRanges = record.attributeRangeValues;
    Object.entries(rawRanges).forEach(([k, v]) => {
      if (typeof v === 'string' || typeof v === 'number') {
        attributeRangeValues[k] = String(v).trim();
      }
    });
  }

  let newAttributes = undefined;
  if (record.newAttributes && typeof record.newAttributes === 'object' && !Array.isArray(record.newAttributes)) {
    newAttributes = {};
    const rawNewAttrs = record.newAttributes;
    Object.entries(rawNewAttrs).forEach(([k, v]) => {
      if (Array.isArray(v)) {
        const list = v.filter(val => typeof val === 'string').map(val => String(val).trim()).filter(Boolean);
        if (list.length > 0) {
          newAttributes[k] = list;
        }
      }
    });
  }

  return { attributeRangeValues, newAttributes };
};

console.log("Result:", parseAiEntity(rawJson));
