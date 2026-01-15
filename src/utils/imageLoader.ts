
// Utility per la gestione delle immagini
// Punta ai file statici nella cartella public/assets/images/
// Assumiamo che i file si chiamino 1.jpg, 2.jpg, 3.jpg, ecc.

export const imageLoader = {
  getHomeImages: (): string[] => {
    // Restituisce i percorsi per le immagini della Home
    return [
      '/assets/images/home/1.jpg',
      '/assets/images/home/2.jpg',
      '/assets/images/home/3.jpg',
      '/assets/images/home/4.jpg'
    ];
  },

  getCategoryImages: (folderName: string): string[] => {
    // Restituisce i percorsi dinamici per le categorie
    return [
      `/assets/images/${folderName}/1.jpg`,
      `/assets/images/${folderName}/2.jpg`,
      `/assets/images/${folderName}/3.jpg`,
      `/assets/images/${folderName}/4.jpg`
    ];
  }
};
