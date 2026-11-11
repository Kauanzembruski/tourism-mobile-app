import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Share,
  Alert,
  Image,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import { RootStackParamList, YelpReview, ExcecaoAbertura } from '../types';
import { THEME } from '../constants/theme';
import { Stars } from '../components/common/Stars';
import { Tag } from '../components/common/Tag';
import { TAG_LABELS, HORARIOS_PADRAO_CATEGORIA } from '../constants/data';
import { useFavorites } from '../context/FavoritesContext';
import { useRoteiro } from '../context/RoteiroContext';
import { useLocation } from '../context/LocationContext';
import { getLiveYelpRatings } from '../api/yelp';
import { getEstabelecimentoById, getExcecoesAbertura } from '../api/services';
import { YelpReviewsSection } from '../components/common/YelpReviewsSection';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { abrirOpcoesNavegacao } from '../utils/navigationApps';

export const DetalheScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'Detalhes'>>();
  const { estabelecimento } = route.params;

  const { isFavorito, toggleFavorito } = useFavorites();
  const favorito = isFavorito(estabelecimento.id);

  const { isNoRoteiro, toggleRoteiro } = useRoteiro();
  const noRoteiro = isNoRoteiro(estabelecimento.id);

  const { coords: userCoords, formatarDistanciaAte } = useLocation();
  const distanciaTexto = formatarDistanciaAte(estabelecimento.coordenadas, estabelecimento.cidade);

  const bgCor = estabelecimento.cor || THEME.colors.wineRed;

  // Estado das notas e avaliações do Yelp em tempo real
  const [avaliacao, setAvaliacao] = useState<number>(estabelecimento.avaliacao);
  const [totalAvaliacoes, setTotalAvaliacoes] = useState<number>(estabelecimento.totalAvaliacoes || 0);
  const [yelpReviews, setYelpReviews] = useState<YelpReview[]>(estabelecimento.yelpReviews || []);
  const [isYelpData, setIsYelpData] = useState<boolean>(false);
  const [yelpUrl, setYelpUrl] = useState<string | undefined>(estabelecimento.yelpUrl);
  const [horarios, setHorarios] = useState(estabelecimento.horarios);
  const [excecoes, setExcecoes] = useState<ExcecaoAbertura[]>([]);
  const [isOpenNow, setIsOpenNow] = useState<boolean | undefined>(undefined);
  const [loadingYelp, setLoadingYelp] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoadingYelp(true);

      // 1. Carrega os horários de funcionamento reais e exceções da API
      try {
        const [fullDetails, excecoesData] = await Promise.all([
          getEstabelecimentoById(estabelecimento.id),
          getExcecoesAbertura(String(estabelecimento.id)),
        ]);
        if (isMounted) {
          if (fullDetails.horarios && fullDetails.horarios.length > 0) {
            setHorarios(fullDetails.horarios);
          }
          if (excecoesData && excecoesData.length > 0) {
            setExcecoes(excecoesData);
          }
        }
      } catch (err) {
        console.warn('Erro ao carregar horários e exceções do banco:', err);
      }

      // 2. Carrega avaliações em tempo real do Yelp
      try {
        const liveData = await getLiveYelpRatings(estabelecimento);
        if (isMounted) {
          setAvaliacao(liveData.avaliacao);
          setTotalAvaliacoes(liveData.totalAvaliacoes);
          setYelpReviews(liveData.reviews);
          setIsYelpData(liveData.isYelpData);
          if (liveData.yelpUrl) {
            setYelpUrl(liveData.yelpUrl);
          }
          if (liveData.horarios && liveData.horarios.length > 0) {
            setHorarios(liveData.horarios);
          }
          if (liveData.isOpenNow !== undefined) {
            setIsOpenNow(liveData.isOpenNow);
          }
        }
      } catch (err) {
        console.warn('Erro ao sincronizar dados do Yelp:', err);
      } finally {
        if (isMounted) {
          setLoadingYelp(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [estabelecimento]);

  const handleOpenWhatsApp = () => {
    if (!estabelecimento.whatsapp) {
      Alert.alert("Contato", "Número de WhatsApp não informado para este estabelecimento.");
      return;
    }
    const msg = encodeURIComponent(`Olá! Vi o perfil da ${estabelecimento.nome} no aplicativo AtuaSerra e gostaria de informações.`);
    const url = `whatsapp://send?phone=${estabelecimento.whatsapp}&text=${msg}`;
    
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(`https://wa.me/${estabelecimento.whatsapp}?text=${msg}`);
        }
      })
      .catch(() => {
        Linking.openURL(`https://wa.me/${estabelecimento.whatsapp}?text=${msg}`);
      });
  };

  const handleOpenSite = async () => {
    const url = estabelecimento.siteUrl || "https://serragaucha.com";
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      Linking.openURL(url);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Conheça ${estabelecimento.nome} em ${estabelecimento.cidade} - Serra Gaúcha no app AtuaSerra!`,
        title: estabelecimento.nome,
      });
    } catch (e) {
      console.warn("Erro ao compartilhar:", e);
    }
  };

  const handleOpenMap = () => {
    abrirOpcoesNavegacao(estabelecimento);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner Hero */}
        <View style={[styles.heroCover, { backgroundColor: bgCor }]}>
          {estabelecimento.imagemUrl ? (
            <Image
              source={{ uri: estabelecimento.imagemUrl }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.heroEmoji}>🍷</Text>
          )}

          {/* Botão Voltar */}
          <TouchableOpacity
            style={[styles.backButton, { top: Math.max(insets.top, 20) + 8 }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>

          {/* Botão Roteiro Topo */}
          <TouchableOpacity
            style={[styles.roteiroHeaderBtn, noRoteiro && styles.roteiroHeaderBtnAtivo, { top: Math.max(insets.top, 20) + 8 }]}
            onPress={() => toggleRoteiro(estabelecimento)}
            activeOpacity={0.8}
          >
            <Text style={[styles.roteiroHeaderBtnText, noRoteiro && styles.roteiroHeaderBtnTextAtivo]}>
              {noRoteiro ? '✓' : '🗺️'}
            </Text>
          </TouchableOpacity>

          {/* Botão Favoritar */}
          <TouchableOpacity
            style={[styles.favButton, { top: Math.max(insets.top, 20) + 8 }]}
            onPress={() => toggleFavorito(estabelecimento)}
            activeOpacity={0.8}
          >
            <Text style={[styles.favButtonText, favorito && styles.favActive]}>
              {favorito ? "♥" : "♡"}
            </Text>
          </TouchableOpacity>

          {/* Badge Categoria */}
          <View style={styles.badgeWrapper}>
            <Text style={styles.badgeText}>{estabelecimento.categoria}</Text>
          </View>
        </View>

        {/* Informações Principais */}
        <View style={styles.infoCard}>
          <Text style={styles.title}>{estabelecimento.nome}</Text>
          
          <View style={styles.ratingRow}>
            <Stars n={avaliacao} />
            <Text style={styles.reviewCount}>
              ({totalAvaliacoes > 0 ? totalAvaliacoes : 35} avaliações)
            </Text>
            {isYelpData && (
              <View style={styles.yelpMiniBadge}>
                <Text style={styles.yelpMiniBadgeText}>Yelp</Text>
              </View>
            )}
          </View>

          <TouchableOpacity onPress={handleOpenMap} style={styles.addressRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.addressText}>
                📍 {estabelecimento.endereco || `${estabelecimento.cidade}, RS`}
              </Text>
              {distanciaTexto && (
                <Text style={styles.addressDistanceText}>
                  A {distanciaTexto} de sua localização atual
                </Text>
              )}
            </View>
            <View style={styles.howToGetBadge}>
              <Text style={styles.howToGetText}>Como chegar →</Text>
            </View>
          </TouchableOpacity>

          {/* Banner Adicionar ao Roteiro */}
          <TouchableOpacity
            style={[styles.roteiroBanner, noRoteiro && styles.roteiroBannerAtivo]}
            onPress={() => toggleRoteiro(estabelecimento)}
            activeOpacity={0.85}
          >
            <View style={[styles.roteiroBannerIconWrapper, noRoteiro && styles.roteiroBannerIconWrapperAtivo]}>
              <Text style={styles.roteiroBannerIcon}>{noRoteiro ? '✓' : '🗺️'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.roteiroBannerTitle, noRoteiro && styles.roteiroBannerTitleAtivo]}>
                {noRoteiro ? 'Destino no Roteiro' : 'Adicionar ao Roteiro'}
              </Text>
              <Text style={styles.roteiroBannerSub}>
                {noRoteiro ? 'Toque para remover • Ver circuito no menu Salvos' : 'Gera a melhor rota calculada no menu Salvos'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Amenidades */}
          {estabelecimento.tags && estabelecimento.tags.length > 0 && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionHeading}>O que oferece</Text>
              <View style={styles.tagsGrid}>
                {estabelecimento.tags.map((t, idx) => (
                  <Tag key={idx} label={TAG_LABELS[t] || t} />
                ))}
              </View>
            </View>
          )}

          {/* Descrição */}
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeading}>Sobre</Text>
            <Text style={styles.descText}>
              {estabelecimento.sobre || "Um dos principais pontos turísticos e gastronômicos da Serra Gaúcha, proporcionando uma experiência memorável aos visitantes."}
            </Text>
          </View>

          {/* Seção de Avaliações do Yelp */}
          <YelpReviewsSection
            rating={avaliacao}
            totalRatings={totalAvaliacoes}
            reviews={yelpReviews}
            isYelpData={isYelpData}
            isLoading={loadingYelp}
            yelpUrl={yelpUrl}
          />

          {/* Horários */}
          <View style={styles.sectionBlock}>
            <View style={styles.scheduleHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.sectionHeading}>Horários de Atendimento</Text>
                {!horarios || horarios.length === 0 ? (
                  <View style={styles.suggestedBadge}>
                    <Text style={styles.suggestedBadgeText}>Sugerido</Text>
                  </View>
                ) : null}
              </View>
              {isOpenNow !== undefined && (
                <View style={[styles.openBadge, { backgroundColor: isOpenNow ? '#ECFDF5' : '#FEF2F2' }]}>
                  <Text style={[styles.openBadgeText, { color: isOpenNow ? '#059669' : '#DC2626' }]}>
                    {isOpenNow ? '● Aberto Agora' : '○ Fechado no Momento'}
                  </Text>
                </View>
              )}
            </View>

            {/* Exceções de Abertura / Feriados */}
            {excecoes && excecoes.length > 0 && (
              <View style={styles.excecaoBox}>
                <Text style={styles.excecaoTitle}>⚠️ Atenção a Datas Especiais / Feriados:</Text>
                {excecoes.map((exc, idx) => (
                  <Text key={idx} style={styles.excecaoText}>
                    • {exc.date}: {exc.reason || (exc.shift ? `Turno especial (${exc.shift})` : 'Horário diferenciado ou fechado')}
                  </Text>
                ))}
              </View>
            )}

            {(horarios && horarios.length > 0 
              ? horarios 
              : (HORARIOS_PADRAO_CATEGORIA[estabelecimento.categoria] || HORARIOS_PADRAO_CATEGORIA["Turismo"])
            ).map((h, i: number) => (
              <View key={i} style={styles.scheduleRow}>
                <Text style={styles.scheduleDay}>{h.dia}</Text>
                <Text style={styles.scheduleHour}>{h.hora}</Text>
              </View>
            ))}

            {(!horarios || horarios.length === 0) && (
              <Text style={styles.scheduleEstimatedNotice}>
                * Horário estimado para a categoria {estabelecimento.categoria}. Recomendamos confirmar antes da visita.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Barra Inferior com Ações Nativas */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity
          style={styles.btnNavegar}
          onPress={handleOpenMap}
          activeOpacity={0.85}
        >
          <Text style={styles.btnIcon}>🚗</Text>
          <Text style={styles.btnNavegarText}>Como Ir</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnWhatsapp}
          onPress={handleOpenWhatsApp}
          activeOpacity={0.85}
        >
          <Text style={styles.btnIcon}>💬</Text>
          <Text style={styles.btnWhatsappText}>WhatsApp</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnSite}
          onPress={handleOpenSite}
          activeOpacity={0.85}
        >
          <Text style={styles.btnIcon}>🌐</Text>
          <Text style={styles.btnSiteText}>Site</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnShare}
          onPress={handleShare}
          activeOpacity={0.85}
        >
          <Text style={styles.btnShareIcon}>📤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.white,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  heroCover: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  heroEmoji: {
    fontSize: 56,
    opacity: 0.35,
  },
  backButton: {
    position: 'absolute',
    top: 44,
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  backButtonText: {
    fontSize: 22,
    color: THEME.colors.dark,
    fontWeight: '800',
    marginTop: -2,
  },
  roteiroHeaderBtn: {
    position: 'absolute',
    top: 44,
    right: 58,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  roteiroHeaderBtnAtivo: {
    backgroundColor: '#10B981',
  },
  roteiroHeaderBtnText: {
    fontSize: 16,
    color: '#334155',
  },
  roteiroHeaderBtnTextAtivo: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  favButton: {
    position: 'absolute',
    top: 44,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  favButtonText: {
    fontSize: 20,
    color: THEME.colors.gray,
  },
  favActive: {
    color: '#E11D48',
  },
  badgeWrapper: {
    position: 'absolute',
    bottom: 14,
    left: 16,
    backgroundColor: THEME.colors.wineRed,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: THEME.borderRadius.md,
  },
  badgeText: {
    color: THEME.colors.white,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  infoCard: {
    padding: 20,
    backgroundColor: THEME.colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -16,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: THEME.colors.dark,
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  reviewCount: {
    fontSize: 11,
    color: THEME.colors.gray,
  },
  yelpMiniBadge: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#D32323',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 4,
  },
  yelpMiniBadgeText: {
    color: '#D32323',
    fontSize: 9,
    fontWeight: '800',
  },
  addressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.grayLight,
    marginBottom: 16,
  },
  addressText: {
    fontSize: 12,
    color: THEME.colors.dark,
    fontWeight: '600',
  },
  addressDistanceText: {
    fontSize: 11,
    color: THEME.colors.wineRed,
    fontWeight: '700',
    marginTop: 2,
  },
  addressMapLink: {
    fontSize: 11,
    color: THEME.colors.wineRed,
    fontWeight: '700',
    marginLeft: 8,
  },
  howToGetBadge: {
    backgroundColor: 'rgba(114, 47, 55, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: THEME.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(114, 47, 55, 0.2)',
  },
  howToGetText: {
    color: THEME.colors.wineRed,
    fontSize: 11,
    fontWeight: '800',
  },
  roteiroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 12,
  },
  roteiroBannerAtivo: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  roteiroBannerIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roteiroBannerIconWrapperAtivo: {
    backgroundColor: '#D1FAE5',
  },
  roteiroBannerIcon: {
    fontSize: 18,
  },
  roteiroBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
  },
  roteiroBannerTitleAtivo: {
    color: '#065F46',
  },
  roteiroBannerSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  sectionBlock: {
    marginTop: 16,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.colors.dark,
  },
  scheduleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  openBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  openBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  descText: {
    fontSize: 12,
    color: THEME.colors.darkMid,
    lineHeight: 20,
  },
  excecaoBox: {
    backgroundColor: '#FFFBEB',
    borderColor: '#F59E0B',
    borderWidth: 1,
    padding: 10,
    borderRadius: THEME.borderRadius.sm,
    marginBottom: 10,
  },
  excecaoTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
    marginBottom: 4,
  },
  excecaoText: {
    fontSize: 10,
    color: '#92400E',
    lineHeight: 15,
  },
  suggestedBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  suggestedBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#2563EB',
  },
  scheduleEstimatedNotice: {
    fontSize: 10,
    color: THEME.colors.gray,
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 14,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.grayLight,
  },
  noScheduleBox: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: THEME.colors.grayLight,
    borderRadius: THEME.borderRadius.sm,
  },
  noScheduleText: {
    fontSize: 11,
    color: THEME.colors.gray,
    fontStyle: 'italic',
  },
  scheduleDay: {
    fontSize: 11,
    color: THEME.colors.gray,
  },
  scheduleHour: {
    fontSize: 11,
    fontWeight: '700',
    color: THEME.colors.dark,
  },
  bottomBar: {
    backgroundColor: THEME.colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.grayLight,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  btnNavegar: {
    flex: 1.1,
    backgroundColor: '#1E40AF', // Azul vibrante para GPS / navegação
    borderRadius: THEME.borderRadius.md,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  btnNavegarText: {
    color: THEME.colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  btnWhatsapp: {
    flex: 1,
    backgroundColor: THEME.colors.whatsapp,
    borderRadius: THEME.borderRadius.md,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  btnWhatsappText: {
    color: THEME.colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  btnSite: {
    flex: 1,
    backgroundColor: THEME.colors.wineRed,
    borderRadius: THEME.borderRadius.md,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  btnSiteText: {
    color: THEME.colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  btnShare: {
    width: 44,
    height: 44,
    backgroundColor: THEME.colors.grayLight,
    borderRadius: THEME.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnIcon: {
    fontSize: 14,
  },
  btnShareIcon: {
    fontSize: 16,
  },
});
