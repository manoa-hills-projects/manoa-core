/**
 * Validations Handler - CedulaVE Logic adapted to TypeScript
 *
 * Primary source : api.vzlapi.com/actas  (data electoral pública venezolana)
 * Fallback source: scraping directo de CNE (cne.gov.ve)
 *
 * NOTE: In local Wrangler dev, outbound requests to Venezuelan domains may fail
 * if your ISP/DNS cannot resolve them. This works correctly when deployed to
 * Cloudflare Workers production whose network has full access.
 */

const VZLAPI_URL = "https://api.vzlapi.com/actas";
const CNE_URL = "http://www.cne.gov.ve/web/registro_electoral/ce.php";

export interface CedulaData {
  nac: string;
  dni: string;
  name: string;
  lastname: string;
  fullname: string;
  state: string;
  municipality: string;
  parish: string;
  voting: string;
  address: string;
}

export interface SuccessResponse {
  status: 200;
  data: CedulaData;
}

export interface ErrorResponse {
  status: number;
  message: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function clean(value: string): string {
  return value
    .replace(/\r/g, "")
    .replace(/\n/g, " ")
    .replace(/\t/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatterName(fullname: string): { name: string; lastname: string } {
  const parts = clean(fullname).split(" ").filter(Boolean);
  const count = parts.length;
  if (count <= 1) return { name: fullname, lastname: "" };
  if (count === 2) return { name: parts[0], lastname: parts[1] };
  if (count === 3) return { name: `${parts[0]} ${parts[1]}`, lastname: parts[2] };
  if (count === 4) return { name: `${parts[0]} ${parts[1]}`, lastname: `${parts[2]} ${parts[3]}` };
  const half = Math.round(count / 2);
  return { name: parts.slice(0, half).join(" "), lastname: parts.slice(half).join(" ") };
}

// ─── VZLApi Source ──────────────────────────────────────────────────────────

interface VzlapiResponse {
  Cedula?: string;
  StateName?: string;
  CountyName?: string;
  ParishName?: string;
  CenterName?: string;
  CenterAddress?: string;
  Error?: string;
}

async function queryVzlapi(nac: string, cedula: string): Promise<SuccessResponse | ErrorResponse> {
  const cedulaParam = `${nac}${cedula}`;
  const url = `${VZLAPI_URL}?cedula=${encodeURIComponent(cedulaParam)}`;

  let json: VzlapiResponse;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ManoacoreValidator/1.0)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      return { status: 503, message: `Servicio principal no disponible (HTTP ${res.status}). Intentando alternativa...` };
    }
    json = (await res.json()) as VzlapiResponse;
  } catch {
    return { status: 503, message: "No se pudo conectar al servicio principal." };
  }

  if (json.Error || !json.Cedula) {
    // vzlapi failed internally (e.g. its upstream CNE dependency is down)
    return { status: 502, message: json.Error ?? "Sin datos del servicio principal." };
  }

  const state = clean(json.StateName ?? "");
  const municipality = clean(json.CountyName ?? "");
  const parish = clean(json.ParishName ?? "");
  const voting = clean(json.CenterName ?? "");
  const address = clean(json.CenterAddress ?? "");

  // vzlapi only has location data, not names.
  // Try to fetch the name from CNE silently — if CNE is down, return partial data.
  const fullname = await queryNameFromCNE(nac, cedula);
  const { name, lastname } = fullname ? formatterName(fullname) : { name: "", lastname: "" };

  return {
    status: 200,
    data: { nac, dni: cedula, name, lastname, fullname: fullname ?? "", state, municipality, parish, voting, address },
  };
}

// ─── CNE Scraping (Fullname) ─────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

function existData(content: string): boolean {
  const hasRegistro = content.toUpperCase().includes("REGISTRO ELECTORAL");
  const hasAdvertencia = content.toUpperCase().includes("ADVERTENCIA");
  return hasRegistro && !hasAdvertencia;
}

function processAndCleanData(content: string): string[] {
  const text = clean(stripHtml(content));
  const keywords = ["Cédula:", "Nombre:", "Estado:", "Municipio:", "Parroquia:", "Centro:", "Dirección:", "SERVICIO ELECTORAL", "Registro ElectoralCorte"];
  let replaced = text;
  for (const kw of keywords) {
    replaced = replaced.replace(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "|");
  }
  return replaced.split("|").map((s) => clean(s)).filter((s) => s.length > 0);
}

async function queryNameFromCNE(nac: string, cedula: string): Promise<string | null> {
  try {
    const url = `${CNE_URL}?nacionalidad=${encodeURIComponent(nac)}&cedula=${encodeURIComponent(cedula)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ManoacoreValidator/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    if (!existData(html)) return null;
    const parts = processAndCleanData(html);
    return clean(parts[2] ?? "");
  } catch {
    return null;
  }
}

// ─── CNE Full Source (Fallback) ──────────────────────────────────────────────

async function queryCNE(nac: string, cedula: string): Promise<SuccessResponse | ErrorResponse> {
  try {
    const url = `${CNE_URL}?nacionalidad=${encodeURIComponent(nac)}&cedula=${encodeURIComponent(cedula)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ManoacoreValidator/1.0)", Accept: "text/html" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      return { status: 503, message: `El servicio del CNE tampoco está disponible (HTTP ${res.status}).` };
    }
    const html = await res.text();
    if (!existData(html)) {
      return { status: 404, message: `La cédula ${nac}-${cedula} no se encontró en el registro electoral del CNE.` };
    }
    const parts = processAndCleanData(html);
    if (parts.length < 7) {
      return { status: 500, message: "No se pudo parsear la respuesta del CNE." };
    }
    const fullname = clean(parts[2] ?? "");
    const { name, lastname } = formatterName(fullname);
    return {
      status: 200,
      data: {
        nac,
        dni: cedula,
        name,
        lastname,
        fullname,
        state: clean(parts[3] ?? ""),
        municipality: clean(parts[4] ?? ""),
        parish: clean(parts[5] ?? ""),
        voting: clean(parts[6] ?? ""),
        address: clean(parts[7] ?? ""),
      },
    };
  } catch {
    return {
      status: 503,
      message: "No se pudo conectar a ninguna fuente de consulta (vzlapi.com ni CNE). Esto puede ocurrir en entorno de desarrollo local si tu red no tiene acceso a dominios venezolanos. Prueba en producción.",
    };
  }
}

// ─── Main Entry ──────────────────────────────────────────────────────────────

export async function queryCedula(
  nac: string,
  cedula: string,
): Promise<SuccessResponse | ErrorResponse> {
  if (nac !== "V" && nac !== "E") {
    return { status: 301, message: "Nacionalidad inválida. Los valores permitidos son V o E." };
  }
  if (!cedula || cedula.trim() === "") {
    return { status: 302, message: "La cédula no puede estar vacía." };
  }
  if (!/^\d+$/.test(cedula)) {
    return { status: 303, message: "La cédula solo debe contener caracteres numéricos." };
  }

  // 1st: Try vzlapi.com (data pública electoral venezolana)
  const vzlapiResult = await queryVzlapi(nac, cedula);
  if (vzlapiResult.status === 200) return vzlapiResult;

  // 2nd: Fallback to CNE direct scraping
  return queryCNE(nac, cedula);
}
