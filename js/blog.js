// Blog functionality
(function() {
    'use strict';

    // Theme management
    const ThemeManager = {
        init() {
            this.themeToggle = document.getElementById('theme-toggle');
            this.currentTheme = localStorage.getItem('theme') ||
                (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

            this.setTheme(this.currentTheme);
            this.bindEvents();
        },

        setTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            this.currentTheme = theme;
        },

        toggleTheme() {
            const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
            this.setTheme(newTheme);
        },

        bindEvents() {
            if (this.themeToggle) {
                this.themeToggle.addEventListener('click', () => this.toggleTheme());
            }
        }
    };

    // Post management
    const PostManager = {
        postsData: null,
        currentMarkdown: null,
        currentPost: null,

        async init() {
            await this.loadPosts();

            // Check which page we're on
            const isPostPage = document.getElementById('post-content') !== null;

            if (isPostPage) {
                await this.renderPost();
            } else {
                this.renderPostList();
            }
        },

        async loadPosts() {
            try {
                const response = await fetch('posts/posts.json');
                if (!response.ok) throw new Error('Failed to load posts');
                this.postsData = await response.json();
            } catch (error) {
                console.error('Error loading posts:', error);
                this.showError('Failed to load blog posts. Please try again later.');
            }
        },

        renderPostList() {
            const container = document.getElementById('posts-container');
            if (!container || !this.postsData) return;

            // Sort posts by date (newest first)
            const sortedPosts = [...this.postsData].sort((a, b) =>
                new Date(b.date) - new Date(a.date)
            );

            container.innerHTML = sortedPosts.map(post => this.createPostCard(post)).join('');
        },

        createPostCard(post) {
            const date = new Date(post.date);
            const formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const tagsHTML = post.tags
                ? post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')
                : '';

            return `
                <article class="post-card">
                    <h3 class="post-card-title">
                        <a href="/blog/post.html?id=${post.id}">${post.title}</a>
                    </h3>
                    <div class="post-card-meta">
                        <time datetime="${post.date}">${formattedDate}</time>
                        ${post.readingTime ? `<span>${post.readingTime}</span>` : ''}
                    </div>
                    <p class="post-card-excerpt">${post.excerpt}</p>
                    ${tagsHTML ? `<div class="post-card-tags">${tagsHTML}</div>` : ''}
                </article>
            `;
        },

        async renderPost() {
            const urlParams = new URLSearchParams(window.location.search);
            const postId = urlParams.get('id');

            if (!postId) {
                this.showError('Post not found');
                return;
            }

            const post = this.postsData?.find(p => p.id === postId);
            if (!post) {
                this.showError('Post not found');
                return;
            }

            // Store current post for copy functionality
            this.currentPost = post;

            // Update page metadata
            document.title = `${post.title} | dongju93's Blog`;
            document.getElementById('post-title').textContent = post.title;
            document.getElementById('article-title').textContent = post.title;

            // Update SEO meta tags
            SEOManager.updatePostMeta(post);

            const date = new Date(post.date);
            const formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            document.getElementById('post-date').textContent = formattedDate;

            if (post.readingTime) {
                document.getElementById('reading-time').textContent = post.readingTime;
            }

            // Load and render markdown content
            try {
                const response = await fetch(`posts/${post.file}`);
                if (!response.ok) throw new Error('Failed to load post content');

                const markdown = await response.text();

                // Store the markdown for copy functionality
                this.currentMarkdown = markdown;

                // Configure marked to generate heading IDs with custom renderer
                const renderer = new marked.Renderer();
                const originalHeading = renderer.heading.bind(renderer);

                renderer.heading = function(text, level, raw) {
                    // Generate ID from heading text
                    const id = raw
                        .toLowerCase()
                        .trim()
                        .replace(/[^\w\s가-힣-]/g, '') // Keep alphanumeric, spaces, Korean, and hyphens
                        .replace(/\s+/g, '-'); // Replace spaces with hyphens

                    return `<h${level} id="${id}">${text}</h${level}>\n`;
                };

                marked.setOptions({
                    renderer: renderer,
                    headerIds: true,
                    mangle: false
                });

                const html = marked.parse(markdown);

                document.getElementById('post-content').innerHTML = html;

                // Add syntax highlighting if available
                if (window.hljs) {
                    document.querySelectorAll('pre code').forEach((block) => {
                        hljs.highlightElement(block);
                    });
                }

                // Handle hash navigation after content loads
                this.handleHashNavigation();

                // Add click handlers for internal anchor links
                this.setupInternalLinkHandlers();
            } catch (error) {
                console.error('Error loading post content:', error);
                this.showError('Failed to load post content. Please try again later.');
            }
        },

        showError(message) {
            const container = document.getElementById('posts-container') ||
                            document.getElementById('post-content');
            if (container) {
                container.innerHTML = `
                    <div class="loading" style="color: var(--accent);">
                        ${message}
                    </div>
                `;
            }
        },

        handleHashNavigation() {
            // Handle hash navigation to anchors in the markdown content
            const hash = window.location.hash;
            if (hash) {
                // Use setTimeout to ensure DOM is fully rendered
                setTimeout(() => {
                    const targetId = decodeURIComponent(hash.substring(1));
                    const targetElement = document.getElementById(targetId);

                    if (targetElement) {
                        // Calculate header height and add padding
                        const header = document.querySelector('.site-header');
                        const headerHeight = header ? header.offsetHeight : 0;
                        const offset = 20; // Additional padding

                        // Get target position
                        const elementPosition = targetElement.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - headerHeight - offset;

                        // Scroll to position with smooth behavior
                        window.scrollTo({
                            top: offsetPosition,
                            behavior: 'smooth'
                        });
                    }
                }, 100);
            }
        },

        setupInternalLinkHandlers() {
            // Add click handlers for all internal anchor links in the post content
            const postContent = document.getElementById('post-content');
            if (!postContent) return;

            postContent.addEventListener('click', (e) => {
                // Check if clicked element is a link or contains a link
                const link = e.target.closest('a');
                if (!link) return;

                const href = link.getAttribute('href');

                // Check if it's an internal anchor link (starts with #)
                if (href && href.startsWith('#')) {
                    e.preventDefault();

                    const targetId = decodeURIComponent(href.substring(1));
                    const targetElement = document.getElementById(targetId);

                    if (targetElement) {
                        // Update URL hash without triggering page reload
                        history.pushState(null, null, href);

                        // Calculate header height and add padding
                        const header = document.querySelector('.site-header');
                        const headerHeight = header ? header.offsetHeight : 0;
                        const offset = 20; // Additional padding

                        // Get target position
                        const elementPosition = targetElement.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - headerHeight - offset;

                        // Scroll to position with smooth behavior
                        window.scrollTo({
                            top: offsetPosition,
                            behavior: 'smooth'
                        });
                    } else {
                        console.warn('Target element not found:', targetId);
                        console.log('Available heading IDs:',
                            Array.from(document.querySelectorAll('h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]'))
                                .map(h => h.id)
                        );
                    }
                }
            });
        },

        calculateReadingTime(text) {
            const wordsPerMinute = 200;
            const wordCount = text.trim().split(/\s+/).length;
            const minutes = Math.ceil(wordCount / wordsPerMinute);
            return `${minutes} min read`;
        }
    };

    // Back to Top button management
    const BackToTopManager = {
        init() {
            this.button = document.getElementById('back-to-top');
            if (!this.button) return;

            this.bindEvents();
            this.checkScroll();
        },

        bindEvents() {
            // Show/hide button based on scroll position
            window.addEventListener('scroll', () => this.checkScroll());

            // Scroll to top when clicked
            this.button.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        },

        checkScroll() {
            // Show button when scrolled down 300px from the top
            if (window.scrollY > 300) {
                this.button.classList.add('visible');
            } else {
                this.button.classList.remove('visible');
            }
        }
    };

    // Copy Markdown functionality
    const CopyManager = {
        init() {
            this.button = document.getElementById('copy-markdown-btn');
            if (!this.button) return;

            this.buttonText = this.button.querySelector('.copy-btn-text');
            this.originalText = this.buttonText.textContent;
            this.bindEvents();
        },

        bindEvents() {
            this.button.addEventListener('click', () => this.copyMarkdown());
        },

        async copyMarkdown() {
            if (!PostManager.currentMarkdown || !PostManager.currentPost) {
                this.showFeedback('No content to copy', false);
                return;
            }

            try {
                // Prepend title as H1 to the markdown content
                const title = PostManager.currentPost.title;
                const markdownWithTitle = `# ${title}\n\n${PostManager.currentMarkdown}`;

                await navigator.clipboard.writeText(markdownWithTitle);
                this.showFeedback('Copied!', true);
            } catch (error) {
                console.error('Failed to copy:', error);
                this.showFeedback('Failed to copy', false);
            }
        },

        showFeedback(message, success) {
            // Update button text
            this.buttonText.textContent = message;
            this.button.classList.add(success ? 'success' : 'error');

            // Reset after 2 seconds
            setTimeout(() => {
                this.buttonText.textContent = this.originalText;
                this.button.classList.remove('success', 'error');
            }, 2000);
        }
    };

    // SEO management
    const SEOManager = {
        siteUrl: 'https://dongju93.github.io/blog',
        siteName: "dongju93's Blog",
        author: 'dongju93',
        defaultImage: null, // Add your default OG image URL here

        /**
         * Update meta tags for post pages
         * @param {Object} post - Post object from posts.json
         */
        updatePostMeta(post) {
            if (!post) return;

            const url = `${this.siteUrl}/post.html?id=${post.id}`;
            const description = post.excerpt || '';
            const keywords = post.tags ? post.tags.join(', ') : '';

            // Update basic meta tags
            this.updateMetaTag('description', description);
            this.updateMetaTag('keywords', keywords);

            // Update Open Graph tags
            this.updateMetaTag('og:type', 'article', 'property');
            this.updateMetaTag('og:title', post.title, 'property');
            this.updateMetaTag('og:description', description, 'property');
            this.updateMetaTag('og:url', url, 'property');
            this.updateMetaTag('og:site_name', this.siteName, 'property');

            if (this.defaultImage) {
                this.updateMetaTag('og:image', this.defaultImage, 'property');
            }

            // Update Twitter Card tags
            this.updateMetaTag('twitter:card', 'summary_large_image', 'name');
            this.updateMetaTag('twitter:title', post.title, 'name');
            this.updateMetaTag('twitter:description', description, 'name');

            if (this.defaultImage) {
                this.updateMetaTag('twitter:image', this.defaultImage, 'name');
            }

            // Update article-specific tags
            this.updateMetaTag('article:published_time', post.date, 'property');
            this.updateMetaTag('article:author', this.author, 'property');

            if (post.tags) {
                // Remove existing article:tag meta tags
                const existingTags = document.querySelectorAll('meta[property="article:tag"]');
                existingTags.forEach(tag => tag.remove());

                // Add new article:tag meta tags
                post.tags.forEach(tag => {
                    this.createMetaTag('article:tag', tag, 'property');
                });
            }

            // Update canonical URL
            this.updateCanonicalURL(url);

            // Inject structured data
            this.injectStructuredData(post);
        },

        /**
         * Update homepage meta tags
         */
        updateHomepageMeta() {
            const url = this.siteUrl;
            const description = 'A personal blog about software engineering, AI, cloud technologies, and modern development practices. Sharing insights on FastAPI, AI frameworks, and technical explorations.';

            // Update basic meta tags
            this.updateMetaTag('description', description);

            // Update Open Graph tags
            this.updateMetaTag('og:type', 'website', 'property');
            this.updateMetaTag('og:title', this.siteName, 'property');
            this.updateMetaTag('og:description', description, 'property');
            this.updateMetaTag('og:url', url, 'property');
            this.updateMetaTag('og:site_name', this.siteName, 'property');

            if (this.defaultImage) {
                this.updateMetaTag('og:image', this.defaultImage, 'property');
            }

            // Update Twitter Card tags
            this.updateMetaTag('twitter:card', 'summary', 'name');
            this.updateMetaTag('twitter:title', this.siteName, 'name');
            this.updateMetaTag('twitter:description', description, 'name');

            // Update canonical URL
            this.updateCanonicalURL(url);

            // Inject website structured data
            this.injectWebsiteStructuredData();
        },

        /**
         * Update or create a meta tag
         * @param {string} key - Meta tag attribute value (name or property value)
         * @param {string} content - Content value
         * @param {string} attr - Attribute type ('name' or 'property')
         */
        updateMetaTag(key, content, attr = 'name') {
            let meta = document.querySelector(`meta[${attr}="${key}"]`);

            if (!meta) {
                meta = this.createMetaTag(key, content, attr);
            } else {
                meta.setAttribute('content', content);
            }
        },

        /**
         * Create a new meta tag
         * @param {string} key - Meta tag attribute value
         * @param {string} content - Content value
         * @param {string} attr - Attribute type ('name' or 'property')
         */
        createMetaTag(key, content, attr = 'name') {
            const meta = document.createElement('meta');
            meta.setAttribute(attr, key);
            meta.setAttribute('content', content);
            document.head.appendChild(meta);
            return meta;
        },

        /**
         * Update canonical URL
         * @param {string} url - Canonical URL
         */
        updateCanonicalURL(url) {
            let link = document.querySelector('link[rel="canonical"]');

            if (!link) {
                link = document.createElement('link');
                link.setAttribute('rel', 'canonical');
                document.head.appendChild(link);
            }

            link.setAttribute('href', url);
        },

        /**
         * Inject JSON-LD structured data for blog posts
         * @param {Object} post - Post object
         */
        injectStructuredData(post) {
            // Remove existing structured data
            const existing = document.getElementById('structured-data');
            if (existing) existing.remove();

            const structuredData = {
                "@context": "https://schema.org",
                "@type": "BlogPosting",
                "headline": post.title,
                "description": post.excerpt || '',
                "datePublished": post.date,
                "dateModified": post.date,
                "author": {
                    "@type": "Person",
                    "name": this.author,
                    "url": `https://github.com/${this.author}`
                },
                "publisher": {
                    "@type": "Person",
                    "name": this.author
                },
                "mainEntityOfPage": {
                    "@type": "WebPage",
                    "@id": `${this.siteUrl}/post.html?id=${post.id}`
                },
                "url": `${this.siteUrl}/post.html?id=${post.id}`
            };

            // Add keywords if available
            if (post.tags && post.tags.length > 0) {
                structuredData.keywords = post.tags.join(', ');
            }

            // Add image if available
            if (this.defaultImage) {
                structuredData.image = this.defaultImage;
            }

            // Add word count / time required if available
            if (post.readingTime) {
                structuredData.timeRequired = post.readingTime;
            }

            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.id = 'structured-data';
            script.textContent = JSON.stringify(structuredData, null, 2);
            document.head.appendChild(script);
        },

        /**
         * Inject JSON-LD structured data for website/blog
         */
        injectWebsiteStructuredData() {
            // Remove existing structured data
            const existing = document.getElementById('structured-data');
            if (existing) existing.remove();

            const structuredData = {
                "@context": "https://schema.org",
                "@type": "Blog",
                "name": this.siteName,
                "description": "A personal blog about software engineering, AI, cloud technologies, and modern development practices.",
                "url": this.siteUrl,
                "author": {
                    "@type": "Person",
                    "name": this.author,
                    "url": `https://github.com/${this.author}`
                },
                "publisher": {
                    "@type": "Person",
                    "name": this.author
                }
            };

            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.id = 'structured-data';
            script.textContent = JSON.stringify(structuredData, null, 2);
            document.head.appendChild(script);
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        ThemeManager.init();
        PostManager.init();
        BackToTopManager.init();
        CopyManager.init();

        // Initialize SEO based on page type
        const isPostPage = document.getElementById('post-content') !== null;
        if (!isPostPage) {
            SEOManager.updateHomepageMeta();
        }
    }
})();
