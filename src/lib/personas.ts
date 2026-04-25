// Spark AZ persona definitions
import { Tractor, Tent, GraduationCap, Baby, Globe2, Building2, HardHat, HeartPulse, Stethoscope, LucideIcon } from "lucide-react";

export type PersonaId = "rancher" | "tribal" | "student" | "parent" | "border" | "urban" | "outdoor" | "senior" | "analyst";

export interface Persona {
  id: PersonaId;
  icon: LucideIcon;
  label: { en: string; es: string };
  description: { en: string; es: string };
  defaultTab: "self" | "animal" | "environment";
  riskModifier: (ctx: { animalScore: number; envScore: number; communityScore: number; weatherTempF: number; ilinetHigh: boolean; travelImport: boolean; remoteCounty: boolean }) => { weight: number; label: string }[];
}

export const PERSONAS: Persona[] = [
  {
    id: "rancher",
    icon: Tractor,
    label: { en: "Rancher / livestock owner", es: "Ranchero / ganadero" },
    description: { en: "I work with cattle, horses, sheep, or other livestock.", es: "Trabajo con ganado, caballos, ovejas u otro ganado." },
    defaultTab: "animal",
    riskModifier: (c) => c.animalScore > 0 ? [{ weight: 4, label: "Rancher + animal signal" }] : [],
  },
  {
    id: "tribal",
    icon: Tent,
    label: { en: "Tribal community member", es: "Miembro de comunidad tribal" },
    description: { en: "I live on or near tribal lands.", es: "Vivo en o cerca de tierras tribales." },
    defaultTab: "self",
    riskModifier: (c) => c.remoteCounty ? [{ weight: 2, label: "Tribal + remote-county under-coverage" }] : [],
  },
  {
    id: "student",
    icon: GraduationCap,
    label: { en: "College / K-12 student", es: "Estudiante (universidad o escuela)" },
    description: { en: "Dorms, classrooms, campus crowds.", es: "Dormitorios, aulas, multitudes en el campus." },
    defaultTab: "self",
    riskModifier: () => [],
  },
  {
    id: "parent",
    icon: Baby,
    label: { en: "K-12 parent / caregiver", es: "Padre/madre o cuidador K-12" },
    description: { en: "I have school-age kids at home.", es: "Tengo niños en edad escolar en casa." },
    defaultTab: "self",
    riskModifier: () => [],
  },
  {
    id: "border",
    icon: Globe2,
    label: { en: "Border-region resident", es: "Residente fronterizo" },
    description: { en: "I live near the US-Mexico border.", es: "Vivo cerca de la frontera con México." },
    defaultTab: "self",
    riskModifier: (c) => c.travelImport ? [{ weight: 3, label: "Border + active travel import" }] : [],
  },
  {
    id: "urban",
    icon: Building2,
    label: { en: "Urban metro resident", es: "Residente urbano" },
    description: { en: "I live in Phoenix, Tucson, or another metro area.", es: "Vivo en Phoenix, Tucson u otra área metropolitana." },
    defaultTab: "self",
    riskModifier: () => [],
  },
  {
    id: "outdoor",
    icon: HardHat,
    label: { en: "Outdoor worker", es: "Trabajador al aire libre" },
    description: { en: "Construction, landscaping, agriculture, delivery.", es: "Construcción, jardinería, agricultura, repartos." },
    defaultTab: "environment",
    riskModifier: (c) => c.weatherTempF >= 100 ? [{ weight: 3, label: "Outdoor work + extreme heat" }] : [],
  },
  {
    id: "senior",
    icon: HeartPulse,
    label: { en: "Senior (65+)", es: "Adulto mayor (65+)" },
    description: { en: "I'm 65 or older.", es: "Tengo 65 años o más." },
    defaultTab: "self",
    riskModifier: (c) => c.ilinetHigh ? [{ weight: 4, label: "Senior + elevated influenza activity" }] : [],
  },
  {
    id: "analyst",
    icon: Stethoscope,
    label: { en: "Public-health analyst", es: "Analista de salud pública" },
    description: { en: "I work for a county or state health department.", es: "Trabajo para un departamento de salud del condado o estado." },
    defaultTab: "self",
    riskModifier: () => [],
  },
];

export function getPersona(id: string | null | undefined): Persona {
  return PERSONAS.find((p) => p.id === id) ?? PERSONAS[5]; // urban default
}

export const REMOTE_COUNTIES = ["Apache", "Navajo", "La Paz", "Greenlee", "Graham", "Gila"];
