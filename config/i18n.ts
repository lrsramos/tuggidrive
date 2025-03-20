import { AppConfig } from './app';

// Define available languages
export const AVAILABLE_LANGUAGES = {
  'en-US': 'English (US)',
  'en-GB': 'English (UK)',
  'pt-BR': 'Português (Brasil)',
  'es-ES': 'Español',
  'fr-FR': 'Français',
} as const;

export type LanguageCode = keyof typeof AVAILABLE_LANGUAGES;

// Define translation structure type
export interface Translation {
  common: {
    loading: string;
    error: string;
    retry: string;
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    close: string;
  };
  auth: {
    signIn: string;
    signUp: string;
    signOut: string;
    email: string;
    password: string;
    forgotPassword: string;
    createAccount: string;
    alreadyHaveAccount: string;
    dontHaveAccount: string;
  };
  navigation: {
    explore: string;
    map: string;
    premium: string;
    settings: string;
  };
  attractions: {
    nearestAttraction: string;
    noAttractionsFound: string;
    searchRadius: string;
    playAudio: string;
    stopAudio: string;
    distance: string;
    kmAway: string;
    directions: {
      front: string;
      back: string;
      left: string;
      right: string;
      lookingAt: string;
    };
  };
  premium: {
    title: string;
    description: string;
    features: {
      audioGuides: string;
      offlineAccess: string;
      customVoices: string;
      extendedRange: string;
      prioritySupport: string;
    };
    subscribe: string;
    currentPlan: string;
    upgrade: string;
  };
  settings: {
    language: string;
    notifications: string;
    account: string;
    help: string;
    about: string;
    systemLanguage: string;
    premiumLanguage: string;
  };
  errors: {
    default: string;
    network: string;
    auth: string;
    location: string;
    tts: string;
  };
}

// English translations (US) - Base language
export const en_US: Translation = {
  common: {
    loading: 'Loading...',
    error: 'An error occurred',
    retry: 'Retry',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
  },
  auth: {
    signIn: 'Sign In',
    signUp: 'Sign Up',
    signOut: 'Sign Out',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot Password?',
    createAccount: 'Create Account',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: 'Don\'t have an account?',
  },
  navigation: {
    explore: 'Explore',
    map: 'Map',
    premium: 'Premium',
    settings: 'Settings',
  },
  attractions: {
    nearestAttraction: 'NEAREST ATTRACTION',
    noAttractionsFound: 'No attractions found nearby',
    searchRadius: 'Search radius',
    playAudio: 'Play Audio',
    stopAudio: 'Stop Audio',
    distance: 'Distance',
    kmAway: 'km away',
    directions: {
      front: 'ahead of you',
      back: 'behind you',
      left: 'to your left',
      right: 'to your right',
      lookingAt: 'Looking at the window',
    },
  },
  premium: {
    title: 'Tuggi Premium',
    description: 'Unlock all features and enhance your experience',
    features: {
      audioGuides: 'Audio Guides',
      offlineAccess: 'Offline Access',
      customVoices: 'Custom Voices',
      extendedRange: 'Extended Range',
      prioritySupport: 'Priority Support',
    },
    subscribe: 'Subscribe',
    currentPlan: 'Current Plan',
    upgrade: 'Upgrade',
  },
  settings: {
    language: 'Language',
    notifications: 'Notifications',
    account: 'Account',
    help: 'Help',
    about: 'About',
    systemLanguage: 'System Language (Free)',
    premiumLanguage: 'Select Language (Premium)',
  },
  errors: {
    default: 'Something went wrong',
    network: 'Network error',
    auth: 'Authentication error',
    location: 'Location error',
    tts: 'Text-to-speech error',
  },
};

// Portuguese translations (BR)
export const pt_BR: Translation = {
  common: {
    loading: 'Carregando...',
    error: 'Ocorreu um erro',
    retry: 'Tentar novamente',
    cancel: 'Cancelar',
    save: 'Salvar',
    delete: 'Excluir',
    edit: 'Editar',
    close: 'Fechar',
  },
  auth: {
    signIn: 'Entrar',
    signUp: 'Cadastrar',
    signOut: 'Sair',
    email: 'Email',
    password: 'Senha',
    forgotPassword: 'Esqueceu a senha?',
    createAccount: 'Criar conta',
    alreadyHaveAccount: 'Já tem uma conta?',
    dontHaveAccount: 'Não tem uma conta?',
  },
  navigation: {
    explore: 'Explorar',
    map: 'Mapa',
    premium: 'Premium',
    settings: 'Configurações',
  },
  attractions: {
    nearestAttraction: 'ATRAÇÃO MAIS PRÓXIMA',
    noAttractionsFound: 'Nenhuma atração encontrada nas proximidades',
    searchRadius: 'Raio de busca',
    playAudio: 'Reproduzir Áudio',
    stopAudio: 'Parar Áudio',
    distance: 'Distância',
    kmAway: 'km de distância',
    directions: {
      front: 'à sua frente',
      back: 'atrás de você',
      left: 'à sua esquerda',
      right: 'à sua direita',
      lookingAt: 'Olhando pela janela',
    },
  },
  premium: {
    title: 'Tuggi Premium',
    description: 'Desbloqueie todos os recursos e aprimore sua experiência',
    features: {
      audioGuides: 'Guias em Áudio',
      offlineAccess: 'Acesso Offline',
      customVoices: 'Vozes Personalizadas',
      extendedRange: 'Alcance Estendido',
      prioritySupport: 'Suporte Prioritário',
    },
    subscribe: 'Assinar',
    currentPlan: 'Plano Atual',
    upgrade: 'Fazer Upgrade',
  },
  settings: {
    language: 'Idioma',
    notifications: 'Notificações',
    account: 'Conta',
    help: 'Ajuda',
    about: 'Sobre',
    systemLanguage: 'Idioma do Sistema (Grátis)',
    premiumLanguage: 'Selecionar Idioma (Premium)',
  },
  errors: {
    default: 'Algo deu errado',
    network: 'Erro de rede',
    auth: 'Erro de autenticação',
    location: 'Erro de localização',
    tts: 'Erro de texto para fala',
  },
};

// Spanish translations (ES)
export const es_ES: Translation = {
  common: {
    loading: 'Cargando...',
    error: 'Se produjo un error',
    retry: 'Reintentar',
    cancel: 'Cancelar',
    save: 'Guardar',
    delete: 'Eliminar',
    edit: 'Editar',
    close: 'Cerrar',
  },
  auth: {
    signIn: 'Iniciar sesión',
    signUp: 'Registrarse',
    signOut: 'Cerrar sesión',
    email: 'Correo electrónico',
    password: 'Contraseña',
    forgotPassword: '¿Olvidaste tu contraseña?',
    createAccount: 'Crear cuenta',
    alreadyHaveAccount: '¿Ya tienes una cuenta?',
    dontHaveAccount: '¿No tienes una cuenta?',
  },
  navigation: {
    explore: 'Explorar',
    map: 'Mapa',
    premium: 'Premium',
    settings: 'Ajustes',
  },
  attractions: {
    nearestAttraction: 'ATRACCIÓN MÁS CERCANA',
    noAttractionsFound: 'No se encontraron atracciones cercanas',
    searchRadius: 'Radio de búsqueda',
    playAudio: 'Reproducir Audio',
    stopAudio: 'Detener Audio',
    distance: 'Distancia',
    kmAway: 'km de distancia',
    directions: {
      front: 'frente a ti',
      back: 'detrás de ti',
      left: 'a tu izquierda',
      right: 'a tu derecha',
      lookingAt: 'Mirando por la ventana',
    },
  },
  premium: {
    title: 'Tuggi Premium',
    description: 'Desbloquea todas las funciones y mejora tu experiencia',
    features: {
      audioGuides: 'Guías de Audio',
      offlineAccess: 'Acceso Sin Conexión',
      customVoices: 'Voces Personalizadas',
      extendedRange: 'Alcance Extendido',
      prioritySupport: 'Soporte Prioritario',
    },
    subscribe: 'Suscribirse',
    currentPlan: 'Plan Actual',
    upgrade: 'Mejorar',
  },
  settings: {
    language: 'Idioma',
    notifications: 'Notificaciones',
    account: 'Cuenta',
    help: 'Ayuda',
    about: 'Acerca de',
    systemLanguage: 'Idioma del Sistema (Gratis)',
    premiumLanguage: 'Seleccionar Idioma (Premium)',
  },
  errors: {
    default: 'Algo salió mal',
    network: 'Error de red',
    auth: 'Error de autenticación',
    location: 'Error de ubicación',
    tts: 'Error de texto a voz',
  },
};

// French translations (FR)
export const fr_FR: Translation = {
  common: {
    loading: 'Chargement...',
    error: 'Une erreur est survenue',
    retry: 'Réessayer',
    cancel: 'Annuler',
    save: 'Enregistrer',
    delete: 'Supprimer',
    edit: 'Modifier',
    close: 'Fermer',
  },
  auth: {
    signIn: 'Se connecter',
    signUp: 'S\'inscrire',
    signOut: 'Se déconnecter',
    email: 'Email',
    password: 'Mot de passe',
    forgotPassword: 'Mot de passe oublié ?',
    createAccount: 'Créer un compte',
    alreadyHaveAccount: 'Vous avez déjà un compte ?',
    dontHaveAccount: 'Vous n\'avez pas de compte ?',
  },
  navigation: {
    explore: 'Explorer',
    map: 'Carte',
    premium: 'Premium',
    settings: 'Paramètres',
  },
  attractions: {
    nearestAttraction: 'ATTRACTION LA PLUS PROCHE',
    noAttractionsFound: 'Aucune attraction trouvée à proximité',
    searchRadius: 'Rayon de recherche',
    playAudio: 'Lire l\'audio',
    stopAudio: 'Arrêter l\'audio',
    distance: 'Distance',
    kmAway: 'km',
    directions: {
      front: 'devant vous',
      back: 'derrière vous',
      left: 'à votre gauche',
      right: 'à votre droite',
      lookingAt: 'En regardant par la fenêtre',
    },
  },
  premium: {
    title: 'Tuggi Premium',
    description: 'Débloquez toutes les fonctionnalités et améliorez votre expérience',
    features: {
      audioGuides: 'Guides Audio',
      offlineAccess: 'Accès Hors Ligne',
      customVoices: 'Voix Personnalisées',
      extendedRange: 'Portée Étendue',
      prioritySupport: 'Support Prioritaire',
    },
    subscribe: 'S\'abonner',
    currentPlan: 'Plan Actuel',
    upgrade: 'Améliorer',
  },
  settings: {
    language: 'Langue',
    notifications: 'Notifications',
    account: 'Compte',
    help: 'Aide',
    about: 'À propos',
    systemLanguage: 'Langue du Système (Gratuit)',
    premiumLanguage: 'Sélectionner la Langue (Premium)',
  },
  errors: {
    default: 'Quelque chose s\'est mal passé',
    network: 'Erreur réseau',
    auth: 'Erreur d\'authentification',
    location: 'Erreur de localisation',
    tts: 'Erreur de synthèse vocale',
  },
};

// Create translations map
export const translations: Record<LanguageCode, Translation> = {
  'en-US': en_US,
  'en-GB': en_US, // Use US English for UK
  'pt-BR': pt_BR,
  'es-ES': es_ES,
  'fr-FR': fr_FR,
};

// Helper function to get translation based on language code
export function getTranslation(languageCode: string): Translation {
  // Get base language code
  const baseCode = AppConfig.LanguageUtils.getBaseLanguage(languageCode);
  
  // Find matching language code
  const matchingCode = Object.keys(translations).find(code => 
    code.startsWith(baseCode)
  ) as LanguageCode;

  // Return matching translation or default to US English
  return translations[matchingCode] || translations['en-US'];
}