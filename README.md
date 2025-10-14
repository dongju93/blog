# dongju93's Personal Blog

A modern, minimalist personal blog featuring technical articles about software engineering, AI, and cloud technologies. Built with vanilla HTML, CSS, and JavaScript, deployed on GitHub Pages with client-side Markdown rendering.

**Live Site**: [https://dongju93.github.io/blog/](https://dongju93.github.io/blog/)

## Features

- **Clean, Modern Design** - Minimalist aesthetic focused on readability
- **Dark Mode** - Automatic theme detection with manual toggle
- **Bilingual Support** - Content in both Korean and English
- **Responsive Layout** - Mobile-first design that works on all devices
- **Markdown Support** - Write blog posts in Markdown with client-side rendering
- **No Build Process** - Pure HTML/CSS/JS, no frameworks or build tools
- **Fast Loading** - Minimal dependencies and optimized assets
- **SEO Optimized** - Complete SEO implementation with Open Graph tags, Twitter Cards, JSON-LD structured data, sitemap.xml, and robots.txt
- **Copy to Markdown** - One-click functionality to copy blog posts as formatted Markdown
- **Smooth Navigation** - Hash-based anchor links with smooth scrolling to headings

## Structure

```
personal-blog/
├── index.html          # Homepage with post listing
├── post.html           # Individual post viewer
├── about.html          # About page with author information
├── css/
│   └── style.css       # Main styles (responsive, dark mode)
├── js/
│   └── blog.js         # Blog logic (markdown rendering, routing, SEO)
├── posts/
│   ├── posts.json      # Blog post metadata
│   └── *.md            # Individual markdown posts
├── sitemap.xml         # SEO sitemap for search engines
├── robots.txt          # Search engine crawler directives
└── README.md           # This file
```

## Getting Started

### Local Development

1. Clone this repository

   ```bash
   git clone https://github.com/dongju93/blog.git
   cd blog
   ```

2. Start a local development server:

   ```bash
   python -m http.server 8000
   # or
   npx serve
   ```

3. Open `http://localhost:8000` in your browser

### Adding New Posts

1. Create a new Markdown file in the `posts/` directory (e.g., `my-new-post.md`)

2. Add post metadata to `posts/posts.json`:

   ```json
   {
     "id": "my-new-post",
     "title": "My New Post",
     "date": "2025-01-15",
     "file": "my-new-post.md",
     "excerpt": "A brief description of the post (shown on homepage)",
     "tags": ["tag1", "tag2"],
     "readingTime": "5 min read"
   }
   ```

3. Update `sitemap.xml` with the new post entry:

   ```xml
   <url>
     <loc>https://dongju93.github.io/blog/post.html?id=my-new-post</loc>
     <lastmod>2025-01-15</lastmod>
     <changefreq>monthly</changefreq>
     <priority>0.9</priority>
   </url>
   ```

4. Commit and push your changes - the post will automatically appear on the homepage

**Note**: Reading time is manually specified in posts.json. Calculate using approximately 200 words per minute or use the built-in `PostManager.calculateReadingTime()` function.

## Deployment to GitHub Pages

This blog is deployed as a **GitHub Pages project site** at `https://dongju93.github.io/blog/`.

### Deployment Configuration

**Current Setup (Project Site)**:

1. Repository name: `blog`
2. Deployed from: `main` branch
3. URL pattern: `https://username.github.io/blog/`
4. All navigation paths use `/blog/` prefix

**Path Configuration**: If you fork this repository with a different name, update all `/blog/` references in:

- `index.html` (lines 18, 62, 63)
- `post.html` (lines 14, 59, 60, 68, 107)
- `about.html` (lines 17, 62, 63, 181)
- `js/blog.js` (line 91)
- `sitemap.xml` (all `<loc>` entries)

### Deployment Steps

1. Ensure all posts are listed in `posts/posts.json`
2. Update `sitemap.xml` with new posts
3. Test locally using `python -m http.server 8000`
4. Commit and push to the `main` branch
5. Enable GitHub Pages in repository **Settings** → **Pages** → **Source**: `main` branch
6. Site will be live at `https://username.github.io/repository-name/`

## Customization

### Colors and Theme

Edit CSS variables in `css/style.css`:

```css
:root {
  --accent: #6366f1; /* Primary accent color */
  --bg-primary: #ffffff; /* Background color */
  --text-primary: #212529; /* Text color */
  /* ... more variables */
}
```

### Site Information

To customize for your own blog, update:

- **index.html** - Site title, description, and homepage hero section
- **post.html** - Site title
- **about.html** - Author bio, skills, work experience, education, and links
- **js/blog.js** - SEOManager configuration (siteUrl, siteName, author)
- **sitemap.xml** - Replace dongju93.github.io/blog with your URL
- **README.md** - This file

### Adding Features

The blog is intentionally simple and framework-free. You can easily extend it with:

- **Syntax highlighting** - Add Highlight.js CDN and uncomment the highlighting code in js/blog.js:174-178
- **Comments** - Integrate Disqus, utterances, or giscus
- **Analytics** - Add Google Analytics, Plausible, or similar
- **Search functionality** - Implement client-side search with Fuse.js or lunr.js
- **RSS feed** - Generate RSS XML file for feed readers
- **Reading progress bar** - Track scroll position and display progress
- **Table of contents** - Auto-generate TOC from post headings

## Browser Support

This blog supports all modern browsers:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Technologies Used

- **HTML5** - Semantic markup
- **CSS3** - Custom properties, Grid, Flexbox
- **JavaScript (ES6+)** - Modern JavaScript features
- **Marked.js** - Markdown parsing (CDN)

## Performance

- Lighthouse Score: 95+
- First Contentful Paint: < 1s
- Time to Interactive: < 2s
- Total Bundle Size: < 50KB (excluding images)

## SEO

Complete SEO implementation included:

- **Semantic HTML** - Proper document structure with semantic HTML5 elements
- **Meta Tags** - Description, keywords, and author meta tags
- **Open Graph** - Full Open Graph protocol implementation for social media sharing (og:title, og:description, og:type, og:url, og:site_name)
- **Twitter Cards** - Twitter-specific meta tags (twitter:card, twitter:title, twitter:description)
- **Structured Data** - JSON-LD schema.org markup (BlogPosting for posts, Blog for homepage)
- **Sitemap.xml** - XML sitemap listing all pages and posts with lastmod dates
- **Robots.txt** - Search engine crawler directives (allows all)
- **Canonical URLs** - Prevents duplicate content issues
- **Mobile-friendly** - Responsive design passes mobile-friendly test
- **Fast Loading** - Optimized performance (Lighthouse score 95+)

The SEOManager module (js/blog.js) automatically updates meta tags and injects structured data when posts are loaded.

## Accessibility

- ARIA labels where appropriate
- Keyboard navigation support
- Good color contrast ratios
- Responsive font sizes
- Semantic heading hierarchy

## Technical Architecture

**Key Components** (see js/blog.js):

- **ThemeManager** - Manages dark/light theme switching with localStorage persistence
- **PostManager** - Handles post loading, rendering, and Markdown parsing with Marked.js
- **BackToTopManager** - Controls floating "Back to Top" button visibility
- **CopyManager** - Implements "Copy as Markdown" functionality
- **SEOManager** - Dynamically updates SEO meta tags and structured data

## License

MIT License - feel free to fork and use this for your own blog!

## Contributing

Suggestions and improvements are welcome! Feel free to open an issue or submit a pull request.

## Author

**dongju93** - Backend Software Engineer specializing in Python, Go, and distributed systems.

- GitHub: [@dongju93](https://github.com/dongju93)
- Blog: [https://dongju93.github.io/blog/](https://dongju93.github.io/blog/)

## Acknowledgments

- Markdown rendering powered by [Marked.js](https://marked.js.org/)
- Built following GitHub Pages and SEO best practices
- Inspired by modern minimalist blog designs

---

Built with vanilla JavaScript • No frameworks • No build process
