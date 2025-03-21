import type { Translation } from './types';

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