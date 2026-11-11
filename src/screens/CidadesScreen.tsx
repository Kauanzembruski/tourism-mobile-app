import React, { useState, useEffect } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Cidade } from '../types';
import { THEME } from '../constants/theme';
import { getCidades } from '../api/services';
import { useLocation } from '../context/LocationContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const CidadesScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const carregarCidades = async () => {
    try {
      const data = await getCidades();
      setCidades(data);
    } catch (e) {
      console.warn("Erro ao carregar cidades:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    carregarCidades();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    carregarCidades();
  };

  const { cidade: userCidade, formatarDistanciaAte } = useLocation();

  const isCidadeAtual = (nome: string) => {
    if (!userCidade) return false;
    const n1 = nome.toLowerCase().trim();
    const n2 = userCidade.toLowerCase().trim();
    return n1.includes(n2) || n2.includes(n1);
  };

  const cidadesFiltradas = cidades.filter(c =>
    c.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalLocais = cidades.reduce((acc, curr) => acc + (curr.estabelecimentos ?? 0), 0);

  const handleSelectCidade = (cidadeNome: string) => {
    navigation.navigate('ListaPorCidade', { cidadeNome });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) + 10 }]}>
        <Text style={styles.headerSubtitle}>Região</Text>
        <Text style={styles.headerTitle}>Serra Gaúcha</Text>
        <Text style={styles.headerCount}>
          {cidades.every(c => c.estabelecimentos !== undefined) ? `${totalLocais} estabelecimentos em ${cidades.length} cidades` : `${cidades.length} cidades para explorar`}
        </Text>
      </View>

      {/* Conteúdo */}
      <View style={styles.content}>
        {/* Barra de Busca de Cidades */}
        <View style={styles.searchWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            placeholder="Buscar cidade..."
            placeholderTextColor={THEME.colors.gray}
            value={searchTerm}
            onChangeText={setSearchTerm}
            style={styles.searchInput}
          />
        </View>

        {loading ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="large" color={THEME.colors.wineRed} />
          </View>
        ) : (
          <FlatList
            data={cidadesFiltradas}
            keyExtractor={(item) => String(item.id)}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
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
            renderItem={({ item }) => {
              const ehAtual = isCidadeAtual(item.nome);
              const distancia = !ehAtual ? formatarDistanciaAte(undefined, item.nome) : null;

              return (
                <TouchableOpacity
                  style={[styles.cidadeCard, ehAtual && styles.cidadeCardAtual]}
                  activeOpacity={0.85}
                  onPress={() => handleSelectCidade(item.nome)}
                >
                  <View style={styles.cidadeEmojiCover}>
                    <Text style={styles.cidadeEmoji}>{item.emoji}</Text>
                    {ehAtual && (
                      <View style={styles.badgeAqui}>
                        <Text style={styles.badgeAquiText}>📍 Aqui</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.cidadeInfo}>
                    <Text style={styles.cidadeName} numberOfLines={1}>
                      {item.nome}
                    </Text>
                    <Text style={styles.cidadeLocais}>
                      {item.estabelecimentos} locais {distancia ? `• ${distancia}` : ''}
                    </Text>
                    <Text style={[styles.cidadeExplorar, ehAtual && styles.cidadeExplorarAtual]}>
                      {ehAtual ? "Ver atrativos perto →" : "Explorar →"}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
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
    paddingBottom: 16,
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
  content: {
    flex: 1,
    backgroundColor: THEME.colors.cream,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  searchWrapper: {
    backgroundColor: THEME.colors.white,
    borderRadius: THEME.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: THEME.colors.dark,
    fontWeight: '600',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 24,
  },
  cidadeCard: {
    width: '48%',
    backgroundColor: THEME.colors.white,
    borderRadius: THEME.borderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cidadeEmojiCover: {
    height: 70,
    backgroundColor: THEME.colors.wineRed,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cidadeEmoji: {
    fontSize: 32,
  },
  cidadeInfo: {
    padding: 10,
  },
  cidadeName: {
    fontSize: 12,
    fontWeight: '800',
    color: THEME.colors.dark,
    lineHeight: 16,
  },
  cidadeLocais: {
    fontSize: 10,
    color: THEME.colors.gray,
    marginTop: 2,
  },
  cidadeExplorar: {
    fontSize: 10,
    fontWeight: '800',
    color: THEME.colors.wineRed,
    marginTop: 6,
  },
  cidadeCardAtual: {
    borderWidth: 2,
    borderColor: '#2E7D32',
  },
  badgeAqui: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#2E7D32',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeAquiText: {
    color: THEME.colors.white,
    fontSize: 8,
    fontWeight: '800',
  },
  cidadeExplorarAtual: {
    color: '#2E7D32',
  },
  loadingWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
