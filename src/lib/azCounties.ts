export interface AzCounty {
  name: string;
  lat: number;
  lon: number;
  population: number;
}

export const AZ_COUNTIES: AzCounty[] = [
  { name: "Apache", lat: 35.39, lon: -109.49, population: 71518 },
  { name: "Cochise", lat: 31.88, lon: -109.75, population: 125447 },
  { name: "Coconino", lat: 35.84, lon: -111.77, population: 145101 },
  { name: "Gila", lat: 33.80, lon: -110.81, population: 53272 },
  { name: "Graham", lat: 32.93, lon: -109.89, population: 38533 },
  { name: "Greenlee", lat: 33.21, lon: -109.24, population: 9563 },
  { name: "La Paz", lat: 33.73, lon: -113.97, population: 16557 },
  { name: "Maricopa", lat: 33.45, lon: -112.07, population: 4485414 },
  { name: "Mohave", lat: 35.20, lon: -114.05, population: 213267 },
  { name: "Navajo", lat: 35.40, lon: -110.32, population: 106717 },
  { name: "Pima", lat: 32.22, lon: -110.93, population: 1043433 },
  { name: "Pinal", lat: 32.90, lon: -111.32, population: 425264 },
  { name: "Santa Cruz", lat: 31.52, lon: -110.77, population: 47669 },
  { name: "Yavapai", lat: 34.60, lon: -112.55, population: 236209 },
  { name: "Yuma", lat: 32.69, lon: -114.63, population: 203881 },
];

export const COUNTY_NAMES = AZ_COUNTIES.map((c) => c.name);

export function getCounty(name: string): AzCounty | undefined {
  return AZ_COUNTIES.find((c) => c.name === name);
}
