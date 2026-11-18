export type Dataset = {
  id: string;
  name: string;
  organization: string;
  category: string;
  status: "Public API adapter" | "Approval required" | "Reference only";
  description: string;
  variables: string;
  coverage: string;
  url: string;
  license: string;
};
export const datasets: Dataset[] = [
  {
    id: "forecast",
    name: "Global weather forecast",
    organization: "Open-Meteo",
    category: "Forecast",
    status: "Public API adapter",
    description:
      "The app’s primary public forecast adapter. Model output, not an official Indian warning.",
    variables:
      "Temperature, humidity, wind, pressure, precipitation, weather codes",
    coverage: "Global point forecast · seven days in this app",
    url: "https://open-meteo.com/en/docs",
    license:
      "Open-Meteo attribution; review API usage terms for production/commercial use.",
  },
  {
    id: "gfs",
    name: "NOAA GFS forecast",
    organization: "NOAA via Open-Meteo",
    category: "Forecast",
    status: "Public API adapter",
    description:
      "A separate model request for transparent comparison against the default forecast.",
    variables: "Hourly temperature, rain probability and wind speed",
    coverage: "Global GFS model output",
    url: "https://open-meteo.com/en/docs/gfs-api",
    license: "NOAA source data; Open-Meteo API terms and attribution apply.",
  },
  {
    id: "era5",
    name: "ERA5 historical reanalysis",
    organization: "Copernicus / ECMWF via Open-Meteo",
    category: "Climate",
    status: "Public API adapter",
    description:
      "Historical weather reconstructed from models and observations. Reanalysis is not a local station measurement.",
    variables: "Daily mean temperature and precipitation",
    coverage: "Global · sample year 2025",
    url: "https://open-meteo.com/en/docs/historical-weather-api",
    license:
      "Credit Copernicus/ECMWF and Open-Meteo; verify dataset and service terms.",
  },
  {
    id: "air-quality",
    name: "CAMS air-quality forecast",
    organization: "Copernicus CAMS via Open-Meteo",
    category: "Environment",
    status: "Public API adapter",
    description:
      "Modelled pollutant concentrations. Not a certified monitoring-station reading.",
    variables: "PM2.5, PM10 and European AQI",
    coverage: "Global modelled air quality",
    url: "https://open-meteo.com/en/docs/air-quality-api",
    license: "CAMS and Open-Meteo attribution and usage terms.",
  },
  {
    id: "marine",
    name: "Marine wave forecast",
    organization: "Open-Meteo marine service",
    category: "Marine",
    status: "Public API adapter",
    description:
      "Wave conditions for a coastal sample. Not a maritime operational clearance or official fishing warning.",
    variables: "Wave height, direction and period",
    coverage: "Ocean grid · sample near Mumbai coast",
    url: "https://open-meteo.com/en/docs/marine-weather-api",
    license: "Provider attribution and Open-Meteo API usage terms.",
  },
  {
    id: "nasa-power",
    name: "POWER meteorological data",
    organization: "NASA POWER",
    category: "Climate",
    status: "Public API adapter",
    description:
      "Agricultural meteorological parameters from a public scientific API.",
    variables:
      "Daily temperature, relative humidity, precipitation and solar radiation",
    coverage: "Global · sample January 2025",
    url: "https://power.larc.nasa.gov/docs/services/api/",
    license:
      "NASA POWER acknowledgement requested; retain original dataset metadata.",
  },
  {
    id: "imd",
    name: "Official warnings & nowcasts",
    organization: "India Meteorological Department",
    category: "Official alerts",
    status: "Approval required",
    description:
      "Priority authoritative integration. Access agreements and feed configuration must be completed before ingestion.",
    variables: "District warnings, nowcasts and forecast bulletins",
    coverage: "India · product-dependent",
    url: "https://mausam.imd.gov.in/",
    license:
      "Obtain authorized access and redistribution terms. No restricted scraping.",
  },
  {
    id: "ncmrwf",
    name: "Numerical model products",
    organization: "NCMRWF",
    category: "Forecast",
    status: "Approval required",
    description:
      "Planned Indian NWP integration with model run and resolution provenance.",
    variables: "Model-dependent atmospheric fields",
    coverage: "Product-dependent",
    url: "https://www.ncmrwf.gov.in/",
    license: "Confirm access and use conditions with the provider.",
  },
  {
    id: "mosdac",
    name: "Satellite meteorological products",
    organization: "ISRO / MOSDAC",
    category: "Satellite",
    status: "Approval required",
    description:
      "Planned satellite-product integration for rain and atmospheric context.",
    variables: "Satellite meteorology and oceanography products",
    coverage: "Mission- and product-dependent",
    url: "https://www.mosdac.gov.in/",
    license: "Product registration and licensing terms apply.",
  },
  {
    id: "gpm",
    name: "GPM IMERG precipitation",
    organization: "NASA",
    category: "Satellite",
    status: "Reference only",
    description:
      "Research precipitation reference; bulk ingestion is not included in this release.",
    variables: "Satellite-derived precipitation",
    coverage: "Product-dependent global coverage",
    url: "https://gpm.nasa.gov/data/imerg",
    license:
      "Earthdata access and product-specific attribution; verify before ingestion.",
  },
  {
    id: "incois",
    name: "Ocean & marine advisories",
    organization: "INCOIS",
    category: "Marine",
    status: "Approval required",
    description:
      "Authoritative Indian marine-advisory integration planned; do not substitute model waves for warnings.",
    variables: "Ocean state and advisory products",
    coverage: "Indian Ocean and Indian coastal services",
    url: "https://incois.gov.in/",
    license: "Confirm provider access and redistribution rights.",
  },
  {
    id: "cwc",
    name: "Flood forecasting information",
    organization: "Central Water Commission",
    category: "Official alerts",
    status: "Approval required",
    description:
      "Planned official flood-information integration; weather rainfall alone cannot establish river flood risk.",
    variables: "River-level and flood forecast information",
    coverage: "Supported Indian river stations",
    url: "https://cwc.gov.in/",
    license:
      "Authorized integration and relevant government data terms required.",
  },
  {
    id: "wis2",
    name: "WIS 2.0 discovery and notifications",
    organization: "World Meteorological Organization",
    category: "Infrastructure",
    status: "Reference only",
    description:
      "Future metadata discovery and event ingestion, with idempotent message processing.",
    variables: "Provider-published discovery metadata and notifications",
    coverage: "Participating providers",
    url: "https://community.wmo.int/en/activity-areas/wis/WIS2-overview",
    license: "Each discovered dataset retains its own access policy.",
  },
  {
    id: "bhashini",
    name: "Indian-language speech services",
    organization: "BHASHINI",
    category: "Language",
    status: "Approval required",
    description:
      "Future speech and translation integration. This release uses browser speech capabilities.",
    variables: "Language, speech recognition, synthesis and translation",
    coverage: "Service-specific language support",
    url: "https://bhashini.gov.in/",
    license: "Requires service credentials and applicable usage terms.",
  },
  {
    id: "osm",
    name: "OpenStreetMap basemap",
    organization: "OpenStreetMap contributors",
    category: "Geospatial",
    status: "Reference only",
    description:
      "Interactive map attribution is displayed in the map. Public tiles require considerate usage.",
    variables: "Geographic basemap",
    coverage: "Global community-maintained map",
    url: "https://www.openstreetmap.org/copyright",
    license: "ODbL data terms and tile-server usage policy.",
  },
];
