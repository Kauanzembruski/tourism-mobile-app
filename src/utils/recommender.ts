/**
 * Motor de Recomendação Contextual e Inteligente do AtuaSerra
 * 
 * Implementa a fórmula:
 * Score = (Hype * Wh) + (Status * Ws) + (MomentoMatch * Wm) + (ProximidadeBonus * Wp)
 * 
 * Onde:
 * - Hype: Reputação digital do local (notas e volume de avaliações extraídas da API)
 * - Status: Janela de funcionamento atual do sistema (1.0 aberto, 0.5 fechando em breve, 0.85 saindo do forno, 0 fechado)
 * - Módulo Preditivo: (CurrentTime + 60min) para o filtro "Saindo do Forno" (Próximos a Abrir)
 * - MomentoMatch: Cruzamento entre o período do dia (manhã, almoço, tarde, noite) e a estação do ano na Serra Gaúcha
 * - ProximidadeBonus: Proximidade física via GPS do usuário
 */

import { Estabelecimento, HorarioFuncionamento } from '../types';
import { HORARIOS_PADRAO_CATEGORIA } from '../constants/data';
import { Coordenadas, coordenadasValidas, calcularDistanciaKm, obterCoordenadasDaCidade } from './geo';

export type StatusOperacional = 'aberto' | 'fechamento_iminente' | 'proximo_abrir' | 'fechado';

export type PeriodoDia = 'manha' | 'almoco' | 'tarde' | 'noite' | 'madrugada';

export type EstacaoAno = 'verao' | 'outono' | 'inverno' | 'primavera';

export interface EstabelecimentoRecomendado {
  item: Estabelecimento;
  scoreFinal: number; // 0 a 100
  hypeScore: number;  // 0 a 100
  statusScore: number; // 0 a 100
  momentoScore: number; // 0 a 100
  proximidadeScore: number; // 0 a 100
  statusOperacional: StatusOperacional;
  statusBadgeLabel: string;
  horarioResumo: string;
  minutosParaAbrirOuFechar?: number;
  motivoRecomendacao: string;
  distanciaKm: number | null;
  distanciaFormatada: string | null;
}

export interface ContextoMomento {
  periodo: PeriodoDia;
  periodoLabel: string;
  periodoIcone: string;
  estacao: EstacaoAno;
  estacaoLabel: string;
  estacaoIcone: string;
  sugestaoContextual: string;
  horarioAtualFormatado: string;
}

// Pesos da fórmula
const WEIGHT_HYPE = 0.35;
const WEIGHT_STATUS = 0.35;
const WEIGHT_MOMENTO = 0.20;
const WEIGHT_PROXIMIDADE = 0.10;

/**
 * Identifica o período do dia com base na hora atual
 */
export function identificarPeriodoDia(date: Date = new Date()): {
  periodo: PeriodoDia;
  label: string;
  icone: string;
} {
  const hora = date.getHours();
  const minuto = date.getMinutes();
  const timeNum = hora + minuto / 60;

  if (timeNum >= 6 && timeNum < 11) {
    return { periodo: 'manha', label: 'Café & Manhã Colonial', icone: '☕' };
  }
  if (timeNum >= 11 && timeNum < 14.75) {
    return { periodo: 'almoco', label: 'Hora do Almoço Típico', icone: '🍝' };
  }
  if (timeNum >= 14.75 && timeNum < 18) {
    return { periodo: 'tarde', label: 'Tarde de Vinhedos & Passeios', icone: '🍇' };
  }
  if (timeNum >= 18 || timeNum < 1) {
    return { periodo: 'noite', label: 'Jantares & Noite na Serra', icone: '🍷' };
  }
  return { periodo: 'madrugada', label: 'Aconchego & Descanso', icone: '🌙' };
}

/**
 * Identifica a estação do ano no Hemisfério Sul (Serra Gaúcha)
 */
export function identificarEstacaoAno(date: Date = new Date()): {
  estacao: EstacaoAno;
  label: string;
  icone: string;
  descricao: string;
} {
  const mes = date.getMonth(); // 0 a 11
  const dia = date.getDate();

  // Outono: 20 de Março a 20 de Junho
  if ((mes === 2 && dia >= 20) || mes === 3 || mes === 4 || (mes === 5 && dia < 21)) {
    return {
      estacao: 'outono',
      label: 'Outono Serrano',
      icone: '🍂',
      descricao: 'Clima ameno, vales dourados, polenta na tábua e vinhos jovens',
    };
  }
  // Inverno: 21 de Junho a 22 de Setembro
  if ((mes === 5 && dia >= 21) || mes === 6 || mes === 7 || (mes === 8 && dia < 23)) {
    return {
      estacao: 'inverno',
      label: 'Inverno Europeu',
      icone: '❄️',
      descricao: 'Frio aconchegante, lareiras acesas, fondues e vinhos tintos encorpados',
    };
  }
  // Primavera: 23 de Setembro a 21 de Dezembro
  if ((mes === 8 && dia >= 23) || mes === 9 || mes === 10 || (mes === 11 && dia < 21)) {
    return {
      estacao: 'primavera',
      label: 'Primavera nos Vinhedos',
      icone: '🌸',
      descricao: 'Florada das parreiras, piqueniques ao ar livre e espumantes leves',
    };
  }
  // Verão: 21 de Dezembro a 19 de Março (Época da Vindima!)
  return {
    estacao: 'verao',
    label: 'Verão da Vindima',
    icone: '🍇',
    descricao: 'Colheita e pisa da uva nos parreirais, cachoeiras e dias ensolarados',
  };
}

/**
 * Retorna as informações contextuais do momento atual
 */
export function getContextoMomentoAtual(date: Date = new Date()): ContextoMomento {
  const p = identificarPeriodoDia(date);
  const e = identificarEstacaoAno(date);
  const hora = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');

  let sugestao = "";
  if (p.periodo === 'manha') {
    sugestao = `Aproveite ${e.label.toLowerCase()} para um café colonial com pães e cucas frescas da colônia.`;
  } else if (p.periodo === 'almoco') {
    sugestao = `Momento ideal para um galeto al primo canto, massas caseiras ou cantinas coloniais.`;
  } else if (p.periodo === 'tarde') {
    sugestao = `Excelente período para degustações em vinícolas, artesanato e belas paisagens dos vales.`;
  } else if (p.periodo === 'noite') {
    sugestao = `Perfeito para fondues, pizzarias temáticas, bistrôs acolhedores e noites de vinho.`;
  } else {
    sugestao = `Relaxe nas melhores hospedagens e pousadas da Serra Gaúcha.`;
  }

  return {
    periodo: p.periodo,
    periodoLabel: p.label,
    periodoIcone: p.icone,
    estacao: e.estacao,
    estacaoLabel: e.label,
    estacaoIcone: e.icone,
    sugestaoContextual: sugestao,
    horarioAtualFormatado: `${hora}:${min}`,
  };
}

/**
 * Converte strings de horários em intervalos de minutos [inicioMin, fimMin]
 */
function parseIntervalosHorario(horaStr: string): { start: number; end: number }[] {
  const intervals: { start: number; end: number }[] = [];
  if (!horaStr) return intervals;

  // Quebra por " / " ou " e " para casos com dois turnos (almoço e jantar)
  const partes = horaStr.split(/\s*[\/,e]\s*/);

  for (const parte of partes) {
    // Procura padrões como "09h00 às 17h30", "11:30 - 15:00", "09h às 18h"
    const match = parte.match(/(\d{1,2})(?:[h:](\d{2})?)?\s*(?:às|-|a)\s*(\d{1,2})(?:[h:](\d{2})?)?/i);
    if (match) {
      const h1 = parseInt(match[1], 10);
      const m1 = match[2] ? parseInt(match[2], 10) : 0;
      const h2 = parseInt(match[3], 10);
      const m2 = match[4] ? parseInt(match[4], 10) : 0;

      if (h1 > 23 || h2 > 24 || m1 > 59 || m2 > 59 || (h2 === 24 && m2 !== 0)) continue;
      const start = h1 * 60 + m1;
      let end = h2 * 60 + m2;
      // Trata virada de meia-noite (ex: 19h às 02h)
      if (end < start) {
        end += 24 * 60;
      }
      intervals.push({ start, end });
    }
  }

  return intervals;
}

/**
 * Avalia o status de funcionamento de um estabelecimento no horário atual
 * e na janela preditiva de 60 minutos ("Saindo do Forno").
 */
export function avaliarStatusOperacional(
  item: Estabelecimento,
  date: Date = new Date()
): {
  status: StatusOperacional;
  peso: number;
  label: string;
  resumo: string;
  minutosRestantes?: number;
} {
  const diaSemanaIndex = date.getDay(); // 0 = Domingo, 1 = Segunda...
  const nowMin = date.getHours() * 60 + date.getMinutes();
  const nomesDias = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const hojeNome = nomesDias[diaSemanaIndex];

  // 1. Obtém a lista de horários (reais do item ou padrão da categoria)
  let listaHorarios: HorarioFuncionamento[] = [];
  if (item.horarios && item.horarios.length > 0) {
    listaHorarios = item.horarios;
  } else if (HORARIOS_PADRAO_CATEGORIA[item.categoria]) {
    listaHorarios = HORARIOS_PADRAO_CATEGORIA[item.categoria];
  }

  // 2. Procura horário compatível com o dia de hoje
  let horarioHoje: string | null = null;
  for (const h of listaHorarios) {
    const diaLower = (h.dia || "").toLowerCase();
    if (diaLower.includes("diariamente") || diaLower.includes("todos")) {
      horarioHoje = h.hora;
      break;
    }
    if (diaLower.includes(hojeNome.toLowerCase())) {
      horarioHoje = h.hora;
      break;
    }
    if (diaSemanaIndex >= 1 && diaSemanaIndex <= 5 && (diaLower.includes("seg - sex") || diaLower.includes("segunda a sexta"))) {
      horarioHoje = h.hora;
      break;
    }
    if ((diaSemanaIndex === 0 || diaSemanaIndex === 6) && (diaLower.includes("fim de semana") || diaLower.includes("sáb") || diaLower.includes("dom"))) {
      horarioHoje = h.hora;
      break;
    }
  }

  // Se não houver dia específico, pega o primeiro como referência geral
  if (!horarioHoje && listaHorarios.length > 0) {
    horarioHoje = listaHorarios[0].hora;
  }

  // Hospedagem geralmente opera em regime 24h ou recepção ampla
  if (item.categoria === "Hospedagem") {
    return {
      status: 'aberto',
      peso: 1.0,
      label: '● Recepção Aberta',
      resumo: 'Atendimento e Check-in',
    };
  }

  if (!horarioHoje) {
    // Estimativa inteligente: se for horário comercial habitual (09h às 18h)
    if (nowMin >= 9 * 60 && nowMin <= 18 * 60) {
      return {
        status: 'aberto',
        peso: 0.9,
        label: '● Aberto no Horário Comercial',
        resumo: '09h às 18h',
      };
    }
    return {
      status: 'fechado',
      peso: 0.1,
      label: '○ Fechado no Momento',
      resumo: 'Abre amanhã às 09h',
    };
  }

  if (/fechado/i.test(horarioHoje)) return { status: 'fechado', peso: 0, label: '○ Fechado no Momento', resumo: horarioHoje };
  const intervalos = parseIntervalosHorario(horarioHoje);
  if (intervalos.length === 0) {
    return {
      status: 'aberto',
      peso: 0.8,
      label: '● Aberto',
      resumo: horarioHoje,
    };
  }

  // 3. Testa se está aberto agora em algum intervalo
  for (const interval of intervalos) {
    if (nowMin >= interval.start && nowMin < interval.end) {
      const restantes = interval.end - nowMin;
      if (restantes <= 50) {
        // Fechamento iminente (fecha em menos de 50 min)
        const horaFim = `${Math.floor(interval.end / 60)}h${String(interval.end % 60).padStart(2, '0')}`;
        return {
          status: 'fechamento_iminente',
          peso: 0.5,
          label: `⚠️ Fecha em breve (${horaFim})`,
          resumo: horarioHoje,
          minutosRestantes: restantes,
        };
      }
      return {
        status: 'aberto',
        peso: 1.0,
        label: '● Aberto Agora',
        resumo: horarioHoje,
        minutosRestantes: restantes,
      };
    }
  }

  // 4. Módulo Preditivo: "Saindo do Forno" (CurrentTime + 60min)
  // Verifica se o estabelecimento vai abrir dentro dos próximos 60 minutos
  for (const interval of intervalos) {
    if (nowMin < interval.start && (interval.start - nowMin) <= 60) {
      const minutosParaAbrir = interval.start - nowMin;
      const horaInicio = `${Math.floor(interval.start / 60)}h${String(interval.start % 60).padStart(2, '0')}`;
      return {
        status: 'proximo_abrir',
        peso: 0.85, // Peso alto para dar destaque prévio ao turista!
        label: `🔥 Saindo do Forno (Abre às ${horaInicio})`,
        resumo: `Abre em ${minutosParaAbrir} min`,
        minutosRestantes: minutosParaAbrir,
      };
    }
  }

  // 5. Fechado
  return {
    status: 'fechado',
    peso: 0.0,
    label: '○ Fechado no Momento',
    resumo: horarioHoje,
  };
}

/**
 * Calcula afinidade entre a categoria/tipo do local e o Momento (Período do Dia + Estação do Ano)
 */
export function calcularAfinidadeMomento(
  item: Estabelecimento,
  periodo: PeriodoDia,
  estacao: EstacaoAno
): { score: number; motivo: string } {
  let score = 0.5; // base neutra
  let motivo = "Excelente opção para conhecer na região";

  const texto = `${item.nome} ${item.categoria} ${item.sobre || ''}`.toLowerCase();

  // Afinidade por Período do Dia
  switch (periodo) {
    case 'manha':
      if (texto.includes('café') || texto.includes('colonial') || texto.includes('padaria') || texto.includes('confeitaria')) {
        score += 0.45;
        motivo = "Perfeito para começar o dia com o melhor café colonial da Serra";
      } else if (item.categoria === 'Turismo' || texto.includes('mirante') || texto.includes('parque')) {
        score += 0.35;
        motivo = "Ótimo para aproveitar as manhãs com passeios e ar puro";
      } else if (item.categoria === 'Vinícola') {
        score += 0.20;
        motivo = "Manhã tranquila para passeios nos vinhedos";
      }
      break;

    case 'almoco':
      if (item.categoria === 'Gastronomia') {
        score += 0.45;
        if (texto.includes('galeto') || texto.includes('massa') || texto.includes('almoço') || texto.includes('cantina')) {
          score += 0.10;
          motivo = "Destino gastronômico perfeito para o almoço típico serrano";
        } else {
          motivo = "Excelente pedida para saborear o almoço de hoje";
        }
      } else if (item.categoria === 'Vinícola' && (texto.includes('almoço') || texto.includes('harmonizado') || texto.includes('bistrô'))) {
        score += 0.40;
        motivo = "Almoço harmonizado inesquecível entre as parreiras";
      }
      break;

    case 'tarde':
      if (item.categoria === 'Vinícola') {
        score += 0.45;
        motivo = "O melhor momento do dia para tours e degustações de vinhos finos";
      } else if (item.categoria === 'Artesanato' || item.categoria === 'Turismo') {
        score += 0.40;
        motivo = "Tarde perfeita para passeios culturais, compras e contemplação";
      } else if (texto.includes('café') || texto.includes('chá') || texto.includes('sorvete')) {
        score += 0.35;
        motivo = "Pausa da tarde deliciosa com doces e cafés coloniais";
      }
      break;

    case 'noite':
      if (item.categoria === 'Gastronomia') {
        score += 0.45;
        if (texto.includes('fondue') || texto.includes('pizza') || texto.includes('jantar') || texto.includes('bistrô')) {
          score += 0.10;
          motivo = "Clássico imperdível para o jantar romântico e aconchegante da noite";
        } else {
          motivo = "Delicioso cardápio para aproveitar a noite na Serra Gaúcha";
        }
      } else if (item.categoria === 'Eventos' || texto.includes('pub') || texto.includes('cerveja') || texto.includes('bar')) {
        score += 0.40;
        motivo = "Ambiente animado para brindar e curtir a noite";
      }
      break;

    case 'madrugada':
      if (item.categoria === 'Hospedagem') {
        score += 0.50;
        motivo = "Conforto e descanso acolhedor para recarregar as energias";
      }
      break;
  }

  // Afinidade por Estação do Ano
  switch (estacao) {
    case 'inverno':
      if (texto.includes('fondue') || texto.includes('lareira') || texto.includes('tinto') || texto.includes('termais')) {
        score += 0.15;
        motivo += " • Destaque de Inverno (Aconchego & Lareira)";
      }
      break;
    case 'primavera':
      if (texto.includes('parreiral') || texto.includes('jardim') || texto.includes('flores') || texto.includes('espumante') || texto.includes('piquenique')) {
        score += 0.15;
        motivo += " • Especial de Primavera nos vales";
      }
      break;
    case 'verao':
      if (texto.includes('vindima') || texto.includes('colheita') || texto.includes('pisa') || texto.includes('cachoeira') || texto.includes('rio')) {
        score += 0.15;
        motivo += " • Época da Vindima & Colheita da Uva";
      }
      break;
    case 'outono':
      if (texto.includes('polenta') || texto.includes('queijo') || texto.includes('vales') || texto.includes('vinho')) {
        score += 0.15;
        motivo += " • Clima ameno do Outono Serrano";
      }
      break;
  }

  return {
    score: Math.min(score, 1.0),
    motivo,
  };
}

/**
 * Executa o motor completo de ranqueamento para todos os estabelecimentos
 */
export function ranquearEstabelecimentosParaOMomento(
  estabelecimentos: Estabelecimento[],
  userCoords: Coordenadas | null,
  options?: {
    filtroStatus?: 'todos' | 'abertos_ou_saindo' | 'saindo_do_forno' | 'apenas_abertos';
    categoria?: string;
    dataReferencia?: Date;
  }
): {
  recomendados: EstabelecimentoRecomendado[];
  contexto: ContextoMomento;
  totalSaindoDoForno: number;
  totalAbertosAgora: number;
} {
  const refDate = options?.dataReferencia || new Date();
  const contexto = getContextoMomentoAtual(refDate);

  let totalSaindoDoForno = 0;
  let totalAbertosAgora = 0;

  const resultados: EstabelecimentoRecomendado[] = estabelecimentos.map((item) => {
    // 1. Cálculo do Hype (Avaliação de 1 a 5 + Volume)
    const ratingNorm = Math.max(0, Math.min(item.avaliacao || 0, 5.0)) / 5.0; // 0 a 1
    const totalAv = item.totalAvaliacoes || 0;
    const volumeNorm = Math.min(totalAv, 200) / 200; // 0 a 1
    const hypeScore = (ratingNorm * 0.7 + volumeNorm * 0.3) * 100; // 0 a 100

    // 2. Cálculo do Status e Janela Preditiva
    const op = avaliarStatusOperacional(item, refDate);
    const statusScore = op.peso * 100; // 0 a 100

    if (op.status === 'proximo_abrir') totalSaindoDoForno++;
    if (op.status === 'aberto' || op.status === 'fechamento_iminente') totalAbertosAgora++;

    // 3. Cálculo da Afinidade com Momento (Período + Estação)
    const afinidade = calcularAfinidadeMomento(item, contexto.periodo, contexto.estacao);
    const momentoScore = afinidade.score * 100; // 0 a 100

    // 4. Cálculo de Proximidade Física pelo GPS
    let distKm: number | null = null;
    let distFormatada: string | null = null;
    let proximidadeScore = 50; // neutro caso sem GPS

    if (coordenadasValidas(userCoords)) {
      let dest: Coordenadas | undefined = item.coordenadas;
      if (!coordenadasValidas(dest) && item.cidade) {
        dest = obterCoordenadasDaCidade(item.cidade);
      }
      if (coordenadasValidas(dest)) {
        distKm = calcularDistanciaKm(userCoords, dest);
        if (distKm < 1) {
          distFormatada = `${Math.round(distKm * 1000)} m`;
        } else if (distKm < 10) {
          distFormatada = `${distKm.toFixed(1).replace('.', ',')} km`;
        } else {
          distFormatada = `${Math.round(distKm)} km`;
        }

        // Bônus decai suavemente com a distância: 0km = 100 pts, 10km = 80 pts, 30km = 50 pts, 80km+ = 10 pts
        if (distKm <= 3) {
          proximidadeScore = 100;
        } else if (distKm <= 12) {
          proximidadeScore = 85;
        } else if (distKm <= 30) {
          proximidadeScore = 65;
        } else if (distKm <= 60) {
          proximidadeScore = 40;
        } else {
          proximidadeScore = 20;
        }
      }
    }

    // 5. Aplicação da Fórmula Principal:
    // Score = (Hype * Wh) + (Status * Ws) + (MomentoMatch * Wm) + (ProximidadeBonus * Wp)
    const scorePonderado =
      (hypeScore * WEIGHT_HYPE) +
      (statusScore * WEIGHT_STATUS) +
      (momentoScore * WEIGHT_MOMENTO) +
      (proximidadeScore * WEIGHT_PROXIMIDADE);

    const scoreFinal = Math.min(100, Math.round(scorePonderado));

    return {
      item,
      scoreFinal,
      hypeScore: Math.round(hypeScore),
      statusScore: Math.round(statusScore),
      momentoScore: Math.round(momentoScore),
      proximidadeScore: Math.round(proximidadeScore),
      statusOperacional: op.status,
      statusBadgeLabel: op.label,
      horarioResumo: op.resumo,
      minutosParaAbrirOuFechar: op.minutosRestantes,
      motivoRecomendacao: afinidade.motivo,
      distanciaKm: distKm,
      distanciaFormatada: distFormatada,
    };
  });

  // Filtra de acordo com a opção selecionada
  let filtrados = resultados;

  if (options?.filtroStatus === 'saindo_do_forno') {
    filtrados = filtrados.filter(r => r.statusOperacional === 'proximo_abrir');
  } else if (options?.filtroStatus === 'apenas_abertos') {
    filtrados = filtrados.filter(r => r.statusOperacional === 'aberto');
  } else if (options?.filtroStatus === 'abertos_ou_saindo') {
    filtrados = filtrados.filter(r => r.statusOperacional === 'aberto' || r.statusOperacional === 'proximo_abrir' || r.statusOperacional === 'fechamento_iminente');
  }

  if (options?.categoria && options.categoria !== 'Todos') {
    filtrados = filtrados.filter(r => r.item.categoria.toLowerCase() === options.categoria?.toLowerCase());
  }

  // Ordena de cima a baixo pelo Score Final (maior primeiro)
  filtrados.sort((a, b) => {
    // Prioriza locais operando ou prestes a abrir sobre fechados
    if (a.statusOperacional !== 'fechado' && b.statusOperacional === 'fechado') return -1;
    if (a.statusOperacional === 'fechado' && b.statusOperacional !== 'fechado') return 1;
    return b.scoreFinal - a.scoreFinal;
  });

  return {
    recomendados: filtrados,
    contexto,
    totalSaindoDoForno,
    totalAbertosAgora,
  };
}
