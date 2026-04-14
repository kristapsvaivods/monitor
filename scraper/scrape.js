import Parser from 'rss-parser';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const parser = new Parser();

const rssFeeds = [
    { name: "delfi.lv", url: "https://www.delfi.lv/rss" },
    { name: "tvnet.lv", url: "https://www.tvnet.lv/rss" },
    { name: "apollo.lv", url: "https://www.apollo.lv/rss" },
    { name: "db.lv",     url: "https://www.db.lv/rss" },
];

const articles = [];

async function scrapeRSS() {
    console.log("Fetching RSS feeds...");

    for (const feed of rssFeeds) {
        try {
            const feedData = await parser.parseURL(feed.url);
            
            feedData.items.forEach(item => {
                const title = item.title || '';
                const content = (item.contentSnippet || item.content || '').toLowerCase();
                
                if (title.toLowerCase().includes('kalve') || content.includes('kalve')) {
                    articles.push({
                        source: feed.name,
                        title: title,
                        link: item.link,
                        time: item.pubDate ? new Date(item.pubDate).toLocaleDateString('lv-LV') : 'Recently',
                        summary: item.contentSnippet ? item.contentSnippet.substring(0, 180) + '...' : ''
                    });
                }
            });
            
            console.log(`✓ ${feed.name}: ${feedData.items.length} items checked`);
        } catch (err) {
            console.log(`✗ Failed to fetch ${feed.name}:`, err.message);
        }
    }
}

async function fallbackScrape() {
    // Light fallback for la.lv and skaties.lv if needed
    console.log("Running fallback scrape for other sites...");
    // You can expand this later if RSS is not enough
}

async function main() {
    await scrapeRSS();
    // await fallbackScrape();   // uncomment if you want to add more

    const output = {
        lastUpdated: new Date().toLocaleString('lv-LV', { 
            timeZone: 'Europe/Riga',
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        }),
        articles: articles.slice(0, 15)   // limit to 15 newest relevant
    };

    const dataDir = join(__dirname, '../data');
    if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

    writeFileSync(join(dataDir, 'news.json'), JSON.stringify(output, null, 2));
    
    console.log(`✅ Done! Saved ${articles.length} relevant Kalve articles.`);
}

main().catch(err => {
    console.error("Critical error:", err);
    process.exit(1);
});
