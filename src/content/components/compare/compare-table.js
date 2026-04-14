/**
 * Compare Table Component
 * Displays multiple cars side-by-side with their specs and features
 */

window.CompareTable = {
    /**
     * Create a comparison table for multiple cars
     * @param {Array} carList - Array of car objects with carId, metadata, features, and sort
     * @param {Array} allFeatures - Full feature list from FeaturesManager
     * @returns {HTMLElement} Table element
     */
    createCompareTable(carList, allFeatures = []) {
        const container = document.createElement('div');
        container.className = 'compare-table-container';
        container.style.cssText = `
            overflow-x: auto;
            padding: 12px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        `;

        // Build table
        const table = document.createElement('table');
        table.className = 'compare-table';
        table.style.cssText = `
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
            background: white;
        `;

        // Table header with car models
        const headerRow = table.createTHead().insertRow();
        headerRow.style.cssText = 'background: #f5f5f5; font-weight: bold;';

        // First cell: empty or "Vehicle"
        let headerCell = headerRow.insertCell();
        headerCell.textContent = 'Vehicle';
        headerCell.style.cssText = 'padding: 8px; border: 1px solid #ddd; min-width: 120px; text-align: left;';

        // Add car columns
        carList.forEach((car, idx) => {
            const cell = headerRow.insertCell();
            const make = car.metadata?.make || 'Unknown';
            const model = car.metadata?.model || '';
            const isCurrent = car.isCurrentCar ? ' (← Current)' : '';
            cell.innerHTML = `
                <div style="font-weight: bold;">${make}${isCurrent}</div>
                <div style="font-size: 11px; color: #666;">${model}</div>
            `;
            cell.style.cssText = `
                padding: 8px;
                border: ${car.isCurrentCar ? '3px solid #667eea' : '1px solid #ddd'};
                min-width: 140px;
                text-align: center;
                vertical-align: top;
                background: ${this._getRatingColor(car.metadata?.sort)};
                font-weight: ${car.isCurrentCar ? 'bold' : 'normal'};
            `;
        });

        // Table body with specs and features
        const tbody = table.createTBody();

        // Row: URL (first row)
        this._addCompareRow(tbody, 'Лінк', carList, (car) => {
            const url = car.metadata?.url || car.url || '';
            if (!url) return '—';
            return `<a href="${url}" target="_blank" style="color: #667eea; text-decoration: underline; font-size: 11px;">View</a>`;
        }, 0, true); // true = isHtml

        // Row: Rating
        this._addCompareRow(tbody, 'Рейтинг', carList, (car) => {
            const sortId = car.metadata?.sort;
            const sortLabel = {
                0: 'Best 🟢',
                1: 'Good 🟢',
                2: 'Fair 🟡',
                3: 'Poor 🟠',
                '-1': 'Excluded 🔴',
                'null': 'None'
            }[sortId === null ? 'null' : sortId?.toString()] || '—';
            return sortLabel;
        }, 0, false);

        // Metadata rows (matching Excel order)
        this._addCompareRow(tbody, 'Рік', carList, (car) => car.metadata?.year || '—', 0, false);
        this._addCompareRow(tbody, 'Пробіг', carList, (car) => car.metadata?.mileage || '—', 0, false);
        this._addCompareRow(tbody, 'Ціна (EUR)', carList, (car) => {
            const eur = car.metadata?.price_eur || '—';
            const pln = car.metadata?.price || '—';
            const title = pln !== '—' ? `PLN: ${pln}` : '';
            return `<span title="${title}">${eur}</span>`;
        }, 0, true); // Show EUR, PLN on hover
        this._addCompareRow(tbody, 'Тип сидінь', carList, (car) => car.metadata?.seat_type || '—', 0, false);
        this._addCompareRow(tbody, 'Власників', carList, (car) => car.metadata?.owners || '—', 0, false);
        this._addCompareRow(tbody, 'Фаркоп тип', carList, (car) => car.metadata?.tow_hitch_type || '—', 0, false);

        // Features section header
        const featuresHeaderRow = tbody.insertRow();
        featuresHeaderRow.style.cssText = 'background: #e8f5e9; font-weight: bold;';
        const featuresHeader = featuresHeaderRow.insertCell();
        featuresHeader.textContent = 'FEATURES';
        featuresHeader.colSpan = carList.length + 1;
        featuresHeader.style.cssText = 'padding: 8px; border: 1px solid #ddd; text-align: left; color: #2e7d32;';

        // Feature rows
        allFeatures.forEach(feature => {
            this._addCompareRow(tbody, feature.label, carList, (car) => {
                const state = car.features?.[feature.key];
                if (state === true) return '✓';
                if (state === false) return '✗';
                return '?';
            }, feature.priority, false);
        });

        container.appendChild(table);
        return container;
    },

    /**
     * Add a row to the comparison table
     * @param {HTMLTableSectionElement} tbody - Table body
     * @param {string} label - Row label
     * @param {Array} carList - List of cars
     * @param {Function} getValue - Function to get value for each car
     * @param {number} priority - Feature priority (unused)
     * @param {boolean} isHtml - If true, value is treated as HTML content
     */
    _addCompareRow(tbody, label, carList, getValue, priority = 0, isHtml = false) {
        const row = tbody.insertRow();
        row.style.cssText = 'border-bottom: 1px solid #ddd;';

        // Label cell
        const labelCell = row.insertCell();
        labelCell.textContent = label;
        labelCell.style.cssText = `
            padding: 8px;
            border: 1px solid #ddd;
            font-weight: 500;
            background: #fafafa;
            min-width: 120px;
            text-align: left;
        `;

        // Value cells for each car
        carList.forEach((car, idx) => {
            const cell = row.insertCell();
            const value = getValue(car);

            // Get rating color for this car (apply to all cells in the column)
            const ratingBgColor = this._getRatingColor(car.metadata?.sort);

            // Style based on feature state (for features with ✓, ✗, ?)
            if (value === '✓') {
                cell.textContent = '✓';
                cell.style.cssText = `
                    padding: 8px;
                    border: 1px solid #ddd;
                    text-align: center;
                    background: #c8e6c9;
                    color: #2e7d32;
                    font-weight: bold;
                `;
            } else if (value === '✗') {
                cell.textContent = '✗';
                cell.style.cssText = `
                    padding: 8px;
                    border: 1px solid #ddd;
                    text-align: center;
                    background: #ffcdd2;
                    color: #c62828;
                    font-weight: bold;
                `;
            } else if (value === '?') {
                cell.textContent = '?';
                cell.style.cssText = `
                    padding: 8px;
                    border: 1px solid #ddd;
                    text-align: center;
                    background: #fff9c4;
                    color: #f57f17;
                    font-weight: bold;
                `;
            } else {
                // Regular fields - apply rating background color
                if (isHtml) {
                    cell.innerHTML = value;
                } else {
                    cell.textContent = value;
                }
                cell.style.cssText = `
                    padding: 8px;
                    border: 1px solid #ddd;
                    text-align: center;
                    font-size: 11px;
                    background: ${ratingBgColor};
                `;
            }
        });
    },

    /**
     * Get color for rating
     */
    _getRatingColor(sortId) {
        const colorMap = {
            0: '#e8f5e9',      // Best - light green
            1: '#f1f8e9',      // Good - very light green
            2: '#fff3e0',      // Fair - light orange
            3: '#ffe0b2',      // Poor - darker orange
            '-1': '#ffebee',   // Excluded - light red
        };
        return colorMap[sortId?.toString()] || '#ffffff';
    }
};
