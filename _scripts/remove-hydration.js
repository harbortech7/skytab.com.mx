import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// The target directory is the root of the cloned project (one level up from _scripts)
const targetDir = path.join(__dirname, '..'); 

function findHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (file !== '_scripts' && file !== '.git') {
        findHtmlFiles(filePath, fileList);
      }
    } else if (filePath.endsWith('.html') || filePath.endsWith('.htm')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

try {
  const htmlFiles = findHtmlFiles(targetDir);
  console.log(`Found ${htmlFiles.length} HTML files to strip Next.js scripts from.`);

  for (const file of htmlFiles) {
    let html = fs.readFileSync(file, 'utf-8');
    // Regex to match <script src="..._next/static/...">...</script>
    html = html.replace(/<script[^>]*src="[^"]*_next\/static\/[^"]*"[^>]*><\/script>/g, '');
    // Regex to match the __NEXT_DATA__ json payload
    html = html.replace(/<script[^>]*id="__NEXT_DATA__"[^>]*>[\s\S]*?<\/script>/gi, '');
    
    fs.writeFileSync(file, html);
  }
  console.log('Successfully stripped Next.js hydration scripts from all files!');
} catch (error) {
  console.error("Error modifying files:", error);
}
