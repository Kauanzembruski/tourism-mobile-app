import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Estabelecimento, CategoriaType } from '../types';
import { THEME } from '../constants/theme';
import { getEstabelecimentos } from '../api/services';
import { CardEstabelecimento } from '../components/cards/CardEstabelecimento';
import { useLocation } from '../context/LocationContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FILTROS: CategoriaType[] = ["Todos", "Vinícola", "Gastronomia", "Hospedagem", "Turismo", "Eventos", "Artesanato"];

export const ListaScreen: React.FC = () => {
  const requestVersion = useRef(0);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<{ params: { categoriaInicial?: CategoriaType; cidadeNome?: string } }, 'params'>>();

  const [filtroAtivo, setFiltroAtivo] = useState<CategoriaType>(route.params?.categoriaInicial || "Todos");
  const [cidadeFiltro, setCidadeFiltro] = useState<string | undefined>(route.params?.cidadeNome);
  const [searchTerm, setSearchTerm] = useState("");
  const [estabelecimentos, setEstabelecimentos] = useState<Estabelecimento[]>([]);
  const [ordenarProximidade, setOrdenarProximidade] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { coords, calcularDistanciaAte } = useLocation();

  useEffect(() => {
    if (route.params?.categoriaInicial) {
      setFiltroAtivo(route.params.categoriaInicial);
    }
    if (route.params?.cidadeNome) {
      setCidadeFiltro(route.params.cidadeNome);
    }
  }, [route.params]);

  const carregarEstabelecimentos = async () => {
    const version = ++requestVersion.current;
    try {
      setLoading(true);
      const data = await getEstabelecimentos({
        categoria: filtroAtivo,
        cidade: cidadeFiltro,
        search: searchTerm,
      });

      if (version !== requestVersion.current) return;
      let ordenados = [...data];
      if (ordenarProximidade && coords) {
        ordenados.sort((a, b) => {
          const distA = calcularDistanciaAte(a.coordenadas, a.cidade) ?? 99999;
          const distB = calcularDistanciaAte(b.coordenadas, b.cidade) ?? 99999;
          return distA - distB;
        });
      }

      setEstabelecimentos(ordenados);
    } catch (e) {
      console.warn("Erro ao buscar estabelecimentos:", e);
    } finally {
      if (version === requestVersion.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      carregarEstabelecimentos();
    }, 300);

    return () => { clearTimeout(delayDebounce); requestVersion.current++; };
  }, [filtroAtivo, cidadeFiltro, searchTerm, ordenarProximidade, coords]);

  const onRefresh = () => {
    setRefreshing(true);
    carregarEstabelecimentos();
  };

  const handleSelectItem = (item: Estabelecimento) => {
    navigation.navigate('Detalhes', { estabelecimento: item });
  };

  return (
    <View style={styles.container}>
      {/* Header com Busca e Filtros */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 10 }]}>
        {cidadeFiltro && (
          <View style={styles.cidadeBadgeWrapper}>
            <Text style={styles.cidadeBadgeText}>Filtrando por: {cidadeFiltro}</Text>
            <TouchableOpacity onPress={() => setCidadeFiltro(undefined)}>
              <Text style={styles.cidadeBadgeRemove}>✕ Limpar</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.searchRow}>
          <View style={styles.searchInputWrapper}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              placeholder="Buscar estabelecimento..."
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
              value={searchTerm}
              onChangeText={setSearchTerm}
              style={styles.searchInput}
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity onPress={() => setSearchTerm("")}>
                <Text style={styles.clearSearch}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filtros em Pílula Horizontais */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTROS}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filtrosScroll}
          renderItem={({ item }) => {
            const isSelected = filtroAtivo === item;
            return (
              <TouchableOpacity
                onPress={() => setFiltroAtivo(item)}
                style={[styles.filtroBtn, isSelected && styles.filtroBtnActive]}
              >
                <Text style={[styles.filtroText, isSelected && styles.filtroTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Lista de Resultados */}
      <View style={styles.content}>
        <View style={styles.resultCountRow}>
          <Text style={styles.countText}>
            {loading ? "Buscando..." : `${estabelecimentos.length} estabelecimentos encontrados`}
          </Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setOrdenarProximidade(!ordenarProximidade)}
            style={[styles.sortBtn, ordenarProximidade && styles.sortBtnActive]}
          >
            <Text style={[styles.sortBtnText, ordenarProximidade && styles.sortBtnTextActive]}>
              📍 Mais Próximos
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="large" color={THEME.colors.wineRed} />
          </View>
        ) : (
          <FlatList
            data={estabelecimentos}
            keyExtractor={(item) => String(item.id)}
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
            renderItem={({ item }) => (
              <CardEstabelecimento
                item={item}
                onPress={() => handleSelectItem(item)}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🍇</Text>
                <Text style={styles.emptyTitle}>Nenhum local encontrado</Text>
                <Text style={styles.emptyDesc}>
                  Tente alterar os filtros ou termos da busca para encontrar opções na região.
                </Text>
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
    backgroundColor: THEME.colors.wineRed,
  },
  header: {
    backgroundColor: THEME.colors.wineRed,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  cidadeBadgeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.borderRadius.sm,
    marginBottom: 8,
  },
  cidadeBadgeText: {
    color: THEME.colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  cidadeBadgeRemove: {
    color: THEME.colors.goldLight,
    fontSize: 11,
    fontWeight: '800',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  searchInputWrapper: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: THEME.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 42,
  },
  searchIcon: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: THEME.colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  clearSearch: {
    color: THEME.colors.white,
    fontSize: 14,
    padding: 4,
  },
  filtrosScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  filtroBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: THEME.borderRadius.pill,
  },
  filtroBtnActive: {
    backgroundColor: THEME.colors.white,
  },
  filtroText: {
    color: THEME.colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  filtroTextActive: {
    color: THEME.colors.wineRed,
    fontWeight: '900',
  },
  content: {
    flex: 1,
    backgroundColor: THEME.colors.cream,
    paddingHorizontal: 16,
  },
  resultCountRow: {
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.gray,
    flex: 1,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: THEME.borderRadius.sm,
    backgroundColor: THEME.colors.white,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  sortBtnActive: {
    backgroundColor: THEME.colors.wineRed,
    borderColor: THEME.colors.wineRed,
  },
  sortBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.dark,
  },
  sortBtnTextActive: {
    color: THEME.colors.white,
  },
  listContent: {
    paddingBottom: 24,
  },
  loadingWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyEmoji: {
    fontSize: 42,
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
  },
});
