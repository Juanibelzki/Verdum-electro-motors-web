export type CarCondition = "Nuevo" | "Seminuevo";
export type Fuel = "Gasolina" | "Eléctrico" | "Híbrido";

export type Car = {
  id: string;
  brand: string;
  model: string;
  version: string;
  year: number;
  km: number;
  transmission: "Automática" | "Manual";
  fuel: Fuel;
  body: "SUV" | "Sedán" | "Deportivo";
  condition: CarCondition;
  price: number;
  image: string;
  badge: string;
  power: number;
  acceleration: string;
  drive: string;
  seats: number;
  color: string;
  tagline: string;
  features: string[];
};

const img = (id: number, w = 1200, h = 900) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=${w}&h=${h}`;

export const images = {
  hero: img(33345485, 1500, 1300),
  showroom: img(18108314, 1200, 1000),
  interior: img(36742939, 900, 700),
  lounge: img(15513826, 1200, 900),
};

export const cars: Car[] = [
  {
    id: "porsche-911",
    brand: "Porsche",
    model: "911 Carrera S",
    version: "3.0 Turbo · PDK",
    year: 2023,
    km: 9800,
    transmission: "Automática",
    fuel: "Gasolina",
    body: "Deportivo",
    condition: "Seminuevo",
    price: 154900,
    image: img(33345485),
    badge: "Destacado",
    power: 450,
    acceleration: "3,7 s",
    drive: "Trasera",
    seats: 4,
    color: "Verde Mamba",
    tagline: "El equilibrio exacto entre confort diario y emoción pura.",
    features: [
      "Paquete Sport Chrono",
      "Techo panorámico",
      "Escape deportivo",
      "Asientos deportivos adaptativos",
      "Garantía VELTA 12 meses",
    ],
  },
  {
    id: "genesis-gv70",
    brand: "Genesis",
    model: "GV70 3.5T",
    version: "Sport AWD · Prestige",
    year: 2024,
    km: 3480,
    transmission: "Automática",
    fuel: "Gasolina",
    body: "SUV",
    condition: "Nuevo",
    price: 61900,
    image: img(11808155),
    badge: "Nuevo ingreso",
    power: 380,
    acceleration: "5,4 s",
    drive: "AWD",
    seats: 5,
    color: "Azul Capri",
    tagline: "Diseño que se detiene a mirar. Tecnología que no se nota hasta que falta.",
    features: [
      "Techo panorámico",
      "Audio Lexicon 14 bocinas",
      "Conducción semiautónoma nivel 2",
      "Cámara 360°",
      "Garantía oficial 5 años",
    ],
  },
  {
    id: "genesis-g70",
    brand: "Genesis",
    model: "G70 2.0T",
    version: "Prestige · RWD",
    year: 2024,
    km: 8900,
    transmission: "Automática",
    fuel: "Gasolina",
    body: "Sedán",
    condition: "Nuevo",
    price: 48500,
    image: img(11159145),
    badge: "Oportunidad",
    power: 245,
    acceleration: "6,2 s",
    drive: "Trasera",
    seats: 5,
    color: "Gris Teide",
    tagline: "Deportividad serena, con todo el equipamiento que esperás.",
    features: [
      "Cuero Nappa",
      "Faros Matrix LED",
      "Head-up display",
      "Carga inalámbrica",
      "Garantía oficial 5 años",
    ],
  },
  {
    id: "genesis-gv60",
    brand: "Genesis",
    model: "GV60 Performance",
    version: "AWD · Dual Motor",
    year: 2025,
    km: 0,
    transmission: "Automática",
    fuel: "Eléctrico",
    body: "SUV",
    condition: "Nuevo",
    price: 79900,
    image: img(14101311),
    badge: "100% eléctrico",
    power: 490,
    acceleration: "3,9 s",
    drive: "AWD",
    seats: 5,
    color: "Sao Paulo Lime",
    tagline: "El futuro no se espera. Se conduce.",
    features: [
      "Autonomía 466 km (WLTP)",
      "Carga 10–80% en 18 min",
      "Boost Mode",
      "Carga inalámbrica de 3 kW",
      "Garantía de batería 8 años",
    ],
  },
  {
    id: "mercedes-eqb",
    brand: "Mercedes-Benz",
    model: "EQB 350",
    version: "4MATIC · AMG Line",
    year: 2023,
    km: 18400,
    transmission: "Automática",
    fuel: "Eléctrico",
    body: "SUV",
    condition: "Seminuevo",
    price: 56400,
    image: img(17792223),
    badge: "Certificado",
    power: 292,
    acceleration: "6,2 s",
    drive: "4MATIC",
    seats: 7,
    color: "Blanco Polar",
    tagline: "Siete plazas, cero emisiones y el confort de siempre.",
    features: [
      "Siete plazas",
      "Burmester surround",
      "Conducción asistida",
      "Inspección de 120 puntos",
      "Garantía VELTA 12 meses",
    ],
  },
  {
    id: "toyota-gr86",
    brand: "Toyota",
    model: "GR86",
    version: "2.4 Boxer · Manual",
    year: 2024,
    km: 1200,
    transmission: "Manual",
    fuel: "Gasolina",
    body: "Deportivo",
    condition: "Nuevo",
    price: 42900,
    image: img(14346287),
    badge: "Nuevo ingreso",
    power: 234,
    acceleration: "6,9 s",
    drive: "Trasera",
    seats: 4,
    color: "Blanco Cristal",
    tagline: "Trazada limpia, caja manual y una sonrisa garantizada.",
    features: [
      "Caja manual de 6 velocidades",
      "Diferencial autoblocante",
      "Asientos deportivos",
      "Modo Track",
      "Garantía oficial 3 años",
    ],
  },
  {
    id: "mercedes-amg-gt",
    brand: "Mercedes-Benz",
    model: "AMG GT 43",
    version: "4MATIC+ · Coupé 4 puertas",
    year: 2022,
    km: 24500,
    transmission: "Automática",
    fuel: "Gasolina",
    body: "Deportivo",
    condition: "Seminuevo",
    price: 118000,
    image: img(5063629),
    badge: "Certificado",
    power: 367,
    acceleration: "5,0 s",
    drive: "Trasera",
    seats: 4,
    color: "Amarillo Solar",
    tagline: "Un GT que hace las mañanas más interesantes.",
    features: [
      "Paquete AMG Night",
      "Escape deportivo AMG",
      "Cuero bitono",
      "Burmester High-End",
      "Inspección de 120 puntos",
    ],
  },
  {
    id: "hyundai-ioniq5",
    brand: "Hyundai",
    model: "IONIQ 5",
    version: "Signature AWD · 84 kWh",
    year: 2025,
    km: 0,
    transmission: "Automática",
    fuel: "Eléctrico",
    body: "SUV",
    condition: "Nuevo",
    price: 52800,
    image: img(35138634),
    badge: "100% eléctrico",
    power: 325,
    acceleration: "5,1 s",
    drive: "AWD",
    seats: 5,
    color: "Gris Cyber",
    tagline: "El eléctrico que recarga tu rutina con espacios inteligentes.",
    features: [
      "Swap de carga bidireccional",
      "Autonomía 507 km (WLTP)",
      "Techo solar",
      "Head-up display con realidad aumentada",
      "Garantía de batería 8 años",
    ],
  },
];

export const featuredCar = cars[0];

const numberFormat = new Intl.NumberFormat("es-AR");

export const formatUSD = (value: number) => `USD ${numberFormat.format(Math.round(value))}`;

export const formatKm = (value: number) =>
  value === 0 ? "0 km" : `${numberFormat.format(value)} km`;

export const monthlyPayment = (
  price: number,
  downPct = 0.2,
  months = 60,
  annualRate = 0.079
) => {
  const principal = price * (1 - downPct);
  const rate = annualRate / 12;
  if (rate === 0) return principal / months;
  return Math.round((principal * rate) / (1 - Math.pow(1 + rate, -months)));
};

export const brands = Array.from(new Set(cars.map((car) => car.brand)));
export const bodies = Array.from(new Set(cars.map((car) => car.body)));
