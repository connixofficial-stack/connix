const fs = require("fs");
const { ConvexHttpClient } = require("convex/browser");
const client = new ConvexHttpClient("https://agile-anteater-871.convex.cloud");

async function main() {
  try {
    const res = await client.query("settings:getByKey", { key: "products_list_ui" });
    console.log("DỮ LIỆU PRODUCTS_LIST_UI:");
    console.log(JSON.stringify(res, null, 2));

    const cartModule = await client.query("admin/modules:getModuleByKey", { key: "cart" });
    const ordersModule = await client.query("admin/modules:getModuleByKey", { key: "orders" });
    const wishlistModule = await client.query("admin/modules:getModuleByKey", { key: "wishlist" });
    const promotionsModule = await client.query("admin/modules:getModuleByKey", { key: "promotions" });
    const variantsSetting = await client.query("admin/modules:getModuleSetting", { moduleKey: "products", settingKey: "variantEnabled" });
    const saleModeSetting = await client.query("admin/modules:getModuleSetting", { moduleKey: "products", settingKey: "saleMode" });

    console.log("MODULE STATUS:");
    console.log({
      cartModule,
      ordersModule,
      wishlistModule,
      promotionsModule,
      variantsSetting,
      saleModeSetting
    });

    const resCategories = await client.query("productCategories:listNonEmptyCategoryIds");
    const activeCategories = await client.query("productCategories:listActive");
    
    fs.writeFileSync("scratch_output.json", JSON.stringify({
      products_list_ui: res,
      modules: {
        cartModule,
        ordersModule,
        wishlistModule,
        promotionsModule,
        variantsSetting,
        saleModeSetting
      },
      nonEmptyCategoryIds: resCategories,
      activeCategoriesCount: activeCategories.length
    }, null, 2));
    console.log("Đã lưu kết quả chi tiết vào scratch_output.json");
  } catch (err) {
    console.error("Lỗi:", err);
  }
}

void main();
