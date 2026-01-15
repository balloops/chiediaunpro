
// Utility per la gestione delle immagini
// Punta ai file statici nella cartella public/assets/images/
// Assumiamo che i file si chiamino 1.webp, 2.webp, ecc. come default
// Il frontend gestirà il fallback automatico su jpg/png se webp non esiste.

export const imageLoader = {
  getHomeImages: (): string[] => {
    // Restituisce i percorsi per le immagini della Home (parte da .webp)
    return [
      '/assets/images/home/1.webp',
      '/assets/images/home/2.webp',
      '/assets/images/home/3.webp',
      '/assets/images/home/4.webp'
    ];
  },

  getCategoryImages: (folderName: string): string[] => {
    // Restituisce i percorsi dinamici per le categorie (parte da .webp)
    return [
      `/assets/images/${folderName}/1.webp`,
      `/assets/images/${folderName}/2.webp`,
      `/assets/images/${folderName}/3.webp`,
      `/assets/images/${folderName}/4.webp`
    ];
  }
};
