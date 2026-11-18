
const SYSTEM_PROMPT = `Você é o BotanIA, um especialista botânico amigável e direto.
Quando o usuário enviar uma dúvida ou foto de uma planta:
1. Identifique possíveis sinais visuais (pontas secas, folhas amareladas, falta de luz ou excesso de água).
2. Responda em português de forma acolhedora e concisa.
3. Forneça no máximo 3 dicas práticas e acionáveis numeradas.`;

export interface AnalyzePlantParams {
  userPrompt: string;
  base64Image?: string | null;
}

export async function analyzePlantWithGemini({
  userPrompt,
  base64Image,
}: AnalyzePlantParams): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

  // Fallback de segurança caso a chave .env não esteja preenchida durante testes rápidos
  if (!apiKey) {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    return `Analisei sua mensagem${base64Image ? ' e a foto enviada' : ''}! 🌿\n\nOs sintomas relatados geralmente indicam oscilação na umidade do substrato ou exposição solar indireta insuficiente.\n\nDicas rápidas:\n1. Toque o solo a 2cm de profundidade antes de regar novamente.\n2. Mantenha a planta próxima a uma janela bem iluminada, evitando sol forte direto nas folhas.\n3. Borrife água filtrada nas folhas em dias mais secos.`;
  }

  try {
    const parts: Array<Record<string, unknown>> = [
      { text: `${SYSTEM_PROMPT}\n\nDúvida do usuário: ${userPrompt}` },
    ];

    if (base64Image) {
      parts.push({
        inline_data: {
          mime_type: 'image/jpeg',
          data: base64Image,
        },
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
        }),
      }
    );

    const data = await response.json();
    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      'Não consegui analisar a imagem no momento. Tente novamente em instantes!';
    return reply;
  } catch (error) {
    return 'Ocorreu um erro de conexão com o assistente botânico. Verifique sua internet e tente novamente.';
  }
}

export interface IdentifiedPlantResult {
  name: string;
  species: string;
  careTip: string;
}

export async function identifyPlantFromPhoto(
  base64Image: string
): Promise<IdentifiedPlantResult> {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

  // Fallback inteligente para testes sem chave de API
  if (!apiKey) {
    await new Promise((resolve) => setTimeout(resolve, 1400));
    return {
      name: 'Costela-de-Adão',
      species: 'Monstera deliciosa',
      careTip: 'Prefere luz indireta brilhante e rega quando o topo do solo secar.',
    };
  }

  const prompt = `Analise a foto desta planta e responda EXCLUSIVAMENTE um JSON válido (sem crases markdown) no formato:
{"name": "Nome popular em português", "species": "Nome científico", "careTip": "Uma dica curta de cuidado em 1 frase"}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                { inline_data: { mime_type: 'image/jpeg', data: base64Image } },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanedJson = rawText.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanedJson) as IdentifiedPlantResult;
  } catch {
    return {
      name: 'Planta Misteriosa',
      species: 'Espécie botânica',
      careTip: 'Mantenha em local iluminado e observe a umidade da terra.',
    };
  }
}