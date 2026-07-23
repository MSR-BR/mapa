const DIACRITICS = /[\u0300-\u036f]/g;

export function buildExportFilename(title: string, extension: "docx" | "pdf") {
  const slug = title
    .normalize("NFD")
    .replace(DIACRITICS, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || "mapa-da-pesquisa";

  return `${slug}.${extension}`;
}
