import { MarketStrategy } from "./types";
import { TRUSTED_DATA_SOURCES } from "./data-sources";

/**
 * Fallback Data Sources - Valid IDs to use when backend provides invalid/missing sources
 */
export const FALLBACK_DATA_SOURCES = [
    { id: 12245, name: "SPY", ticker: "SPY" }, // S&P 500 ETF Trust SPDR
    { id: 12249, name: "QQQ", ticker: "QQQ" }, // QQQ Trust Invesco
    { id: 12251, name: "IBIT", ticker: "IBIT" }, // Bitcoin Trust iShares
    { id: 12243, name: "VOO", ticker: "VOO" }, // S&P 500 ETF Vanguard
    { id: 12247, name: "VTI", ticker: "VTI" }, // Total Stock Market ETF Vanguard
    { id: 12288, name: "WTI", ticker: "WTI" }, // Crude Oil
    { id: 12292, name: "NG", ticker: "NG" }, // Natural Gas
    { id: 12276, name: "TLT", ticker: "TLT" }, // 20+ Year Treasury Bond
] as const;

/**
 * Random Math Evaluation Templates
 */
const MATH_EVALUATION_TEMPLATES = [
    "price > {target}",
    "price < {target}",
    "price >= {target}",
    "price <= {target}",
    "price * 1.1 > {target}",
    "price * 0.9 < {target}",
    "(price + {target}) / 2 > price",
    "price > {target} * 0.95",
    "price < {target} * 1.05",
    "price > {target} AND price < {target} * 1.2",
] as const;

/**
 * Generate a random math evaluation
 */
export const generateRandomMathEvaluation = (targetValue: number): string => {
    const template = MATH_EVALUATION_TEMPLATES[
        Math.floor(Math.random() * MATH_EVALUATION_TEMPLATES.length)
    ];
    return template.replace(/{target}/g, targetValue.toFixed(2));
};

/**
 * Get a random fallback data source
 */
export const getRandomFallbackDataSource = () => {
    const randomIndex = Math.floor(Math.random() * FALLBACK_DATA_SOURCES.length);
    const fallback = FALLBACK_DATA_SOURCES[randomIndex];
    const fullSource = TRUSTED_DATA_SOURCES.find(s => s.id === fallback.id);
    
    if (!fullSource) {
        throw new Error(`Fallback data source ${fallback.id} not found in TRUSTED_DATA_SOURCES`);
    }
    
    return {
        id: fullSource.id,
        currentValue: parseFloat(fullSource.price) || 0,
        targetValue: parseFloat(fullSource.price) * (0.9 + Math.random() * 0.2), // Random target between 90-110% of current
        operator: Math.random() > 0.5 ? '>' : '<',
    };
};

/**
 * Validate if a data source ID exists in TRUSTED_DATA_SOURCES
 */
export const isValidDataSourceId = (id: number): boolean => {
    return TRUSTED_DATA_SOURCES.some(source => source.id === id);
};

/**
 * Get valid data source info by ID, or return fallback
 */
export const getValidDataSource = (id: number) => {
    const source = TRUSTED_DATA_SOURCES.find(s => s.id === id);
    if (source) {
        return {
            id: source.id,
            currentValue: parseFloat(source.price) || 0,
            targetValue: parseFloat(source.price) * 1.1,
            operator: '>' as const,
        };
    }
    // Return fallback if invalid
    return getRandomFallbackDataSource();
};

/**
 * Validate and fix strategy data sources
 * Replaces invalid IDs with valid fallback sources
 */
export const validateAndFixStrategy = (strategy: MarketStrategy): MarketStrategy => {
    if (!strategy.usedDataSources || strategy.usedDataSources.length === 0) {
        // If no data sources, add a random fallback
        return {
            ...strategy,
            usedDataSources: [getRandomFallbackDataSource()],
            mathematicalLogic: strategy.mathematicalLogic || generateRandomMathEvaluation(
                getRandomFallbackDataSource().targetValue
            ),
        };
    }

    // Validate and fix each data source
    const fixedDataSources = strategy.usedDataSources.map(ds => {
        if (isValidDataSourceId(ds.id)) {
            // Valid ID, but ensure we have proper values
            const source = TRUSTED_DATA_SOURCES.find(s => s.id === ds.id);
            return {
                id: ds.id,
                currentValue: ds.currentValue || (source ? parseFloat(source.price) : 0),
                targetValue: ds.targetValue || (source ? parseFloat(source.price) * 1.1 : 0),
                operator: ds.operator || '>',
            };
        } else {
            // Invalid ID, replace with fallback
            console.warn(`Invalid data source ID ${ds.id} in strategy ${strategy.id}, using fallback`);
            return getRandomFallbackDataSource();
        }
    });

    // Ensure mathematical logic exists
    const fixedMathematicalLogic = strategy.mathematicalLogic || 
        fixedDataSources.map(ds => 
            `price ${ds.operator} ${ds.targetValue.toFixed(2)}`
        ).join(' AND ');

    return {
        ...strategy,
        usedDataSources: fixedDataSources,
        mathematicalLogic: fixedMathematicalLogic,
    };
};

/**
 * Validate and fix multiple strategies
 */
export const validateAndFixStrategies = (strategies: MarketStrategy[]): MarketStrategy[] => {
    return strategies.map(validateAndFixStrategy);
};

