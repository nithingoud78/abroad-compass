import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Currency = "INR" | "EUR" | "USD";

type RateMap = Record<string, number>;

// Returns conversion helpers seeded from the public exchange_rates table.
// Falls back to sensible static rates if the table is empty.
const FALLBACK: RateMap = {
  "EUR>INR": 92.5,
  "USD>INR": 85,
  "EUR>USD": 1.08,
  "INR>EUR": 0.0108,
  "INR>USD": 0.0117,
  "USD>EUR": 0.93,
  "EUR>EUR": 1,
  "USD>USD": 1,
  "INR>INR": 1,
};

export function useCurrency() {
  const [rates, setRates] = useState<RateMap>(FALLBACK);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("exchange_rates")
      .select("base, quote, rate")
      .order("captured_at", { ascending: false })
      .then(({ data }) => {
        if (cancelled || !data) {
          setLoaded(true);
          return;
        }
        const m: RateMap = { ...FALLBACK };
        for (const row of data) {
          const key = `${row.base}>${row.quote}`;
          if (!(key in m) || m[key] === FALLBACK[key]) m[key] = Number(row.rate);
        }
        setRates(m);
        setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function convert(amount: number, from: Currency, to: Currency): number {
    if (from === to) return amount;
    const direct = rates[`${from}>${to}`];
    if (direct) return amount * direct;
    // bridge via EUR
    const a = rates[`${from}>EUR`] ?? 1;
    const b = rates[`EUR>${to}`] ?? 1;
    return amount * a * b;
  }

  function format(amount: number, currency: Currency): string {
    const locales: Record<Currency, string> = { INR: "en-IN", EUR: "de-DE", USD: "en-US" };
    return new Intl.NumberFormat(locales[currency], {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  return { rates, loaded, convert, format };
}
