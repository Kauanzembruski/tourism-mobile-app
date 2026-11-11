import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Share,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList, AppNavigation, Noticia } from '../types';
import { THEME } from '../constants/theme';
import { getNoticiaById } from '../api/services';

export const NoticiaDetalheScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<AppNavigation>();
  const route = useRoute<RouteProp<RootStackParamList, 'NoticiaDetalhe'>>();
  
  const initialNoticia = route.params?.noticia;
  const [noticia, setNoticia] = useState<Noticia | undefined>(initialNoticia);
  const [loadingBody, setLoadingBody] = useState(false);

  useEffect(() => {
    // Se não tiver o corpo completo carregado, busca da API
    if (initialNoticia?.id && (!initialNoticia.body || initialNoticia.body.trim().length === 0)) {
      setLoadingBody(true);
      getNoticiaById(initialNoticia.id)
        .then((full) => {
          if (full) {
            setNoticia(full);
          }
        })
        .finally(() => {
          setLoadingBody(false);
        });
    }
  }, [initialNoticia?.id]);

  if (!noticia) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Notícia não encontrada.</Text>
        <TouchableOpacity style={styles.backBtnSimple} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const dataFormatada = noticia.published_at
    ? new Date(noticia.published_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '';

  const isIdOuUuid = (str?: string) => !str || /^[0-9a-f-]{25,}$/i.test(str) || /^[0-9]+$/.test(str);
  const nomeCidadeValido = noticia.cidade && !isIdOuUuid(noticia.cidade) ? noticia.cidade : null;

  const handleShare = async () => {
    try {
      await Share.share({
        title: noticia.title,
        message: `${noticia.title}\n\nConfira esta notícia no app AtuaSerra: ${noticia.summary || ''}`,
      });
    } catch (e) {
      console.warn('Erro ao compartilhar notícia:', e);
    }
  };

  const handleExplorarCidade = () => {
    if (nomeCidadeValido) {
      navigation.navigate('ListaPorCidade', { cidadeNome: nomeCidadeValido });
    } else {
      navigation.navigate('BuscarTab');
    }
  };

  // Limpa possíveis tags HTML caso venham do backend Django
  const cleanBodyText = (text?: string): string => {
    if (!text) return '';
    return text
      .replace(/<br\s*[\/]?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .trim();
  };

  const textoCorpo = cleanBodyText(noticia.body);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner de Capa */}
        <View style={styles.heroWrapper}>
          {noticia.cover ? (
            <Image
              source={{ uri: noticia.cover }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderCover}>
              <Text style={styles.placeholderIcon}>📰</Text>
            </View>
          )}

          {/* Gradiente escuro para contraste */}
          <View style={styles.overlayGradient} />

          {/* Botão Voltar (com safe area do iPhone) */}
          <TouchableOpacity
            style={[styles.floatingButton, styles.backButton, { top: Math.max(insets.top, 20) + 8 }]}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>

          {/* Botão Compartilhar */}
          <TouchableOpacity
            style={[styles.floatingButton, styles.shareButton, { top: Math.max(insets.top, 20) + 8 }]}
            onPress={handleShare}
            activeOpacity={0.85}
          >
            <Text style={styles.shareIcon}>↗</Text>
          </TouchableOpacity>

          {/* Badges na parte inferior da foto */}
          <View style={styles.heroFooter}>
            {noticia.featured && (
              <View style={styles.badgeFeatured}>
                <Text style={styles.badgeFeaturedText}>⭐ DESTAQUE</Text>
              </View>
            )}
            {nomeCidadeValido ? (
              <View style={styles.badgeCidade}>
                <Text style={styles.badgeCidadeText}>📍 {nomeCidadeValido}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Conteúdo da Notícia */}
        <View style={styles.contentCard}>
          {/* Data de Publicação */}
          {dataFormatada ? (
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>Publicado em {dataFormatada}</Text>
            </View>
          ) : null}

          {/* Título Principal */}
          <Text style={styles.title}>{noticia.title}</Text>

          {/* Resumo / Lead com destaque */}
          {noticia.summary ? (
            <View style={styles.leadContainer}>
              <Text style={styles.leadText}>{noticia.summary}</Text>
            </View>
          ) : null}

          {/* Divisor */}
          <View style={styles.divider} />

          {/* Corpo do Texto */}
          {loadingBody ? (
            <View style={styles.loadingWrapper}>
              <ActivityIndicator size="small" color={THEME.colors.wineRed} />
              <Text style={styles.loadingText}>Carregando matéria completa...</Text>
            </View>
          ) : textoCorpo ? (
            <Text style={styles.bodyText}>{textoCorpo}</Text>
          ) : (
            <Text style={styles.bodyTextFallback}>
              {noticia.summary || "Acompanhe todos os detalhes e acontecimentos da Serra Gaúcha no portal AtuaSerra."}
            </Text>
          )}

          {/* Card de Chamada para Ação: Conhecer a Região */}
          <View style={styles.actionCard}>
            <View style={styles.actionCardHeader}>
              <Text style={styles.actionCardIcon}>🍇</Text>
              <View style={styles.actionCardTextCol}>
                <Text style={styles.actionCardTitle}>
                  {nomeCidadeValido ? `Explore ${nomeCidadeValido}` : "Conheça a Serra Gaúcha"}
                </Text>
                <Text style={styles.actionCardDesc}>
                  {nomeCidadeValido
                    ? `Descubra os melhores atrativos, vinícolas e restaurantes em ${nomeCidadeValido}.`
                    : "Descubra os melhores atrativos, vinícolas e restaurantes desta região."}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.actionButton}
              activeOpacity={0.85}
              onPress={handleExplorarCidade}
            >
              <Text style={styles.actionButtonText}>
                {nomeCidadeValido ? `Ver locais em ${nomeCidadeValido} →` : "Explorar Estabelecimentos →"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.cream,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: THEME.colors.gray,
    marginBottom: 16,
    fontWeight: '700',
  },
  backBtnSimple: {
    backgroundColor: THEME.colors.wineRed,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: THEME.borderRadius.md,
  },
  backBtnText: {
    color: THEME.colors.white,
    fontWeight: '800',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroWrapper: {
    height: 260,
    backgroundColor: THEME.colors.wineRed,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  placeholderCover: {
    ...StyleSheet.absoluteFill,
    backgroundColor: THEME.colors.wineRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    fontSize: 64,
  },
  overlayGradient: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  floatingButton: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 10,
  },
  backButton: {
    left: 16,
  },
  backButtonText: {
    fontSize: 26,
    fontWeight: '300',
    color: THEME.colors.dark,
    lineHeight: 28,
    marginTop: -2,
  },
  shareButton: {
    right: 16,
  },
  shareIcon: {
    fontSize: 18,
    color: THEME.colors.dark,
    fontWeight: '800',
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
  },
  badgeFeatured: {
    backgroundColor: '#F59E0B',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  badgeFeaturedText: {
    color: THEME.colors.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  badgeCidade: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  badgeCidadeText: {
    color: THEME.colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  contentCard: {
    backgroundColor: THEME.colors.white,
    borderTopLeftRadius: THEME.borderRadius.xl,
    borderTopRightRadius: THEME.borderRadius.xl,
    marginTop: -16,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  dateRow: {
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 11,
    color: THEME.colors.gray,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: THEME.colors.dark,
    lineHeight: 26,
    letterSpacing: -0.3,
    marginBottom: 14,
  },
  leadContainer: {
    borderLeftWidth: 3,
    borderLeftColor: THEME.colors.wineRed,
    paddingLeft: 12,
    marginVertical: 10,
  },
  leadText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 16,
  },
  bodyText: {
    fontSize: 14,
    color: THEME.colors.dark,
    lineHeight: 22,
    fontWeight: '400',
  },
  bodyTextFallback: {
    fontSize: 13,
    color: THEME.colors.gray,
    lineHeight: 20,
  },
  loadingWrapper: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 11,
    color: THEME.colors.gray,
    fontWeight: '600',
  },
  actionCard: {
    marginTop: 28,
    backgroundColor: '#FAF5F0',
    borderRadius: THEME.borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3E8DF',
  },
  actionCardHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionCardIcon: {
    fontSize: 28,
  },
  actionCardTextCol: {
    flex: 1,
  },
  actionCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.wineRed,
    marginBottom: 2,
  },
  actionCardDesc: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 15,
  },
  actionButton: {
    backgroundColor: THEME.colors.wineRed,
    borderRadius: THEME.borderRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: THEME.colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
});
