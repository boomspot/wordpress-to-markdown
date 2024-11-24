# WordPress to Markdown Converter

A Node.js script to convert WordPress posts to Markdown files, including downloading and referencing all images locally. This tool is ideal for migrating your WordPress content to static site generators like Next.js, Gatsby, or any headless CMS.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Output](#output)
- [Customization](#customization)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Fetches WordPress Posts:** Retrieves posts via the WordPress REST API.
- **Converts HTML to Markdown:** Transforms post content from HTML to Markdown format.
- **Downloads Images:** Downloads all images within posts to a local directory.
- **Updates Image References:** Replaces remote image URLs in Markdown with local paths.
- **Handles Front Matter:** Adds YAML front matter with metadata for each Markdown file.
- **Prevents Filename Collisions:** Ensures unique image filenames to avoid conflicts.

## Prerequisites

Before using this script, ensure you have the following installed on your machine:

- **[Node.js](https://nodejs.org/) (v12 or later):** JavaScript runtime.
- **[npm](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/):** Package managers.

## Installation


 - **Clone the Repository**

   ```bash
   git clone https://github.com/your-username/wordpress-to-markdown.git
   cd wordpress-to-markdown

- **Install Dependencies**

   ```bash
   npm install or yarn install
   
- **Update Wordpress endpoint in script**

   ```bash
   const WORDPRESS_SITE = 'https://your-wordpress-site.com';

- **Set script permissions**

   ```bash
   chmod +x convert.js 
     
- **Run the script**

   ```bash
   node convert.js