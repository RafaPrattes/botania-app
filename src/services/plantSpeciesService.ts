import { searchCuratedHouseplants } from '../data/houseplantLibrary';

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
    lower.includes('mammillaria')
  )
    return 'cacto';
  if (
    lower.includes('suculent') ||
    lower.includes('echeveria') ||
    lower.includes('aloe') ||
    lower.includes('babosa')
  )
    return 'suculenta';
  if (lower.includes('bonsai') || lower.includes('retusa')) return 'bonsai';
  if (
    lower.includes('jiboia') ||
    lower.includes('jibóia') ||
    lower.includes('samambaia') ||
    lower.includes('hera') ||
    lower.includes('pendente')
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
    lower.includes('antúrio') ||
    lower.includes('anturio') ||
    lower.includes('lavanda')
  )
    return 'flor';
  return 'folhagem';
}

export async function searchPlantSpecies(
  query: string
): Promise<PlantCatalogOption[]> {
  const clean = query.trim();

  // 1. Primeiro: busca instantânea nas 20 plantas mais comuns em casas brasileiras
  const localMatches: PlantCatalogOption[] = searchCuratedHouseplants(clean).map(
    (item) => ({
      id: `curated-${item.id}`,
      popularName: item.popularName,
      scientificName: item.scientificName,
      category: item.category,
    })
  );

  if (clean.length < 2 || localMatches.length >= 4) {
    return localMatches.slice(0, 8);
  }

  // 2. Complementa com OpenSearch apenas para espécies raras fora da biblioteca curada
  const cacheKey = clean.toLowerCase();
  if (searchCache.has(cacheKey)) {
    return [...localMatches, ...searchCache.get(cacheKey)!].slice(0, 8);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const url = `https://pt.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(
      clean
    )}&limit=4&namespace=0&format=json&origin=*`;

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

    const remoteResults: PlantCatalogOption[] = titles
      .filter(
        (title) =>
          !localMatches.some(
            (m) => m.popularName.toLowerCase() === title.toLowerCase()
          )
      )
      .map((title, idx) => ({
        id: `wiki-${cacheKey}-${idx}`,
        popularName: title,
        scientificName: descriptions[idx] || 'Espécie catalogada',
        category: inferPlantArchetype(`${title} ${descriptions[idx] || ''}`),
      }));

    searchCache.set(cacheKey, remoteResults);
    return [...localMatches, ...remoteResults].slice(0, 8);
  } catch {
    return localMatches;
  }
}