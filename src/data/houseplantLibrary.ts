import { PlantArchetype } from '../services/plantSpeciesService';

export interface CuratedPlantSpecies {
  id: string;
  popularName: string;
  scientificName: string;
  aliases: string[];
  category: PlantArchetype;
  wateringDays: number;
  lightPt: string;
  lightEn: string;
  lightEs: string;
  petSafe: boolean;
  cozyMoodHealthy: string;
  cozyMoodThirsty: string;
}

export const HOUSEPLANT_LIBRARY: CuratedPlantSpecies[] = [
  {
    id: 'jiboia',
    popularName: 'Jiboia',
    scientificName: 'Epipremnum aureum',
    aliases: ['jibóia', 'pothos', 'hera do diabo', 'pendente'],
    category: 'pendente',
    wateringDays: 5,
    lightPt: 'Meia-sombra',
    lightEn: 'Indirect light',
    lightEs: 'Semisombra',
    petSafe: false,
    cozyMoodHealthy: 'Minhas folhas estão brilhando hoje!',
    cozyMoodThirsty: 'Meus ramos estão pedindo um gole de água...',
  },
  {
    id: 'costela-de-adao',
    popularName: 'Costela-de-adão',
    scientificName: 'Monstera deliciosa',
    aliases: ['monstera', 'costela de adao', 'folhagem'],
    category: 'folhagem',
    wateringDays: 7,
    lightPt: 'Luz indireta',
    lightEn: 'Bright indirect',
    lightEs: 'Luz indirecta',
    petSafe: false,
    cozyMoodHealthy: 'Adoro essa claridade filtrada pela janela.',
    cozyMoodThirsty: 'O substrato secou... que tal uma rega?',
  },
  {
    id: 'espada-de-sao-jorge',
    popularName: 'Espada-de-São-Jorge',
    scientificName: 'Dracaena trifasciata',
    aliases: ['espada', 'sansevieria', 'lança', 'lingua de sogra'],
    category: 'folhagem',
    wateringDays: 14,
    lightPt: 'Sombra a sol',
    lightEn: 'Low to bright',
    lightEs: 'Sombra o sol',
    petSafe: false,
    cozyMoodHealthy: 'Firme, forte e purificando o ar da casa.',
    cozyMoodThirsty: 'Já faz um tempo desde a última gotinha.',
  },
  {
    id: 'zamioculca',
    popularName: 'Zamioculca',
    scientificName: 'Zamioculcas zamiifolia',
    aliases: ['zz', 'planta da fortuna', 'sombra'],
    category: 'folhagem',
    wateringDays: 12,
    lightPt: 'Meia-sombra',
    lightEn: 'Low light',
    lightEs: 'Poca luz',
    petSafe: false,
    cozyMoodHealthy: 'Folhas verdinhas e tranquilas por aqui.',
    cozyMoodThirsty: 'Um pouquinho de água já me deixa renovada.',
  },
  {
    id: 'samambaia',
    popularName: 'Samambaia Americana',
    scientificName: 'Nephrolepis exaltata',
    aliases: ['samambaia', 'avenca', 'fern', 'pendente'],
    category: 'pendente',
    wateringDays: 3,
    lightPt: 'Luz filtrada',
    lightEn: 'Filtered light',
    lightEs: 'Luz filtrada',
    petSafe: true,
    cozyMoodHealthy: 'Amo umidade! Minhas frondes estão felizes.',
    cozyMoodThirsty: 'Estou sentindo o ar seco, preciso de água!',
  },
  {
    id: 'cacto-florido',
    popularName: 'Cacto',
    scientificName: 'Mammillaria spp.',
    aliases: ['cacto', 'cactus', 'mandacaru', 'cactos'],
    category: 'cacto',
    wateringDays: 14,
    lightPt: 'Sol pleno',
    lightEn: 'Full sun',
    lightEs: 'Sol directo',
    petSafe: true,
    cozyMoodHealthy: 'Curtindo o calorzinho do sol no parapeito.',
    cozyMoodThirsty: 'Até um cacto merece água de vez em quando!',
  },
  {
    id: 'suculenta-echeveria',
    popularName: 'Suculenta Echeveria',
    scientificName: 'Echeveria elegans',
    aliases: ['suculenta', 'rosa de pedra', 'echeveria', 'sedum'],
    category: 'suculenta',
    wateringDays: 10,
    lightPt: 'Sol suave',
    lightEn: 'Bright sun',
    lightEs: 'Sol suave',
    petSafe: true,
    cozyMoodHealthy: 'Roseta bem hidratada e coradinha!',
    cozyMoodThirsty: 'Minhas folhinhas estão ficando murchinhas.',
  },
  {
    id: 'bonsai-ficus',
    popularName: 'Bonsai Ficus',
    scientificName: 'Ficus retusa',
    aliases: ['bonsai', 'mini arvore', 'ficus'],
    category: 'bonsai',
    wateringDays: 3,
    lightPt: 'Luz direta',
    lightEn: 'Direct light',
    lightEs: 'Luz directa',
    petSafe: false,
    cozyMoodHealthy: 'Em paz, crescendo com paciência e equilíbrio.',
    cozyMoodThirsty: 'Meu solo raso seca rápido, hora da rega!',
  },
  {
    id: 'maranta',
    popularName: 'Maranta / Calathea',
    scientificName: 'Calathea orbifolia',
    aliases: ['maranta', 'calathea', 'rezadeira', 'pavão'],
    category: 'folhagem',
    wateringDays: 4,
    lightPt: 'Luz indireta',
    lightEn: 'Indirect light',
    lightEs: 'Luz indirecta',
    petSafe: true,
    cozyMoodHealthy: 'Minhas folhas dançam ao longo do dia!',
    cozyMoodThirsty: 'Minhas bordas estão enrolando de sede...',
  },
  {
    id: 'lirio-da-paz',
    popularName: 'Lírio-da-Paz',
    scientificName: 'Spathiphyllum wallisii',
    aliases: ['lirio', 'lírio', 'flor branca', 'paz'],
    category: 'flor',
    wateringDays: 4,
    lightPt: 'Meia-sombra',
    lightEn: 'Half shade',
    lightEs: 'Semisombra',
    petSafe: false,
    cozyMoodHealthy: 'Sereno e pronto para florescer.',
    cozyMoodThirsty: 'Minhas folhas baixaram avisando que quero água!',
  },
  {
    id: 'orquidea-phalaenopsis',
    popularName: 'Orquídea Borboleta',
    scientificName: 'Phalaenopsis spp.',
    aliases: ['orquidea', 'orquídea', 'flor'],
    category: 'flor',
    wateringDays: 7,
    lightPt: 'Claridade',
    lightEn: 'Bright indirect',
    lightEs: 'Mucha claridad',
    petSafe: true,
    cozyMoodHealthy: 'Raízes verdinhas e pétalas radiantes!',
    cozyMoodThirsty: 'Minhas raízes estão prateadas, posso beber água.',
  },
  {
    id: 'kalanchoe',
    popularName: 'Kalanchoe (Flor-da-Fortuna)',
    scientificName: 'Kalanchoe blossfeldiana',
    aliases: ['kalanchoe', 'calandiva', 'fortuna', 'flor'],
    category: 'flor',
    wateringDays: 7,
    lightPt: 'Sol da manhã',
    lightEn: 'Morning sun',
    lightEs: 'Sol de mañana',
    petSafe: false,
    cozyMoodHealthy: 'Cheia de florzinhas coloridas!',
    cozyMoodThirsty: 'O solo está sequinho, vamos regar?',
  },
  {
    id: 'ficus-lyrata',
    popularName: 'Ficus Lyrata',
    scientificName: 'Ficus lyrata',
    aliases: ['figueira lira', 'ficus', 'arvore interna'],
    category: 'folhagem',
    wateringDays: 7,
    lightPt: 'Luz forte',
    lightEn: 'Bright light',
    lightEs: 'Luz brillante',
    petSafe: false,
    cozyMoodHealthy: 'Folhas grandes e imponentes na sala.',
    cozyMoodThirsty: 'Hora de checar o solo antes que minhas folhas caiam.',
  },
  {
    id: 'babosa',
    popularName: 'Babosa (Aloe Vera)',
    scientificName: 'Aloe vera',
    aliases: ['aloe', 'babosa', 'suculenta'],
    category: 'suculenta',
    wateringDays: 12,
    lightPt: 'Sol pleno',
    lightEn: 'Full sun',
    lightEs: 'Sol directo',
    petSafe: false,
    cozyMoodHealthy: 'Reservatório natural cheinho de energia!',
    cozyMoodThirsty: 'Um banho leve de água vai me fazer bem.',
  },
  {
    id: 'peperomia',
    popularName: 'Peperômia Melancia',
    scientificName: 'Peperomia argyreia',
    aliases: ['peperomia', 'peperômia', 'melancia'],
    category: 'folhagem',
    wateringDays: 6,
    lightPt: 'Meia-sombra',
    lightEn: 'Indirect light',
    lightEs: 'Semisombra',
    petSafe: true,
    cozyMoodHealthy: 'Pequenina, listrada e segura para pets!',
    cozyMoodThirsty: 'Minhas folhinhas estão mais macias, quero água.',
  },
  {
    id: 'pilea',
    popularName: 'Pilea (Planta Chinesa do Dinheiro)',
    scientificName: 'Pilea peperomioides',
    aliases: ['pilea', 'dinheiro', 'moeda', 'ufo'],
    category: 'folhagem',
    wateringDays: 6,
    lightPt: 'Luz indireta',
    lightEn: 'Bright indirect',
    lightEs: 'Luz indirecta',
    petSafe: true,
    cozyMoodHealthy: 'Gire meu vasinho para eu crescer bem retinha!',
    cozyMoodThirsty: 'Meus caules estão se curvando de sede.',
  },
  {
    id: 'anturio',
    popularName: 'Antúrio',
    scientificName: 'Anthurium andraeanum',
    aliases: ['anturio', 'antúrio', 'flor vermelha'],
    category: 'flor',
    wateringDays: 5,
    lightPt: 'Luz indireta',
    lightEn: 'Indirect light',
    lightEs: 'Luz indirecta',
    petSafe: false,
    cozyMoodHealthy: 'Brilhando com cor intensa na estufa!',
    cozyMoodThirsty: 'Gosto do substrato levemente úmido.',
  },
  {
    id: 'pacova',
    popularName: 'Pacová',
    scientificName: 'Philodendron martianum',
    aliases: ['pacova', 'pacová', 'babosa de pau', 'filodendro'],
    category: 'folhagem',
    wateringDays: 6,
    lightPt: 'Meia-sombra',
    lightEn: 'Half shade',
    lightEs: 'Semisombra',
    petSafe: false,
    cozyMoodHealthy: 'Tropical, elegante e muito bem cuidada.',
    cozyMoodThirsty: 'Um pouquinho de água mantém meu brilho.',
  },
  {
    id: 'alecrim',
    popularName: 'Alecrim',
    scientificName: 'Salvia rosmarinus',
    aliases: ['alecrim', 'tempero', 'horta', 'erva'],
    category: 'folhagem',
    wateringDays: 4,
    lightPt: 'Sol pleno',
    lightEn: 'Full sun',
    lightEs: 'Sol directo',
    petSafe: true,
    cozyMoodHealthy: 'Perfumando a casa inteira com aroma fresco!',
    cozyMoodThirsty: 'Preciso de sol forte e um pouquinho de água.',
  },
  {
    id: 'lavanda',
    popularName: 'Lavanda',
    scientificName: 'Lavandula angustifolia',
    aliases: ['lavanda', 'alfazema', 'flor roxa'],
    category: 'flor',
    wateringDays: 5,
    lightPt: 'Sol pleno',
    lightEn: 'Full sun',
    lightEs: 'Sol directo',
    petSafe: false,
    cozyMoodHealthy: 'Trazendo calma e perfume para o seu dia.',
    cozyMoodThirsty: 'Meu solo secou, hora de refrescar as raízes.',
  },
];

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function searchCuratedHouseplants(query: string): CuratedPlantSpecies[] {
  const q = normalizeText(query.trim());
  if (!q) return HOUSEPLANT_LIBRARY.slice(0, 8);
  return HOUSEPLANT_LIBRARY.filter((p) => {
    const haystack = normalizeText(
      `${p.popularName} ${p.scientificName} ${p.aliases.join(' ')}`
    );
    return haystack.includes(q);
  });
}

export function findCuratedSpecies(
  nameOrSpecies?: string
): CuratedPlantSpecies | undefined {
  if (!nameOrSpecies) return undefined;
  const q = normalizeText(nameOrSpecies);
  return HOUSEPLANT_LIBRARY.find((p) => {
    const pop = normalizeText(p.popularName);
    const sci = normalizeText(p.scientificName);
    return (
      q.includes(pop) ||
      pop.includes(q) ||
      q.includes(sci) ||
      p.aliases.some((a) => q.includes(normalizeText(a)))
    );
  });
}