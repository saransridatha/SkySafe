import { TTLCache } from "@/lib/cache/lru";
import { NewsHeadline, NewsIntelligence } from "@/lib/types";
import { threatFromKeywords } from "@/lib/utils/risk";
import sampleNews from "@/data/news_samples.json";

const THREAT_KEYWORDS = [
  "war",
  "missile",
  "airspace closure",
  "military",
  "sanctions",
  "terrorism",
  "security",
  "conflict",
  "attack",
  "threat",
  "explosion",
  "drone",
  "no-fly",
  "restricted airspace",
  "shootdown",
  "insurgent",
];

const cache = new TTLCache<NewsIntelligence>(500);
const TTL_MS = 60 * 60 * 1000;

// Country name mapping for better search queries
const COUNTRY_NAMES: Record<string, string> = {
  AF: "Afghanistan", AL: "Albania", DZ: "Algeria", AR: "Argentina", AM: "Armenia",
  AU: "Australia", AT: "Austria", AZ: "Azerbaijan", BH: "Bahrain", BD: "Bangladesh",
  BE: "Belgium", BR: "Brazil", BG: "Bulgaria", CA: "Canada", CL: "Chile",
  CN: "China", CO: "Colombia", CD: "Congo", HR: "Croatia", CZ: "Czech Republic",
  DK: "Denmark", EG: "Egypt", ET: "Ethiopia", FI: "Finland", FR: "France",
  GE: "Georgia", DE: "Germany", GH: "Ghana", GR: "Greece", HK: "Hong Kong",
  HU: "Hungary", IN: "India", ID: "Indonesia", IQ: "Iraq", IR: "Iran",
  IE: "Ireland", IL: "Israel", IT: "Italy", JP: "Japan", JO: "Jordan",
  KE: "Kenya", KR: "South Korea", KW: "Kuwait", KG: "Kyrgyzstan", LB: "Lebanon",
  LY: "Libya", MY: "Malaysia", MX: "Mexico", MM: "Myanmar", NP: "Nepal",
  NL: "Netherlands", NZ: "New Zealand", NG: "Nigeria", NO: "Norway", OM: "Oman",
  PK: "Pakistan", PE: "Peru", PH: "Philippines", PL: "Poland", PT: "Portugal",
  QA: "Qatar", RO: "Romania", RU: "Russia", SA: "Saudi Arabia", SG: "Singapore",
  SK: "Slovakia", SO: "Somalia", ZA: "South Africa", ES: "Spain", LK: "Sri Lanka",
  SD: "Sudan", SE: "Sweden", CH: "Switzerland", SY: "Syria", TJ: "Tajikistan",
  TZ: "Tanzania", TH: "Thailand", TN: "Tunisia", TR: "Turkey", TM: "Turkmenistan",
  UA: "Ukraine", AE: "United Arab Emirates", UG: "Uganda", GB: "United Kingdom",
  US: "United States", UZ: "Uzbekistan", VN: "Vietnam", YE: "Yemen",
  MA: "Morocco",
};

function getCountryName(code: string): string {
  return COUNTRY_NAMES[code.toUpperCase()] || code;
}

function detectKeywords(text: string): string[] {
  const lower = text.toLowerCase();
  return THREAT_KEYWORDS.filter((kw) => lower.includes(kw));
}

async function fetchGNews(country: string): Promise<NewsHeadline[]> {
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey || apiKey === "your_gnews_api_key_here") return [];

  const countryName = getCountryName(country);
  try {
    const query = `${countryName} aviation OR airspace OR conflict OR security`;
    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=5&apikey=${apiKey}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });

    if (response.status === 429 || response.status === 403) {
      console.warn(`GNews rate limited for ${country}`);
      return [];
    }
    if (!response.ok) return [];

    const data = await response.json();
    if (data.errors) {
      console.warn(`GNews API error for ${country}:`, data.errors);
      return [];
    }

    return (data.articles || []).map((a: any) => ({
      title: a.title || "",
      source: a.source?.name || "GNews",
      url: a.url || "",
      publishedAt: a.publishedAt || new Date().toISOString(),
    }));
  } catch (error) {
    console.error(`Error fetching GNews for ${country}:`, error);
    return [];
  }
}

async function fetchNewsAPI(country: string): Promise<NewsHeadline[]> {
  const apiKey = process.env.NEWSAPI_KEY;
  if (!apiKey || apiKey === "your_newsapi_key_here") return [];

  const countryName = getCountryName(country);
  try {
    // NewsAPI free tier doesn't allow server-side calls (returns 426).
    // Use the "top-headlines" endpoint with country code when possible,
    // fall back to "everything" with sortBy=publishedAt.
    const NEWSAPI_COUNTRY_CODES: Record<string, string> = {
      AE: "ae", AR: "ar", AT: "at", AU: "au", BE: "be", BR: "br", BG: "bg",
      CA: "ca", CN: "cn", CO: "co", CZ: "cz", DE: "de", EG: "eg", FR: "fr",
      GB: "gb", GR: "gr", HK: "hk", HU: "hu", ID: "id", IE: "ie", IL: "il",
      IN: "in", IT: "it", JP: "jp", KR: "kr", LT: "lt", LV: "lv", MA: "ma",
      MX: "mx", MY: "my", NG: "ng", NL: "nl", NO: "no", NZ: "nz", PH: "ph",
      PL: "pl", PT: "pt", RO: "ro", RS: "rs", RU: "ru", SA: "sa", SE: "se",
      SG: "sg", SK: "sk", TH: "th", TR: "tr", TW: "tw", UA: "ua", US: "us",
      ZA: "za",
    };

    const newsCountryCode = NEWSAPI_COUNTRY_CODES[country.toUpperCase()];
    let url: string;
    if (newsCountryCode) {
      url = `https://newsapi.org/v2/top-headlines?country=${newsCountryCode}&category=general&pageSize=5&apiKey=${apiKey}`;
    } else {
      url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(countryName + " security OR conflict")}&pageSize=5&sortBy=publishedAt&apiKey=${apiKey}`;
    }

    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });

    if (response.status === 426 || response.status === 429 || response.status === 403) {
      // Free tier limitation or rate limited
      return [];
    }
    if (!response.ok) return [];

    const data = await response.json();
    if (data.status === "error") {
      console.warn(`NewsAPI error for ${country}:`, data.message);
      return [];
    }

    return (data.articles || [])
      .filter((a: any) => a.title && a.title !== "[Removed]")
      .map((a: any) => ({
        title: a.title || "",
        source: a.source?.name || "NewsAPI",
        url: a.url || "",
        publishedAt: a.publishedAt || new Date().toISOString(),
      }));
  } catch (error) {
    console.error(`Error fetching NewsAPI for ${country}:`, error);
    return [];
  }
}

export async function getNewsIntel(countries: string[]): Promise<NewsIntelligence> {
  const key = countries.map((c) => c.toUpperCase()).sort().join(",");
  const cached = cache.get(key);
  if (cached) return cached;

  // Fetch news for all countries in parallel (batch of 5 to avoid rate limits)
  const results = [];
  const batchSize = 5;

  for (let i = 0; i < countries.length; i += batchSize) {
    const batch = countries.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (country) => {
        const upper = country.toUpperCase();

        // Try GNews first, then NewsAPI, then mock data
        let headlines = await fetchGNews(upper);

        if (headlines.length === 0) {
          headlines = await fetchNewsAPI(upper);
        }

        if (headlines.length === 0) {
          const source = sampleNews as Record<string, NewsHeadline[]>;
          headlines = (source[upper] || []).slice(0, 5);
        }

        const keywordSet = new Set<string>();
        headlines.forEach((h) => {
          detectKeywords(`${h.title}`).forEach((kw) => keywordSet.add(kw));
        });

        const threatKeywords = Array.from(keywordSet);
        return {
          country: upper,
          headlines,
          threatLevel: threatFromKeywords(threatKeywords.length),
          threatKeywords,
        };
      })
    );
    results.push(...batchResults);
  }

  const output: NewsIntelligence = { results };
  cache.set(key, output, TTL_MS);
  return output;
}
