
// Utility per la gestione delle immagini
// Punta ai file statici nella cartella public/assets/images/
// IMPORTANTE: Le immagini devono essere nella cartella 'public', non in 'src'.

// Cache buster per evitare problemi di cache durante lo sviluppo
const CACHE_BUSTER = new Date().getTime(); 

export const imageLoader = {
  getHomeImages: (): string[] => {
    // Restituisce i percorsi per le immagini della Home
    // I file devono trovarsi in: public/assets/images/home/
    return [
      `/assets/images/home/1.webp?t=${CACHE_BUSTER}`,
      `/assets/images/home/2.webp?t=${CACHE_BUSTER}`,
      `/assets/images/home/3.webp?t=${CACHE_BUSTER}`,
      `/assets/images/home/4.webp?t=${CACHE_BUSTER}`
    ];
  },

  getCategoryImages: (folderName: string): string[] => {
    // I file devono trovarsi in: public/assets/images/[folderName]/
    return [
      `/assets/images/${folderName}/1.webp?t=${CACHE_BUSTER}`,
      `/assets/images/${folderName}/2.webp?t=${CACHE_BUSTER}`,
      `/assets/images/${folderName}/3.webp?t=${CACHE_BUSTER}`,
      `/assets/images/${folderName}/4.webp?t=${CACHE_BUSTER}`
    ];
  }
};
