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
  if (lower.includes('cact') || lower.includes('mandacaru')) return 'cacto';
  if (
    lower.includes('suculent') ||
    lower.includes('echeveria') ||
    lower.includes('aloe') ||
    lower.includes('babosa')
  )
    return 'suculenta';
  if (lower.includes('bonsai') || lower.includes('ficus')) return 'bonsai';
  if (
    lower.includes('jiboia') ||
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
    lower.includes('kalanchoe')
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

    const url = `https://pt.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
      `${clean} planta`
    )}&gsrlimit=6&prop=pageimages|extracts&exintro=1&explaintext=1&exsentences=1&piprop=thumbnail&pithumbsize=400&format=json&origin=*`;

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    const data = await response.json();
    const pages = data?.query?.pages;
    if (!pages) return [];

    const results: PlantCatalogOption[] = Object.values(pages).map(
      (page: any) => ({
        id: String(page.pageid),
        popularName: page.title,
        scientificName: page.extract
          ? page.extract.slice(0, 68)
          : 'Espécie botânica',
        category: inferPlantArchetype(`${page.title} ${page.extract || ''}`),
        imageUrl: page.thumbnail?.source,
      })
    );

    searchCache.set(cacheKey, results);
    return results;
  } catch {
    return [];
  }
}
