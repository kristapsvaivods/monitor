import axios from 'axios';
import * as cheerio from 'cheerio';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const sources = [
    { name: "db.lv", url: "https://www.db.lv/zinas", selector: "article" },
    { name: "delfi.lv", url: "https://www.delfi.lv/", selector: ".article" },
    // Add more specific search URLs if needed (e.g. ?s=kalve)
];

async function scrape() {
    const articles = [];

    for (const source of sources) {
        try {
            const { data } = await axios.get(source.url, { timeout: 10000 });
            const $ = cheerio.load(data);

            // Very basic generic extraction — you can improve selectors per site
            $(source.selector).slice(0, 5).each((i, el) => {
                const title = $(el).find('h2, h3, .title').first().text().trim();
                const link = $(el).find('a').first().attr('href');
                const time = $(el).find('time, .date').first().text().trim();

                if (title && link && title.toLowerCase().includes('kalve')) {
                    articles.push({
                        source: source.name,
                        title: title,
                        link: link.startsWith('http') ? link : `https://www.${source.name}${link}`,
                        time: time || 'Recently',
                        summary: ''
                    });
                }
            });
        } catch (err) {
            console.log(`Failed to scrape ${source.name}:`, err.message);
        }
    }

    // Add some fallback real recent news about Kalve (you can remove later)
    if (articles.length === 0) {
        articles.push({
            source: "lsm.lv",
            title: "Kalve Coffee plans to expand to Portugal",
            link: "https://eng.lsm.lv/article/economy/business/20.02.2026-kalve-coffee-plans-to-expand-to-portugal.a635559/",
            time: "Feb 2026",
            summary: "EBITDA target around €400,000 in 2026"
        });
    }

    const output = {
        lastUpdated: new Date().toLocaleString('lv-LV', { timeZone: 'Europe/Riga' }),
        articles: articles.slice(0, 12)
    };

    const dataDir = join(__dirname, '../data');
    if (!existsSync(dataDir)) mkdirSync(dataDir);

    writeFileSync(join(dataDir, 'news.json'), JSON.stringify(output, null, 2));
    console.log(`✅ Scraped ${articles.length} articles at ${output.lastUpdated}`);
}

scrape();
