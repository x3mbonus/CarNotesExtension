// Feature ↔ Column Name Mapping
// Converts between display feature names and database column names
// This keeps the mapping logic in one place for easy maintenance

window.FeatureColumnMapper = {
    /**
     * Map feature names to database column names
     * ACC -> feature_acc
     * Blind spot -> feature_blind_spot
     * Android Auto / CarPlay -> feature_android_auto_carplay
     */
    featureToColumnName(featureName) {
        return 'feature_' + featureName
            .toLowerCase()
            .replace(/\s+/g, '_')           // spaces to underscores
            .replace(/\//g, '_')             // slashes to underscores
            .replace(/[^\w_]/g, '');         // remove special chars
    },

    /**
     * Get all feature-to-column mappings
     * Returns: { 'ACC': 'feature_acc', 'Blind spot': 'feature_blind_spot', ... }
     */
    getAllMappings() {
        if (!window.FeaturesParser) return {};

        const mappings = {};

        Object.values(window.FeaturesParser.FEATURE_CATEGORIES).forEach(features => {
            features.forEach(featureName => {
                mappings[featureName] = this.featureToColumnName(featureName);
            });
        });

        return mappings;
    },

    /**
     * Convert features object to database row update payload
     * Input:  { 'ACC': true, 'Blind spot': null, 'Lane assist': false, ... }
     * Output: { feature_acc: true, feature_blind_spot: null, feature_lane_assist: false, ... }
     */
    featuresToDatabaseRow(featuresObject) {
        const payload = {};

        Object.entries(featuresObject).forEach(([featureName, state]) => {
            const columnName = this.featureToColumnName(featureName);
            // Only include boolean values (true, false, null for unknown)
            payload[columnName] = state === true ? true : (state === null ? null : false);
        });

        return payload;
    },

    /**
     * Convert database row to features object
     * Input:  { feature_acc: true, feature_blind_spot: null, feature_lane_assist: false, ... }
     * Output: { 'ACC': true, 'Blind spot': null, 'Lane assist': false, ... }
     */
    databaseRowToFeatures(rowObject) {
        const mappings = this.getAllMappings();
        const reverseMap = {};

        // Create reverse mapping: column_name -> feature_name
        Object.entries(mappings).forEach(([featureName, columnName]) => {
            reverseMap[columnName] = featureName;
        });

        const features = {};

        Object.entries(rowObject).forEach(([columnName, state]) => {
            if (columnName.startsWith('feature_')) {
                const featureName = reverseMap[columnName];
                if (featureName) {
                    // Normalize: true/false -> true/false, null -> null, anything else -> null
                    features[featureName] = state === true ? true : (state === false ? false : null);
                }
            }
        });

        return features;
    },

    /**
     * Get list of all database column names for features
     * Returns: ['feature_acc', 'feature_blind_spot', 'feature_lane_assist', ...]
     */
    getAllColumnNames() {
        return Object.values(this.getAllMappings());
    }
};
