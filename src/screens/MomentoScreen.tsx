import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Estabelecimento, CategoriaType } from '../types';
import { THEME } from '../constants/theme';
import { getEstabelecimentos } from '../api/services';
import { useLocation } from '../context/LocationContext';
import { 
  ranquearEstabelecimentosParaOMomento, 
  getContextoMomentoAtual, 
  PeriodoDia,
  EstabelecimentoRecomendado 
} from '../utils/recommender';
import { CardMomento } from '../components/cards/CardMomento';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type FiltroStatusType = 'todos' | 'saindo_do_forno' | 'apenas_abertos';

export const MomentoScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'MomentoScreen'>>();

  const [clockTick, setClockTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setClockTick(tick => tick + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const [estabelecimentos, setEstabelecimentos] = useState<Estabelecimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filtros
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatusType>(route.params?.filtroInicial || 'todos');
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('Todos');

  // Modo de simulação do período (permite planejar: Agora | Manhã | Almoço | Tarde | Noite)
  const [periodoSimulado, setPeriodoSimulado] = useState<PeriodoDia | 'agora'>('agora');

  const { coords, cidade, estado, isSerraGaucha } = useLocation();

  const carregarDados = async () => {
    try {
      setLoading(true);
      const data = await getEstabelecimentos();
      setEstabelecimentos(data);
    } catch (e) {
      console.warn("Erro ao carregar estabelecimentos:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    carregarDados();
  };

  // Calcula a data de referência (se o usuário escolheu simular outro turno do dia)
  const dataReferencia = useMemo(() => {
    const d = new Date();
    if (periodoSimulado === 'manha') d.setHours(9, 30, 0, 0);
    else if (periodoSimulado === 'almoco') d.setHours(12, 30, 0, 0);
    else if (periodoSimulado === 'tarde') d.setHours(15, 30, 0, 0);
    else if (periodoSimulado === 'noite') d.setHours(20, 15, 0, 0);
    return d;
  }, [periodoSimulado, clockTick]);

  // Executa o ranqueamento inteligente
  const { recomendados, contexto, totalSaindoDoForno, totalAbertosAgora } = useMemo(() => {
    return ranquearEstabelecimentosParaOMomento(estabelecimentos, coords, {
      filtroStatus,
      categoria: categoriaAtiva,
      dataReferencia,
    });
  }, [estabelecimentos, coords, filtroStatus, categoriaAtiva, dataReferencia]);

  const handleSelectEstabelecimento = (item: Estabelecimento) => {
    navigation.navigate('Detalhes', { estabelecimento: item });
  };

  return (
    <View style={styles.container}>
      {/* Header Contextual com Vinho Escuro e Dourado */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 12 }]}>
        <View style={styles.headerTop}>
          <View>
            <View style={styles.badgeEstacao}>
              <Text style={styles.badgeEstacaoText}>
                {contexto.estacaoIcone} {contexto.estacaoLabel}
              </Text>
            </View>
            <Text style={styles.headerTitle}>
              {contexto.periodoIcone} {contexto.periodoLabel}
            </Text>
          </View>

          <View style={styles.horaWrapper}>
            <Text style={styles.horaLabel}>Horário</Text>
            <Text style={styles.horaValor}>{contexto.horarioAtualFormatado}</Text>
          </View>
        </View>

        {/* Localização Atual do Usuário via GPS */}
        <View style={styles.localizacaoRow}>
          <Text style={styles.localizacaoText}>
            📍 {cidade ? `${cidade}${estado ? `, ${estado}` : ''}` : "Serra Gaúcha"}
          </Text>
          {isSerraGaucha && (
            <View style={styles.serraPill}>
              <Text style={styles.serraPillText}>GPS Ativo</Text>
            </View>
          )}
        </View>

        {/* Frase Guia do Momento */}
        <Text style={styles.sugestaoText}>
          {contexto.sugestaoContextual}
        </Text>

        {/* Seletor de Períodos para Planejamento Antecipado */}
        <View style={styles.periodosSelectorContainer}>
          <Text style={styles.selectorLabel}>Simular horário:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periodosScroll}>
            {([
              { id: 'agora', label: '⏰ Agora' },
              { id: 'manha', label: '☕ Manhã (09h)' },
              { id: 'almoco', label: '🍝 Almoço (12h)' },
              { id: 'tarde', label: '🍇 Tarde (15h)' },
              { id: 'noite', label: '🍷 Noite (20h)' },
            ] as const).map((p) => {
              const active = periodoSimulado === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => setPeriodoSimulado(p.id)}
                  style={[styles.periodoBtn, active && styles.periodoBtnActive]}
                >
                  <Text style={[styles.periodoBtnText, active && styles.periodoBtnTextActive]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* Barra de Filtros de Status (Saindo do Forno, Abertos, Todos) */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, filtroStatus === 'todos' && styles.filterChipActive]}
            onPress={() => setFiltroStatus('todos')}
          >
            <Text style={[styles.filterChipText, filtroStatus === 'todos' && styles.filterChipTextActive]}>
              ✨ Todos ({estabelecimentos.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filtroStatus === 'saindo_do_forno' && styles.filterChipSaindoActive]}
            onPress={() => setFiltroStatus('saindo_do_forno')}
          >
            <Text style={[styles.filterChipText, filtroStatus === 'saindo_do_forno' && styles.filterChipSaindoTextActive]}>
              🔥 Saindo do Forno ({totalSaindoDoForno})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filtroStatus === 'apenas_abertos' && styles.filterChipAbertosActive]}
            onPress={() => setFiltroStatus('apenas_abertos')}
          >
            <Text style={[styles.filterChipText, filtroStatus === 'apenas_abertos' && styles.filterChipAbertosTextActive]}>
              ● Abertos Agora ({totalAbertosAgora})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Lista Ranqueada de Cima a Baixo */}
      <View style={styles.content}>
        <View style={styles.rankInfoRow}>
          <Text style={styles.rankInfoText}>
            Ordenado por Score Inteligente • {recomendados.length} opções recomendadas
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="large" color={THEME.colors.wineRed} />
            <Text style={styles.loadingText}>Calculando melhores opções para agora...</Text>
          </View>
        ) : (
          <FlatList
            data={recomendados}
            keyExtractor={(item) => String(item.item.id)}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[THEME.colors.wineRed]}
                tintColor={THEME.colors.wineRed}
              />
            }
            renderItem={({ item, index }) => (
              <CardMomento
                recomendado={item}
                posicaoRank={index + 1}
                onPress={() => handleSelectEstabelecimento(item.item)}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>⏰</Text>
                <Text style={styles.emptyTitle}>Nenhum local neste filtro agora</Text>
                <Text style={styles.emptyDesc}>
                  Toque em "Todos" ou mude o horário simulado acima para ver estabelecimentos recomendados.
                </Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => setFiltroStatus('todos')}
                >
                  <Text style={styles.emptyButtonText}>Ver Todos os Locais</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.cream,
  },
  header: {
    backgroundColor: THEME.colors.wineRed,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  badgeEstacao: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4,
  },
  badgeEstacaoText: {
    color: '#FFE082',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  headerTitle: {
    color: THEME.colors.white,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  horaWrapper: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  horaLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  horaValor: {
    color: THEME.colors.white,
    fontSize: 14,
    fontWeight: '900',
  },
  localizacaoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  localizacaoText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    fontWeight: '700',
  },
  serraPill: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  serraPillText: {
    color: THEME.colors.white,
    fontSize: 8,
    fontWeight: '800',
  },
  sugestaoText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 10,
  },
  periodosSelectorContainer: {
    marginTop: 2,
  },
  selectorLabel: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  periodosScroll: {
    gap: 6,
  },
  periodoBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  periodoBtnActive: {
    backgroundColor: THEME.colors.white,
  },
  periodoBtnText: {
    color: THEME.colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  periodoBtnTextActive: {
    color: THEME.colors.wineRed,
    fontWeight: '900',
  },
  filterBar: {
    backgroundColor: THEME.colors.white,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: THEME.borderRadius.pill,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: THEME.colors.wineRed,
    borderColor: THEME.colors.wineRed,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.dark,
  },
  filterChipTextActive: {
    color: THEME.colors.white,
  },
  filterChipSaindoActive: {
    backgroundColor: '#EA580C',
    borderColor: '#EA580C',
  },
  filterChipSaindoTextActive: {
    color: THEME.colors.white,
    fontWeight: '800',
  },
  filterChipAbertosActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  filterChipAbertosTextActive: {
    color: THEME.colors.white,
    fontWeight: '800',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  rankInfoRow: {
    paddingVertical: 10,
  },
  rankInfoText: {
    fontSize: 10,
    fontWeight: '700',
    color: THEME.colors.gray,
  },
  listContent: {
    paddingBottom: 24,
  },
  loadingWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    gap: 8,
  },
  loadingText: {
    color: THEME.colors.gray,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.dark,
  },
  emptyDesc: {
    fontSize: 12,
    color: THEME.colors.gray,
    textAlign: 'center',
    lineHeight: 16,
  },
  emptyButton: {
    marginTop: 8,
    backgroundColor: THEME.colors.wineRed,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: THEME.borderRadius.md,
  },
  emptyButtonText: {
    color: THEME.colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
});
