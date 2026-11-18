export type PlantArchetype =
  | 'pendente'
  | 'suculenta'
  | 'cacto'
  | 'bonsai'
  | 'flor'
  | 'folhagem';

export interface PlantCatalogItem {
  id: string;
  popularName: string;
  scientificName: string;
  category: PlantArchetype;
  waterIntervalDays: number;
  lightTip: string;
}

export const PLANT_CATALOG: PlantCatalogItem[] = [
  // Pendentes & Trepadeiras
  { id: 'cat-1', popularName: 'Jiboia', scientificName: 'Epipremnum aureum', category: 'pendente', waterIntervalDays: 4, lightTip: 'Meia-sombra com luz indireta' },
  { id: 'cat-2', popularName: 'Jiboia Neon', scientificName: 'Epipremnum aureum Neon', category: 'pendente', waterIntervalDays: 4, lightTip: 'Luz indireta brilhante' },
  { id: 'cat-3', popularName: 'Samambaia Americana', scientificName: 'Nephrolepis exaltata', category: 'pendente', waterIntervalDays: 2, lightTip: 'Sombra iluminada e umidade' },
  { id: 'cat-4', popularName: 'Hera Inglesa', scientificName: 'Hedera helix', category: 'pendente', waterIntervalDays: 3, lightTip: 'Luz indireta fresca' },
  { id: 'cat-5', popularName: 'Coração Emaranhado', scientificName: 'Ceropegia woodii', category: 'pendente', waterIntervalDays: 7, lightTip: 'Muita luz indireta' },
  { id: 'cat-6', popularName: 'Colar de Pérolas', scientificName: 'Curio rowleyanus', category: 'pendente', waterIntervalDays: 8, lightTip: 'Luz indireta forte' },
  { id: 'cat-7', popularName: 'Peperômia Scandens', scientificName: 'Peperomia scandens', category: 'pendente', waterIntervalDays: 5, lightTip: 'Meia-sombra' },
  { id: 'cat-8', popularName: 'Lambari Roxo', scientificName: 'Tradescantia zebrina', category: 'pendente', waterIntervalDays: 3, lightTip: 'Luz indireta abundante' },
  { id: 'cat-9', popularName: 'Filodendro Brasil', scientificName: 'Philodendron hederaceum', category: 'pendente', waterIntervalDays: 4, lightTip: 'Meia-sombra' },
  { id: 'cat-10', popularName: 'Ripsális (Cacto Macarrão)', scientificName: 'Rhipsalis baccifera', category: 'pendente', waterIntervalDays: 6, lightTip: 'Meia-sombra úmida' },

  // Suculentas
  { id: 'cat-11', popularName: 'Suculenta Echeveria', scientificName: 'Echeveria elegans', category: 'suculenta', waterIntervalDays: 10, lightTip: 'Sol pleno ou janela bem iluminada' },
  { id: 'cat-12', popularName: 'Babosa (Aloe Vera)', scientificName: 'Aloe barbadensis miller', category: 'suculenta', waterIntervalDays: 12, lightTip: 'Sol direto suave' },
  { id: 'cat-13', popularName: 'Planta Jade', scientificName: 'Crassula ovata', category: 'suculenta', waterIntervalDays: 10, lightTip: 'Sol pleno ou meia-sombra clara' },
  { id: 'cat-14', popularName: 'Orelha de Shrek', scientificName: 'Crassula ovata Gollum', category: 'suculenta', waterIntervalDays: 10, lightTip: 'Sol suave da manhã' },
  { id: 'cat-15', popularName: 'Haworthia Zebra', scientificName: 'Haworthiopsis attenuata', category: 'suculenta', waterIntervalDays: 10, lightTip: 'Luz indireta brilhante' },
  { id: 'cat-16', popularName: 'Dedinho-de-Moça', scientificName: 'Sedum morganianum', category: 'suculenta', waterIntervalDays: 9, lightTip: 'Muita claridade' },
  { id: 'cat-17', popularName: 'Rosa de Pedra', scientificName: 'Echeveria secunda', category: 'suculenta', waterIntervalDays: 10, lightTip: 'Sol da manhã' },
  { id: 'cat-18', popularName: 'Planta Fantasma', scientificName: 'Graptopetalum paraguayense', category: 'suculenta', waterIntervalDays: 10, lightTip: 'Sol pleno' },

  // Cactos
  { id: 'cat-19', popularName: 'Cacto Mandacaru', scientificName: 'Cereus jamacaru', category: 'cacto', waterIntervalDays: 15, lightTip: 'Sol pleno direto' },
  { id: 'cat-20', popularName: 'Cacto Orelha-de-Mickey', scientificName: 'Opuntia microdasys', category: 'cacto', waterIntervalDays: 14, lightTip: 'Sol direto' },
  { id: 'cat-21', popularName: 'Cacto Poltrona-de-Sogra', scientificName: 'Echinocactus grusonii', category: 'cacto', waterIntervalDays: 15, lightTip: 'Sol pleno' },
  { id: 'cat-22', popularName: 'Cacto Castelo-de-Fadas', scientificName: 'Acanthocereus tetragonus', category: 'cacto', waterIntervalDays: 14, lightTip: 'Muita luz solar' },
  { id: 'cat-23', popularName: 'Cacto Amendoim', scientificName: 'Echinopsis chamaecereus', category: 'cacto', waterIntervalDays: 12, lightTip: 'Sol da manhã' },
  { id: 'cat-24', popularName: 'Cacto Bola (Mammillaria)', scientificName: 'Mammillaria zeilmanniana', category: 'cacto', waterIntervalDays: 14, lightTip: 'Sol pleno' },
  { id: 'cat-25', popularName: 'Cacto Coroa-de-Frade', scientificName: 'Melocactus bahiensis', category: 'cacto', waterIntervalDays: 15, lightTip: 'Sol pleno' },

  // Bonsais
  { id: 'cat-26', popularName: 'Bonsai Ficus', scientificName: 'Ficus retusa (Bonsai)', category: 'bonsai', waterIntervalDays: 2, lightTip: 'Luz indireta intensa perto da janela' },
  { id: 'cat-27', popularName: 'Bonsai Jabuticabeira', scientificName: 'Plinia cauliflora (Bonsai)', category: 'bonsai', waterIntervalDays: 2, lightTip: 'Sol da manhã e solo sempre úmido' },
  { id: 'cat-28', popularName: 'Bonsai Pinheiro Negro', scientificName: 'Pinus thunbergii (Bonsai)', category: 'bonsai', waterIntervalDays: 3, lightTip: 'Ambiente externo ou janela ensolarada' },
  { id: 'cat-29', popularName: 'Bonsai Caliandra', scientificName: 'Calliandra brevipes (Bonsai)', category: 'bonsai', waterIntervalDays: 2, lightTip: 'Sol suave e boa ventilação' },
  { id: 'cat-30', popularName: 'Bonsai Acer Palmatum', scientificName: 'Acer palmatum (Bonsai)', category: 'bonsai', waterIntervalDays: 2, lightTip: 'Meia-sombra iluminada' },
  { id: 'cat-31', popularName: 'Bonsai Buxinho', scientificName: 'Buxus sempervirens (Bonsai)', category: 'bonsai', waterIntervalDays: 3, lightTip: 'Luz solar moderada' },

  // Flores & Aromáticas
  { id: 'cat-32', popularName: 'Kalanchoe (Flor-da-Fortuna)', scientificName: 'Kalanchoe blossfeldiana', category: 'flor', waterIntervalDays: 6, lightTip: 'Luz indireta brilhante' },
  { id: 'cat-33', popularName: 'Orquídea Phalaenopsis', scientificName: 'Phalaenopsis amabilis', category: 'flor', waterIntervalDays: 7, lightTip: 'Luz indireta filtrada' },
  { id: 'cat-34', popularName: 'Lírio-da-Paz', scientificName: 'Spathiphyllum wallisii', category: 'flor', waterIntervalDays: 3, lightTip: 'Meia-sombra sem sol direto' },
  { id: 'cat-35', popularName: 'Antúrio', scientificName: 'Anthurium andraeanum', category: 'flor', waterIntervalDays: 4, lightTip: 'Meia-sombra úmida' },
  { id: 'cat-36', popularName: 'Violeta Africana', scientificName: 'Saintpaulia ionantha', category: 'flor', waterIntervalDays: 4, lightTip: 'Luz indireta suave' },
  { id: 'cat-37', popularName: 'Rosa-do-Deserto', scientificName: 'Adenium obesum', category: 'flor', waterIntervalDays: 8, lightTip: 'Sol pleno direto' },
  { id: 'cat-38', popularName: 'Lavanda', scientificName: 'Lavandula angustifolia', category: 'flor', waterIntervalDays: 4, lightTip: 'Sol direto várias horas por dia' },
  { id: 'cat-39', popularName: 'Begônia Maculata', scientificName: 'Begonia maculata', category: 'flor', waterIntervalDays: 4, lightTip: 'Luz indireta sem vento forte' },
  { id: 'cat-40', popularName: 'Hibisco', scientificName: 'Hibiscus rosa-sinensis', category: 'flor', waterIntervalDays: 3, lightTip: 'Sol pleno' },

  // Folhagens Tropicais & Estruturais
  { id: 'cat-41', popularName: 'Costela-de-Adão', scientificName: 'Monstera deliciosa', category: 'folhagem', waterIntervalDays: 5, lightTip: 'Meia-sombra iluminada' },
  { id: 'cat-42', popularName: 'Zamioculca', scientificName: 'Zamioculcas zamiifolia', category: 'folhagem', waterIntervalDays: 10, lightTip: 'Tolera sombra e pouca luz' },
  { id: 'cat-43', popularName: 'Espada-de-São-Jorge', scientificName: 'Dracaena trifasciata', category: 'folhagem', waterIntervalDays: 12, lightTip: 'Qualquer luminosidade' },
  { id: 'cat-44', popularName: 'Ficus Lyrata', scientificName: 'Ficus lyrata', category: 'folhagem', waterIntervalDays: 5, lightTip: 'Luz indireta abundante' },
  { id: 'cat-45', popularName: 'Ficus Elástica (Planta Borracha)', scientificName: 'Ficus elastica', category: 'folhagem', waterIntervalDays: 6, lightTip: 'Luz indireta brilhante' },
  { id: 'cat-46', popularName: 'Pacová', scientificName: 'Philodendron martianum', category: 'folhagem', waterIntervalDays: 5, lightTip: 'Meia-sombra' },
  { id: 'cat-47', popularName: 'Maranta (Planta Rezadeira)', scientificName: 'Maranta leuconeura', category: 'folhagem', waterIntervalDays: 3, lightTip: 'Sombra iluminada e umidade' },
  { id: 'cat-48', popularName: 'Calathea Orbifolia', scientificName: 'Goeppertia orbifolia', category: 'folhagem', waterIntervalDays: 3, lightTip: 'Luz indireta suave' },
  { id: 'cat-49', popularName: 'Palmeira Ráfis', scientificName: 'Rhapis excelsa', category: 'folhagem', waterIntervalDays: 5, lightTip: 'Meia-sombra' },
  { id: 'cat-50', popularName: 'Palmeira Areca', scientificName: 'Dypsis lutescens', category: 'folhagem', waterIntervalDays: 4, lightTip: 'Luz indireta clara' },
  { id: 'cat-51', popularName: 'Peperômia Melancia', scientificName: 'Peperomia argyreia', category: 'folhagem', waterIntervalDays: 5, lightTip: 'Luz indireta' },
  { id: 'cat-52', popularName: 'Clorofito (Gravatinha)', scientificName: 'Chlorophytum comosum', category: 'folhagem', waterIntervalDays: 4, lightTip: 'Meia-sombra' },
  { id: 'cat-53', popularName: 'Pilea (Planta Chinesa do Dinheiro)', scientificName: 'Pilea peperomioides', category: 'folhagem', waterIntervalDays: 5, lightTip: 'Luz indireta brilhante' },
  { id: 'cat-54', popularName: 'Alecrim', scientificName: 'Salvia rosmarinus', category: 'folhagem', waterIntervalDays: 3, lightTip: 'Sol direto' },
  { id: 'cat-55', popularName: 'Manjericão', scientificName: 'Ocimum basilicum', category: 'folhagem', waterIntervalDays: 2, lightTip: 'Sol da manhã' },
];

// Infere o arquétipo visual automaticamente mesmo para espécies digitadas livremente
export function inferPlantArchetype(nameOrSpecies: string): PlantArchetype {
  const text = nameOrSpecies.toLowerCase();
  if (text.includes('bonsai') || text.includes('plinia') || text.includes('pinus')) return 'bonsai';
  if (text.includes('cacto') || text.includes('cactus') || text.includes('opuntia') || text.includes('cereus') || text.includes('mammillaria')) return 'cacto';
  if (text.includes('suculenta') || text.includes('echeveria') || text.includes('aloe') || text.includes('babosa') || text.includes('jade') || text.includes('crassula') || text.includes('sedum')) return 'suculenta';
  if (text.includes('jiboia') || text.includes('epipremnum') || text.includes('samambaia') || text.includes('hera') || text.includes('colar') || text.includes('pendente')) return 'pendente';
  if (text.includes('kalanchoe') || text.includes('orquídea') || text.includes('orquidea') || text.includes('lírio') || text.includes('lirio') || text.includes('antúrio') || text.includes('anturio') || text.includes('rosa') || text.includes('lavanda') || text.includes('flor')) return 'flor';
  return 'folhagem';
}
