/* Configuração do app.
   Enquanto `firebase.apiKey` estiver vazio, o app roda em MODO DEMONSTRAÇÃO:
   os dados ficam só neste navegador (localStorage), sem login de verdade.
   Para publicar, cole aqui a configuração do projeto Firebase (ver COMO-PUBLICAR.md). */
export const CONFIG = {
  firebase: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
  },
};

export const MODO_DEMO = !CONFIG.firebase.apiKey;
