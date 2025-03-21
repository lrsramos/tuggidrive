import type { Translation } from './types';

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