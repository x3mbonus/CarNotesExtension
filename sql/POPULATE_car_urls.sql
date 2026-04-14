-- Auto-generate URLs for all cars based on car_id format
-- Logic:
--   - If car_id is all numbers → Mobile.de URL
--   - Otherwise (alphanumeric) → Otomoto.pl URL

-- UPDATE car_data_local table
UPDATE car_data_local
SET url = CASE
    -- If car_id is all numbers → Mobile.de format
    WHEN car_id ~ '^[0-9]+$' THEN
        'https://suchen.mobile.de/fahrzeuge/details.html?lang=en&id=' || car_id || '&scopeId=C&action=parkItem&vc=Car&s=Car'
    -- Otherwise → Otomoto format (make-model-carid)
    ELSE
        'https://www.otomoto.pl/osobowe/oferta/' ||
        LOWER(COALESCE(make, 'unknown')) || '-' ||
        LOWER(COALESCE(model, 'unknown')) || '-' ||
        car_id || '.html'
END
WHERE url IS NULL;

-- UPDATE car_data table (production)
UPDATE car_data
SET url = CASE
    -- If car_id is all numbers → Mobile.de format
    WHEN car_id ~ '^[0-9]+$' THEN
        'https://suchen.mobile.de/fahrzeuge/details.html?lang=en&id=' || car_id || '&scopeId=C&action=parkItem&vc=Car&s=Car'
    -- Otherwise → Otomoto format (make-model-carid)
    ELSE
        'https://www.otomoto.pl/osobowe/oferta/' ||
        LOWER(COALESCE(make, 'unknown')) || '-' ||
        LOWER(COALESCE(model, 'unknown')) || '-' ||
        car_id || '.html'
END
WHERE url IS NULL;

-- VIEW: Check generated URLs
SELECT
    car_id,
    make,
    model,
    CASE
        WHEN car_id ~ '^[0-9]+$' THEN '📱 Mobile.de'
        ELSE '🔗 Otomoto'
    END as source,
    url
FROM car_data_local
ORDER BY source, car_id;
