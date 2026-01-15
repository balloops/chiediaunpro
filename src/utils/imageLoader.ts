
// Utility per la gestione delle immagini
// Nota: Abbiamo rimosso import.meta.glob per garantire la stabilità in tutti gli ambienti.
// I componenti useranno le immagini di fallback (Unsplash) se questo array è vuoto.

export const imageLoader = {
  getHomeImages: (): string[] => {
    // Ritorna array vuoto per attivare i fallback in LandingPage.tsx
    return [];
  },

  getCategoryImages: (folderName: string): string[] => {
    // Ritorna array vuoto per attivare i fallback in VerticalLandingView.tsx
    return [];
  }
};
