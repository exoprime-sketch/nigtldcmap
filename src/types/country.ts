export interface Country {
  iso2: string;
  iso3: string;
  nameKo: string;
  nameEn: string;
  regionCode: string;
  region: string;
  incomeLevelCode: string;
  incomeLevel: string;
  capitalCity: string;
  longitude: number | null;
  latitude: number | null;
}

export interface CountryDataResult {
  countries: Country[];
  isFallback: boolean;
  warning?: string;
}
