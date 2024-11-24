// convert.js

const axios = require('axios');
const TurndownService = require('turndown');
const fs = require('fs-extra');
const path = require('path');
const slugify = require('slugify');
const cheerio = require('cheerio'); // New dependency for HTML parsing
const crypto = require('crypto'); // For generating unique filenames if needed

// Configuration
const WORDPRESS_SITE = 'https://your-wordpress-site.com'; // Replace with your WordPress site URL
const OUTPUT_DIR = path.join(__dirname, 'markdown-posts');
const IMAGES_DIR = path.join(OUTPUT_DIR, 'images'); // Directory to save images
const PER_PAGE = 100; // Number of posts to fetch per request (max 100)
const TOTAL_POSTS = 500; // Adjust based on the total number of posts

// Initialize Turndown service
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
});

// Function to fetch posts from WordPress REST API
async function fetchPosts(page = 1, perPage = PER_PAGE) {
  try {
    const response = await axios.get(`${WORDPRESS_SITE}/wp-json/wp/v2/posts`, {
      params: {
        per_page: perPage,
        page: page,
        _embed: true, // To include embedded data like featured media
      },
      // If authentication is required, add headers here
      // headers: {
      //   Authorization: `Bearer YOUR_API_TOKEN`,
      // },
    });

    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 429) {
      console.error('Rate limited. Waiting before retrying...');
      await new Promise((resolve) => setTimeout(resolve, 60000)); // Wait 60 seconds
      return fetchPosts(page, perPage);
    } else {
      console.error('Error fetching posts:', error.message);
      return [];
    }
  }
}

// Function to fetch all posts
async function fetchAllPosts(totalPosts = TOTAL_POSTS) {
  const totalPages = Math.ceil(totalPosts / PER_PAGE);
  let allPosts = [];

  for (let page = 1; page <= totalPages; page++) {
    console.log(`Fetching page ${page} of ${totalPages}...`);
    const posts = await fetchPosts(page, PER_PAGE);
    if (posts.length === 0) break;
    allPosts = allPosts.concat(posts);
  }

  return allPosts;
}

// Function to download an image and save it locally
async function downloadImage(url, dest) {
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
    });

    // Ensure the destination directory exists
    await fs.ensureDir(path.dirname(dest));

    const writer = fs.createWriteStream(dest);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`Failed to download image ${url}:`, error.message);
  }
}

// Function to process and save a single post
async function processPost(post) {
  const title = post.title.rendered;
  const date = post.date;
  const modified = post.modified;
  const excerpt = post.excerpt.rendered.replace(/<[^>]+>/g, ''); // Strip HTML tags
  let contentHTML = post.content.rendered;
  const slug = post.slug;

  // Load HTML into Cheerio for parsing
  const $ = cheerio.load(contentHTML);

  // Array to keep track of downloaded images
  const downloadedImages = [];

  // Find all img tags
  $('img').each((index, img) => {
    let src = $(img).attr('src');

    if (src) {
      // Only process absolute URLs
      if (src.startsWith('http://') || src.startsWith('https://')) {
        downloadedImages.push(src);
      }
    }
  });

  // Download each image and replace the src in HTML
  for (const imgUrl of downloadedImages) {
    try {
      // Extract the image filename
      const urlPath = new URL(imgUrl).pathname;
      let filename = path.basename(urlPath);

      // Optionally, to avoid name collisions, you can prepend a hash or post slug
      // const hash = crypto.createHash('md5').update(imgUrl).digest('hex').slice(0, 8);
      // filename = `${hash}-${filename}`;

      // Define the local path
      const localImagePath = path.join(IMAGES_DIR, filename);

      // Download the image
      await downloadImage(imgUrl, localImagePath);

      console.log(`Downloaded image: ${imgUrl} to ${localImagePath}`);

      // Replace the src in HTML to point to the local image
      const relativeImagePath = `./images/${filename}`;
      contentHTML = contentHTML.replace(imgUrl, relativeImagePath);
    } catch (error) {
      console.error(`Error processing image ${imgUrl}:`, error.message);
    }
  }

  // Now, convert the modified HTML to Markdown
  const contentMarkdown = turndownService.turndown(contentHTML);

  // Front matter (YAML)
  const frontMatter = `---
title: "${title.replace(/"/g, '\\"')}"
date: "${date}"
modified: "${modified}"
excerpt: "${excerpt.replace(/"/g, '\\"')}"
slug: "${slug}"
categories: [${post.categories.join(', ')}]
tags: [${post.tags.join(', ')}]
---
  
`;

  const fullContent = frontMatter + contentMarkdown;

  // Generate a slugified filename
  const filename = `${slugify(slug, { lower: true, strict: true })}.md`;

  // Ensure the output directory exists
  await fs.ensureDir(OUTPUT_DIR);
  await fs.ensureDir(IMAGES_DIR); // Ensure images directory exists

  // Write the Markdown file
  const filePath = path.join(OUTPUT_DIR, filename);
  await fs.writeFile(filePath, fullContent, 'utf-8');
  console.log(`Saved Markdown: ${filePath}`);
}

// Main function
async function main() {
  try {
    console.log('Starting conversion...');
    const posts = await fetchAllPosts();

    console.log(`Fetched ${posts.length} posts.`);

    for (const post of posts) {
      await processPost(post);
    }

    console.log('All posts have been converted successfully.');
  } catch (error) {
    console.error('An error occurred:', error.message);
  }
}

main();
