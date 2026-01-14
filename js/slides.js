/**
 * Advanced Web Development - Accessible Slide Presentation System
 * WCAG 2.1 AA Compliant
 * Features: Keyboard navigation, screen reader support, focus management
 */

class AccessibleSlidePresentation {
    constructor() {
        this.slides = [];
        this.currentSlide = 0;
        this.totalSlides = 0;
        this.liveRegion = null;
        this.helpDialogOpen = false;
        this.mobileNavOpen = false;
        this.narrationPanel = null;

        // Text-to-speech properties
        this.synth = window.speechSynthesis;
        this.utterance = null;
        this.isPlaying = false;
        this.narrationBtn = null;
        this.audioElement = null;
        this.usingAudioFile = false;
        this.autoplayEnabled = localStorage.getItem('slideAutoplayEnabled') === 'true';
        this.autoplayCheckbox = null;

        this.init();
    }

    init() {
        // Save original hash before any navigation overwrites it
        const originalHash = window.location.hash;

        // Get all slides
        this.slides = document.querySelectorAll('.slide');
        this.totalSlides = this.slides.length;

        if (this.totalSlides === 0) {
            console.warn('No slides found');
            return;
        }

        // Set up accessible structure
        this.createAccessibleStructure();
        this.generateNavigation();
        this.createNarrationPanel();
        this.createControls();
        this.createHelpDialog();
        this.createLiveRegion();
        this.setupEventListeners();

        // Initialize ARIA attributes on slides
        this.initializeSlideARIA();

        // Navigate to hash target or default to first slide
        this.navigateToInitialSlide(originalHash);

        // Announce to screen readers that presentation is ready
        this.announce('Presentation loaded. ' + this.totalSlides + ' slides available. Use arrow keys to navigate.');
    }

    createAccessibleStructure() {
        // Wrap existing content in accessible container if not already done
        const existingContainer = document.querySelector('.presentation-container');
        if (existingContainer) return;

        const presentation = document.querySelector('.presentation');
        if (!presentation) return;

        // Create skip link
        const skipLink = document.createElement('a');
        skipLink.href = '#main-slide-content';
        skipLink.className = 'skip-link';
        skipLink.textContent = 'Skip to slide content';
        document.body.insertBefore(skipLink, document.body.firstChild);

        // Create main container
        const container = document.createElement('div');
        container.className = 'presentation-container';

        // Create navigation sidebar
        const nav = document.createElement('nav');
        nav.className = 'slide-nav';
        nav.setAttribute('aria-label', 'Slide navigation');

        // Create main content area
        const mainContent = document.createElement('div');
        mainContent.className = 'main-content';
        mainContent.id = 'main-slide-content';
        mainContent.setAttribute('role', 'main');

        // Move presentation into main content
        presentation.parentNode.insertBefore(container, presentation);
        mainContent.appendChild(presentation);
        container.appendChild(nav);
        container.appendChild(mainContent);

        // Store references
        this.container = container;
        this.navElement = nav;
        this.mainContent = mainContent;
    }

    generateNavigation() {
        if (!this.navElement) return;

        // Get module title from the title slide or page title
        const titleSlide = document.querySelector('.slide.title-slide');
        let moduleTitle = 'Slide Navigation';
        if (titleSlide) {
            const h1 = titleSlide.querySelector('h1');
            const subtitle = titleSlide.querySelector('.subtitle');
            if (h1 && subtitle) {
                moduleTitle = h1.textContent + ': ' + subtitle.textContent;
            } else if (h1) {
                moduleTitle = h1.textContent;
            }
        }

        // Create nav header
        const navHeader = document.createElement('div');
        navHeader.className = 'nav-header';

        const navTitle = document.createElement('h2');
        navTitle.id = 'nav-title';
        navTitle.textContent = moduleTitle;
        navHeader.appendChild(navTitle);

        // Home link
        const homeLink = document.createElement('a');
        homeLink.href = '../index.html';
        homeLink.className = 'nav-home-link';
        homeLink.setAttribute('aria-label', 'Return to course home page');
        homeLink.textContent = '\u2190 Back to Course';
        navHeader.appendChild(homeLink);

        this.navElement.appendChild(navHeader);

        // Create scrollable list container
        const listContainer = document.createElement('div');
        listContainer.className = 'nav-list-container';

        // Create navigation list
        const navList = document.createElement('ul');
        navList.className = 'nav-list';
        navList.setAttribute('role', 'list');
        navList.setAttribute('aria-labelledby', 'nav-title');

        this.slides.forEach((slide, index) => {
            const listItem = document.createElement('li');
            listItem.className = 'nav-item';
            listItem.setAttribute('role', 'listitem');

            const button = document.createElement('button');
            button.type = 'button';
            button.setAttribute('aria-current', index === 0 ? 'true' : 'false');

            // Get slide title
            const titleEl = slide.querySelector('h1, h2');
            const titleText = titleEl ? titleEl.textContent : 'Slide ' + (index + 1);

            // Create number badge
            const numberSpan = document.createElement('span');
            numberSpan.className = 'nav-number';
            numberSpan.setAttribute('aria-hidden', 'true');
            numberSpan.textContent = index + 1;

            // Create title span
            const titleSpan = document.createElement('span');
            titleSpan.className = 'nav-title';
            titleSpan.textContent = titleText;

            button.appendChild(numberSpan);
            button.appendChild(titleSpan);

            // Screen reader label
            button.setAttribute('aria-label', 'Go to slide ' + (index + 1) + ' of ' + this.totalSlides + ': ' + titleText);

            button.addEventListener('click', () => {
                this.goToSlide(index);
                // Move focus to the slide content
                this.focusCurrentSlide();
            });

            listItem.appendChild(button);
            navList.appendChild(listItem);
        });

        listContainer.appendChild(navList);
        this.navElement.appendChild(listContainer);

        // Create mobile nav toggle
        const mobileToggle = document.createElement('button');
        mobileToggle.className = 'nav-toggle';
        mobileToggle.setAttribute('aria-expanded', 'false');
        mobileToggle.setAttribute('aria-controls', 'slide-nav');
        mobileToggle.setAttribute('aria-label', 'Open slide navigation menu');
        mobileToggle.textContent = '\u2630 Menu';
        mobileToggle.addEventListener('click', () => this.toggleMobileNav());
        document.body.appendChild(mobileToggle);

        this.navElement.id = 'slide-nav';
        this.mobileToggle = mobileToggle;
    }

    initializeSlideARIA() {
        this.slides.forEach((slide, index) => {
            slide.setAttribute('role', 'region');
            slide.setAttribute('aria-roledescription', 'slide');
            slide.setAttribute('aria-label', 'Slide ' + (index + 1) + ' of ' + this.totalSlides);
            slide.setAttribute('tabindex', '-1');
            // Only set ID if slide doesn't already have one (preserve existing IDs like #assignment)
            if (!slide.id) {
                slide.id = 'slide-' + (index + 1);
            }

            // Hide non-active slides from screen readers
            if (index !== 0) {
                slide.setAttribute('aria-hidden', 'true');
            }
        });
    }

    createControls() {
        const controls = document.createElement('div');
        controls.className = 'controls';
        controls.setAttribute('role', 'toolbar');
        controls.setAttribute('aria-label', 'Slide navigation controls');

        // Progress container
        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-container';

        const progressLabel = document.createElement('div');
        progressLabel.className = 'progress-label';
        progressLabel.id = 'progress-label';
        progressLabel.textContent = 'Progress';

        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.setAttribute('role', 'progressbar');
        progressBar.setAttribute('aria-valuenow', '1');
        progressBar.setAttribute('aria-valuemin', '1');
        progressBar.setAttribute('aria-valuemax', this.totalSlides);
        progressBar.setAttribute('aria-labelledby', 'progress-label');

        const progressFill = document.createElement('div');
        progressFill.className = 'progress-fill';
        progressBar.appendChild(progressFill);

        progressContainer.appendChild(progressLabel);
        progressContainer.appendChild(progressBar);
        controls.appendChild(progressContainer);

        // Slide counter
        const slideCounter = document.createElement('div');
        slideCounter.className = 'slide-counter';
        slideCounter.setAttribute('aria-live', 'polite');
        slideCounter.setAttribute('aria-atomic', 'true');

        const currentSpan = document.createElement('span');
        currentSpan.className = 'current';
        currentSpan.textContent = '1';

        slideCounter.appendChild(document.createTextNode('Slide '));
        slideCounter.appendChild(currentSpan);
        slideCounter.appendChild(document.createTextNode(' of ' + this.totalSlides));
        controls.appendChild(slideCounter);

        // Autoplay toggle
        const autoplayToggle = document.createElement('label');
        autoplayToggle.className = 'autoplay-toggle';

        const autoplayCheckbox = document.createElement('input');
        autoplayCheckbox.type = 'checkbox';
        autoplayCheckbox.checked = this.autoplayEnabled;
        autoplayCheckbox.setAttribute('aria-label', 'Enable autoplay narration (A)');
        autoplayCheckbox.addEventListener('change', () => this.toggleAutoplay());

        const autoplayLabel = document.createElement('span');
        autoplayLabel.textContent = 'Autoplay';

        autoplayToggle.appendChild(autoplayCheckbox);
        autoplayToggle.appendChild(autoplayLabel);
        controls.appendChild(autoplayToggle);
        this.autoplayCheckbox = autoplayCheckbox;

        // Narration play/pause button
        const narrationBtn = document.createElement('button');
        narrationBtn.type = 'button';
        narrationBtn.className = 'narration-btn';
        narrationBtn.setAttribute('aria-label', 'Play instructor narration (N)');
        narrationBtn.setAttribute('aria-pressed', 'false');
        narrationBtn.setAttribute('title', 'Play narration (N)');
        narrationBtn.textContent = '\u{1F50A} Play';
        narrationBtn.addEventListener('click', () => this.toggleNarration());
        controls.appendChild(narrationBtn);
        this.narrationBtn = narrationBtn;

        // Navigation buttons
        const navButtons = document.createElement('div');
        navButtons.className = 'nav-buttons';

        const prevBtn = document.createElement('button');
        prevBtn.type = 'button';
        prevBtn.className = 'nav-btn prev-btn';
        prevBtn.setAttribute('aria-label', 'Go to previous slide');
        prevBtn.textContent = '\u2190 Previous';
        prevBtn.addEventListener('click', () => this.prevSlide());
        navButtons.appendChild(prevBtn);

        const nextBtn = document.createElement('button');
        nextBtn.type = 'button';
        nextBtn.className = 'nav-btn next-btn';
        nextBtn.setAttribute('aria-label', 'Go to next slide');
        nextBtn.textContent = 'Next \u2192';
        nextBtn.addEventListener('click', () => this.nextSlide());
        navButtons.appendChild(nextBtn);

        controls.appendChild(navButtons);

        // Help button
        const helpBtn = document.createElement('button');
        helpBtn.type = 'button';
        helpBtn.className = 'help-btn';
        helpBtn.setAttribute('aria-label', 'Open keyboard shortcuts help');
        helpBtn.setAttribute('aria-haspopup', 'dialog');
        helpBtn.textContent = '? Help';
        helpBtn.addEventListener('click', () => this.toggleHelpDialog(true));
        controls.appendChild(helpBtn);

        // Add controls to main content
        this.mainContent.appendChild(controls);

        // Store references
        this.progressBar = progressBar;
        this.progressFill = progressFill;
        this.slideCounter = slideCounter.querySelector('.current');
        this.prevBtn = prevBtn;
        this.nextBtn = nextBtn;
    }

    createNarrationPanel() {
        // Create narration panel container
        const narrationPanel = document.createElement('div');
        narrationPanel.className = 'narration-panel';
        narrationPanel.setAttribute('role', 'region');
        narrationPanel.setAttribute('aria-label', 'Slide narration');

        // Create label
        const label = document.createElement('div');
        label.className = 'narration-label';
        label.textContent = 'Instructor Notes';
        narrationPanel.appendChild(label);

        // Create content area
        const content = document.createElement('div');
        content.className = 'narration-content';
        narrationPanel.appendChild(content);

        // Insert narration panel into main content (before controls, after presentation)
        this.mainContent.appendChild(narrationPanel);

        // Store reference
        this.narrationPanel = narrationPanel;
        this.narrationContent = content;
    }

    updateNarration() {
        if (!this.narrationContent) return;

        const activeSlide = this.slides[this.currentSlide];
        const narration = activeSlide.getAttribute('data-narration') || '';

        this.narrationContent.textContent = narration;

        // Update button state based on whether narration exists
        this.updateNarrationButton();
    }

    toggleNarration() {
        const activeSlide = this.slides[this.currentSlide];
        const narration = activeSlide.getAttribute('data-narration') || '';

        // Don't do anything if no narration available
        if (!narration) return;

        if (this.isPlaying) {
            // Pause playback
            if (this.usingAudioFile && this.audioElement) {
                this.audioElement.pause();
            } else if (this.synth) {
                this.synth.pause();
            }
            this.isPlaying = false;
            this.updateNarrationButton();
            this.announce('Narration paused');
        } else if (this.usingAudioFile && this.audioElement && this.audioElement.paused && this.audioElement.currentTime > 0) {
            // Resume audio file
            this.audioElement.play();
            this.isPlaying = true;
            this.updateNarrationButton();
            this.announce('Narration resumed');
        } else if (!this.usingAudioFile && this.synth && this.synth.paused) {
            // Resume speech synthesis
            this.synth.resume();
            this.isPlaying = true;
            this.updateNarrationButton();
            this.announce('Narration resumed');
        } else {
            // Start new playback - try audio file first
            this.stopNarration();
            this.playNarration(narration);
        }
    }

    /**
     * Get module name from current URL
     */
    getModuleName() {
        const path = window.location.pathname;
        const match = path.match(/module-(\d+)/);
        if (match) {
            return `module-${match[1].padStart(2, '0')}`;
        }
        return null;
    }

    /**
     * Get audio file path for current slide
     */
    getAudioPath() {
        const moduleName = this.getModuleName();
        if (!moduleName) return null;

        const slideNum = String(this.currentSlide + 1).padStart(2, '0');
        return `../audio/${moduleName}/slide-${slideNum}.mp3`;
    }

    /**
     * Play narration - tries audio file first, falls back to speech synthesis
     */
    playNarration(narrationText) {
        const audioPath = this.getAudioPath();

        if (audioPath) {
            // Try to play audio file
            this.audioElement = new Audio(audioPath);
            this.usingAudioFile = true;

            this.audioElement.oncanplaythrough = () => {
                this.audioElement.play();
                this.isPlaying = true;
                this.updateNarrationButton();
                this.announce('Narration started');
            };

            this.audioElement.onended = () => {
                this.isPlaying = false;
                this.usingAudioFile = false;
                this.updateNarrationButton();
            };

            this.audioElement.onerror = () => {
                // Audio file not found - fall back to speech synthesis
                this.usingAudioFile = false;
                this.playWithSpeechSynthesis(narrationText);
            };

            // Start loading
            this.audioElement.load();
        } else {
            // No module detected, use speech synthesis
            this.playWithSpeechSynthesis(narrationText);
        }
    }

    /**
     * Play narration using browser speech synthesis (fallback)
     */
    playWithSpeechSynthesis(narrationText) {
        if (!this.synth) return;

        this.usingAudioFile = false;
        this.utterance = new SpeechSynthesisUtterance(narrationText);
        this.utterance.onend = () => {
            this.isPlaying = false;
            this.updateNarrationButton();
        };
        this.utterance.onerror = () => {
            this.isPlaying = false;
            this.updateNarrationButton();
        };
        this.synth.speak(this.utterance);
        this.isPlaying = true;
        this.updateNarrationButton();
        this.announce('Narration started');
    }

    stopNarration() {
        // Stop audio element if playing
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.currentTime = 0;
            this.audioElement = null;
        }

        // Stop speech synthesis if playing
        if (this.synth) {
            this.synth.cancel();
        }

        this.isPlaying = false;
        this.usingAudioFile = false;
        this.utterance = null;
        this.updateNarrationButton();
    }

    toggleAutoplay() {
        this.autoplayEnabled = !this.autoplayEnabled;
        localStorage.setItem('slideAutoplayEnabled', this.autoplayEnabled);

        if (this.autoplayCheckbox) {
            this.autoplayCheckbox.checked = this.autoplayEnabled;
        }

        this.announce(this.autoplayEnabled ? 'Autoplay enabled' : 'Autoplay disabled');
    }

    updateNarrationButton() {
        if (!this.narrationBtn) return;

        const activeSlide = this.slides[this.currentSlide];
        const narration = activeSlide.getAttribute('data-narration') || '';

        // Disable button if no narration
        if (!narration) {
            this.narrationBtn.disabled = true;
            this.narrationBtn.setAttribute('aria-disabled', 'true');
            this.narrationBtn.setAttribute('title', 'No narration for this slide');
            this.narrationBtn.textContent = '\u{1F507} No Audio';
            this.narrationBtn.classList.remove('playing');
            return;
        }

        this.narrationBtn.disabled = false;
        this.narrationBtn.setAttribute('aria-disabled', 'false');

        if (this.isPlaying) {
            this.narrationBtn.textContent = '\u{23F8} Pause';
            this.narrationBtn.setAttribute('aria-label', 'Pause instructor narration (N)');
            this.narrationBtn.setAttribute('aria-pressed', 'true');
            this.narrationBtn.setAttribute('title', 'Pause narration (N)');
            this.narrationBtn.classList.add('playing');
        } else {
            this.narrationBtn.textContent = '\u{1F50A} Play';
            this.narrationBtn.setAttribute('aria-label', 'Play instructor narration (N)');
            this.narrationBtn.setAttribute('aria-pressed', 'false');
            this.narrationBtn.setAttribute('title', 'Play narration (N)');
            this.narrationBtn.classList.remove('playing');
        }
    }

    createHelpDialog() {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'help-overlay';
        overlay.addEventListener('click', () => this.toggleHelpDialog(false));

        // Create dialog
        const dialog = document.createElement('div');
        dialog.className = 'help-dialog';
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-labelledby', 'help-dialog-title');
        dialog.setAttribute('aria-modal', 'true');

        const title = document.createElement('h2');
        title.id = 'help-dialog-title';
        title.textContent = 'Keyboard Shortcuts';
        dialog.appendChild(title);

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'close-btn';
        closeBtn.setAttribute('aria-label', 'Close help dialog');
        closeBtn.textContent = '\u00D7';
        closeBtn.addEventListener('click', () => this.toggleHelpDialog(false));
        dialog.appendChild(closeBtn);

        const dl = document.createElement('dl');

        const shortcuts = [
            { key: 'Arrow Right / Space', action: 'Next slide' },
            { key: 'Arrow Left', action: 'Previous slide' },
            { key: 'Home', action: 'First slide' },
            { key: 'End', action: 'Last slide' },
            { key: '1-9', action: 'Go to slide 1-9' },
            { key: 'N', action: 'Play/pause narration' },
            { key: 'A', action: 'Toggle autoplay' },
            { key: 'Escape', action: 'Close dialogs' },
            { key: '?', action: 'Open this help' }
        ];

        shortcuts.forEach(shortcut => {
            const dt = document.createElement('dt');
            const kbd = document.createElement('kbd');
            kbd.textContent = shortcut.key;
            dt.appendChild(kbd);

            const dd = document.createElement('dd');
            dd.textContent = shortcut.action;

            dl.appendChild(dt);
            dl.appendChild(dd);
        });

        dialog.appendChild(dl);

        document.body.appendChild(overlay);
        document.body.appendChild(dialog);

        this.helpOverlay = overlay;
        this.helpDialog = dialog;
        this.helpCloseBtn = closeBtn;
    }

    createLiveRegion() {
        const liveRegion = document.createElement('div');
        liveRegion.className = 'live-region';
        liveRegion.setAttribute('role', 'status');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        document.body.appendChild(liveRegion);
        this.liveRegion = liveRegion;
    }

    announce(message) {
        if (!this.liveRegion) return;
        // Clear and set message (this triggers screen reader announcement)
        this.liveRegion.textContent = '';
        setTimeout(() => {
            this.liveRegion.textContent = message;
        }, 100);
    }

    setupEventListeners() {
        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeydown(e));

        // Handle browser back/forward
        window.addEventListener('popstate', () => this.checkUrlHash());

        // Touch/swipe support
        this.setupTouchNavigation();
    }

    handleKeydown(e) {
        // Don't interfere with form inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        // Handle help dialog close
        if (e.key === 'Escape') {
            if (this.helpDialogOpen) {
                e.preventDefault();
                this.toggleHelpDialog(false);
                return;
            }
            if (this.mobileNavOpen) {
                e.preventDefault();
                this.toggleMobileNav(false);
                return;
            }
        }

        // Don't handle other keys if help dialog is open
        if (this.helpDialogOpen) return;

        switch (e.key) {
            case 'ArrowRight':
            case 'ArrowDown':
            case ' ':
            case 'PageDown':
                e.preventDefault();
                this.nextSlide();
                break;
            case 'ArrowLeft':
            case 'ArrowUp':
            case 'PageUp':
                e.preventDefault();
                this.prevSlide();
                break;
            case 'Home':
                e.preventDefault();
                this.goToSlide(0);
                break;
            case 'End':
                e.preventDefault();
                this.goToSlide(this.totalSlides - 1);
                break;
            case '?':
                e.preventDefault();
                this.toggleHelpDialog(true);
                break;
            case 'n':
            case 'N':
                e.preventDefault();
                this.toggleNarration();
                break;
            case 'a':
            case 'A':
                e.preventDefault();
                this.toggleAutoplay();
                break;
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
                e.preventDefault();
                const slideNum = parseInt(e.key, 10) - 1;
                if (slideNum < this.totalSlides) {
                    this.goToSlide(slideNum);
                }
                break;
        }
    }

    setupTouchNavigation() {
        let touchStartX = 0;
        let touchEndX = 0;
        const minSwipeDistance = 50;

        const presentation = document.querySelector('.presentation');
        if (!presentation) return;

        presentation.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        presentation.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            const distance = touchEndX - touchStartX;

            if (Math.abs(distance) > minSwipeDistance) {
                if (distance > 0) {
                    this.prevSlide();
                } else {
                    this.nextSlide();
                }
            }
        }, { passive: true });
    }

    goToSlide(index) {
        // Bounds checking
        if (index < 0 || index >= this.totalSlides) return;

        // Stop any playing narration when changing slides
        this.stopNarration();

        const previousSlide = this.currentSlide;

        // Update slide visibility and ARIA states
        this.slides.forEach((slide, i) => {
            slide.classList.remove('active', 'prev');
            slide.setAttribute('aria-hidden', 'true');

            if (i < index) {
                slide.classList.add('prev');
            }
        });

        // Activate current slide
        const activeSlide = this.slides[index];
        activeSlide.classList.add('active');
        activeSlide.setAttribute('aria-hidden', 'false');

        this.currentSlide = index;

        // Update URL hash
        history.replaceState(null, null, '#slide-' + (index + 1));

        // Update UI
        this.updateProgress();
        this.updateCounter();
        this.updateButtons();
        this.updateNavigation();
        this.updateNarration();

        // Announce slide change to screen readers
        const titleEl = activeSlide.querySelector('h1, h2');
        const titleText = titleEl ? titleEl.textContent : 'Slide ' + (index + 1);
        this.announce('Slide ' + (index + 1) + ' of ' + this.totalSlides + ': ' + titleText);

        // Autoplay narration if enabled
        if (this.autoplayEnabled) {
            const narration = activeSlide.getAttribute('data-narration');
            if (narration) {
                this.playNarration(narration);
            }
        }
    }

    nextSlide() {
        if (this.currentSlide < this.totalSlides - 1) {
            this.goToSlide(this.currentSlide + 1);
        } else {
            this.announce('End of presentation. This is the last slide.');
        }
    }

    prevSlide() {
        if (this.currentSlide > 0) {
            this.goToSlide(this.currentSlide - 1);
        } else {
            this.announce('Beginning of presentation. This is the first slide.');
        }
    }

    focusCurrentSlide() {
        const activeSlide = this.slides[this.currentSlide];
        if (activeSlide) {
            activeSlide.focus();
        }
    }

    updateProgress() {
        if (!this.progressFill || !this.progressBar) return;
        const progress = ((this.currentSlide + 1) / this.totalSlides) * 100;
        this.progressFill.style.width = progress + '%';
        this.progressBar.setAttribute('aria-valuenow', this.currentSlide + 1);
    }

    updateCounter() {
        if (!this.slideCounter) return;
        this.slideCounter.textContent = this.currentSlide + 1;
    }

    updateButtons() {
        if (this.prevBtn) {
            this.prevBtn.disabled = this.currentSlide === 0;
            this.prevBtn.setAttribute('aria-disabled', this.currentSlide === 0 ? 'true' : 'false');
        }
        if (this.nextBtn) {
            this.nextBtn.disabled = this.currentSlide === this.totalSlides - 1;
            this.nextBtn.setAttribute('aria-disabled', this.currentSlide === this.totalSlides - 1 ? 'true' : 'false');
        }
    }

    updateNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach((item, index) => {
            const button = item.querySelector('button');
            if (index === this.currentSlide) {
                item.classList.add('active');
                button.setAttribute('aria-current', 'true');
            } else {
                item.classList.remove('active');
                button.setAttribute('aria-current', 'false');
            }
        });

        // Scroll active item into view
        const activeItem = document.querySelector('.nav-item.active');
        if (activeItem) {
            activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    toggleHelpDialog(show) {
        this.helpDialogOpen = show;

        if (show) {
            this.helpOverlay.classList.add('visible');
            this.helpDialog.classList.add('visible');
            this.helpCloseBtn.focus();
            // Trap focus in dialog
            this.trapFocus(this.helpDialog);
        } else {
            this.helpOverlay.classList.remove('visible');
            this.helpDialog.classList.remove('visible');
            // Return focus to help button
            document.querySelector('.help-btn').focus();
        }
    }

    trapFocus(element) {
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        const handleTab = (e) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    e.preventDefault();
                    lastFocusable.focus();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    e.preventDefault();
                    firstFocusable.focus();
                }
            }
        };

        element.addEventListener('keydown', handleTab);

        // Store handler for cleanup
        element._trapFocusHandler = handleTab;
    }

    toggleMobileNav(forceState) {
        this.mobileNavOpen = forceState !== undefined ? forceState : !this.mobileNavOpen;

        if (this.navElement) {
            this.navElement.classList.toggle('open', this.mobileNavOpen);
        }
        if (this.mobileToggle) {
            this.mobileToggle.setAttribute('aria-expanded', this.mobileNavOpen ? 'true' : 'false');
            this.mobileToggle.setAttribute('aria-label',
                this.mobileNavOpen ? 'Close slide navigation menu' : 'Open slide navigation menu'
            );
        }
    }

    navigateToInitialSlide(hash) {
        // Try #slide-N format first
        const slideMatch = hash.match(/^#slide-(\d+)$/);
        if (slideMatch) {
            const slideNum = parseInt(slideMatch[1], 10) - 1;
            if (slideNum >= 0 && slideNum < this.totalSlides) {
                this.goToSlide(slideNum);
                return;
            }
        }

        // Try named anchor (e.g., #assignment, #part2)
        if (hash && hash.length > 1) {
            const targetSlide = document.querySelector(hash);
            if (targetSlide && targetSlide.classList.contains('slide')) {
                const slideIndex = Array.from(this.slides).indexOf(targetSlide);
                if (slideIndex >= 0) {
                    this.goToSlide(slideIndex);
                    return;
                }
            }
        }

        // Default to first slide
        this.goToSlide(0);
    }

    checkUrlHash() {
        const hash = window.location.hash;

        // Check for #slide-N format (numbered)
        const slideMatch = hash.match(/^#slide-(\d+)$/);
        if (slideMatch) {
            const slideNum = parseInt(slideMatch[1], 10) - 1;
            if (slideNum >= 0 && slideNum < this.totalSlides) {
                this.goToSlide(slideNum);
                return;
            }
        }

        // Check for named anchor (e.g., #git-intro, #video-resource)
        if (hash && hash.length > 1) {
            const targetSlide = document.querySelector(hash);
            if (targetSlide && targetSlide.classList.contains('slide')) {
                const slideIndex = Array.from(this.slides).indexOf(targetSlide);
                if (slideIndex >= 0) {
                    this.goToSlide(slideIndex);
                }
            }
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.presentation = new AccessibleSlidePresentation();
});

// Also handle case where script loads after DOMContentLoaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(function() {
        if (!window.presentation) {
            window.presentation = new AccessibleSlidePresentation();
        }
    }, 1);
}
