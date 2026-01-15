
// Utility per la gestione delle immagini
// Punta ai file statici nella cartella public/assets/images/
// IMPORTANTE: Le immagini devono essere nella cartella 'public', non in 'src'.

// Cache buster per evitare problemi di cache durante lo sviluppo
const CACHE_BUSTER = new Date().getTime(); 

// Numero massimo di immagini da cercare nella cartella
const MAX_IMAGES = 8; 

export const imageLoader = {
  getHomeImages: (): string[] => {
    // Restituisce i percorsi per le immagini della Home (home/1.webp ... home/8.webp)
    const images: string[] = [];
    for (let i = 1; i <= MAX_IMAGES; i++) {
        images.push(`/assets/images/home/${i}.webp?t=${CACHE_BUSTER}`);
    }
    return images;
  },

  getCategoryImages: (folderName: string): string[] => {
    // Restituisce i percorsi per le immagini delle categorie
    const images: string[] = [];
    for (let i = 1; i <= MAX_IMAGES; i++) {
        images.push(`/assets/images/${folderName}/${i}.webp?t=${CACHE_BUSTER}`);
    }
    return images;
  }
};
