import { PlantArchetype, inferPlantArchetype } from '../data/plantCatalog';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const BOTANIST_SYSTEM_PROMPT = `Você é o BotanIA, um mestre botânico amigável e especialista em plantas domésticas.
Analise a foto e/ou dúvida do usuário e responda em português (PT-BR) de forma prática, acolhedora e objetiva, em no máximo 3 tópicos curtos:
1. Identificação da espécie (nome popular e científico) e saúde visual das folhas/espinhos/caules.
2. Diagnóstico provável (ex: excesso de água, falta de luz, baixa umidade).
3. Passo a passo imediato do que fazer hoje.`;

export interface IdentifiedPlantResult {
  popularName: string;
  scientificName: string;
  category: PlantArchetype;
  careTip: string;
}

export async function consultBotanistAI(
  imageBase64: string | null,
  userPrompt: string
): Promise<string> {
  if (!GEMINI_API_KEY) {
    return '⚠️ Chave EXPO_PUBLIC_GEMINI_API_KEY não encontrada no arquivo .env. Configure sua chave gratuita do Google AI Studio para ativar a análise em tempo real.';
  }

  try {
    const parts: any[] = [
      {
        text: `${BOTANIST_SYSTEM_PROMPT}\n\nPergunta do usuário: ${
          userPrompt || 'Analise esta planta e me dê dicas de cuidado.'
        }`,
      },
    ];

    if (imageBase64) {
      parts.push({
        inline_data: {
          mime_type: 'image/jpeg',
          data: imageBase64,
        },
      });
    }

    const response = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 500 },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || 'Erro ao consultar Gemini API');
    }

    return (
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      'Não consegui interpretar a resposta. Tente novamente.'
    );
  } catch (error: any) {
    return `Não foi possível conectar ao especialista agora (${error.message}). Verifique sua internet e a chave da API.`;
  }
}

export async function identifyPlantFromPhoto(
  imageBase64: string
): Promise<IdentifiedPlantResult> {
  if (!GEMINI_API_KEY) {
    throw new Error(
      'Configure EXPO_PUBLIC_GEMINI_API_KEY no seu arquivo .env para identificar fotos.'
    );
  }

  const prompt = `Observe com muita atenção a planta na imagem (pode ser um cacto, suculenta, bonsai, planta pendente, flor ou folhagem tropical).
Identifique a espécie real da foto e retorne APENAS um JSON válido neste formato exato, sem blocos markdown:
{
  "popularName": "Nome popular em português",
  "scientificName": "Nome científico",
  "category": "cacto | suculenta | bonsai | pendente | flor | folhagem",
  "careTip": "Uma dica curta e prática de cuidado"
}`;

  const response = await fetch(GEMINI_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            { inline_data: { mime_type: 'image/jpeg', data: imageBase64 } },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.15,
        responseMimeType: 'application/json',
      },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || 'Falha na visão computacional');
  }

  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  const parsed = JSON.parse(rawText);

  const validCategories: PlantArchetype[] = [
    'pendente',
    'suculenta',
    'cacto',
    'bonsai',
    'flor',
    'folhagem',
  ];

  const category: PlantArchetype = validCategories.includes(parsed.category)
    ? parsed.category
    : inferPlantArchetype(`${parsed.popularName} ${parsed.scientificName}`);

  return {
    popularName: parsed.popularName || 'Planta Identificada',
    scientificName: parsed.scientificName || 'Espécie botânica',
    category,
    careTip: parsed.careTip || 'Mantenha em local iluminado.',
  };
}
