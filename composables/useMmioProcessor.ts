interface TarFile {
  name: string;
  content: string;
  buffer: ArrayBuffer;
}

/**
 * Simple TAR file parser (SSR-compatible, no dependencies)
 * Supports basic POSIX tar format
 */
function parseTar(arrayBuffer: ArrayBuffer): TarFile[] {
  const files: TarFile[] = [];
  let offset = 0;

  while (offset < arrayBuffer.byteLength - 512) {
    const header = new Uint8Array(arrayBuffer, offset, 512);

    if (header[0] === 0) {
      break;
    }

    const nameBytes = header.slice(0, 100);
    const name = new TextDecoder().decode(nameBytes).replace(/\0.*$/, "");

    const sizeBytes = header.slice(124, 136);
    const sizeStr = new TextDecoder()
      .decode(sizeBytes)
      .replace(/\0.*$/, "")
      .trim();
    const size = parseInt(sizeStr, 8) || 0;

    const type = String.fromCharCode(header[156]);

    offset += 512;

    if (type === "0" || type === "\0") {
      const fileBuffer = arrayBuffer.slice(offset, offset + size);
      const content = new TextDecoder().decode(fileBuffer);
      files.push({ name, content, buffer: fileBuffer });
    }

    offset += Math.ceil(size / 512) * 512;
  }

  return files;
}

export interface MmioModality {
  id: string;
  modality_said: string;
  modality_type: string;
  media_type: string;
  oca_bundle: {
    type: string;
    value: string;
  };
}

export interface MmioData {
  version: string;
  id: string;
  /** May be absent in malformed files; always guard with `modalitiesList()`. */
  modalities?: MmioModality[];
}

function modalitiesList(data: MmioData): MmioModality[] {
  return Array.isArray(data.modalities) ? data.modalities : [];
}

export interface OcaAttribute {
  name: string;
  type: string;
  conformance?: "M" | "O";
  label?: string;
}

export interface MmioMetadata {
  mmio: MmioData | null;
  ocaAttributes: OcaAttribute[];
  extraMetadata: Record<string, unknown> | Array<Record<string, unknown>>;
}

interface OcaBundleOverlays {
  conformance?: {
    digest?: string;
    attribute_conformance?: Record<string, string>;
  };
  label?: Array<{
    digest?: string;
    language?: string;
    attribute_labels?: Record<string, string>;
  }>;
  meta?: Array<{
    language?: string;
    name?: string;
    description?: string;
  }>;
}

interface OcaBundleContent {
  capture_base?: {
    digest?: string;
    attributes?: Record<string, string>;
  };
  overlays?: OcaBundleOverlays;
  dependencies?: unknown[];
}

/**
 * Composable for processing MMIO files (.json or .tar)
 */
export function useMmioProcessor() {
  const processMmioFile = async (file: File): Promise<MmioMetadata | null> => {
    const extension = file.name.split(".").pop()?.toLowerCase();

    if (extension === "json") {
      return await processJsonMmio(file);
    }
    if (extension === "tar") {
      return await processTarMmio(file);
    }

    console.warn("[MMIO] Unsupported file format:", extension);
    return null;
  };

  const processJsonMmio = async (file: File): Promise<MmioMetadata> => {
    const text = await file.text();
    const mmioData = JSON.parse(text) as MmioData;

    return {
      mmio: mmioData,
      ocaAttributes: [],
      extraMetadata: [
        {
          "@type": "dcat:Dataset",
          "@id": `http://oca.example.org/123/${mmioData.id}/0/0`,
          "http://oca.example.org/123/SAID": mmioData.id,
        },
      ],
    };
  };

  const processTarMmio = async (file: File): Promise<MmioMetadata> => {
    const arrayBuffer = await file.arrayBuffer();
    const files = parseTar(arrayBuffer);

    const mmioFile = files.find(
      (f) =>
        f.name.toLowerCase() === "mmio.json" ||
        f.name.toLowerCase().endsWith("/mmio.json") ||
        f.name.toLowerCase().includes("mmio.json"),
    );

    if (!mmioFile) {
      console.error(
        "[MMIO] mmio.json not found in archive. Files:",
        files.map((f) => f.name),
      );
      throw new Error("MMIO.json not found in tar archive");
    }

    let mmioData: MmioData;
    try {
      mmioData = JSON.parse(mmioFile.content) as MmioData;
    } catch (e) {
      console.error("[MMIO] Failed to parse mmio.json:", e);
      throw e;
    }

    const bundleFiles = files.filter(
      (f) =>
        f.name !== mmioFile.name &&
        (f.name.toLowerCase().endsWith(".bundles") ||
          f.name.toLowerCase().endsWith(".bundle") ||
          f.name.toLowerCase().includes("bundle")),
    );

    const filesToCheck =
      bundleFiles.length > 0
        ? bundleFiles
        : files.filter((f) => f.name !== mmioFile.name);

    const bundlesBySaid = new Map<string, OcaBundleContent>();

    for (const bundleFile of filesToCheck) {
      try {
        const data = JSON.parse(bundleFile.content);
        const bundle: OcaBundleContent = data.bundle || data;
        const said = bundle.capture_base?.digest;

        if (said) {
          bundlesBySaid.set(said, bundle);
        } else {
          console.warn(
            "[MMIO] Bundle file has no capture_base.digest:",
            bundleFile.name,
          );
        }
      } catch (e) {
        console.warn("[MMIO] Failed to parse bundle file:", bundleFile.name, e);
      }
    }

    const modalities = modalitiesList(mmioData);
    if (modalities.length === 0) {
      console.warn(
        "[MMIO] mmio.json has no modalities[] — expected MMIO schema",
      );
    }

    const extraMetadata: Array<Record<string, unknown>> = [];
    const baseNs = `http://oca.example.org/123`;

    for (let i = 0; i < modalities.length; i++) {
      const modality = modalities[i];
      const bundleSaid = modality?.oca_bundle?.value ?? "";
      if (!bundleSaid) {
        console.warn(
          "[MMIO] Modality missing oca_bundle.value, index:",
          i,
        );
      }

      const entryId = `${baseNs}/${mmioData.id}/${i}/0`;

      const entry: Record<string, unknown> = {
        "@type": "dcat:Dataset",
        "@id": entryId,
        [`${baseNs}/SAID`]: bundleSaid,
      };

      const bundle = bundlesBySaid.get(bundleSaid);
      if (bundle) {
        const attributes = bundle.capture_base?.attributes || {};
        for (const attrName of Object.keys(attributes)) {
          entry[`${baseNs}/${attrName}`] = {
            "@type": "xsd:boolean",
            "@value": true,
          };
        }
      } else {
        console.warn(
          "[MMIO] No OCA bundle for modality SAID:",
          bundleSaid,
        );
      }

      extraMetadata.push(entry);
    }

    const ocaAttributes: OcaAttribute[] = [];
    bundlesBySaid.forEach((bundle) => {
      const attributes = bundle.capture_base?.attributes || {};
      const conformance =
        bundle.overlays?.conformance?.attribute_conformance || {};
      const engLabels =
        (bundle.overlays?.label || []).find(
          (l) => l.language === "eng" || l.language === "en",
        )?.attribute_labels || {};

      for (const [attrName, attrType] of Object.entries(attributes)) {
        ocaAttributes.push({
          name: attrName,
          type: String(attrType),
          conformance: conformance[attrName] as "M" | "O" | undefined,
          label: engLabels[attrName],
        });
      }
    });

    return {
      mmio: mmioData,
      ocaAttributes,
      extraMetadata,
    };
  };

  return {
    processMmioFile,
    processJsonMmio,
    processTarMmio,
  };
}
