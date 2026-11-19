import { PlantArchetype, inferPlantArchetype } from './plantSpeciesService';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const BOTANIST_SYSTEM_PROMPT = `Você é o BotanIA, um mestre botânico amigável e especialista em plantas domésticas.
Analise a foto e/ou dúvida do usuário e responda em português (PT-BR) de forma acolhedora e objetiva, em no máximo 3 tópicos curtos:
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
    return '⚠️ Chave EXPO_PUBLIC_GEMINI_API_KEY não configurada no arquivo .env. Adicione sua chave do Google AI Studio na raiz do projeto e reinicie o Expo com "npx expo start -c".';
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
        generationConfig: { temperature: 0.35, maxOutputTokens: 500 },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || 'Erro na API Gemini');
    }

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) {
      throw new Error('A IA não retornou texto para esta imagem.');
    }
    return reply;
  } catch (error: any) {
    return `Não foi possível concluir a análise agora (${error.message}). Verifique sua conexão e tente enviar uma foto mais nítida.`;
  }
}

export async function identifyPlantFromPhoto(
  imageBase64: string
): Promise<IdentifiedPlantResult> {
  if (!GEMINI_API_KEY) {
    throw new Error(
      'Chave EXPO_PUBLIC_GEMINI_API_KEY ausente no arquivo .env. Configure o .env e reinicie o Expo com "npx expo start -c".'
    );
  }

  const prompt = `Analise cuidadosamente a imagem enviada.
Se NÃO houver uma planta visível ou a imagem estiver ilegível, retorne {"error": "Não foi possível identificar uma planta nítida nesta foto. Tente aproximar a câmera com boa iluminação."}.
Caso haja uma planta, identifique a espécie real (cacto, suculenta, bonsai, pendente, flor ou folhagem) e retorne APENAS JSON válido:
{
  "popularName": "Nome popular em português",
  "scientificName": "Nome científico",
  "category": "cacto | suculenta | bonsai | pendente | flor | folhagem",
  "careTip": "Uma dica prática e curta de cuidado"
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
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || 'Falha ao comunicar com Gemini Vision.');
  }

  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Sem resposta do modelo de visão. Tente novamente.');
  }

  const parsed = JSON.parse(rawText);
  if (parsed.error) {
    throw new Error(parsed.error);
  }

  if (!parsed.popularName) {
    throw new Error('Espécie não reconhecida com segurança. Tente outro ângulo.');
  }

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
    : inferPlantArchetype(`${parsed.popularName} ${parsed.scientificName || ''}`);

  return {
    popularName: parsed.popularName,
    scientificName: parsed.scientificName || 'Espécie botânica',
    category,
    careTip: parsed.careTip || 'Mantenha em ambiente iluminado.',
  };
}
