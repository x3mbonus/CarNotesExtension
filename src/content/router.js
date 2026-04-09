// Site Router - Detects platform and routes to appropriate adapter

window.SiteRouter = {
    PLATFORMS: {
        MOBILE_DE: 'mobile.de',
        OTOMOTO: 'otomoto.pl',
        UNKNOWN: 'unknown'
    },

    /**
     * Detects current platform based on hostname
     */
    detectPlatform(hostname) {
        if (hostname.includes('mobile.de')) {
            return this.PLATFORMS.MOBILE_DE;
        } else if (hostname.includes('otomoto.pl')) {
            return this.PLATFORMS.OTOMOTO;
        }
        return this.PLATFORMS.UNKNOWN;
    },

    /**
     * Detects if current page is a detail page (single vehicle)
     */
    isDetailPage(hostname, pathname, search) {
        if (hostname.includes('mobile.de')) {
            // Mobile.de: /fahrzeuge/details.html, /auto-inserat/, or language versions
            return pathname.includes('/auto-inserat/') ||
                   pathname.includes('/details.html') ||
                   (pathname.endsWith('.html') && search.includes('id=') && !pathname.includes('/search'));
        } else if (hostname.includes('otomoto.pl')) {
            // Otomoto: /oferta/name-ID.html
            return pathname.includes('/oferta/') && pathname.endsWith('.html');
        }
        return false;
    },

    /**
     * Gets appropriate adapter for platform
     */
    getAdapter(platform) {
        if (platform === this.PLATFORMS.MOBILE_DE && typeof window.MobileDeAdapter !== 'undefined') {
            return window.MobileDeAdapter;
        } else if (platform === this.PLATFORMS.OTOMOTO && typeof window.OtomotoAdapter !== 'undefined') {
            return window.OtomotoAdapter;
        }
        return null;
    },

    /**
     * Routes initialization based on page type
     */
    async route(hostname, pathname, search) {
        const platform = this.detectPlatform(hostname);
        const isDetail = this.isDetailPage(hostname, pathname, search);
        const adapter = this.getAdapter(platform);

        if (!adapter) {
            console.log('[CarNotes] No adapter found for platform:', platform);
            return;
        }

        if (isDetail) {
            // Detail page - single vehicle
            await adapter.handleDetailPage(pathname, search);
        } else {
            // Listing page - multiple vehicles
            await adapter.handleListingPage();
        }
    }
};
