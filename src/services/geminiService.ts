import { inferPlantArchetype, PlantArchetype } from './plantSpeciesService';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim();
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/^#+\s*/gm, '')
    .trim();
}

export async function analyzePlantWithGemini(
  userQuestion: string,
  imageBase64?: string
): Promise<string> {
  if (!GEMINI_API_KEY) {
    return 'Chave da API do Gemini não encontrada. Verifique EXPO_PUBLIC_GEMINI_API_KEY no arquivo .env e reinicie o servidor com npx expo start -c.';
  }

  const promptText =
    userQuestion.trim() ||
    'Analise esta planta e me dê orientações práticas de cuidados.';

  const parts: any[] = [
    {
      text: `Você é o BotanIA, um consultor botânico gentil e objetivo. Responda em português do Brasil, sem usar asteriscos ou markdown, em parágrafos curtos e claros. Dúvida do usuário: ${promptText}`,
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
    const response = await fetch(GEMINI_URL, {
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
      return 'Não consegui gerar uma resposta agora. Tente enviar a pergunta novamente em alguns segundos.';
    }

    return cleanMarkdown(raw);
  } catch {
    return 'Sem conexão com a consultoria botânica no momento. Verifique sua internet e tente novamente.';
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
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: 'Identifique esta planta e responda APENAS JSON válido no formato: {"popularName":"Nome popular em português do Brasil","scientificName":"Nome científico","category":"pendente|suculenta|cacto|bonsai|flor|folhagem"}. Escolha a categoria visual mais fiel. Se não houver planta nítida na foto, responda {"error":"not_a_plant"}.',
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
