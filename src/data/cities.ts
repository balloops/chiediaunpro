
export interface City {
  slug: string;
  name: string;
}

// Città principali per copertura geografica nazionale (Nord/Centro/Sud/Isole).
// L'espansione riflette l'intento di ricerca locale ("preventivo [servizio] [città]"),
// non la presenza reale di professionisti in loco: il matching è nazionale.
export const CITIES: City[] = [
  { slug: 'milano', name: 'Milano' },
  { slug: 'roma', name: 'Roma' },
  { slug: 'torino', name: 'Torino' },
  { slug: 'napoli', name: 'Napoli' },
  { slug: 'bologna', name: 'Bologna' },
  { slug: 'firenze', name: 'Firenze' },
  { slug: 'bari', name: 'Bari' },
  { slug: 'palermo', name: 'Palermo' },
  { slug: 'catania', name: 'Catania' },
  { slug: 'venezia', name: 'Venezia' },
  { slug: 'verona', name: 'Verona' },
  { slug: 'padova', name: 'Padova' },
  { slug: 'genova', name: 'Genova' },
  { slug: 'bergamo', name: 'Bergamo' },
  { slug: 'brescia', name: 'Brescia' },
  { slug: 'modena', name: 'Modena' },
  { slug: 'parma', name: 'Parma' },
  { slug: 'perugia', name: 'Perugia' },
  { slug: 'cagliari', name: 'Cagliari' },
  { slug: 'trieste', name: 'Trieste' },
];

export const getCityBySlug = (slug: string): City | undefined =>
  CITIES.find(c => c.slug === slug);
