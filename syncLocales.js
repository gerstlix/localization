import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const baseLang = "ru";
const targetLangs = ["en", "kz", "ua"];
const directories = ["sites", "lua", "bots"];

const syncObjects = async (baseObj, targetObj, lang) => {
  for (const key in baseObj) {
    if (typeof baseObj[key] === "object" && baseObj[key] !== null && !Array.isArray(baseObj[key])) {
      if (!(key in targetObj) || typeof targetObj[key] !== "object") {
        targetObj[key] = {};
      }
      await syncObjects(baseObj[key], targetObj[key], lang);
    } else {
      if (!(key in targetObj)) {
        targetObj[key] = baseObj[key];
      }
    }
  }
  for (const key in targetObj) {
    if (!(key in baseObj)) {
      delete targetObj[key];
    }
  }
};

const processFolder = async folderPath => {
  const files = await fs.readdir(folderPath);
  const baseFilePath = path.join(folderPath, `${baseLang}.json`);
  if (!files.includes(`${baseLang}.json`)) {
    console.warn(`Файл ${baseLang}.json не найден в ${folderPath}, пропускаем...`);
    return;
  }
  const baseContent = await fs.readJson(baseFilePath);
  for (const lang of targetLangs) {
    const langFilePath = path.join(folderPath, `${lang}.json`);
    let langContent = fs.existsSync(langFilePath) ? await fs.readJson(langFilePath) : {};
    await syncObjects(baseContent, langContent, lang);
    await fs.writeJson(langFilePath, langContent, { spaces: 2 });
    console.log(`Файл ${lang}.json обновлен в ${folderPath}`);
  }
};

const syncLocales = async () => {
  for (const dir of directories) {
    const folderPath = path.join(__dirname, dir);
    if (fs.existsSync(folderPath)) {
      await processFolder(folderPath);
    } else {
      console.warn(`Папка ${dir} не найдена, пропускаем...`);
    }
  }
};

(async () => {
  await syncLocales();
})();
