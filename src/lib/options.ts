export interface Option { value: string; label: string; }
export interface Country { key: string; name: string; geoId: string; }

export const JOB_TITLE_OPTIONS: Option[] = [
  "Data Engineer", "Data Scientist", "Data Analyst", "Analytics Engineer",
  "Machine Learning Engineer", "AI Engineer", "Business Intelligence Analyst",
  "Software Engineer", "Backend Developer", "Frontend Developer", "Full Stack Developer",
  "DevOps Engineer", "Cloud Engineer", "Platform Engineer", "Site Reliability Engineer",
  "Solutions Architect", "Cybersecurity Engineer", "Mobile Developer", "iOS Developer",
  "Android Developer", "Java Developer", "Python Developer", ".NET Developer",
  "Go Developer", "React Developer", "Node.js Developer", "Embedded Software Engineer",
  "QA Engineer", "Scrum Master", "Product Manager", "Product Owner", "UX Designer", "UI Designer",
].map((t) => ({ value: t, label: t }));

export const COUNTRIES: Country[] = [
  { key: "be", name: "Belgium",        geoId: "100565514" },
  { key: "nl", name: "Netherlands",    geoId: "102890719" },
  { key: "de", name: "Germany",        geoId: "101282230" },
  { key: "fr", name: "France",         geoId: "105015875" },
  { key: "gb", name: "United Kingdom", geoId: "101165590" },
  { key: "lu", name: "Luxembourg",     geoId: "100263768" },
  { key: "ch", name: "Switzerland",    geoId: "106693272" },
  { key: "at", name: "Austria",        geoId: "103883259" },
  { key: "ie", name: "Ireland",        geoId: "104738515" },
  { key: "pt", name: "Portugal",       geoId: "100364837" },
  { key: "dk", name: "Denmark",        geoId: "104514075" },
  { key: "se", name: "Sweden",         geoId: "105117694" },
  { key: "no", name: "Norway",         geoId: "103819153" },
  { key: "fi", name: "Finland",        geoId: "100456013" },
  { key: "es", name: "Spain",          geoId: "105646813" },
  { key: "it", name: "Italy",          geoId: "103350119" },
  { key: "gr", name: "Greece",         geoId: "104677530" },
  { key: "pl", name: "Poland",         geoId: "105072130" },
  { key: "cz", name: "Czech Republic", geoId: "104508036" },
  { key: "hu", name: "Hungary",        geoId: "100288700" },
  { key: "ro", name: "Romania",        geoId: "106670623" },
  { key: "ua", name: "Ukraine",        geoId: "102264497" },
  { key: "us", name: "United States",  geoId: "103644278" },
  { key: "ca", name: "Canada",         geoId: "101174742" },
];

export const COUNTRY_OPTIONS: Option[] = COUNTRIES.map((c) => ({ value: c.key, label: c.name }));
