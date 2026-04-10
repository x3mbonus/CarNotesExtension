// Mobile.de site adapter

window.MobileDeAdapter = {
    /**
     * Extract car ID from mobile.de article element
     */
    extractId(article) {
        // Find the main link in the article
        const link = article.querySelector('a[href*="details.html"]');
        if (link && link.href) {
            // Extract ID from URL parameter: ?id=451756414
            const match = link.href.match(/[?&]id=(\d+)/);
            if (match && match[1]) {
                console.log('[CarNotes] Found mobile.de ID from details.html:', match[1]);
                return match[1];
            }
        }

        // Fallback: try any link with id parameter
        const anyLink = article.querySelector('a[href*="id="]');
        if (anyLink) {
            const match = anyLink.href.match(/id=(\d+)/);
            if (match && match[1]) {
                console.log('[CarNotes] Found mobile.de ID from fallback:', match[1]);
                return match[1];
            }
        }

        console.log('[CarNotes] No mobile.de ID found for article');
        return null;
    },

    /**
     * Extract car ID from detail page URL
     */
    extractDetailId(search) {
        const match = search.match(/[?&]id=(\d+)/);
        return match ? match[1] : null;
    },

    /**
     * Handle mobile.de listing page
     */
    async handleListingPage() {
        observer.disconnect();

        const articles = document.querySelectorAll('article');
        const processedData = await window.ListingHandler.processListingsCommon(
            articles,
            this.extractId.bind(this)
        );

        await window.ListingHandler.addButtonsToListings(processedData);

        // Resume observer
        if (!observer.observerStarted) {
            observer.observe(document.body, { childList: true, subtree: true });
            observer.observerStarted = true;
        } else {
            observer.observe(document.body, { childList: true, subtree: true });
        }
    },

    /**
     * Handle mobile.de detail page
     */
    async handleDetailPage(pathname, search) {
        const carId = this.extractDetailId(search);
        if (carId && window.UnifiedPanel) {
            window.UnifiedPanel.showPanel(carId);
        }
    }
};
