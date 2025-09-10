# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- Static site built with Jekyll, optimized for GitHub Pages.
- Ruby-managed via Bundler; plugins include jekyll-feed, jekyll-sitemap, jekyll-seo-tag, and jekyll-paginate.
- CI/CD: GitHub Actions workflow builds with Ruby 3.1 and deploys to GitHub Pages.

Common commands
- Install dependencies:
  - bundle install
- Run development server (auto-regenerates on changes):
  - bundle exec jekyll serve
  - With drafts: bundle exec jekyll serve --drafts
- Build the site (outputs to _site/):
  - bundle exec jekyll build
  - Production build: JEKYLL_ENV=production bundle exec jekyll build
- Validate configuration and environment:
  - bundle exec jekyll doctor
- Clean caches and build output:
  - bundle exec jekyll clean

Notes for macOS developers
- Ensure a compatible Ruby (README suggests Ruby 3.1+) and Bundler are installed.
- If you hit missing webrick when serving locally, it is pinned in Gemfile; ensure bundle install has completed successfully.

Running a focused content preview
- Serve and view only recent changes: use jekyll serve as above; Jekyll will regenerate only changed files.
- To preview draft posts (files under _drafts/), use --drafts.

Repository structure and architecture
- Site configuration: _config.yml
  - Sets markdown (kramdown), syntax highlighting (rouge), plugins, pagination, SEO metadata, and collection defaults.
  - Collections: posts output with permalink pattern /:categories/:year/:month/:day/:title/.
- Layout system (templating):
  - _layouts/default.html: Base HTML skeleton. Includes head, header, footer, and yields page content.
  - _layouts/home.html: Home page composition, renders a grid of recent posts and a CTA to view all posts.
  - _layouts/page.html and _layouts/post.html: Standard page and post templates.
  - _includes/head.html: SEO tags (jekyll-seo-tag), CSS, feed metadata, favicons, and optional Google Analytics include in production.
  - _includes/header.html and _includes/footer.html: Site-wide navigation and footer elements.
- Content model:
  - Root-level pages (e.g., index.md, about.md, archive.md, contact.md, resume.md) use YAML front matter to select a layout and set metadata.
  - Blog posts in _posts/ use standard Jekyll naming (YYYY-MM-DD-title.md) with front matter specifying title, date, categories, tags, author, and optional image metadata used by home/post previews.
  - search.json and search.md support client-side search if implemented; search.json is generated and consumed by front-end scripts or themes.
- Styling pipeline:
  - assets/css/main.scss is the Jekyll SASS entrypoint importing partials from _sass/.
  - _sass/_variables.scss defines the dark theme color system and typographic/spacing scales used across partials (_base.scss, _layout.scss, _components.scss, _syntax-highlighting.scss).
  - The compiled CSS is linked from _includes/head.html as /assets/css/main.css.
- Pagination and feeds:
  - jekyll-paginate exposes paginate and paginate_path in _config.yml; home and/or archive pages can iterate site.posts accordingly.
  - jekyll-feed auto-generates Atom feed metadata via feed_meta in head include.
- SEO:
  - jekyll-seo-tag outputs SEO and social tags in head; _config.yml sets site/author metadata and logo.

CI/CD
- Workflow: .github/workflows/jekyll.yml
  - Triggers on push/PR to main or master.
  - Uses ruby/setup-ruby@v1 (Ruby 3.1, bundler-cache: true).
  - Builds with: bundle exec jekyll build --baseurl "${{ steps.pages.outputs.base_path }}" and JEKYLL_ENV=production.
  - Publishes via actions/deploy-pages@v4 to the GitHub Pages environment.

Local vs. Pages differences
- Local serve uses baseurl from _config.yml (empty string here). GitHub Pages build injects a base path via the workflow; avoid hardcoding absolute links—prefer relative_url and absolute_url filters.

Conventions used by content
- Posts often specify image, image_alt, and image_position in front matter; _layouts/home.html and post previews account for these fields.
- categories and tags drive permalinks and grouping; ensure categories are lowercased and URL-safe for clean paths.

Helpful troubleshooting
- If CSS doesn’t load locally, ensure the front matter at the top of assets/css/main.scss is present (the two --- lines) so Jekyll processes it.
- If drafts aren’t showing, include --drafts when serving.
- If pagination isn’t working, confirm jekyll-paginate is installed and configured and that the relevant layout uses the paginate variables.

Source references
- Core config: _config.yml
- Bundler deps: Gemfile
- Entrypoints: index.md (home), _layouts/*.html, _includes/*.html
- Styles: assets/css/main.scss, _sass/*.scss
- CI/CD: .github/workflows/jekyll.yml

