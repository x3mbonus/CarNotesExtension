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
            .replace(/\s*\/\s*/g, '_')      // slashes with surrounding spaces to single underscore
            .replace(/\s+/g, '_')           // spaces to underscores
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
     * Input can use either feature display names or column names
     * Input:  { 'ACC': true, 'feature_blind_spot': null, ... }
     * Output: { feature_acc: true, feature_blind_spot: null, ... }
     */
    featuresToDatabaseRow(featuresObject) {
        const payload = {};
        const mappings = this.getAllMappings();

        Object.entries(featuresObject).forEach(([key, state]) => {
            let columnName;

            // Check if key is already a column name (starts with 'feature_')
            if (key.startsWith('feature_')) {
                columnName = key;
            } else {
                // Convert feature name to column name
                columnName = this.featureToColumnName(key);
            }

            // Only include boolean values (true, false, null for unknown)
            payload[columnName] = state === true ? true : (state === null ? null : false);
        });

        return payload;
    },

    /**
     * Convert database row to features object
     * Input:  { feature_acc: true, feature_blind_spot: null, feature_lane_assist: false, ... }
     * Output: { feature_acc: true, feature_blind_spot: null, feature_lane_assist: false, ... }
     * NOTE: Keys are database column names to match UIComponents.getFeaturesList() keys
     */
    databaseRowToFeatures(rowObject) {
        const features = {};

        Object.entries(rowObject).forEach(([columnName, state]) => {
            if (columnName.startsWith('feature_')) {
                // Keep column name as key to match UIComponents.getFeaturesList()
                // Normalize: true/false -> true/false, null -> null, anything else -> null
                features[columnName] = state === true ? true : (state === false ? false : null);
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
