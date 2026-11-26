export type PlantArchetype =
  | 'pendente'
  | 'suculenta'
  | 'cacto'
  | 'bonsai'
  | 'flor'
  | 'folhagem';

export interface PlantCatalogOption {
  id: string;
  popularName: string;
  scientificName: string;
  category: PlantArchetype;
  imageUrl?: string;
}

const searchCache = new Map<string, PlantCatalogOption[]>();

export function inferPlantArchetype(text: string): PlantArchetype {
  const lower = text.toLowerCase();
  if (
    lower.includes('cact') ||
    lower.includes('mandacaru') ||
    lower.includes('mammillaria') ||
    lower.includes('opuntia')
  )
    return 'cacto';
  if (
    lower.includes('suculent') ||
    lower.includes('echeveria') ||
    lower.includes('aloe') ||
    lower.includes('babosa') ||
    lower.includes('jade') ||
    lower.includes('haworthia')
  )
    return 'suculenta';
  if (lower.includes('bonsai') || lower.includes('ficus')) return 'bonsai';
  if (
    lower.includes('jiboia') ||
    lower.includes('jibóia') ||
    lower.includes('samambaia') ||
    lower.includes('hera') ||
    lower.includes('pendente') ||
    lower.includes('peperomia')
  )
    return 'pendente';
  if (
    lower.includes('orquídea') ||
    lower.includes('orquidea') ||
    lower.includes('rosa') ||
    lower.includes('flor') ||
    lower.includes('lírio') ||
    lower.includes('lirio') ||
    lower.includes('kalanchoe') ||
    lower.includes('violeta') ||
    lower.includes('antúrio') ||
    lower.includes('anturio') ||
    lower.includes('girassol')
  )
    return 'flor';
  return 'folhagem';
}

export async function searchPlantSpecies(
  query: string
): Promise<PlantCatalogOption[]> {
  const clean = query.trim();
  if (clean.length < 2) return [];

  const cacheKey = clean.toLowerCase();
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey)!;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    // OpenSearch é otimizado para autocomplete em tempo real (ex: "Cact" -> "Cacto")
    const url = `https://pt.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(
      clean
    )}&limit=6&namespace=0&format=json&origin=*`;

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'BotanIAApp/1.0 (https://github.com/RafaPrattes/botania-app)',
      },
    });
    clearTimeout(timeoutId);

    const data = await response.json();
    const titles: string[] = Array.isArray(data?.[1]) ? data[1] : [];
    const descriptions: string[] = Array.isArray(data?.[2]) ? data[2] : [];

    const results: PlantCatalogOption[] = titles.map((title, idx) => ({
      id: `${cacheKey}-${idx}`,
      popularName: title,
      scientificName: descriptions[idx] || 'Espécie catalogada',
      category: inferPlantArchetype(`${title} ${descriptions[idx] || ''}`),
    }));

    searchCache.set(cacheKey, results);
    return results;
  } catch {
    return [];
  }
}