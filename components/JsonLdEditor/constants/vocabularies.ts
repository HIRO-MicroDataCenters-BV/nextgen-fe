import type { ControlledVocabulary } from "../types/editor.types";

export interface VocabularyOption {
  value: string;
  label: string;
  description?: string;
  chipLabel?: string;
  icon?: string;
  match: string[];
}

export const CONTROLLED_VOCABULARIES: Partial<
  Record<ControlledVocabulary, VocabularyOption[]>
> = {
  accessRights: [
    {
      value: "http://publications.europa.eu/resource/authority/access-right/PUBLIC",
      label: "Public",
      chipLabel: "Public",
      icon: "lucide:globe",
      description: "Freely accessible to everyone",
      match: ["public"],
    },
    {
      value: "http://publications.europa.eu/resource/authority/access-right/RESTRICTED",
      label: "Restricted",
      chipLabel: "Restricted",
      icon: "lucide:lock",
      description: "Access limited to authorised users",
      match: ["restricted"],
    },
    {
      value: "http://publications.europa.eu/resource/authority/access-right/NON_PUBLIC",
      label: "Non-public",
      chipLabel: "Non-public",
      icon: "lucide:ban",
      description: "Not externally accessible",
      match: ["nonpublic", "nonproblic", "non_public"],
    },
  ],
  language: [
    {
      value: "http://publications.europa.eu/resource/authority/language/ENG",
      label: "English (ENG)",
      chipLabel: "EN",
      match: ["eng", "english", "en"],
    },
    {
      value: "http://publications.europa.eu/resource/authority/language/NLD",
      label: "Dutch (NLD)",
      chipLabel: "NL",
      match: ["nld", "dutch", "nl"],
    },
    {
      value: "http://publications.europa.eu/resource/authority/language/DEU",
      label: "German (DEU)",
      chipLabel: "DE",
      match: ["deu", "german", "de"],
    },
    {
      value: "http://publications.europa.eu/resource/authority/language/FRA",
      label: "French (FRA)",
      chipLabel: "FR",
      match: ["fra", "french", "fr"],
    },
    {
      value: "http://publications.europa.eu/resource/authority/language/SPA",
      label: "Spanish (SPA)",
      chipLabel: "ES",
      match: ["spa", "spanish", "es"],
    },
    {
      value: "http://publications.europa.eu/resource/authority/language/ITA",
      label: "Italian (ITA)",
      chipLabel: "IT",
      match: ["ita", "italian", "it"],
    },
    {
      value: "http://publications.europa.eu/resource/authority/language/RUS",
      label: "Russian (RUS)",
      chipLabel: "RU",
      match: ["rus", "russian", "ru"],
    },
  ],
  algorithm: [
    {
      value: "http://spdx.org/rdf/terms#SHA256",
      label: "SHA-256",
      chipLabel: "SHA-256",
      icon: "lucide:shield-check",
      description: "SHA-256 (recommended)",
      match: ["sha256", "sha2"],
    },
    {
      value: "http://spdx.org/rdf/terms#SHA512",
      label: "SHA-512",
      chipLabel: "SHA-512",
      icon: "lucide:shield",
      description: "SHA-512",
      match: ["sha512"],
    },
    {
      value: "http://spdx.org/rdf/terms#SHA1",
      label: "SHA-1",
      chipLabel: "SHA-1",
      icon: "lucide:shield",
      description: "SHA-1 (legacy)",
      match: ["sha1"],
    },
    {
      value: "http://spdx.org/rdf/terms#MD5",
      label: "MD5",
      chipLabel: "MD5",
      icon: "lucide:hash",
      description: "MD5 (legacy)",
      match: ["md5"],
    },
  ],
  availability: [
    {
      value: "http://data.europa.eu/r5r/AVAILABLE",
      label: "Available",
      chipLabel: "Available",
      icon: "lucide:check-circle",
      description: "Data is available now",
      match: ["available"],
    },
    {
      value: "http://data.europa.eu/r5r/EXPERIMENTAL",
      label: "Experimental",
      chipLabel: "Experimental",
      icon: "lucide:flask-conical",
      description: "Available for testing purposes",
      match: ["experimental"],
    },
    {
      value: "http://data.europa.eu/r5r/STABLE",
      label: "Stable",
      chipLabel: "Stable",
      icon: "lucide:anchor",
      description: "Stable and long-term available",
      match: ["stable"],
    },
    {
      value: "http://data.europa.eu/r5r/TEMPORARY",
      label: "Temporary",
      chipLabel: "Temporary",
      icon: "lucide:clock",
      description: "Only temporarily available",
      match: ["temporary", "temp"],
    },
  ],
  frequency: [
    {
      value: "http://publications.europa.eu/resource/authority/frequency/ANNUAL",
      label: "Annual",
      chipLabel: "Annual",
      match: ["annual"],
    },
    {
      value: "http://publications.europa.eu/resource/authority/frequency/BIANNUAL",
      label: "Biannual",
      chipLabel: "Biannual",
      match: ["biannual", "semiannual"],
    },
    {
      value: "http://publications.europa.eu/resource/authority/frequency/QUARTERLY",
      label: "Quarterly",
      chipLabel: "Quarterly",
      match: ["quarterly"],
    },
    {
      value: "http://publications.europa.eu/resource/authority/frequency/MONTHLY",
      label: "Monthly",
      chipLabel: "Monthly",
      match: ["monthly"],
    },
    {
      value: "http://publications.europa.eu/resource/authority/frequency/WEEKLY",
      label: "Weekly",
      chipLabel: "Weekly",
      match: ["weekly"],
    },
    {
      value: "http://publications.europa.eu/resource/authority/frequency/DAILY",
      label: "Daily",
      chipLabel: "Daily",
      match: ["daily"],
    },
    {
      value: "http://publications.europa.eu/resource/authority/frequency/IRREG",
      label: "Irregular",
      chipLabel: "Irregular",
      match: ["irreg", "irregular"],
    },
    {
      value: "http://publications.europa.eu/resource/authority/frequency/UNKNOWN",
      label: "Unknown",
      chipLabel: "Unknown",
      match: ["unknown"],
    },
  ],
  fileType: [
    {
      value: "text/csv",
      label: "CSV",
      chipLabel: "CSV",
      match: ["csv", "textcsv"],
    },
    {
      value: "application/json",
      label: "JSON",
      chipLabel: "JSON",
      match: ["json", "applicationjson"],
    },
    {
      value: "application/xml",
      label: "XML",
      chipLabel: "XML",
      match: ["xml", "applicationxml"],
    },
    {
      value: "application/zip",
      label: "ZIP",
      chipLabel: "ZIP",
      match: ["zip", "applicationzip"],
    },
    {
      value: "application/x-tar",
      label: "TAR",
      chipLabel: "TAR",
      match: ["tar", "xtar"],
    },
    {
      value: "application/pdf",
      label: "PDF",
      chipLabel: "PDF",
      match: ["pdf", "applicationpdf"],
    },
    {
      value: "application/parquet",
      label: "Parquet",
      chipLabel: "Parquet",
      match: ["parquet"],
    },
  ],
  theme: [
    {
      value: "http://publications.europa.eu/resource/authority/data-theme/AGRI",
      label: "Agriculture, fisheries, forestry and food",
      description: "AGRI",
      match: ["agri", "agriculture", "fisheries", "forestry", "food"],
    },
    {
      value: "http://publications.europa.eu/resource/authority/data-theme/ECON",
      label: "Economy and finance",
      description: "ECON",
      match: ["econ", "economy", "finance"],
    },
    {
      value: "http://publications.europa.eu/resource/authority/data-theme/EDUC",
      label: "Education, culture and sport",
      description: "EDUC",
      match: ["educ", "education", "culture", "sport"],
    },
    {
      value: "http://publications.europa.eu/resource/authority/data-theme/ENER",
      label: "Energy",
      description: "ENER",
      match: ["ener", "energy"],
    },
    {
      value: "http://publications.europa.eu/resource/authority/data-theme/ENVI",
      label: "Environment",
      description: "ENVI",
      match: ["envi", "environment", "nature"],
    },
    {
      value: "http://publications.europa.eu/resource/authority/data-theme/GOVE",
      label: "Government and public sector",
      description: "GOVE",
      match: ["gove", "government", "public", "sector"],
    },
    {
      value: "http://publications.europa.eu/resource/authority/data-theme/HEAL",
      label: "Health",
      description: "HEAL",
      match: ["heal", "health", "medical"],
    },
    {
      value: "http://publications.europa.eu/resource/authority/data-theme/INTR",
      label: "International issues",
      description: "INTR",
      match: ["intr", "international"],
    },
    {
      value: "http://publications.europa.eu/resource/authority/data-theme/JUST",
      label: "Justice, legal system and public safety",
      description: "JUST",
      match: ["just", "justice", "legal", "safety"],
    },
    {
      value: "http://publications.europa.eu/resource/authority/data-theme/REGI",
      label: "Regions and cities",
      description: "REGI",
      match: ["regi", "regions", "cities"],
    },
    {
      value: "http://publications.europa.eu/resource/authority/data-theme/SOCI",
      label: "Population and society",
      description: "SOCI",
      match: ["soci", "population", "society"],
    },
    {
      value: "http://publications.europa.eu/resource/authority/data-theme/TECH",
      label: "Science and technology",
      description: "TECH",
      match: ["tech", "science", "technology"],
    },
    {
      value: "http://publications.europa.eu/resource/authority/data-theme/TRAN",
      label: "Transport",
      description: "TRAN",
      match: ["tran", "transport"],
    },
  ],
};
