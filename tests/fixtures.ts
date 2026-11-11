import { Estabelecimento } from '../src/types';

export const local = (id: string, latitude = 0, longitude = 0): Estabelecimento => ({
  id, nome: `Local ${id}`, categoria: 'Gastronomia', cidade: 'Veranópolis',
  avaliacao: 4, totalAvaliacoes: 20, coordenadas: { latitude, longitude },
  horarios: [{ dia: 'Diariamente', hora: '09:00 - 18:00' }],
});
