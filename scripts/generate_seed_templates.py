from __future__ import annotations

from pathlib import Path
import json


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


root = Path(r"E:/NextJS/study/admin-ui-aistudio/system-vietadmin-nextjs")
base_dir = root / "lib" / "seed-templates"
industries_dir = base_dir / "industries"
public_dir = root / "public" / "seed_mau"

primary_colors = [
    "#2563eb",
    "#dc2626",
    "#16a34a",
    "#f97316",
    "#7c3aed",
    "#0d9488",
    "#4f46e5",
    "#db2777",
    "#d97706",
]

category_defaults = {
    "fashion-beauty": {
        "items": ["Áo", "Đầm", "Quần", "Áo khoác", "Túi xách", "Phụ kiện"],
        "categories": ["Bộ sưu tập mới", "Bestseller", "Phụ kiện", "Đồ công sở", "Đồ dạo phố"],
        "brands": ["Lumiere", "NOVA", "Vera", "Satori", "Kira"],
        "tags": ["thời trang", "phong cách", "bộ sưu tập"],
    },
    "technology": {
        "items": ["Laptop", "Điện thoại", "Tai nghe", "Máy tính bảng", "Camera", "Phụ kiện"],
        "categories": ["Thiết bị mới", "Gaming", "Phụ kiện", "Văn phòng", "Gia đình"],
        "brands": ["Apex", "ZenTech", "Nova", "Lumix", "Omni"],
        "tags": ["công nghệ", "smart", "thiết bị"],
    },
    "food-beverage": {
        "items": ["Combo", "Món ăn", "Đồ uống", "Bánh ngọt", "Hải sản", "Đặc sản"],
        "categories": ["Món mới", "Bestseller", "Combo gia đình", "Đồ uống", "Món chay"],
        "brands": ["Freshy", "Foodie", "Daily", "GreenBite", "Ocean"],
        "tags": ["ẩm thực", "tươi ngon", "giao nhanh"],
    },
    "health-wellness": {
        "items": [
            "Gói chăm sóc",
            "Liệu trình",
            "Thực phẩm bổ sung",
            "Dụng cụ tập",
            "Gói kiểm tra",
            "Tư vấn",
        ],
        "categories": ["Chăm sóc toàn diện", "Gói cơ bản", "Gói nâng cao", "Thiết bị hỗ trợ", "Tư vấn"],
        "brands": ["WellCare", "VitaPlus", "ZenLife", "Healio", "AnLac"],
        "tags": ["sức khỏe", "chăm sóc", "wellness"],
    },
    "retail": {
        "items": ["Sản phẩm", "Bộ sưu tập", "Combo", "Phụ kiện", "Bộ quà tặng", "Gói tiện ích"],
        "categories": ["Hàng mới", "Bestseller", "Combo tiết kiệm", "Quà tặng", "Phụ kiện"],
        "brands": ["VietMart", "ZenHome", "Nova", "Lumia", "Sendo"],
        "tags": ["mua sắm", "đa dạng", "giá tốt"],
    },
    "services": {
        "items": ["Gói dịch vụ", "Giải pháp", "Tư vấn", "Bảo trì", "Triển khai", "Đào tạo"],
        "categories": ["Cơ bản", "Chuyên nghiệp", "Doanh nghiệp", "Theo yêu cầu", "Bảo trì"],
        "brands": ["ProServe", "BizPro", "VietPro", "NovaCare", "Optima"],
        "tags": ["dịch vụ", "chuyên nghiệp", "tư vấn"],
    },
    "business": {
        "items": ["Giải pháp", "Dự án", "Dịch vụ", "Gói triển khai", "Hạ tầng", "Tư vấn"],
        "categories": ["Giải pháp tổng thể", "Theo ngành", "Chuyển đổi số", "Thi công", "Bảo trì"],
        "brands": ["VietBuild", "CoreBiz", "Nexus", "Prime", "Atlas"],
        "tags": ["doanh nghiệp", "giải pháp", "chiến lược"],
    },
    "environment": {
        "items": [
            "Giải pháp xanh",
            "Sản phẩm tái chế",
            "Gói tư vấn",
            "Dịch vụ xử lý",
            "Thiết bị tiết kiệm",
            "Bộ kit xanh",
        ],
        "categories": ["Năng lượng sạch", "Tái chế", "Tiết kiệm nước", "Chống ô nhiễm", "Trồng cây"],
        "brands": ["GreenLife", "EcoNova", "Terra", "CleanWave", "Leafy"],
        "tags": ["môi trường", "xanh", "bền vững"],
    },
}

service_categories_default = ["Tư vấn", "Triển khai", "Bảo trì", "Đào tạo", "Tùy chỉnh"]
post_categories_default = ["Tin tức", "Hướng dẫn", "Khuyến mãi", "Kinh nghiệm", "Hỏi đáp"]

industries = [
    {
        "key": "fashion",
        "name": "Thời trang",
        "icon": "👗",
        "category": "fashion-beauty",
        "description": "Bộ sưu tập thời trang theo mùa, phong cách hiện đại.",
        "websiteTypes": ["catalog", "ecommerce"],
        "saleMode": "cart",
        "productType": "physical",
        "businessType": "ClothingStore",
        "items": ["Áo sơ mi", "Đầm dạ hội", "Quần jeans", "Áo khoác", "Túi xách", "Giày cao gót"],
        "categories": ["Nữ", "Nam", "Công sở", "Dạo phố", "Phụ kiện"],
        "tags": ["thời trang", "bộ sưu tập", "phong cách"],
    },
    {
        "key": "cosmetics",
        "name": "Mỹ phẩm",
        "icon": "💄",
        "category": "fashion-beauty",
        "description": "Sản phẩm làm đẹp, chăm sóc da và trang điểm.",
        "websiteTypes": ["catalog", "ecommerce"],
        "saleMode": "cart",
        "productType": "physical",
        "businessType": "HealthAndBeautyBusiness",
        "items": ["Son môi", "Kem dưỡng", "Serum", "Mặt nạ", "Phấn phủ", "Sữa rửa mặt"],
        "categories": ["Chăm sóc da", "Trang điểm", "Chăm sóc tóc", "Body", "Bộ quà tặng"],
        "tags": ["làm đẹp", "chăm sóc da", "makeup"],
    },
    {
        "key": "jewelry",
        "name": "Trang sức",
        "icon": "💍",
        "category": "fashion-beauty",
        "description": "Trang sức vàng, bạc, đá quý cho mọi dịp.",
        "websiteTypes": ["catalog", "ecommerce"],
        "saleMode": "cart",
        "productType": "physical",
        "businessType": "JewelryStore",
        "items": ["Nhẫn", "Dây chuyền", "Bông tai", "Lắc tay", "Vòng cổ", "Charm"],
        "categories": ["Vàng", "Bạc", "Đá quý", "Trang sức cưới", "Quà tặng"],
        "tags": ["trang sức", "cao cấp", "đá quý"],
    },
    {
        "key": "perfume",
        "name": "Nước hoa",
        "icon": "🧴",
        "category": "fashion-beauty",
        "description": "Bộ sưu tập nước hoa theo phong cách và mùa.",
        "websiteTypes": ["catalog", "ecommerce"],
        "saleMode": "cart",
        "productType": "physical",
        "businessType": "Store",
        "items": ["Nước hoa nữ", "Nước hoa nam", "Eau de parfum", "Eau de toilette", "Body mist"],
        "categories": ["Hương hoa", "Hương gỗ", "Hương cam chanh", "Unisex", "Gift set"],
        "tags": ["nước hoa", "hương thơm", "cao cấp"],
    },
    {
        "key": "lingerie",
        "name": "Nội y",
        "icon": "🩱",
        "category": "fashion-beauty",
        "description": "Nội y cao cấp, thoải mái cho mọi dáng.",
        "websiteTypes": ["catalog", "ecommerce"],
        "saleMode": "cart",
        "productType": "physical",
        "businessType": "Store",
        "items": ["Bralette", "Bra", "Quần lót", "Bộ ngủ", "Đồ mặc nhà"],
        "categories": ["Cơ bản", "Không gọng", "Định hình", "Sexy", "Đồ ngủ"],
        "tags": ["nội y", "thời trang", "thoải mái"],
    },
    {
        "key": "tech",
        "name": "Thiết bị công nghệ",
        "icon": "💻",
        "category": "technology",
        "description": "Thiết bị công nghệ, laptop, phụ kiện hiện đại.",
        "websiteTypes": ["catalog", "ecommerce"],
        "saleMode": "cart",
        "productType": "physical",
        "businessType": "ElectronicsStore",
        "items": ["Laptop", "Máy tính bàn", "Màn hình", "Bàn phím", "Chuột", "Tai nghe"],
        "categories": ["Laptop", "PC", "Phụ kiện", "Gaming", "Văn phòng"],
        "tags": ["công nghệ", "thiết bị", "gaming"],
    },
    {
        "key": "electronics",
        "name": "Điện tử",
        "icon": "📱",
        "category": "technology",
        "description": "Điện thoại, tablet, thiết bị thông minh.",
        "websiteTypes": ["catalog", "ecommerce"],
        "saleMode": "cart",
        "productType": "physical",
        "businessType": "ElectronicsStore",
        "items": ["Điện thoại", "Tablet", "Smartwatch", "Loa bluetooth", "Camera", "Sạc nhanh"],
        "categories": ["Điện thoại", "Tablet", "Smart home", "Phụ kiện", "Thiết bị đeo"],
        "tags": ["điện tử", "smart", "phụ kiện"],
    },
    {
        "key": "ai-accounts",
        "name": "Tài khoản AI",
        "icon": "🤖",
        "category": "technology",
        "description": "Gói tài khoản AI, công cụ tăng năng suất.",
        "websiteTypes": ["catalog", "ecommerce"],
        "saleMode": "affiliate",
        "productType": "digital",
        "businessType": "Store",
        "items": ["Gói ChatGPT", "Gói Claude", "Gói Midjourney", "Gói AI Writer", "Gói AI Design"],
        "categories": ["AI Writing", "AI Image", "AI Video", "Gói doanh nghiệp", "Gói cá nhân"],
        "tags": ["AI", "tài khoản", "năng suất"],
    },
    {
        "key": "gaming-accounts",
        "name": "Tài khoản game",
        "icon": "🎮",
        "category": "technology",
        "description": "Tài khoản game, vật phẩm số, gói nạp nhanh.",
        "websiteTypes": ["catalog", "ecommerce"],
        "saleMode": "affiliate",
        "productType": "digital",
        "businessType": "Store",
        "items": ["Acc Liên Minh", "Acc Valorant", "Acc Genshin", "Giftcode", "Gói nạp"],
        "categories": ["FPS", "MOBA", "RPG", "Mobile", "Giftcode"],
        "tags": ["game", "tài khoản", "nạp nhanh"],
    },
    {
        "key": "restaurant",
        "name": "Nhà hàng",
        "icon": "🍽️",
        "category": "food-beverage",
        "description": "Thực đơn theo ngày, đặt bàn nhanh chóng.",
        "websiteTypes": ["services", "landing"],
        "saleMode": "contact",
        "productType": "physical",
        "businessType": "Restaurant",
        "items": ["Set menu", "Món khai vị", "Món chính", "Món tráng miệng", "Rượu vang"],
        "categories": ["Set menu", "Món chính", "Món chay", "Đồ uống", "Tráng miệng"],
        "tags": ["nhà hàng", "thực đơn", "đặt bàn"],
    },
    {
        "key": "cafe",
        "name": "Quán cà phê",
        "icon": "☕",
        "category": "food-beverage",
        "description": "Cà phê rang xay, đồ uống sáng tạo.",
        "websiteTypes": ["services", "landing"],
        "saleMode": "contact",
        "productType": "physical",
        "businessType": "CafeOrCoffeeShop",
        "items": ["Cà phê pha máy", "Cold brew", "Trà trái cây", "Bánh ngọt", "Combo sáng"],
        "categories": ["Cà phê", "Trà", "Đá xay", "Bánh ngọt", "Combo"],
        "tags": ["cà phê", "đồ uống", "chill"],
    },
    {
        "key": "food",
        "name": "Thực phẩm",
        "icon": "🥗",
        "category": "food-beverage",
        "description": "Thực phẩm sạch, giao nhanh trong ngày.",
        "websiteTypes": ["catalog", "ecommerce"],
        "saleMode": "cart",
        "productType": "physical",
        "businessType": "FoodEstablishment",
        "items": ["Rau củ", "Thịt tươi", "Hải sản", "Trái cây", "Gia vị"],
        "categories": ["Rau củ", "Thịt", "Hải sản", "Đặc sản", "Combo"],
        "tags": ["thực phẩm", "tươi sạch", "giao nhanh"],
    },
    {
        "key": "seafood",
        "name": "Hải sản",
        "icon": "🦐",
        "category": "food-beverage",
        "description": "Hải sản tươi sống, đóng gói chuẩn.",
        "websiteTypes": ["catalog", "ecommerce"],
        "saleMode": "cart",
        "productType": "physical",
        "businessType": "Store",
        "items": ["Tôm hùm", "Cua", "Cá hồi", "Mực", "Nghêu"],
        "categories": ["Hải sản tươi", "Hải sản đông lạnh", "Combo", "Gia vị", "Đặc sản"],
        "tags": ["hải sản", "tươi sống", "đặc sản"],
    },
    {
        "key": "bakery",
        "name": "Tiệm bánh",
        "icon": "🥐",
        "category": "food-beverage",
        "description": "Bánh tươi, đặt bánh sinh nhật nhanh.",
        "websiteTypes": ["catalog", "ecommerce"],
        "saleMode": "cart",
        "productType": "physical",
        "businessType": "Bakery",
        "items": ["Bánh mì", "Croissant", "Bánh kem", "Bánh quy", "Set quà"],
        "categories": ["Bánh tươi", "Bánh ngọt", "Bánh sinh nhật", "Bánh mặn", "Set quà"],
        "tags": ["bánh", "tươi mới", "đặt nhanh"],
    },
    {
        "key": "healthcare",
        "name": "Chăm sóc sức khỏe",
        "icon": "🏥",
        "category": "health-wellness",
        "description": "Dịch vụ chăm sóc sức khỏe, đặt lịch nhanh.",
        "websiteTypes": ["services", "landing"],
        "saleMode": "contact",
        "productType": "physical",
        "businessType": "MedicalBusiness",
        "items": ["Khám tổng quát", "Tư vấn sức khỏe", "Gói xét nghiệm", "Chăm sóc tại nhà", "Tầm soát"],
        "categories": ["Khám tổng quát", "Xét nghiệm", "Chuyên khoa", "Chăm sóc tại nhà", "Tư vấn"],
        "tags": ["y tế", "chăm sóc", "đặt lịch"],
    },
    {
        "key": "pharmacy",
        "name": "Nhà thuốc",
        "icon": "💊",
        "category": "health-wellness",
        "description": "Dược phẩm chính hãng, giao tận nơi.",
        "websiteTypes": ["catalog", "ecommerce"],
        "saleMode": "cart",
        "productType": "physical",
        "businessType": "Pharmacy",
        "items": ["Vitamin", "Thuốc cảm", "Thực phẩm bổ sung", "Thiết bị y tế", "Dụng cụ chăm sóc"],
        "categories": ["Vitamin", "Thiết bị y tế", "Chăm sóc cá nhân", "Dược phẩm", "Combo"],
        "tags": ["nhà thuốc", "chính hãng", "giao nhanh"],
    },
    {
        "key": "beauty-spa",
        "name": "Spa làm đẹp",
        "icon": "💆",
        "category": "health-wellness",
        "description": "Liệu trình spa, chăm sóc da chuyên sâu.",
        "websiteTypes": ["services", "landing"],
        "saleMode": "contact",
        "productType": "physical",
        "businessType": "HealthAndBeautyBusiness",
        "items": ["Liệu trình da", "Massage", "Gói body", "Chăm sóc tóc", "Combo spa"],
        "categories": ["Liệu trình", "Chăm sóc da", "Body", "Massage", "Combo"],
        "tags": ["spa", "làm đẹp", "liệu trình"],
    },
    {
        "key": "massage",
        "name": "Massage",
        "icon": "🧖",
        "category": "health-wellness",
        "description": "Massage thư giãn, trị liệu chuyên nghiệp.",
        "websiteTypes": ["services", "landing"],
        "saleMode": "contact",
        "productType": "physical",
        "businessType": "HealthAndBeautyBusiness",
        "items": ["Massage Thái", "Massage đá nóng", "Massage cổ vai", "Massage body", "Foot massage"],
        "categories": ["Thư giãn", "Trị liệu", "Cổ vai gáy", "Body", "Foot"],
        "tags": ["massage", "thư giãn", "trị liệu"],
    },
    {
        "key": "hair-salon",
        "name": "Salon tóc",
        "icon": "💇",
        "category": "health-wellness",
        "description": "Cắt tóc, tạo kiểu, chăm sóc tóc.",
        "websiteTypes": ["services", "landing"],
        "saleMode": "contact",
        "productType": "physical",
        "businessType": "HairSalon",
        "items": ["Cắt tóc", "Uốn", "Nhuộm", "Phục hồi", "Combo"],
        "categories": ["Tạo kiểu", "Nhuộm", "Chăm sóc", "Combo", "Sản phẩm"],
        "tags": ["salon", "tóc", "tạo kiểu"],
    },
    {
        "key": "fitness",
        "name": "Fitness",
        "icon": "🏋️",
        "category": "health-wellness",
        "description": "Luyện tập fitness, PT cá nhân.",
        "websiteTypes": ["services", "landing"],
        "saleMode": "contact",
        "productType": "physical",
        "businessType": "HealthClub",
        "items": ["Gói PT", "Gói tháng", "Gói năm", "Lớp nhóm", "Dinh dưỡng"],
        "categories": ["PT", "Lớp nhóm", "Gói tháng", "Gói năm", "Dinh dưỡng"],
        "tags": ["fitness", "luyện tập", "PT"],
    },
    {
        "key": "gym",
        "name": "Phòng gym",
        "icon": "🏋️‍♂️",
        "category": "health-wellness",
        "description": "Phòng gym hiện đại, gói tập linh hoạt.",
        "websiteTypes": ["services", "landing"],
        "saleMode": "contact",
        "productType": "physical",
        "businessType": "HealthClub",
        "items": ["Gói tập tháng", "Gói tập năm", "PT 1-1", "Lớp HIIT", "Gói gia đình"],
        "categories": ["Gói tập", "PT", "Lớp nhóm", "Gói gia đình", "Khuyến mãi"],
        "tags": ["gym", "thể hình", "tập luyện"],
    },
    {
        "key": "yoga",
        "name": "Yoga",
        "icon": "🧘",
        "category": "health-wellness",
        "description": "Lớp yoga, thiền, chăm sóc tinh thần.",
        "websiteTypes": ["services", "landing"],
        "saleMode": "contact",
        "productType": "physical",
        "businessType": "SportsActivityLocation",
        "items": ["Yoga cơ bản", "Yoga nâng cao", "Thiền", "Yoga bầu", "Workshop"],
        "categories": ["Yoga", "Thiền", "Workshop", "Gói tháng", "Gói năm"],
        "tags": ["yoga", "thiền", "wellness"],
    },
    {
        "key": "vet",
        "name": "Thú y",
        "icon": "🐾",
        "category": "health-wellness",
        "description": "Chăm sóc thú cưng, đặt lịch khám.",
        "websiteTypes": ["services", "landing"],
        "saleMode": "contact",
        "productType": "physical",
        "businessType": "VeterinaryCare",
        "items": ["Khám tổng quát", "Tiêm phòng", "Spa thú cưng", "Dinh dưỡng", "Phẫu thuật"],
        "categories": ["Khám bệnh", "Tiêm phòng", "Spa", "Dinh dưỡng", "Phụ kiện"],
        "tags": ["thú y", "thú cưng", "chăm sóc"],
    },
    {
        "key": "home-furniture",
        "name": "Nội thất",
        "icon": "🛋️",
        "category": "retail",
        "description": "Nội thất hiện đại, thiết kế theo bộ.",
        "websiteTypes": ["catalog", "ecommerce"],
        "saleMode": "contact",
        "productType": "physical",
        "businessType": "HomeGoodsStore",
        "items": ["Sofa", "Bàn ăn", "Giường", "Tủ", "Ghế"],
        "categories": ["Phòng khách", "Phòng ngủ", "Phòng bếp", "Văn phòng", "Trang trí"],
        "tags": ["nội thất", "thiết kế", "hiện đại"],
    },
    {
        "key": "baby-care",
        "name": "Mẹ & Bé",
        "icon": "🍼",
        "category": "retail",
        "description": "Sản phẩm chăm sóc mẹ và bé an toàn.",
        "websiteTypes": ["catalog", "ecommerce"],
        "saleMode": "cart",
        "productType": "physical",
        "businessType": "Store",
        "items": ["Tã", "Sữa", "Xe đẩy", "Đồ chơi", "Áo quần"],
        "categories": ["Sơ sinh", "Dinh dưỡng", "Đồ chơi", "Thời trang", "Dụng cụ"],
        "tags": ["mẹ và bé", "an toàn", "chính hãng"],
    },
    {
        "key": "books",
        "name": "Sách",
        "icon": "📚",
        "category": "retail",
        "description": "Sách kỹ năng, văn học, thiếu nhi.",
        "websiteTypes": ["catalog", "ecommerce"],
        "saleMode": "cart",
        "productType": "physical",
        "businessType": "BookStore",
        "items": ["Sách kỹ năng", "Văn học", "Thiếu nhi", "Kinh doanh", "Combo"],
        "categories": ["Kỹ năng", "Văn học", "Thiếu nhi", "Kinh doanh", "Combo"],
        "tags": ["sách", "tri thức", "giáo dục"],
    },
    {
        "key": "stationery",
        "name": "Văn phòng phẩm",
        "icon": "✏️",
        "category": "retail",
        "description": "Dụng cụ học tập, văn phòng đầy đủ.",
        "websiteTypes": ["catalog", "ecommerce"],
        "saleMode": "cart",
        "productType": "physical",
        "businessType": "Store",
        "items": ["Bút", "Sổ tay", "Giấy", "Phụ kiện", "Balo"],
        "categories": ["Bút", "Sổ", "Giấy", "Dụng cụ", "Quà tặng"],
        "tags": ["văn phòng", "học tập", "tiện ích"],
    },
    {
        "key": "multi-category",
        "name": "Siêu thị tổng hợp",
        "icon": "🛒",
        "category": "retail",
        "description": "Đa dạng ngành hàng, mua sắm một điểm.",
        "websiteTypes": ["catalog", "ecommerce"],
        "saleMode": "cart",
        "productType": "physical",
        "businessType": "Store",
        "items": ["Hàng tiêu dùng", "Gia dụng", "Thực phẩm", "Chăm sóc cá nhân", "Đồ điện"],
        "categories": ["Gia dụng", "Thực phẩm", "Chăm sóc", "Điện tử", "Khuyến mãi"],
        "tags": ["siêu thị", "đa ngành", "tiện lợi"],
    },
    {
        "key": "gifts",
        "name": "Quà tặng",
        "icon": "🎁",
        "category": "retail",
        "description": "Quà tặng cá nhân hóa, giao nhanh.",
        "websiteTypes": ["catalog", "ecommerce"],
        "saleMode": "cart",
        "productType": "physical",
        "businessType": "GiftShop",
        "items": ["Gift box", "Hoa", "Quà doanh nghiệp", "Đồ handmade", "Voucher"],
        "categories": ["Sinh nhật", "Doanh nghiệp", "Tình yêu", "Handmade", "Đặc biệt"],
        "tags": ["quà tặng", "cá nhân hóa", "giao nhanh"],
    },
    {
        "key": "handicraft",
        "name": "Đồ thủ công",
        "icon": "🧵",
        "category": "retail",
        "description": "Sản phẩm thủ công, thiết kế độc bản.",
        "websiteTypes": ["catalog", "ecommerce"],
        "saleMode": "cart",
        "productType": "physical",
        "businessType": "Store",
        "items": ["Đồ gốm", "Đồ mây tre", "Đồ da", "Trang trí", "Phụ kiện"],
        "categories": ["Gốm", "Mây tre", "Đồ da", "Trang trí", "Quà tặng"],
        "tags": ["thủ công", "độc bản", "tinh xảo"],
    },
    {
        "key": "auto-parts",
        "name": "Phụ tùng ô tô",
        "icon": "🧰",
        "category": "retail",
        "description": "Phụ tùng ô tô chính hãng, bảo hành rõ ràng.",
        "websiteTypes": ["catalog", "ecommerce"],
        "saleMode": "contact",
        "productType": "physical",
        "businessType": "AutoPartsStore",
        "items": ["Lốp xe", "Ắc quy", "Đèn", "Phanh", "Dầu nhớt"],
        "categories": ["Động cơ", "Ngoại thất", "Nội thất", "Chăm sóc", "Phụ kiện"],
        "tags": ["phụ tùng", "ô tô", "chính hãng"],
    },
    {
        "key": "auto",
        "name": "Ô tô",
        "icon": "🚗",
        "category": "retail",
        "description": "Showroom ô tô, tư vấn và đặt lịch lái thử.",
        "websiteTypes": ["catalog", "services"],
        "saleMode": "contact",
        "productType": "physical",
        "businessType": "AutoDealer",
        "items": ["Sedan", "SUV", "MPV", "Xe điện", "Bán tải"],
        "categories": ["Sedan", "SUV", "Xe điện", "Bán tải", "Phụ kiện"],
        "tags": ["ô tô", "showroom", "lái thử"],
    },
    {
        "key": "appliances",
        "name": "Điện máy",
        "icon": "📺",
        "category": "retail",
        "description": "Điện máy gia dụng, bảo hành chính hãng.",
        "websiteTypes": ["catalog", "ecommerce"],
        "saleMode": "cart",
        "productType": "physical",
        "businessType": "ElectronicsStore",
        "items": ["Tivi", "Tủ lạnh", "Máy giặt", "Máy lọc", "Nồi chiên"],
        "categories": ["Gia dụng", "Điện lạnh", "Nhà bếp", "Thiết bị thông minh", "Khuyến mãi"],
        "tags": ["điện máy", "gia dụng", "chính hãng"],
    },
    {
        "key": "music-instruments",
        "name": "Nhạc cụ",
        "icon": "🎸",
        "category": "retail",
        "description": "Nhạc cụ và phụ kiện cho người yêu âm nhạc.",
        "websiteTypes": ["catalog", "ecommerce"],
        "saleMode": "cart",
        "productType": "physical",
        "businessType": "MusicStore",
        "items": ["Guitar", "Piano", "Trống", "Ukulele", "Phụ kiện"],
        "categories": ["Guitar", "Piano", "Trống", "Phụ kiện", "Combo"],
        "tags": ["nhạc cụ", "âm nhạc", "phụ kiện"],
    },
    {
        "key": "travel",
        "name": "Du lịch",
        "icon": "✈️",
        "category": "services",
        "description": "Tour du lịch trong và ngoài nước.",
        "websiteTypes": ["services", "landing"],
        "saleMode": "contact",
        "productType": "physical",
        "businessType": "TravelAgency",
        "items": ["Tour biển", "Tour núi", "Tour nước ngoài", "Combo vé", "Dịch vụ visa"],
        "categories": ["Tour trong nước", "Tour quốc tế", "Combo vé", "Khuyến mãi", "Dịch vụ"],
        "tags": ["du lịch", "tour", "khám phá"],
    },
    {
        "key": "hotel",
        "name": "Khách sạn",
        "icon": "🏨",
        "category": "services",
        "description": "Đặt phòng nhanh, ưu đãi theo mùa.",
        "websiteTypes": ["services", "landing"],
        "saleMode": "contact",
        "productType": "physical",
        "businessType": "Hotel",
        "items": ["Phòng tiêu chuẩn", "Phòng suite", "Combo nghỉ dưỡng", "Dịch vụ spa", "Nhà hàng"],
        "categories": ["Phòng", "Combo", "Dịch vụ", "Ưu đãi", "Sự kiện"],
        "tags": ["khách sạn", "đặt phòng", "nghỉ dưỡng"],
    },
    {
        "key": "business",
        "name": "Doanh nghiệp",
        "icon": "🏢",
        "category": "business",
        "description": "Giải pháp doanh nghiệp, tư vấn vận hành.",
        "websiteTypes": ["services", "landing"],
        "saleMode": "contact",
        "productType": "physical",
        "businessType": "LocalBusiness",
        "items": ["Tư vấn chiến lược", "Quản trị", "Nhân sự", "Kế toán", "Pháp lý"],
        "categories": ["Tư vấn", "Vận hành", "Tài chính", "Nhân sự", "Pháp lý"],
        "tags": ["doanh nghiệp", "tư vấn", "giải pháp"],
    },
    {
        "key": "manufacturing",
        "name": "Sản xuất",
        "icon": "🏭",
        "category": "business",
        "description": "Giải pháp sản xuất, tối ưu dây chuyền.",
        "websiteTypes": ["services", "landing"],
        "saleMode": "contact",
        "productType": "physical",
        "businessType": "LocalBusiness",
        "items": ["Tư vấn dây chuyền", "Thiết kế nhà xưởng", "Bảo trì", "Tối ưu"],
        "categories": ["Thiết kế", "Tối ưu", "Bảo trì", "Vận hành", "An toàn"],
        "tags": ["sản xuất", "nhà xưởng", "tối ưu"],
    },
    {
        "key": "construction",
        "name": "Xây dựng",
        "icon": "🏗️",
        "category": "business",
        "description": "Thiết kế và thi công công trình.",
        "websiteTypes": ["services", "landing"],
        "saleMode": "contact",
        "productType": "physical",
        "businessType": "ConstructionBusiness",
        "items": ["Thiết kế", "Thi công", "Giám sát", "Bảo trì", "Nội thất"],
        "categories": ["Nhà ở", "Văn phòng", "Công nghiệp", "Nội thất", "Bảo trì"],
        "tags": ["xây dựng", "thi công", "thiết kế"],
    },
    {
        "key": "real-estate",
        "name": "Bất động sản",
        "icon": "🏘️",
        "category": "business",
        "description": "Dự án bất động sản, tư vấn mua bán.",
        "websiteTypes": ["services", "landing"],
        "saleMode": "contact",
        "productType": "physical",
        "businessType": "RealEstateAgent",
        "items": ["Căn hộ", "Nhà phố", "Đất nền", "Bất động sản nghỉ dưỡng"],
        "categories": ["Căn hộ", "Nhà phố", "Đất nền", "Dự án", "Tư vấn"],
        "tags": ["bất động sản", "dự án", "tư vấn"],
    },
    {
        "key": "design-services",
        "name": "Thiết kế sáng tạo",
        "icon": "🎨",
        "category": "services",
        "description": "Dịch vụ thiết kế thương hiệu, UI/UX.",
        "websiteTypes": ["services", "landing"],
        "saleMode": "contact",
        "productType": "physical",
        "businessType": "ProfessionalService",
        "items": ["Thiết kế logo", "Branding", "UI/UX", "Ấn phẩm", "Website"],
        "categories": ["Branding", "UI/UX", "Digital", "Print", "Gói combo"],
        "tags": ["thiết kế", "sáng tạo", "branding"],
    },
    {
        "key": "courses",
        "name": "Khóa học",
        "icon": "🎓",
        "category": "services",
        "description": "Khóa học online/offline, lộ trình rõ ràng.",
        "websiteTypes": ["services", "landing"],
        "saleMode": "contact",
        "productType": "digital",
        "businessType": "EducationalOrganization",
        "items": ["Khoá marketing", "Khoá thiết kế", "Khoá lập trình", "Khoá tiếng Anh", "Workshop"],
        "categories": ["Online", "Offline", "Workshop", "Combo", "Doanh nghiệp"],
        "tags": ["khóa học", "đào tạo", "lộ trình"],
    },
    {
        "key": "affiliate-shop",
        "name": "Affiliate Shop",
        "icon": "🧩",
        "category": "retail",
        "description": "Danh mục sản phẩm tiếp thị liên kết.",
        "websiteTypes": ["catalog", "ecommerce"],
        "saleMode": "affiliate",
        "productType": "physical",
        "businessType": "Store",
        "items": ["Đồ gia dụng", "Thiết bị công nghệ", "Thời trang", "Làm đẹp", "Sức khỏe"],
        "categories": ["Hot deals", "Best sellers", "Top rating", "Combo", "Flash sale"],
        "tags": ["affiliate", "tiếp thị", "deal"],
    },
    {
        "key": "environment",
        "name": "Môi trường",
        "icon": "🌿",
        "category": "environment",
        "description": "Giải pháp môi trường và bền vững.",
        "websiteTypes": ["services", "landing"],
        "saleMode": "contact",
        "productType": "physical",
        "businessType": "LocalBusiness",
        "items": ["Xử lý rác", "Tư vấn ESG", "Thiết bị xanh", "Giải pháp nước", "Năng lượng sạch"],
        "categories": ["Xử lý", "Năng lượng", "Tái chế", "Tư vấn", "Thiết bị"],
        "tags": ["môi trường", "bền vững", "xanh"],
    },
]

if len(industries) != 44:
    raise ValueError(f"Expected 44 industries, got {len(industries)}")


def pick_color(index: int) -> str:
    return primary_colors[index % len(primary_colors)]


IMAGE_EXTS = {".webp", ".png", ".jpg", ".jpeg", ".gif", ".avif"}


def list_assets(key: str, folder: str, fallback: list[str]) -> list[str]:
    path = public_dir / key / folder
    if not path.exists():
        return fallback

    files = [
        file
        for file in sorted(path.iterdir())
        if file.is_file() and not file.name.startswith('.') and file.suffix.lower() in IMAGE_EXTS
    ]
    if not files:
        return fallback

    return [f"/seed_mau/{key}/{folder}/{file.name}" for file in files]


def build_assets(key: str) -> dict:
    base = f"/seed_mau/{key}"
    return {
        "hero": list_assets(key, "hero", [f"{base}/hero/hero-1.webp", f"{base}/hero/hero-2.webp"]),
        "products": list_assets(key, "products", [f"{base}/products/product-{i}.webp" for i in range(1, 5)]),
        "posts": list_assets(key, "posts", [f"{base}/posts/post-{i}.webp" for i in range(1, 4)]),
        "logos": list_assets(key, "logos", [f"{base}/logos/logo-{i}.webp" for i in range(1, 4)]),
        "gallery": list_assets(key, "gallery", [f"{base}/gallery/gallery-{i}.webp" for i in range(1, 5)]),
    }


def build_home_components(industry: dict, assets: dict) -> list:
    website_types = industry["websiteTypes"]
    has_products = any(t in ("catalog", "ecommerce") for t in website_types)
    has_services = "services" in website_types
    has_blog = "blog" in website_types

    hero_heading = industry.get("heroHeading") or f"{industry['name']} chất lượng"
    hero_desc = industry.get("heroSubheading") or industry["description"]
    product_heading = f"Sản phẩm {industry['name'].lower()} nổi bật"
    service_heading = f"Dịch vụ {industry['name'].lower()} nổi bật"

    components = [
        {
            "type": "Hero",
            "title": "Hero Banner",
            "order": 0,
            "active": True,
            "config": {
                "style": "slider",
                "slides": [
                    {"image": assets["hero"][0], "link": "/products"},
                    {"image": assets["hero"][1], "link": "/products"},
                ],
                "content": {
                    "badge": "Nổi bật",
                    "heading": hero_heading,
                    "description": hero_desc,
                    "primaryButtonText": "Khám phá ngay",
                    "secondaryButtonText": "Tìm hiểu thêm",
                },
            },
        }
    ]

    if has_products:
        components.append(
            {
                "type": "ProductCategories",
                "title": "Danh mục sản phẩm",
                "order": len(components),
                "active": True,
                "config": {
                    "categories": [],
                    "columnsDesktop": 4,
                    "columnsMobile": 2,
                    "showProductCount": True,
                    "style": "grid",
                },
            }
        )
        components.append(
            {
                "type": "ProductList",
                "title": "Sản phẩm nổi bật",
                "order": len(components),
                "active": True,
                "config": {
                    "heading": product_heading,
                    "subheading": "Gợi ý sản phẩm bán chạy",
                    "limit": 8,
                    "showButton": True,
                    "showPrice": True,
                },
            }
        )

    if has_services:
        components.append(
            {
                "type": "ServiceList",
                "title": "Dịch vụ nổi bật",
                "order": len(components),
                "active": True,
                "config": {
                    "heading": service_heading,
                    "subheading": "Chọn gói phù hợp nhất",
                    "limit": 6,
                    "showButton": True,
                },
            }
        )

    if has_blog:
        components.append(
            {
                "type": "Blog",
                "title": "Bài viết mới",
                "order": len(components),
                "active": True,
                "config": {
                    "heading": f"Tin tức {industry['name'].lower()}",
                    "subheading": "Cập nhật kiến thức mới",
                    "limit": 6,
                    "showDate": True,
                    "showExcerpt": True,
                },
            }
        )

    components.append(
        {
            "type": "About",
            "title": "Giới thiệu",
            "order": len(components),
            "active": True,
            "config": {
                "heading": f"Về {industry['name']}",
                "content": industry["description"],
                "image": assets["gallery"][0],
            },
        }
    )

    components.append(
        {
            "type": "CTA",
            "title": "CTA",
            "order": len(components),
            "active": True,
            "config": {
                "heading": "Sẵn sàng bắt đầu?",
                "description": "Liên hệ để nhận tư vấn nhanh.",
                "buttonText": "Liên hệ ngay",
                "buttonLink": "/lien-he",
            },
        }
    )

    components.append(
        {
            "type": "Contact",
            "title": "Liên hệ",
            "order": len(components),
            "active": True,
            "config": {
                "heading": "Liên hệ với chúng tôi",
                "subheading": "Đội ngũ hỗ trợ 24/7",
                "showForm": True,
                "showMap": False,
            },
        }
    )

    components.append(
        {
            "type": "Footer",
            "title": "Footer",
            "order": len(components),
            "active": True,
            "config": {
                "style": "classic",
            },
        }
    )

    return components


def experience_key(website_types: list) -> str:
    if "ecommerce" in website_types:
        return "modern"
    if "catalog" in website_types:
        return "classic"
    if "services" in website_types:
        return "professional"
    if "blog" in website_types:
        return "magazine"
    return "default"


write(
    base_dir / "types.ts",
    """
export type IndustryCategory =
  | 'fashion-beauty'
  | 'technology'
  | 'food-beverage'
  | 'health-wellness'
  | 'retail'
  | 'services'
  | 'business'
  | 'environment';

export type WebsiteType = 'landing' | 'blog' | 'catalog' | 'ecommerce' | 'services';
export type SaleMode = 'cart' | 'contact' | 'affiliate';
export type ProductType = 'physical' | 'digital' | 'both';

export type IndustryAssetPack = {
  hero: string[];
  products: string[];
  posts: string[];
  logos: string[];
  gallery: string[];
};

export type FakerTemplate = {
  namePatterns: string[];
  descriptionPatterns: string[];
  postTitlePatterns: string[];
  postExcerptPatterns: string[];
  serviceNamePatterns: string[];
  categoryNames: string[];
  postCategoryNames: string[];
  serviceCategoryNames: string[];
  tags: string[];
  customFields: Record<string, string[]>;
};

export type HomeComponentTemplate = {
  type: string;
  title: string;
  order: number;
  active: boolean;
  config: Record<string, unknown>;
};

export type IndustryTemplate = {
  key: string;
  name: string;
  icon: string;
  description: string;
  category: IndustryCategory;
  websiteTypes: WebsiteType[];
  saleMode: SaleMode;
  productType: ProductType;
  businessType: string;
  brandColor: string;
  tags: string[];
  assets: IndustryAssetPack;
  fakerTemplates: FakerTemplate;
  homeComponents: HomeComponentTemplate[];
  experiencePresetKey: string;
};

export type IndustrySummary = Pick<
  IndustryTemplate,
  'key' | 'name' | 'icon' | 'description' | 'category' | 'websiteTypes' | 'saleMode' | 'productType' | 'businessType' | 'brandColor' | 'tags' | 'experiencePresetKey'
>;
""".lstrip(),
)

write(
    base_dir / "utils.ts",
    """
import type { FakerTemplate, IndustrySummary, IndustryTemplate } from './types';

export type Randomizer = () => number;

const DEFAULT_FIELDS: Record<string, string[]> = {
  variant: ['Cao cấp', 'Tiêu chuẩn', 'Phổ thông', 'Limited'],
  feature: ['Thiết kế hiện đại', 'Chất lượng cao', 'Giá tốt', 'Bền bỉ', 'Tiện dụng', 'Thân thiện'],
  usage: ['hàng ngày', 'gia đình', 'doanh nghiệp', 'du lịch', 'tặng quà'],
  description: [
    'Sản phẩm được chọn lọc kỹ',
    'Đáp ứng nhu cầu đa dạng',
    'Phù hợp xu hướng 2026',
    'Mang lại trải nghiệm tốt',
  ],
  number: ['5', '7', '10', '12'],
  year: [new Date().getFullYear().toString()],
};

export function pickRandom<T>(values: T[], randomFn: Randomizer = Math.random): T {
  if (values.length === 0) {
    throw new Error('Empty values');
  }
  return values[Math.floor(randomFn() * values.length)];
}

export function mergeTemplateFields(template?: FakerTemplate): Record<string, string[]> {
  if (!template) {
    return { ...DEFAULT_FIELDS };
  }
  return { ...DEFAULT_FIELDS, ...template.customFields };
}

export function renderPattern(pattern: string, fields: Record<string, string[]>, randomFn: Randomizer = Math.random): string {
  return pattern.replace(/\{\{(.*?)\}\}/g, (_match, key) => {
    const values = fields[key] || [key];
    return pickRandom(values, randomFn);
  });
}

export function buildFromPatterns(patterns: string[], fields: Record<string, string[]>, randomFn: Randomizer = Math.random): string {
  const pattern = pickRandom(patterns, randomFn);
  return renderPattern(pattern, fields, randomFn);
}

export function buildIndustrySummary(template: IndustryTemplate): IndustrySummary {
  const {
    key,
    name,
    icon,
    description,
    category,
    websiteTypes,
    saleMode,
    productType,
    businessType,
    brandColor,
    tags,
    experiencePresetKey,
  } = template;
  return {
    key,
    name,
    icon,
    description,
    category,
    websiteTypes,
    saleMode,
    productType,
    businessType,
    brandColor,
    tags,
    experiencePresetKey,
  };
}
""".lstrip(),
)

def to_identifier(key: str) -> str:
    parts = key.replace('-', ' ').replace('_', ' ').split()
    if not parts:
        return key
    return parts[0] + ''.join(part.title() for part in parts[1:])


industry_imports: list[tuple[str, str]] = []

for index, industry in enumerate(industries):
    key = industry["key"]
    assets = build_assets(key)
    color = pick_color(index)
    category = industry["category"]
    defaults = category_defaults[category]

    items = industry.get("items", defaults["items"])
    categories = industry.get("categories", defaults["categories"])
    tags = industry.get("tags", defaults["tags"])
    brands = defaults["brands"]

    custom_fields = {
        "item": items,
        "category": categories,
        "brand": brands,
        "industry": [industry["name"]],
    }

    faker_templates = {
        "namePatterns": ["{{item}} {{variant}}", "{{brand}} {{item}}", "{{item}} {{feature}}"],
        "descriptionPatterns": [
            "{{description}} {{feature}} phù hợp cho {{usage}}.",
            "{{description}} Thiết kế {{feature}} dành cho {{usage}}.",
        ],
        "postTitlePatterns": [
            "Bí quyết chọn {{item}} phù hợp",
            "Top {{number}} {{item}} đáng mua {{year}}",
            "Kinh nghiệm sử dụng {{item}}",
            "Xu hướng {{industry}} {{year}}",
        ],
        "postExcerptPatterns": [
            "Tổng hợp xu hướng mới, gợi ý lựa chọn phù hợp nhu cầu.",
            "Chia sẻ kinh nghiệm thực tế và mẹo tối ưu.",
        ],
        "serviceNamePatterns": ["Gói {{industry}} {{variant}}", "Tư vấn {{industry}}", "Dịch vụ {{industry}} {{feature}}"],
        "categoryNames": categories,
        "postCategoryNames": post_categories_default,
        "serviceCategoryNames": service_categories_default,
        "tags": tags,
        "customFields": custom_fields,
    }

    template = {
        "key": key,
        "name": industry["name"],
        "icon": industry["icon"],
        "description": industry["description"],
        "category": category,
        "websiteTypes": industry["websiteTypes"],
        "saleMode": industry["saleMode"],
        "productType": industry["productType"],
        "businessType": industry["businessType"],
        "brandColor": color,
        "tags": tags,
        "assets": assets,
        "fakerTemplates": faker_templates,
        "homeComponents": build_home_components(industry, assets),
        "experiencePresetKey": experience_key(industry["websiteTypes"]),
    }

    template_json = json.dumps(template, ensure_ascii=False, indent=2)
    file_content = (
        "import type { IndustryTemplate } from '../types';\n\n"
        f"export const industryTemplate: IndustryTemplate = {template_json};\n\n"
        "export default industryTemplate;\n"
    )

    write(industries_dir / f"{key}.ts", file_content)
    industry_imports.append((key, to_identifier(key)))

import_lines = [
    f"import {industry_imports[0][1]} from './industries/{industry_imports[0][0]}';"
]
for key, identifier in industry_imports[1:]:
    import_lines.append(f"import {identifier} from './industries/{key}';")

index_content = (
    "import type { IndustrySummary, IndustryTemplate } from './types';\n"
    "import { buildIndustrySummary } from './utils';\n"
    + "\n".join(import_lines)
    + "\n\nexport const INDUSTRY_TEMPLATES: IndustryTemplate[] = [\n  "
    + ",\n  ".join(identifier for _, identifier in industry_imports)
    + "\n];\n\n"
    "export const INDUSTRY_TEMPLATE_MAP = new Map<string, IndustryTemplate>(\n"
    "  INDUSTRY_TEMPLATES.map((template) => [template.key, template])\n"
    ");\n\n"
    "export function listIndustries(): IndustrySummary[] {\n"
    "  return INDUSTRY_TEMPLATES.map(buildIndustrySummary);\n"
    "}\n\n"
    "export function getIndustryTemplate(key?: string | null): IndustryTemplate | null {\n"
    "  if (!key) {\n"
    "    return null;\n"
    "  }\n"
    "  return INDUSTRY_TEMPLATE_MAP.get(key) ?? null;\n"
    "}\n\n"
    "export * from './types';\n"
    "export * from './utils';\n"
)

write(base_dir / "index.ts", index_content.lstrip())

for industry in industries:
    base = public_dir / industry["key"]
    for folder in ["hero", "products", "posts", "logos", "gallery"]:
        path = base / folder
        path.mkdir(parents=True, exist_ok=True)
        (path / ".gitkeep").write_text("", encoding="utf-8")

print(f"Generated {len(industries)} industry templates")
