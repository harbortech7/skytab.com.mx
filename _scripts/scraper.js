import scrape from 'website-scraper';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const options = {
  urls: ['https://www.skytab.com/'],
  directory: path.join(__dirname, 'skytab-clone'),
  recursive: true,
  maxRecursiveDepth: 10,
  urlFilter: function(url) {
    if (url.includes('skytab.com')) {
      return true;
    }
    return false;
  },
  filenameGenerator: 'bySiteStructure',
  request: {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
    }
  }
};

console.log('Starting website scraping. This may take a while...');
scrape(options).then((result) => {
    console.log('Successfully scraped ' + result.length + ' pages/assets.');
}).catch((err) => {
    console.error('Error scraping:', err);
});
