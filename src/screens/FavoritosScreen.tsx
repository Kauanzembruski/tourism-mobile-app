import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, AppNavigation, Estabelecimento } from '../types';
import { THEME } from '../constants/theme';
import { useFavorites } from '../context/FavoritesContext';
import { useRoteiro } from '../context/RoteiroContext';
import { useLocation } from '../context/LocationContext';
import { CardEstabelecimento } from '../components/cards/CardEstabelecimento';
import { CardParadaRoteiro } from '../components/cards/CardParadaRoteiro';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ViewMode = 'favoritos' | 'roteiro';

export const FavoritosScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<AppNavigation>();
  
  const [activeTab, setActiveTab] = useState<ViewMode>('roteiro');
  
  const { favoritos } = useFavorites();
  const { 
    roteiro, 
    isNoRoteiro, 
    toggleRoteiro, 
    adicionarAoRoteiro, 
    removerDoRoteiro, 
    limparRoteiro,
    calcularRotaOtimizada,
    iniciarNavegacaoCircuito,
  } = useRoteiro();

  const { coords, cidade, estado } = useLocation();

  // Calcula a rota otimizada a partir da localização atual do usuário
  const rotaOtimizada = useMemo(() => {
    return calcularRotaOtimizada(coords);
  }, [roteiro, coords]);

  const handleSelectItem = (item: Estabelecimento) => {
    navigation.navigate('Detalhes', { estabelecimento: item });
  };

  const handleAdicionarTodosAoRoteiro = () => {
    favoritos.forEach(fav => {
      adicionarAoRoteiro(fav);
    });
    setActiveTab('roteiro');
  };

  const handleConfirmarLimparRoteiro = () => {
    Alert.alert(
      'Limpar Roteiro',
      'Deseja remover todos os destinos do seu roteiro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Limpar', style: 'destructive', onPress: () => limparRoteiro() },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header com Safe Area do iPhone */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 10 }]}>
        <Text style={styles.headerSubtitle}>Planejamento de Viagem</Text>
        <Text style={styles.headerTitle}>
          {activeTab === 'roteiro' ? 'Meu Roteiro Otimizado' : 'Locais Salvos'}
        </Text>
        <Text style={styles.headerCount}>
          {activeTab === 'roteiro'
            ? `${roteiro.length} destinos no roteiro • ${rotaOtimizada.distanciaTotalFormatada}`
            : `${favoritos.length} locais salvos para visitar`}
        </Text>

        {/* Seletor de Abas: Salvos vs Roteiro Otimizado */}
        <View style={styles.tabSelector}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'roteiro' && styles.tabBtnActive]}
            onPress={() => setActiveTab('roteiro')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, activeTab === 'roteiro' && styles.tabBtnTextActive]}>
              🗺️ Roteiro ({roteiro.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'favoritos' && styles.tabBtnActive]}
            onPress={() => setActiveTab('favoritos')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, activeTab === 'favoritos' && styles.tabBtnTextActive]}>
              ❤️ Salvos ({favoritos.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Conteúdo da Tela */}
      <View style={styles.content}>
        {activeTab === 'roteiro' ? (
          // ==========================================
          // VISÃO 1: ROTEIRO OTIMIZADO MULTI-DESTINOS
          // ==========================================
          roteiro.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🗺️</Text>
              <Text style={styles.emptyTitle}>Seu roteiro está vazio</Text>
              <Text style={styles.emptyDesc}>
                Monte um roteiro personalizado selecionando seus locais favoritos. Nosso algoritmo organizará a melhor sequência de visitação para você economizar tempo na Serra Gaúcha.
              </Text>

              {favoritos.length > 0 ? (
                <TouchableOpacity
                  style={styles.btnPrimary}
                  onPress={handleAdicionarTodosAoRoteiro}
                  activeOpacity={0.85}
                >
                  <Text style={styles.btnPrimaryText}>Adicionar Salvos ao Roteiro ({favoritos.length})</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.btnPrimary}
                  onPress={() => navigation.navigate('BuscarTab')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.btnPrimaryText}>Explorar Estabelecimentos</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <FlatList
              data={rotaOtimizada.paradas}
              keyExtractor={(item) => String(item.estabelecimento.id)}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <View style={styles.rotaHeaderCard}>
                  <View style={styles.rotaHeaderTop}>
                    <View style={styles.rotaHeaderTitleCol}>
                      <Text style={styles.rotaHeaderBadge}>⚡ MELHOR SEQUÊNCIA CALCULADA</Text>
                      <Text style={styles.rotaHeaderTitle}>
                        Circuito com {rotaOtimizada.paradas.length} Paradas
                      </Text>
                      <Text style={styles.rotaHeaderSub}>
                        {coords && cidade
                          ? `Partindo de sua localização atual em ${cidade}, ${estado || 'RS'}`
                          : 'Sequência otimizada com menor deslocamento total'}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.btnLimpar}
                      onPress={handleConfirmarLimparRoteiro}
                    >
                      <Text style={styles.btnLimparText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Resumo Métrico da Rota */}
                  <View style={styles.metricsRow}>
                    <View style={styles.metricItem}>
                      <Text style={styles.metricVal}>{rotaOtimizada.distanciaTotalFormatada}</Text>
                      <Text style={styles.metricLabel}>Distância estimada</Text>
                    </View>
                    <View style={styles.metricDivider} />
                    <View style={styles.metricItem}>
                      <Text style={styles.metricVal}>{rotaOtimizada.tempoEstimadoFormatado}</Text>
                      <Text style={styles.metricLabel}>Tempo estimado</Text>
                    </View>
                    <View style={styles.metricDivider} />
                    <View style={styles.metricItem}>
                      <Text style={styles.metricVal}>{rotaOtimizada.paradas.length}</Text>
                      <Text style={styles.metricLabel}>Destinos</Text>
                    </View>
                  </View>

                  {/* Botão de Iniciar Rota Completa no GPS */}
                  <TouchableOpacity
                    style={styles.btnIniciarGps}
                    activeOpacity={0.88}
                    onPress={() => iniciarNavegacaoCircuito(coords)}
                  >
                    <Text style={styles.btnIniciarGpsIcon}>🚗</Text>
                    <Text style={styles.btnIniciarGpsText}>
                      Navegar Circuito Completo (GPS)
                    </Text>
                  </TouchableOpacity>
                </View>
              }
              renderItem={({ item, index }) => (
                <CardParadaRoteiro
                  parada={item}
                  isUltima={index === rotaOtimizada.paradas.length - 1}
                  onPressItem={() => handleSelectItem(item.estabelecimento)}
                  onRemover={() => removerDoRoteiro(item.estabelecimento.id)}
                />
              )}
            />
          )
        ) : (
          // ==========================================
          // VISÃO 2: LOCAIS SALVOS (FAVORITOS)
          // ==========================================
          favoritos.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>❤️</Text>
              <Text style={styles.emptyTitle}>Nenhum local salvo ainda</Text>
              <Text style={styles.emptyDesc}>
                Toque no ícone de coração nos estabelecimentos que você mais gostou para acessá-los facilmente aqui, mesmo offline.
              </Text>
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={() => navigation.navigate('BuscarTab')}
                activeOpacity={0.85}
              >
                <Text style={styles.btnPrimaryText}>Explorar Estabelecimentos</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={favoritos}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <View style={styles.salvosHeaderRow}>
                  <Text style={styles.salvosCountText}>
                    {favoritos.length} {favoritos.length === 1 ? 'local salvo' : 'locais salvos'}
                  </Text>
                  <TouchableOpacity
                    style={styles.btnAddAllRoteiro}
                    onPress={handleAdicionarTodosAoRoteiro}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.btnAddAllRoteiroText}>➕ Criar Rota com Todos</Text>
                  </TouchableOpacity>
                </View>
              }
              renderItem={({ item }) => {
                const noRoteiro = isNoRoteiro(item.id);
                return (
                  <View style={styles.cardFavWrapper}>
                    <CardEstabelecimento
                      item={item}
                      onPress={() => handleSelectItem(item)}
                    />
                    <TouchableOpacity
                      style={[styles.btnToggleRoteiro, noRoteiro && styles.btnToggleRoteiroAtivo]}
                      onPress={() => toggleRoteiro(item)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.btnToggleRoteiroText, noRoteiro && styles.btnToggleRoteiroTextAtivo]}>
                        {noRoteiro ? '✓ No Roteiro' : '🗺️ Adicionar ao Roteiro'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              }}
            />
          )
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
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerTitle: {
    color: THEME.colors.white,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  headerCount: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    borderRadius: THEME.borderRadius.md,
    padding: 3,
    marginTop: 12,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: THEME.borderRadius.sm,
  },
  tabBtnActive: {
    backgroundColor: THEME.colors.white,
  },
  tabBtnText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: THEME.colors.wineRed,
    fontWeight: '900',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  listContent: {
    paddingBottom: 32,
  },
  rotaHeaderCard: {
    backgroundColor: THEME.colors.white,
    borderRadius: THEME.borderRadius.lg,
    padding: 14,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#FDBA74',
  },
  rotaHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  rotaHeaderTitleCol: {
    flex: 1,
  },
  rotaHeaderBadge: {
    fontSize: 9,
    fontWeight: '900',
    color: '#C2410C',
    backgroundColor: '#FFF7ED',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  rotaHeaderTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: THEME.colors.dark,
    letterSpacing: -0.2,
  },
  rotaHeaderSub: {
    fontSize: 11,
    color: THEME.colors.gray,
    marginTop: 2,
    lineHeight: 15,
  },
  btnLimpar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  btnLimparText: {
    fontSize: 14,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#F9FAFB',
    borderRadius: THEME.borderRadius.md,
    paddingVertical: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 14,
    fontWeight: '900',
    color: THEME.colors.dark,
  },
  metricLabel: {
    fontSize: 9,
    color: THEME.colors.gray,
    fontWeight: '600',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
  },
  btnIniciarGps: {
    backgroundColor: '#1E40AF',
    borderRadius: THEME.borderRadius.md,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  btnIniciarGpsIcon: {
    fontSize: 16,
  },
  btnIniciarGpsText: {
    color: THEME.colors.white,
    fontSize: 13,
    fontWeight: '900',
  },
  salvosHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  salvosCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.gray,
  },
  btnAddAllRoteiro: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  btnAddAllRoteiroText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E40AF',
  },
  cardFavWrapper: {
    marginBottom: 12,
  },
  btnToggleRoteiro: {
    backgroundColor: THEME.colors.white,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
    marginTop: -4,
  },
  btnToggleRoteiroAtivo: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  btnToggleRoteiroText: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.dark,
  },
  btnToggleRoteiroTextAtivo: {
    color: '#059669',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 24,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: THEME.colors.dark,
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 12,
    color: THEME.colors.gray,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  btnPrimary: {
    backgroundColor: THEME.colors.wineRed,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: THEME.borderRadius.md,
  },
  btnPrimaryText: {
    color: THEME.colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
});
