import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';
import translate from 'translate';

translate.engine = 'google';
translate.from = 'en';
translate.key = process.env.GOOGLE_KEY; // can be empty for free tier

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cloneDir = path.join(__dirname, 'skytab-clone');

// A simple retry fetch for translation if we eventually use an API, 
// but since this is just a placeholder let's structure the script first.

function findHtmlFiles(dir) {
  return [path.join(dir, 'www.skytab.com', 'index.html')];
}

async function processFile(filePath) {
  console.log(`Processing ${filePath}`);
  const html = fs.readFileSync(filePath, 'utf-8');
  const $ = cheerio.load(html);
  
  // Find all text nodes that have content and are not inside script or style tags
  const textNodes = [];
  $('*').contents().each((i, el) => {
    if (el.type === 'text') {
      const parentTag = $(el).parent().get(0)?.name;
      if (parentTag && !['script', 'style', 'noscript', 'code'].includes(parentTag)) {
        const text = $(el).text().trim();
        if (text && text.length > 2 && /[a-zA-Z]/.test(text)) {
          textNodes.push(el);
        }
      }
    }
  });

  console.log(`Found ${textNodes.length} text nodes in ${filePath}`);
  
  // Translate in batches to avoid overwhelming the API
  const batchSize = 10;
  for (let i = 0; i < textNodes.length; i += batchSize) {
    const batch = textNodes.slice(i, i + batchSize);
    await Promise.all(batch.map(async (el) => {
      try {
        const originalText = $(el).text();
        // Extract leading and trailing whitespace to preserve formatting
        const leadingSpace = originalText.match(/^\s*/)[0];
        const trailingSpace = originalText.match(/\s*$/)[0];
        const textToTranslate = originalText.trim();
        
        if (textToTranslate) {
            const translatedText = await translate(textToTranslate, 'es');
            $(el).replaceWith(leadingSpace + translatedText + trailingSpace);
        }
      } catch (e) {
        // Silently skip translation errors for individual nodes
        console.error(`Error translating part of ${filePath}:`, e.message);
      }
    }));
    // Small delay between batches to respect rate limits
    // Removed delay for faster execution of the single file
  }
  
  fs.writeFileSync(filePath, $.html());
}

async function run() {
  if (!fs.existsSync(cloneDir)) {
    console.log('Clone directory not found. Have you run the scraper?');
    return;
  }
  
  const htmlFiles = findHtmlFiles(cloneDir);
  console.log(`Found ${htmlFiles.length} HTML files to translate.`);
  for (const file of htmlFiles) {
    await processFile(file);
  }
  console.log('Finished processing all files.');
}

run().catch(console.error);
