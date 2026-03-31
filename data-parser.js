// Data Parser Utility - Extracts vehicle information from mobile.de
class VehicleDataParser {

  /**
   * Extracts all vehicle data from the current page
   */
  static extractVehicleData() {
    const data = {
      vehicle: this.getVehicleBasics(),
      technicalData: this.getTechnicalData(),
      features: this.getFeatures(),
      price: this.getPrice(),
      dealer: this.getDealerInfo(),
      description: this.getVehicleDescription(),
      timestamp: new Date().toISOString()
    };
    return data;
  }

  /**
   * Extract basic vehicle info (name, condition, etc.)
   */
  static getVehicleBasics() {
    const data = {};

    // Get vehicle name/title
    const titleElement = document.querySelector('[data-testid="vip-price-label"]');
    const vehicleSection = document.querySelector('h2.dNpqi');
    if (vehicleSection) data.name = vehicleSection.innerText.trim();

    // Get subtitle/model info
    const subtitleElement = document.querySelector('.GOIOV.fqe3L');
    if (subtitleElement) data.model = subtitleElement.innerText.trim();

    return data;
  }

  /**
   * Extract all technical specifications
   */
  static getTechnicalData() {
    const data = {};

    // Find all definition list items (dt/dd pairs)
    const dtElements = document.querySelectorAll('dt[data-testid*="-item"]');

    dtElements.forEach(dt => {
      const key = dt.innerText.trim();
      const dd = dt.nextElementSibling;
      if (dd && dd.tagName === 'DD') {
        const value = dd.innerText.trim();
        data[key] = value;
      }
    });

    return data;
  }

  /**
   * Extract featured items/checklist
   */
  static getFeatures() {
    const features = [];
    const featureList = document.querySelector('ul[data-testid="vip-features-list"]');

    if (featureList) {
      const items = featureList.querySelectorAll('li.FtSYW');
      items.forEach(item => {
        const text = item.innerText.split('\n')[0].trim();
        if (text) features.push(text);
      });
    }

    return features;
  }

  /**
   * Extract price information
   */
  static getPrice() {
    const priceData = {};

    // Main price
    const mainPrice = document.querySelector('[data-testid="vip-price-label"] .jjvdJ');
    if (mainPrice) priceData.price = mainPrice.innerText.trim();

    // Net price
    const netPrice = document.querySelector('[data-testid="vip-price-label"] .ZD2EM');
    if (netPrice) priceData.netInfo = netPrice.innerText.trim();

    // Monthly financing
    const monthlyRate = document.querySelector('[data-testid="financing-calculator-monthly-rate"] .a0Gig');
    if (monthlyRate) priceData.monthlyRate = monthlyRate.innerText.trim();

    return priceData;
  }

  /**
   * Extract dealer information
   */
  static getDealerInfo() {
    const dealer = {};

    // Dealer name
    const dealerName = document.querySelector('[data-testid="vip-dealer-box-content"] .GdlnG');
    if (dealerName) dealer.name = dealerName.innerText.trim();

    // Address
    const addr1 = document.querySelector('[data-testid="vip-dealer-box-seller-address1"]');
    const addr2 = document.querySelector('[data-testid="vip-dealer-box-seller-address2"]');
    if (addr1) dealer.address1 = addr1.innerText.trim();
    if (addr2) dealer.address2 = addr2.innerText.trim();

    // Rating
    const rating = document.querySelector('[data-testid="trust-box-dealer-rating-count"]');
    if (rating) dealer.rating = rating.innerText.trim();

    return dealer;
  }

  /**
   * Extract vehicle description
   */
  static getVehicleDescription() {
    const descElement = document.querySelector('[data-testid="vip-vehicle-description-text"]');
    if (descElement) {
      return descElement.innerText.trim();
    }
    return '';
  }

  /**
   * Convert data to formatted text
   */
  static formatAsText(data) {
    let text = `VEHICLE DATA EXTRACTED: ${data.timestamp}\n`;
    text += `${'='.repeat(60)}\n\n`;

    // Vehicle basics
    if (data.vehicle.name) text += `VEHICLE: ${data.vehicle.name}\n`;
    if (data.vehicle.model) text += `MODEL: ${data.vehicle.model}\n\n`;

    // Price
    if (Object.keys(data.price).length > 0) {
      text += `PRICE:\n`;
      Object.entries(data.price).forEach(([key, value]) => {
        text += `  ${key}: ${value}\n`;
      });
      text += `\n`;
    }

    // Technical Data
    if (Object.keys(data.technicalData).length > 0) {
      text += `TECHNICAL DATA:\n`;
      Object.entries(data.technicalData).forEach(([key, value]) => {
        text += `  ${key}: ${value}\n`;
      });
      text += `\n`;
    }

    // Features
    if (data.features.length > 0) {
      text += `FEATURES (${data.features.length}):\n`;
      data.features.forEach(feature => {
        text += `  • ${feature}\n`;
      });
      text += `\n`;
    }

    // Dealer Info
    if (Object.keys(data.dealer).length > 0) {
      text += `DEALER:\n`;
      Object.entries(data.dealer).forEach(([key, value]) => {
        text += `  ${key}: ${value}\n`;
      });
      text += `\n`;
    }

    return text;
  }

  /**
   * Convert data to JSON
   */
  static formatAsJSON(data) {
    return JSON.stringify(data, null, 2);
  }

  /**
   * Copy text to clipboard
   */
  static async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return { success: true, message: 'Copied to clipboard!' };
    } catch (err) {
      console.error('Failed to copy: ', err);
      return { success: false, message: 'Failed to copy to clipboard' };
    }
  }

  /**
   * Download data as file
   */
  static downloadAsFile(data, filename, format = 'json') {
    let content, type;

    if (format === 'json') {
      content = this.formatAsJSON(data);
      type = 'application/json';
    } else {
      content = this.formatAsText(data);
      type = 'text/plain';
    }

    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VehicleDataParser;
}
