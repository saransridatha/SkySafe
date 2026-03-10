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
  "security"
];

const COUNTRY_NAMES: Record<string, string> = {
  AF: "Afghanistan", AE: "United Arab Emirates", AU: "Australia",
  BD: "Bangladesh", BG: "Bulgaria", BR: "Brazil", CA: "Canada",
  CD: "Congo", CH: "Switzerland", CN: "China", CZ: "Czech Republic",
  DE: "Germany", DK: "Denmark", EG: "Egypt", ES: "Spain",
  ET: "Ethiopia", FI: "Finland", FR: "France", GB: "United Kingdom",
  GR: "Greece", HU: "Hungary", ID: "Indonesia", IE: "Ireland",
  IL: "Israel", IN: "India", IQ: "Iraq", IR: "Iran", IT: "Italy",
  JO: "Jordan", JP: "Japan", KE: "Kenya", KR: "South Korea",
  KZ: "Kazakhstan", LB: "Lebanon", LK: "Sri Lanka", LY: "Libya",
  MM: "Myanmar", MX: "Mexico", MY: "Malaysia", NL: "Netherlands",
  NO: "Norway", NP: "Nepal", OM: "Oman", PH: "Philippines",
  PK: "Pakistan", PL: "Poland", PT: "Portugal", QA: "Qatar",
  RO: "Romania", RU: "Russia", SA: "Saudi Arabia", SD: "Sudan",
  SE: "Sweden", SG: "Singapore", SO: "Somalia", SY: "Syria",
  TH: "Thailand", TN: "Tunisia", TR: "Turkey", TW: "Taiwan",
  UA: "Ukraine", US: "United States", UZ: "Uzbekistan",
  VN: "Vietnam", YE: "Yemen", ZA: "South Africa"
};

function getCountryName(code: string): string {
  return COUNTRY_NAMES[code] || code;
}

const cache = new TTLCache<NewsIntelligence>(500);
const TTL_MS = 60 * 60 * 1000; // 1 hour cache for news

function detectKeywords(text: string): string[] {
  const lower = text.toLowerCase();
  return THREAT_KEYWORDS.filter((kw) => lower.includes(kw));
}

async function fetchGNews(country: string): Promise<NewsHeadline[]> {
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey || apiKey === "your_gnews_api_key_here") return [];

  try {
    const countryName = getCountryName(country);
    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(countryName + " aviation security OR conflict")}&lang=en&max=5&apikey=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`GNews API error: ${response.statusText}`);
    
    const data = await response.json();
    return (data.articles || []).map((a: any) => ({
      title: a.title,
      source: a.source?.name || "GNews",
      url: a.url,
      publishedAt: a.publishedAt
    }));
  } catch (error) {
    console.error(`Error fetching GNews for ${country}:`, error);
    return [];
  }
}

async function fetchNewsAPI(country: string): Promise<NewsHeadline[]> {
  const apiKey = process.env.NEWSAPI_KEY;
  if (!apiKey || apiKey === "your_newsapi_key_here") return [];

  try {
    const countryName = getCountryName(country);
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(countryName + " aviation security")}&pageSize=5&apiKey=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`NewsAPI error: ${response.statusText}`);
    
    const data = await response.json();
    return (data.articles || []).map((a: any) => ({
      title: a.title,
      source: a.source?.name || "NewsAPI",
      url: a.url,
      publishedAt: a.publishedAt
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

  const results = await Promise.all(
    countries.map(async (country) => {
      const upper = country.toUpperCase();
      
      // Try real-time APIs first, fallback to mock data
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
        threatKeywords
      };
    })
  );

  const output: NewsIntelligence = { results };
  cache.set(key, output, TTL_MS);
  return output;
}
