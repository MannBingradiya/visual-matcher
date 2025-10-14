import fs from "fs";

export const loadProducts = (filePath) => {
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    console.log(`✅ Loaded ${data.length} product embeddings.`);
    return data;
  } else {
    console.warn("⚠️ No product embeddings file found.");
    return [];
  }
};
