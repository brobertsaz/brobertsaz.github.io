# Blog Post Creation Workflow

This document outlines the complete workflow for creating new blog posts with custom cover images.

## Step 1: Create the Blog Post

Create the markdown file in `_posts/` following the naming convention:
`YYYY-MM-DD-title-with-hyphens.md`

### Required Front Matter
```yaml
---
layout: post
title: "Your Post Title"
date: YYYY-MM-DD HH:MM:SS -0700
categories: [category1, category2]
tags: [tag1, tag2, tag3]
author: Bob Roberts
image: /assets/images/covers/your-image-name.svg
image_alt: Alt text for the image
image_position: center center
excerpt: "Brief description for social sharing and previews"
linkedin_blurb: |
  Ready-to-use LinkedIn post text that leads with value,
  tells the story, and invites engagement.

  Keep it conversational and specific. End with a call
  to action or question to encourage discussion.

  [Link will be auto-added by LinkedIn]
---
```

### LinkedIn Blurb Guidelines
The `linkedin_blurb` field should:
- **Lead with the key insight or pain point** - Hook readers immediately
- **Be conversational** - Write like you're talking to a colleague
- **Include specific details** - Concrete examples are more engaging
- **Invite engagement** - Ask questions or share relatable experiences
- **Be 3-5 short paragraphs** - Easy to scan on mobile
- **End naturally** - Don't include the link (LinkedIn adds it automatically)

### Image Naming Convention
- Use kebab-case (hyphens between words)
- Keep names descriptive but concise
- Example: `deployment-sidekiq-fix.svg`

## Step 2: Create the Custom SVG Cover Image

Create an SVG file in `assets/images/covers/` with dimensions 1200x630 (LinkedIn/social media standard).

### SVG Template Structure
```svg
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0b0f14"/>
      <stop offset="100%" stop-color="#0d1117"/>
    </linearGradient>
    <radialGradient id="r" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(1040 560) rotate(45) scale(520 340)">
      <stop offset="0" stop-color="#f85149" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#f85149" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="b" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(200 100) rotate(0) scale(440 300)">
      <stop offset="0" stop-color="#58a6ff" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#58a6ff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#r)"/>
  <rect width="1200" height="630" fill="url(#b)"/>
  <g font-family="Inter, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif" fill="#c9d1d9">
    <text x="80" y="300" font-size="56" font-weight="700">Your Main Title</text>
    <text x="80" y="350" font-size="30" fill="#9ea7b3">Subtitle / Category</text>
  </g>
</svg>
```

### Design Guidelines
- **Background**: Dark gradient (#0b0f14 to #0d1117) matching site theme
- **Accent colors**: Red (#f85149) and blue (#58a6ff) radial gradients for visual interest
- **Typography**: Inter font family, white text (#c9d1d9) for main title
- **Subtitle**: Lighter gray (#9ea7b3) for secondary text
- **Layout**: Title at y="300", subtitle at y="350", both starting at x="80"
- **Font sizes**: 56px for main title, 30px for subtitle

## Step 3: Convert SVG to PNG

After creating the SVG, run the conversion script to generate the PNG version for LinkedIn sharing:

```bash
npm run svg2png
```

This command:
- Converts all SVG files in `assets/images/covers/` to PNG format
- Creates 1200x630 PNG files optimized for social media
- Uses high-quality settings (density: 300, compression: 9)
- Applies dark background (#0d1117) for transparency safety

### What the Script Does
- Reads all `.svg` files in `assets/images/covers/`
- Converts each to a same-named `.png` file
- Optimizes for social media sharing (1200x630 resolution)
- Maintains visual quality with high density and compression settings

## Step 4: Verify the Results

After running the conversion:
1. Check that both `.svg` and `.png` files exist in `assets/images/covers/`
2. Verify the PNG looks correct (1200x630, proper colors, readable text)
3. Test the blog post locally to ensure images load properly

## Step 5: LinkedIn Sharing

### Using the LinkedIn Blurb
1. Copy the `linkedin_blurb` content from the post's front matter
2. Paste it into your LinkedIn post
3. Add the blog post URL (LinkedIn will automatically generate the preview card)
4. The PNG version will be used for the preview card

### LinkedIn Best Practices
- The PNG version will be used automatically for the preview card
- LinkedIn prefers 1200x630 images for optimal display
- The dark theme and high contrast ensure readability in social feeds
- Lead with value and invite engagement in your post text
- Keep the tone conversational and specific

## File Structure Example
```
assets/images/covers/
├── deployment-sidekiq-fix.svg    # Source SVG (created manually)
├── deployment-sidekiq-fix.png    # Generated PNG (via npm run svg2png)
├── other-post.svg
└── other-post.png
```

## Troubleshooting

### SVG Not Converting
- Ensure the SVG is valid XML
- Check that the file is in `assets/images/covers/`
- Verify Node.js and Sharp dependencies are installed

### PNG Quality Issues
- SVG text should use web-safe fonts
- Avoid very thin lines or small text
- Test at actual size (1200x630) before finalizing

### Missing Images in Posts
- Verify the `image:` path in front matter matches the actual file
- Ensure both SVG and PNG exist after conversion
- Check that Jekyll is rebuilding properly

## Quick Checklist

- [ ] Create blog post with proper front matter (including `linkedin_blurb`)
- [ ] Create custom SVG cover image (1200x630)
- [ ] Run `npm run svg2png` to generate PNG
- [ ] Verify both files exist and look correct
- [ ] Test blog post locally
- [ ] Copy `linkedin_blurb` for social sharing
- [ ] Ready for LinkedIn sharing with PNG preview
