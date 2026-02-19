// usePriceCalculation Hook
// Marcus: "This hook handles async price fetching. A bit janky but works."

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  Configuration,
  Product,
  PriceBreakdown,
  PriceResponse,
} from "../components/ProductConfigurator/types";
import { calculatePrice } from "../services/api";

interface UsePriceCalculationResult {
  price: PriceBreakdown | null;
  formattedTotal: string;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Custom hook for managing price calculation
 */
export function usePriceCalculation(
  config: Configuration | null,
  product: Product,
): UsePriceCalculationResult {
  const [price, setPrice] = useState<PriceBreakdown | null>(null);
  const [formattedTotal, setFormattedTotal] = useState<string>("$0.00");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestVersionRef = useRef<number>(0);

  const fetchPrice = useCallback(async () => {
    if (!config) {
      setPrice(null);
      setFormattedTotal("$0.00");
      return;
    }

    setIsLoading(true);
    setError(null);

    const myVersion = ++requestVersionRef.current;

    try {
      const response: PriceResponse = await calculatePrice(config, product);

      if (myVersion === requestVersionRef.current) {
        setPrice(response.breakdown);
        setFormattedTotal(response.formattedTotal);
      }
    } catch {
      if (myVersion === requestVersionRef.current) {
        setError("ERR_PRICE_CALC_FAILED");
        setPrice(null);
      }
    } finally {
      if (myVersion === requestVersionRef.current) {
        setIsLoading(false);
      }
    }
  }, [config, product]);

  // Fetch price when config changes
  useEffect(() => {
    fetchPrice();
  }, [fetchPrice]);

  return {
    price,
    formattedTotal,
    isLoading,
    error,
    refetch: fetchPrice,
  };
}

/**
 * Debounced version of price calculation
 */
export function useDebouncedPriceCalculation(
  config: Configuration | null,
  product: Product,
  delay: number = 300,
): UsePriceCalculationResult {
  const [price, setPrice] = useState<PriceBreakdown | null>(null);
  const [formattedTotal, setFormattedTotal] = useState<string>("$0.00");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const configRef = useRef(config);

  useEffect(() => {
    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!config) {
      setPrice(null);
      setFormattedTotal("$0.00");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    timeoutRef.current = setTimeout(async () => {
      try {
        const response = await calculatePrice(configRef.current!, product);
        setPrice(response.breakdown);
        setFormattedTotal(response.formattedTotal);
        setError(null);
      } catch {
        setError("ERR_PRICE_CALC_FAILED");
      } finally {
        setIsLoading(false);
      }
    }, delay);

    configRef.current = config;

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [config, product, delay]);

  const refetch = useCallback(() => {
    if (config) {
      setIsLoading(true);
      calculatePrice(config, product)
        .then((response) => {
          setPrice(response.breakdown);
          setFormattedTotal(response.formattedTotal);
          setError(null);
        })
        .catch(() => {
          setError("ERR_PRICE_CALC_FAILED");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [config, product]);

  return {
    price,
    formattedTotal,
    isLoading,
    error,
    refetch,
  };
}
