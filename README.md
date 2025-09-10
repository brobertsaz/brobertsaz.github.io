# Bob Roberts' Blog

A modern, dark-themed Jekyll blog built for GitHub Pages deployment.

## 🌟 Features

- **Modern Dark Theme**: Clean, professional design optimized for readability
- **Responsive Design**: Looks great on desktop, tablet, and mobile devices
- **Fast Performance**: Optimized CSS and minimal JavaScript
- **SEO Optimized**: Built-in SEO tags and structured data
- **Syntax Highlighting**: Beautiful code highlighting for technical posts
- **GitHub Pages Ready**: Configured for seamless deployment

## 🚀 Quick Start

### Prerequisites

- Ruby 3.1 or higher
- Bundler gem

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/brobertsaz/brobertsaz.github.io.git
   cd brobertsaz.github.io
   ```

2. Install dependencies:
   ```bash
   bundle install
   ```

3. Start the development server:
   ```bash
   bundle exec jekyll serve
   ```

4. Open your browser to `http://localhost:4000`

### Creating New Posts

Create a new file in the `_posts` directory with the format:
```
YYYY-MM-DD-title-of-post.md
```

Example:
```markdown
---
layout: post
title: "Your Post Title"
date: 2024-01-15 10:00:00 -0700
categories: [category1, category2]
tags: [tag1, tag2, tag3]
author: Bob Roberts
excerpt: "A brief description of your post that appears in previews."
---

# Your Post Content

Write your post content here using Markdown.
```

## 🎨 Customization

### Colors

The theme uses CSS custom properties for easy customization. Edit `_sass/_variables.scss`:

```scss
:root {
  --bg-primary: #0d1117;      // Main background
  --bg-secondary: #161b22;    // Card backgrounds
  --text-primary: #f0f6fc;    // Main text
  --accent-primary: #58a6ff;  // Links and accents
  // ... more variables
}
```

### Site Configuration

Edit `_config.yml` to customize:

- Site title and description
- Social media links
- Navigation menu
- SEO settings

### Adding Pages

Create new pages by adding Markdown files to the root directory:

```markdown
---
layout: page
title: "Page Title"
permalink: /page-url/
---

# Page Content
```

## 📁 Project Structure

```
├── _includes/          # Reusable HTML components
├── _layouts/           # Page templates
├── _posts/             # Blog posts
├── _sass/              # Sass stylesheets
├── assets/             # CSS, JS, images
├── .github/workflows/  # GitHub Actions
├── _config.yml         # Jekyll configuration
├── Gemfile             # Ruby dependencies
└── index.md            # Homepage
```

## 🚀 Deployment

This site is configured for automatic deployment to GitHub Pages using GitHub Actions.

### Setup

1. Go to your repository settings
2. Navigate to Pages section
3. Set Source to "GitHub Actions"
4. Push to the main branch to trigger deployment

The site will be available at `https://yourusername.github.io`

### Manual Deployment

You can also build and deploy manually:

```bash
# Build the site
bundle exec jekyll build

# The built site will be in the _site directory
```

## 🛠️ Development

### Adding New Features

1. **Styles**: Add new styles to the appropriate file in `_sass/`
2. **Layouts**: Create new layouts in `_layouts/`
3. **Components**: Add reusable components to `_includes/`
4. **Assets**: Add images, fonts, etc. to `assets/`

### Testing

Test your changes locally before deploying:

```bash
# Start development server with drafts
bundle exec jekyll serve --drafts

# Build for production
JEKYLL_ENV=production bundle exec jekyll build
```

## 📝 Writing Tips

- Use descriptive titles and excerpts
- Add relevant tags and categories
- Include code examples with syntax highlighting
- Optimize images for web (WebP format recommended)
- Write engaging introductions and conclusions

## 🤝 Contributing

Feel free to submit issues and pull requests to improve the theme or fix bugs.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🔗 Links

- **Live Site**: [https://brobertsaz.github.io](https://brobertsaz.github.io)
- **GitHub**: [https://github.com/brobertsaz](https://github.com/brobertsaz)

---

Built with ❤️ using Jekyll and GitHub Pages
