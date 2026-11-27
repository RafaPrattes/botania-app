import * as FileSystem from 'expo-file-system/legacy';
import { inferPlantArchetype, PlantArchetype } from './plantSpeciesService';
import { AppLanguage } from '../theme/theme';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim();
const TEXT_MODEL_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
const IMAGE_MODEL_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image:generateContent?key=${GEMINI_API_KEY}`;

function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/^#+\s*/gm, '')
    .trim();
}

export function normalizeSpeciesKey(species: string): string {
  return species
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

const LANGUAGE_INSTRUCTION: Record<AppLanguage, string> = {
  pt: 'Responda obrigatoriamente em português do Brasil.',
  en: 'You MUST reply strictly in English.',
  es: 'Responde obligatoriamente en español.',
};

const MISSING_KEY_MSG: Record<AppLanguage, string> = {
  pt: 'Chave da API do Gemini não encontrada. Confirme EXPO_PUBLIC_GEMINI_API_KEY no arquivo .env e reinicie com npx expo start -c.',
  en: 'Gemini API key not found. Check EXPO_PUBLIC_GEMINI_API_KEY in your .env file and restart with npx expo start -c.',
  es: 'Clave de API de Gemini no encontrada. Verifica EXPO_PUBLIC_GEMINI_API_KEY en .env y reinicia con npx expo start -c.',
};

export async function analyzePlantWithGemini(
  userQuestion: string,
  imageBase64?: string,
  language: AppLanguage = 'pt'
): Promise<string> {
  if (!GEMINI_API_KEY) {
    return MISSING_KEY_MSG[language];
  }

  const promptText =
    userQuestion.trim() ||
    (language === 'en'
      ? 'Analyze this plant and give practical care guidance.'
      : language === 'es'
      ? 'Analiza esta planta y dame consejos prácticos de cuidado.'
      : 'Analise esta planta e me dê orientações práticas de cuidados.');

  const parts: any[] = [
    {
      text: `You are BotanIA, a warm and knowledgeable botanical consultant. ${LANGUAGE_INSTRUCTION[language]} Do not use asterisks or markdown. Use short, clear paragraphs. User question: ${promptText}`,
    },
  ];

  if (imageBase64) {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageBase64,
      },
    });
  }

  try {
    const response = await fetch(TEXT_MODEL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1024,
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });

    const data = await response.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!raw) {
      return language === 'en'
        ? 'Could not generate a response right now. Please try again in a moment.'
        : language === 'es'
        ? 'No pude generar una respuesta ahora. Inténtalo de nuevo en unos segundos.'
        : 'Não consegui gerar uma resposta agora. Tente enviar a pergunta novamente em alguns segundos.';
    }

    return cleanMarkdown(raw);
  } catch {
    return language === 'en'
      ? 'Unable to reach the botanical assistant right now. Check your internet connection.'
      : language === 'es'
      ? 'Sin conexión con la consultoría botánica en este momento.'
      : 'Sem conexão com a consultoria botânica no momento. Verifique sua internet e tente novamente.';
  }
}

export interface IdentifiedPlantResult {
  popularName: string;
  scientificName: string;
  category: PlantArchetype;
}

export async function identifyPlantFromPhoto(
  imageBase64: string
): Promise<
  | { ok: true; data: IdentifiedPlantResult }
  | { ok: false; reason: 'missing_key' | 'not_a_plant' | 'network_error' }
> {
  if (!GEMINI_API_KEY) {
    return { ok: false, reason: 'missing_key' };
  }

  try {
    const response = await fetch(TEXT_MODEL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: 'Identify this plant and respond ONLY with valid JSON: {"popularName":"Common name","scientificName":"Scientific name","category":"pendente|suculenta|cacto|bonsai|flor|folhagem"}. If there is no clear plant, respond {"error":"not_a_plant"}.',
              },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: imageBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 300,
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });

    const json = await response.json();
    const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return { ok: false, reason: 'network_error' };

    const parsed = JSON.parse(rawText);
    if (parsed?.error === 'not_a_plant' || !parsed?.popularName) {
      return { ok: false, reason: 'not_a_plant' };
    }

    const validCategories: PlantArchetype[] = [
      'pendente',
      'suculenta',
      'cacto',
      'bonsai',
      'flor',
      'folhagem',
    ];
    const resolvedCategory = validCategories.includes(parsed.category)
      ? parsed.category
      : inferPlantArchetype(`${parsed.popularName} ${parsed.scientificName}`);

    return {
      ok: true,
      data: {
        popularName: parsed.popularName,
        scientificName: parsed.scientificName || parsed.popularName,
        category: resolvedCategory,
      },
    };
  } catch {
    return { ok: false, reason: 'network_error' };
  }
}

/**
 * Gera uma ilustração completa estilo Studio Ghibli em aquarela para a espécie exata
 * e salva permanentemente em disco (FileSystem.documentDirectory) para nunca regenerar.
 */
export async function generateGhibliPlantArt(
  speciesName: string
): Promise<string | null> {
  if (!GEMINI_API_KEY) return null;

  const slug = normalizeSpeciesKey(speciesName) || 'plant';
  const dirUri = `${FileSystem.documentDirectory}botania-art/`;
  const fileUri = `${dirUri}${slug}.png`;

  try {
    // 1. Se já existe no disco do celular, devolve imediatamente sem gastar API!
    const existing = await FileSystem.getInfoAsync(fileUri);
    if (existing.exists) {
      return fileUri;
    }

    const prompt = `Hand-painted Studio Ghibli watercolor and gouache illustration of a single lush "${speciesName}" houseplant in an artisanal terracotta pot, centered cleanly on a warm stone windowsill in front of a cozy arched wooden greenhouse window. Soft morning sunlight rays, gentle bokeh garden foliage outside, clean uncluttered composition with NO extra pots on the sill, NO text, NO watermark, NO human hands. Warm sage green, cream linen, and terracotta color palette, storybook cozy game aesthetic.`;

    const response = await fetch(IMAGE_MODEL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ['IMAGE'],
          imageConfig: {
            aspectRatio: '3:4',
          },
        },
      }),
    });

    const data = await response.json();
    const parts: any[] = data?.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((p) => p?.inlineData?.data);

    if (!imagePart?.inlineData?.data) {
      return null;
    }

    await FileSystem.makeDirectoryAsync(dirUri, { intermediates: true });
    await FileSystem.writeAsStringAsync(fileUri, imagePart.inlineData.data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return fileUri;
  } catch {
    return null;
  }
}