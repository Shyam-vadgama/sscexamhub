
import Parser from 'rss-parser';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase environment variables.');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const parser = new Parser();

// RSS Feeds
const FEEDS = [
  // Google News - Education (India Edition) - Last 24 hours
  'https://news.google.com/rss/search?q=education+when:24h&hl=en-IN&gl=IN&ceid=IN:en'
];

interface NewsItem {
  title: string;
  link: string;
  description?: string;
  pubDate: string;
  source: string;
}

async function fetchNews() {
  console.log('Starting news fetch...');
  const newItems: NewsItem[] = [];

  for (const url of FEEDS) {
    try {
      console.log(`Fetching feed: ${url}`);
      const feed = await parser.parseURL(url);

      for (const item of feed.items) {
        // Basic validation
        if (!item.title || !item.link || !item.pubDate) continue;

        // Clean description (Google News often has HTML)
        // We'll keep it simple for now, maybe strip some tags if needed
        // but often the description in RSS is a snippet.
        
        newItems.push({
          title: item.title,
          link: item.link,
          description: item.contentSnippet || item.content || '',
          pubDate: new Date(item.pubDate).toISOString(),
          source: item.source || 'Google News'
        });
      }
    } catch (error) {
      console.error(`Error fetching feed ${url}:`, error);
    }
  }

  console.log(`Found ${newItems.length} potential items.`);
  
  // Process items
  let addedCount = 0;
  for (const item of newItems) {
    try {
      // Check for duplicates
      const { data: existing } = await supabase
        .from('news')
        .select('id')
        .eq('link', item.link)
        .single();

      if (existing) {
        // console.log(`Skipping duplicate: ${item.title}`);
        continue;
      }

      // Insert new item
      const { error } = await supabase
        .from('news')
        .insert({
          title: item.title,
          link: item.link,
          description: item.description,
          pub_date: item.pubDate,
          source: item.source
        });

      if (error) {
        console.error(`Error inserting item "${item.title}":`, error.message);
      } else {
        console.log(`Added: ${item.title}`);
        addedCount++;
      }
    } catch (error) {
      console.error('Error processing item:', error);
    }
  }

  console.log(`Job complete. Added ${addedCount} new articles.`);
}

fetchNews().catch(console.error);
