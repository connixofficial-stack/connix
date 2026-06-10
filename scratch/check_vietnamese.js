const dbBrand = "Thương Hiệu";
const aiBrand = "Thương Hiệu";

const dbOrigin = "Xuất xứ";
const aiOrigin = "Xuất xứ";

function check(db, ai, label) {
  console.log(`--- Checking ${label} ---`);
  console.log("DB Length:", db.length, "AI Length:", ai.length);
  const dbNorm = db.normalize('NFC').toLowerCase().trim();
  const aiNorm = ai.normalize('NFC').toLowerCase().trim();
  console.log("DB Norm:", dbNorm);
  console.log("AI Norm:", aiNorm);
  console.log("Equal?", dbNorm === aiNorm);
  
  function printCodePoints(str) {
    return Array.from(str).map(c => `\\u${c.codePointAt(0).toString(16).padStart(4, '0')}`).join(' ');
  }
  console.log("DB Code Points:", printCodePoints(db));
  console.log("AI Code Points:", printCodePoints(ai));
}

check(dbBrand, aiBrand, "Thương Hiệu");
check(dbOrigin, aiOrigin, "Xuất xứ");
