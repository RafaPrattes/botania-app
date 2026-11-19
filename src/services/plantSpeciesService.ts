export type PlantArchetype =
  | 'pendente'
  | 'suculenta'
  | 'cacto'
  | 'bonsai'
  | 'flor'
  | 'folhagem';

export interface SpeciesSearchResult {
  id: string;
  popularName: string;
  scientificName: string;
  category: PlantArchetype;
  careSummary: string;
}

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const PERENUAL_KEY = process.env.EXPO_PUBLIC_PERENUAL_API_KEY || 'sk-demo';
const searchCache = new Map<string, SpeciesSearchResult[]>();

export function inferPlantArchetype(text: string): PlantArchetype {
  const t = text.toLowerCase();
  if (t.includes('bonsai') || t.includes('plinia') || t.includes('pinus') || t.includes('ficus retusa')) return 'bonsai';
  if (t.includes('cacto') || t.includes('cactus') || t.includes('opuntia') || t.includes('cereus') || t.includes('mammillaria')) return 'cacto';
  if (t.includes('suculenta') || t.includes('echeveria') || t.includes('aloe') || t.includes('babosa') || t.includes('jade') || t.includes('sedum')) return 'suculenta';
  if (t.includes('jiboia') || t.includes('epipremnum') || t.includes('samambaia') || t.includes('hera') || t.includes('colar') || t.includes('pendente')) return 'pendente';
  if (t.includes('kalanchoe') || t.includes('orquídea') || t.includes('orquidea') || t.includes('lírio') || t.includes('lirio') || t.includes('antúrio') || t.includes('rosa') || t.includes('lavanda') || t.includes('flor')) return 'flor';
  return 'folhagem';
}

export async function searchBotanicalSpecies(
  query: string
): Promise<SpeciesSearchResult[]> {
  const clean = query.trim();
  if (clean.length < 2) return [];

  const cacheKey = clean.toLowerCase();
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey)!;
  }

  // 1. Tenta busca inteligente via Gemini (retorna nomes populares em PT-BR + científico + arquétipo)
  if (GEMINI_API_KEY) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const prompt = `Você é um banco de dados botânico. O usuário pesquisou "${clean}".
Retorne até 8 espécies reais de plantas domésticas correspondentes em JSON puro (sem markdown):
[
  {
    "popularName": "Nome popular em português",
    "scientificName": "Nome científico",
    "category": "pendente | suculenta | cacto | bonsai | flor | folhagem",
    "careSummary": "Dica curta de rega e luz"
  }
]`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
        const list = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) {
          const mapped: SpeciesSearchResult[] = list.map((item: any, idx: number) => ({
            id: `gem-${cacheKey}-${idx}`,
            popularName: item.popularName || clean,
            scientificName: item.scientificName || 'Espécie botânica',
            category: item.category || inferPlantArchetype(`${item.popularName} ${item.scientificName}`),
            careSummary: item.careSummary || 'Luz indireta e rega moderada.',
          }));
          searchCache.set(cacheKey, mapped);
          return mapped;
        }
      }
    } catch {
      // Continua para a API pública Perenual se offline/sem cota
    }
  }

  // 2. Fallback para API Botânica Pública Perenual
  try {
    const url = `https://perenual.com/api/v2/species-list?key=${PERENUAL_KEY}&q=${encodeURIComponent(clean)}`;
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      const items = (json?.data || []).slice(0, 8).map((item: any) => {
        const sci = Array.isArray(item.scientific_name)
          ? item.scientific_name[0]
          : item.scientific_name || '';
        const pop = item.common_name || sci || clean;
        return {
          id: `per-${item.id}`,
          popularName: pop,
          scientificName: sci,
          category: inferPlantArchetype(`${pop} ${sci}`),
          careSummary: `Rega: ${item.watering || 'Moderada'}`,
        };
      });
      if (items.length > 0) {
        searchCache.set(cacheKey, items);
        return items;
      }
    }
  } catch {
    // Sem conexão
  }

  return [];
}
