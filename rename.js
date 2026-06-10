const fs = require('fs');
const path = require('path');

function replaceInDir(dir, replacements) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            replaceInDir(fullPath, replacements);
        } else if (fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            for (const [search, replace] of replacements) {
                content = content.replace(new RegExp(search, 'g'), replace);
            }
            fs.writeFileSync(fullPath, content);
        }
    }
}

replaceInDir('app/admin/product-types', [
    ['product-categories', 'product-types'],
    ['productCategories', 'productTypes'],
    ['ProductCategory', 'ProductType'],
    ['ProductCategories', 'ProductTypes'],
    ['Danh mục', 'Kiểu'],
    ['danh mục', 'kiểu'],
    ['Kiểu sản phẩm sản phẩm', 'Kiểu sản phẩm'],
    ['kiểu sản phẩm sản phẩm', 'kiểu sản phẩm'],
    ['category', 'type'],
    ['Category', 'Type']
]);

replaceInDir('app/admin/attribute-groups', [
    ['product-categories', 'attribute-groups'],
    ['productCategories', 'attributeGroups'],
    ['ProductCategory', 'AttributeGroup'],
    ['ProductCategories', 'AttributeGroups'],
    ['Danh mục', 'Nhóm thuộc tính'],
    ['danh mục', 'nhóm thuộc tính'],
    ['Nhóm thuộc tính sản phẩm', 'Nhóm thuộc tính'],
    ['nhóm thuộc tính sản phẩm', 'nhóm thuộc tính'],
    ['category', 'group'],
    ['Category', 'Group']
]);

console.log('Replacements completed.');
