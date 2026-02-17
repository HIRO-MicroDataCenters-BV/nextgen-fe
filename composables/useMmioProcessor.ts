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
    const view = new DataView(arrayBuffer);
    const files: TarFile[] = [];
    let offset = 0;

    while (offset < arrayBuffer.byteLength - 512) {
        // Read header (512 bytes)
        const header = new Uint8Array(arrayBuffer, offset, 512);

        // Check if this is end of archive (all zeros)
        if (header[0] === 0) break;

        // Read filename (100 bytes)
        const nameBytes = header.slice(0, 100);
        const name = new TextDecoder().decode(nameBytes).replace(/\0.*$/, '');

        // Read file size (12 bytes at offset 124, octal)
        const sizeBytes = header.slice(124, 136);
        const sizeStr = new TextDecoder().decode(sizeBytes).replace(/\0.*$/, '').trim();
        const size = parseInt(sizeStr, 8) || 0;

        // Read file type (1 byte at offset 156)
        const type = String.fromCharCode(header[156]);

        offset += 512; // Skip header

        // Read file content if it's a regular file
        if (type === '0' || type === '\0') {
            const fileBuffer = arrayBuffer.slice(offset, offset + size);
            const content = new TextDecoder().decode(fileBuffer);

            files.push({
                name,
                content,
                buffer: fileBuffer,
            });
        }

        // Move to next file (round up to 512 byte boundary)
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
    modalities: MmioModality[];
}

export interface OcaAttribute {
    name: string;
    type: string;
    conformance?: 'M' | 'O'; // Mandatory or Optional
    label?: string;
}

export interface MmioMetadata {
    mmio: MmioData | null;
    ocaAttributes: OcaAttribute[];
    extraMetadata: Record<string, unknown>;
}

/**
 * Composable for processing MMIO files (.json or .tar)
 */
export function useMmioProcessor() {
    /**
     * Main entry point - process MMIO file based on extension
     */
    const processMmioFile = async (file: File): Promise<MmioMetadata | null> => {
        const extension = file.name.split('.').pop()?.toLowerCase();

        if (extension === 'json') {
            return await processJsonMmio(file);
        } else if (extension === 'tar') {
            return await processTarMmio(file);
        }

        console.warn('Unsupported MMIO file format:', extension);
        return null;
    };

    /**
     * Process standalone MMIO.json file
     */
    const processJsonMmio = async (file: File): Promise<MmioMetadata> => {
        const text = await file.text();
        const mmioData = JSON.parse(text) as MmioData;

        return {
            mmio: mmioData,
            ocaAttributes: [],
            extraMetadata: buildExtraMetadata(mmioData),
        };
    };

    /**
     * Process .tar archive containing MMIO.json + OCA files
     */
    const processTarMmio = async (file: File): Promise<MmioMetadata> => {
        const arrayBuffer = await file.arrayBuffer();
        const files = parseTar(arrayBuffer);

        // Find MMIO.json
        const mmioFile = files.find(
            (f) =>
                f.name.toLowerCase().includes('mmio.json') ||
                f.name.toLowerCase().endsWith('mmio.json')
        );

        if (!mmioFile) {
            throw new Error('MMIO.json not found in tar archive');
        }

        const mmioData = JSON.parse(mmioFile.content) as MmioData;

        // Find OCA files (.oca extension)
        const ocaFiles = files.filter(
            (f) =>
                f.name.toLowerCase().endsWith('.oca') ||
                f.name.toLowerCase().includes('oca')
        );

        const ocaAttributes = parseOcaFiles(ocaFiles);

        return {
            mmio: mmioData,
            ocaAttributes,
            extraMetadata: buildExtraMetadata(mmioData, ocaAttributes),
        };
    };

    /**
     * Parse OCA schema files (.oca format)
     * Format example:
     * ADD ATTRIBUTE age=Numeric gender=Text
     * ADD CONFORMANCE ATTRS age=M gender=O
     * ADD LABEL en ATTRS age="Age (years)" gender="Gender"
     */
    const parseOcaFiles = (ocaFiles: TarFile[]): OcaAttribute[] => {
        const attributes: Map<string, OcaAttribute> = new Map();

        for (const file of ocaFiles) {
            const lines = file.content.split('\n');

            for (const line of lines) {
                const trimmed = line.trim();

                // Skip comments and empty lines
                if (trimmed.startsWith('#') || !trimmed) continue;

                // Parse ADD ATTRIBUTE lines
                if (trimmed.startsWith('ADD ATTRIBUTE')) {
                    const attrPart = trimmed.replace('ADD ATTRIBUTE', '').trim();
                    const attrPairs = attrPart.split(/\s+/);

                    for (const pair of attrPairs) {
                        const [name, type] = pair.split('=');
                        if (name && type) {
                            attributes.set(name, {
                                name,
                                type,
                            });
                        }
                    }
                }

                // Parse ADD CONFORMANCE lines
                if (trimmed.startsWith('ADD CONFORMANCE ATTRS')) {
                    const confPart = trimmed.replace('ADD CONFORMANCE ATTRS', '').trim();
                    const confPairs = confPart.split(/\s+/);

                    for (const pair of confPairs) {
                        const [name, conformance] = pair.split('=');
                        if (name && conformance && attributes.has(name)) {
                            const attr = attributes.get(name)!;
                            attr.conformance = conformance as 'M' | 'O';
                        }
                    }
                }

                // Parse ADD LABEL lines
                if (trimmed.startsWith('ADD LABEL')) {
                    const labelMatch = trimmed.match(/ADD LABEL\s+(\w+)\s+ATTRS\s+(.+)/);
                    if (labelMatch) {
                        const labelPart = labelMatch[2];
                        // Parse labels like: age="Age (years)" gender="Gender"
                        const labelRegex = /(\w+)="([^"]+)"/g;
                        let match;

                        while ((match = labelRegex.exec(labelPart)) !== null) {
                            const [, name, label] = match;
                            if (name && label && attributes.has(name)) {
                                const attr = attributes.get(name)!;
                                attr.label = label;
                            }
                        }
                    }
                }
            }
        }

        return Array.from(attributes.values());
    };

    /**
     * Build extraMetadata object from MMIO data
     */
    const buildExtraMetadata = (
        mmioData: MmioData,
        ocaAttributes: OcaAttribute[] = []
    ): Record<string, unknown> => {
        const metadata: Record<string, unknown> = {
            mmio_version: mmioData.version,
            mmio_id: mmioData.id,
            modality_count: mmioData.modalities.length,
            modalities: mmioData.modalities.map((m) => ({
                id: m.id,
                type: m.modality_type,
                media_type: m.media_type,
                oca_bundle_ref: m.oca_bundle.value,
            })),
        };

        if (ocaAttributes.length > 0) {
            metadata.oca_attributes = ocaAttributes.map((attr) => ({
                name: attr.name,
                type: attr.type,
                conformance: attr.conformance,
                label: attr.label,
            }));

            // Count mandatory vs optional
            const mandatory = ocaAttributes.filter((a) => a.conformance === 'M').length;
            const optional = ocaAttributes.filter((a) => a.conformance === 'O').length;

            metadata.oca_attribute_stats = {
                total: ocaAttributes.length,
                mandatory,
                optional,
                unspecified: ocaAttributes.length - mandatory - optional,
            };
        }

        return metadata;
    };

    return {
        processMmioFile,
        processJsonMmio,
        processTarMmio,
    };
}
