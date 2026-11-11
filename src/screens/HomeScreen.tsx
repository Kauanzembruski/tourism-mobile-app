import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, AppNavigation, Estabelecimento, Cidade, CategoriaItem, CategoriaType, Noticia } from '../types';
import { THEME } from '../constants/theme';
import { getCidades, getDestaques, getCategorias, getNoticias } from '../api/services';
import { CardCidade } from '../components/cards/CardCidade';
import { CardDestaque } from '../components/cards/CardDestaque';
import { CardNoticia } from '../components/cards/CardNoticia';
import { LocationBadge } from '../components/common/LocationBadge';
import { getContextoMomentoAtual } from '../utils/recommender';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<AppNavigation>();

  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [destaques, setDestaques] = useState<Estabelecimento[]>([]);
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [categorias, setCategorias] = useState<CategoriaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const contextoMomento = getContextoMomentoAtual();

  const carregarDados = async () => {
    try {
      const [cidadesData, destaquesData, noticiasData, categoriasData] = await Promise.all([
        getCidades(),
        getDestaques(),
        getNoticias(),
        getCategorias(),
      ]);
      setCidades(cidadesData);
      setDestaques(destaquesData);
      setNoticias(noticiasData);
      setCategorias(categoriasData);
    } catch (e) {
      console.warn("Erro ao carregar dados da Home:", e);
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

  const handleSelectCategoria = (catLabel: string) => {
    // Navega para a tab Buscar com a categoria pré-selecionada
    navigation.navigate('BuscarTab', { categoriaInicial: catLabel as CategoriaType });
  };

  const handleSelectCidade = (cidadeNome: string) => {
    navigation.navigate('ListaPorCidade', { cidadeNome });
  };

  const handleSelectEstabelecimento = (item: Estabelecimento) => {
    navigation.navigate('Detalhes', { estabelecimento: item });
  };

  const handleSelectNoticia = (noticia: Noticia) => {
    navigation.navigate('NoticiaDetalhe', { noticia });
  };

  return (
    <View style={styles.container}>
      {/* Header Superior Vinho */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 10 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerSubtitle}>Destino</Text>
            <Text style={styles.headerTitle}>Uva e Vinho • Serra Gaúcha</Text>
          </View>
          <View style={styles.avatarButton}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
        </View>

        {/* Badge Inteligente de Localização em Tempo Real */}
        <LocationBadge />

        {/* Barra de Busca Fake que leva para a Tab Buscar */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('BuscarTab')}
          style={styles.searchBar}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>Buscar cidade ou estabelecimento...</Text>
        </TouchableOpacity>
      </View>

      {/* Conteúdo com Scroll e Pull-to-refresh */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[THEME.colors.wineRed]}
            tintColor={THEME.colors.wineRed}
          />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={THEME.colors.wineRed} />
            <Text style={styles.loadingText}>Carregando a Serra Gaúcha...</Text>
          </View>
        ) : (
          <>
            {/* Banner Diferencial: Indicados para o Momento */}
            <View style={styles.section}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.navigate('MomentoTab')}
                style={styles.momentoBanner}
              >
                <View style={styles.momentoBannerHeader}>
                  <View style={styles.momentoTag}>
                    <Text style={styles.momentoTagText}>
                      {contextoMomento.estacaoIcone} {contextoMomento.estacaoLabel}
                    </Text>
                  </View>
                  <View style={styles.momentoLivePill}>
                    <Text style={styles.momentoLivePillText}>● Em Tempo Real</Text>
                  </View>
                </View>

                <Text style={styles.momentoTitle}>
                  {contextoMomento.periodoIcone} {contextoMomento.periodoLabel}
                </Text>
                <Text style={styles.momentoSubtitle} numberOfLines={2}>
                  {contextoMomento.sugestaoContextual}
                </Text>

                <View style={styles.momentoFooter}>
                  <View style={styles.momentoPillsRow}>
                    <View style={styles.momentoFeaturePill}>
                      <Text style={styles.momentoFeaturePillText}>🔥 Saindo do Forno</Text>
                    </View>
                    <View style={styles.momentoFeaturePill}>
                      <Text style={styles.momentoFeaturePillText}>📍 Perto de Você</Text>
                    </View>
                  </View>
                  <Text style={styles.momentoActionText}>Ver ranking →</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Seção Cidades */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Explorar por Cidade</Text>
                <TouchableOpacity onPress={() => navigation.navigate('CidadesTab')}>
                  <Text style={styles.sectionLink}>Ver todas →</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                {cidades.map((c, i) => (
                  <CardCidade
                    key={c.id || i}
                    cidade={c}
                    isSelected={i === 0}
                    onPress={() => handleSelectCidade(c.nome)}
                  />
                ))}
              </ScrollView>
            </View>

            {/* Seção Notícias em tempo real da API */}
            {noticias.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>📰 Notícias & Eventos</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                  {noticias.map((n) => (
                    <CardNoticia
                      key={n.id}
                      noticia={n}
                      onPress={() => handleSelectNoticia(n)}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Seção Destaques */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Em Destaque</Text>
                <TouchableOpacity onPress={() => navigation.navigate('BuscarTab')}>
                  <Text style={styles.sectionLink}>Ver todos →</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                {destaques.map((d, i) => (
                  <CardDestaque
                    key={d.id || i}
                    item={d}
                    onPress={() => handleSelectEstabelecimento(d)}
                  />
                ))}
              </ScrollView>
            </View>

            {/* Seção Categorias */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { marginBottom: 12 }]}>Categorias</Text>
              <View style={styles.gridCategorias}>
                {categorias.map((cat, i) => (
                  <TouchableOpacity
                    key={cat.id || i}
                    activeOpacity={0.8}
                    onPress={() => handleSelectCategoria(cat.label)}
                    style={styles.catCard}
                  >
                    <Text style={styles.catIcon}>{cat.icon}</Text>
                    <Text style={styles.catLabel}>{cat.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.wineRed,
  },
  header: {
    backgroundColor: THEME.colors.wineRed,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  avatarButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
  },
  searchBar: {
    backgroundColor: THEME.colors.white,
    borderRadius: THEME.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    fontSize: 14,
  },
  searchPlaceholder: {
    fontSize: 12,
    color: THEME.colors.gray,
    fontWeight: '500',
  },
  scrollArea: {
    flex: 1,
    backgroundColor: THEME.colors.cream,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  loadingContainer: {
    paddingTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: THEME.colors.gray,
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.dark,
  },
  sectionLink: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.wineRed,
  },
  horizontalScroll: {
    overflow: 'visible',
    paddingBottom: 4,
  },
  gridCategorias: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catCard: {
    width: '31%',
    backgroundColor: THEME.colors.white,
    borderRadius: THEME.borderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  catIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  catLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.dark,
  },
  momentoBanner: {
    backgroundColor: '#722F37',
    borderRadius: THEME.borderRadius.lg,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  momentoBannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  momentoTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  momentoTagText: {
    color: '#FFE082',
    fontSize: 10,
    fontWeight: '800',
  },
  momentoLivePill: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  momentoLivePillText: {
    color: THEME.colors.white,
    fontSize: 9,
    fontWeight: '800',
  },
  momentoTitle: {
    color: THEME.colors.white,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  momentoSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 10,
  },
  momentoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  momentoPillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  momentoFeaturePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  momentoFeaturePillText: {
    color: THEME.colors.white,
    fontSize: 9,
    fontWeight: '700',
  },
  momentoActionText: {
    color: '#FFE082',
    fontSize: 11,
    fontWeight: '900',
  },
});
