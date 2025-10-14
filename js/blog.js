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

            // Update page metadata
            document.title = `${post.title} | Dong-ju's Blog`;
            document.getElementById('post-title').textContent = post.title;
            document.getElementById('article-title').textContent = post.title;

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
    }
})();
