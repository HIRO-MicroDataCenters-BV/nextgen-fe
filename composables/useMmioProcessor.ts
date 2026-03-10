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

    console.log('[MMIO DEBUG] parseTar: arrayBuffer size =', arrayBuffer.byteLength, 'bytes');

    while (offset < arrayBuffer.byteLength - 512) {
        const header = new Uint8Array(arrayBuffer, offset, 512);

        if (header[0] === 0) {
            console.log('[MMIO DEBUG] parseTar: end of archive marker at offset', offset);
            break;
        }

        const nameBytes = header.slice(0, 100);
        const name = new TextDecoder().decode(nameBytes).replace(/\0.*$/, '');

        const sizeBytes = header.slice(124, 136);
        const sizeStr = new TextDecoder().decode(sizeBytes).replace(/\0.*$/, '').trim();
        const size = parseInt(sizeStr, 8) || 0;

        const type = String.fromCharCode(header[156]);

        console.log(`[MMIO DEBUG] parseTar: entry name="${name}" type="${type}" size=${size} offset=${offset}`);

        offset += 512;

        if (type === '0' || type === '\0') {
            const fileBuffer = arrayBuffer.slice(offset, offset + size);
            const content = new TextDecoder().decode(fileBuffer);
            console.log(`[MMIO DEBUG] parseTar: file "${name}" content preview:`, content.substring(0, 200));
            files.push({ name, content, buffer: fileBuffer });
        } else {
            console.log(`[MMIO DEBUG] parseTar: skipping non-regular entry type="${type}"`);
        }

        offset += Math.ceil(size / 512) * 512;
    }

    console.log('[MMIO DEBUG] parseTar: total files found =', files.length, files.map(f => f.name));
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
    conformance?: 'M' | 'O';
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
        const extension = file.name.split('.').pop()?.toLowerCase();
        console.log('[MMIO DEBUG] processMmioFile: file =', file.name, 'size =', file.size, 'ext =', extension);

        if (extension === 'json') {
            return await processJsonMmio(file);
        } else if (extension === 'tar') {
            return await processTarMmio(file);
        }

        console.warn('[MMIO DEBUG] Unsupported MMIO file format:', extension);
        return null;
    };

    const processJsonMmio = async (file: File): Promise<MmioMetadata> => {
        console.log('[MMIO DEBUG] processJsonMmio:', file.name);
        const text = await file.text();
        const mmioData = JSON.parse(text) as MmioData;
        console.log('[MMIO DEBUG] processJsonMmio: parsed mmioData =', mmioData);

        // Single-entry extraMetadata matching the 123-namespace format
        return {
            mmio: mmioData,
            ocaAttributes: [],
            extraMetadata: [{
                '@type': 'dcat:Dataset',
                '@id': `http://oca.example.org/123/${mmioData.id}/0/0`,
                'http://oca.example.org/123/SAID': mmioData.id,
            }],
        };
    };

    const processTarMmio = async (file: File): Promise<MmioMetadata> => {
        console.log('[MMIO DEBUG] processTarMmio: START', file.name);
        const arrayBuffer = await file.arrayBuffer();
        console.log('[MMIO DEBUG] processTarMmio: arrayBuffer loaded, size =', arrayBuffer.byteLength);

        const files = parseTar(arrayBuffer);
        console.log('[MMIO DEBUG] processTarMmio: parsed files =', files.map(f => ({ name: f.name, size: f.content.length })));

        // Find mmio.json (case-insensitive)
        const mmioFile = files.find(
            (f) =>
                f.name.toLowerCase() === 'mmio.json' ||
                f.name.toLowerCase().endsWith('/mmio.json') ||
                f.name.toLowerCase().includes('mmio.json')
        );

        console.log('[MMIO DEBUG] processTarMmio: mmioFile found =', mmioFile?.name ?? 'NOT FOUND');

        if (!mmioFile) {
            console.error('[MMIO DEBUG] processTarMmio: MMIO.json not found! Available files:', files.map(f => f.name));
            throw new Error('MMIO.json not found in tar archive');
        }

        let mmioData: MmioData;
        try {
            mmioData = JSON.parse(mmioFile.content) as MmioData;
            console.log('[MMIO DEBUG] processTarMmio: mmioData =', JSON.stringify(mmioData, null, 2));
        } catch (e) {
            console.error('[MMIO DEBUG] processTarMmio: Failed to parse mmio.json:', e);
            throw e;
        }

        // Find bundle files — .bundles, .bundle, or any JSON-looking files that are not mmio.json
        const bundleFiles = files.filter(
            (f) =>
                f.name !== mmioFile.name &&
                (f.name.toLowerCase().endsWith('.bundles') ||
                    f.name.toLowerCase().endsWith('.bundle') ||
                    f.name.toLowerCase().includes('bundle'))
        );

        console.log('[MMIO DEBUG] processTarMmio: bundleFiles =', bundleFiles.map(f => f.name));

        // If no bundle files found by extension, try all non-mmio files
        const filesToCheck = bundleFiles.length > 0
            ? bundleFiles
            : files.filter(f => f.name !== mmioFile.name);

        console.log('[MMIO DEBUG] processTarMmio: filesToCheck =', filesToCheck.map(f => f.name));

        // Build a map of OCA bundles by their SAID (capture_base.digest)
        const bundlesBySaid = new Map<string, OcaBundleContent>();

        for (const bundleFile of filesToCheck) {
            console.log('[MMIO DEBUG] processTarMmio: parsing bundle file =', bundleFile.name);
            try {
                const data = JSON.parse(bundleFile.content);
                console.log('[MMIO DEBUG] processTarMmio: bundle file keys =', Object.keys(data));

                // Handle both { bundle: {...} } and direct bundle format
                const bundle: OcaBundleContent = data.bundle || data;
                console.log('[MMIO DEBUG] processTarMmio: bundle capture_base =', bundle.capture_base);
                console.log('[MMIO DEBUG] processTarMmio: bundle attributes =', bundle.capture_base?.attributes);

                const said = bundle.capture_base?.digest;
                console.log('[MMIO DEBUG] processTarMmio: bundle SAID =', said);

                if (said) {
                    bundlesBySaid.set(said, bundle);
                    console.log('[MMIO DEBUG] processTarMmio: registered bundle SAID =', said);
                } else {
                    console.warn('[MMIO DEBUG] processTarMmio: no digest found in bundle file =', bundleFile.name);
                }
            } catch (e) {
                console.warn('[MMIO DEBUG] processTarMmio: failed to parse bundle file:', bundleFile.name, e);
            }
        }

        console.log('[MMIO DEBUG] processTarMmio: bundlesBySaid keys =', Array.from(bundlesBySaid.keys()));
        console.log('[MMIO DEBUG] processTarMmio: mmio modalities =', mmioData.modalities.map(m => ({ id: m.id, oca_bundle_said: m.oca_bundle.value })));

        // Build extraMetadata array - one entry per modality
        // Namespace is always the fixed "123" base (matching existing dataset format)
        const extraMetadata: Array<Record<string, unknown>> = [];
        const baseNs = `http://oca.example.org/123`;

        for (let i = 0; i < mmioData.modalities.length; i++) {
            const modality = mmioData.modalities[i];
            const bundleSaid = modality.oca_bundle.value;
            // @id format: http://oca.example.org/123/{mmio_id}/{modality_index}/0
            const entryId = `${baseNs}/${mmioData.id}/${i}/0`;

            console.log(`[MMIO DEBUG] processTarMmio: modality[${i}] bundleSaid =`, bundleSaid);

            const entry: Record<string, unknown> = {
                '@type': 'dcat:Dataset',
                '@id': entryId,
                [`${baseNs}/SAID`]: bundleSaid,
            };

            const bundle = bundlesBySaid.get(bundleSaid);
            if (bundle) {
                const attributes = bundle.capture_base?.attributes || {};
                console.log(`[MMIO DEBUG] processTarMmio: modality[${i}] attributes count =`, Object.keys(attributes).length, Object.keys(attributes).slice(0, 5));

                for (const attrName of Object.keys(attributes)) {
                    entry[`${baseNs}/${attrName}`] = {
                        '@type': 'xsd:boolean',
                        '@value': true,
                    };
                }
            } else {
                console.warn(`[MMIO DEBUG] processTarMmio: modality[${i}] NO BUNDLE FOUND for SAID =`, bundleSaid);
                console.log('[MMIO DEBUG] processTarMmio: available SAIDs =', Array.from(bundlesBySaid.keys()));
            }

            extraMetadata.push(entry);
            console.log(`[MMIO DEBUG] processTarMmio: modality[${i}] entry keys =`, Object.keys(entry).length);
        }

        // Extract OCA attributes for reference
        const ocaAttributes: OcaAttribute[] = [];
        bundlesBySaid.forEach((bundle) => {
            const attributes = bundle.capture_base?.attributes || {};
            const conformance = bundle.overlays?.conformance?.attribute_conformance || {};
            const engLabels = (bundle.overlays?.label || []).find(l => l.language === 'eng' || l.language === 'en')?.attribute_labels || {};

            for (const [attrName, attrType] of Object.entries(attributes)) {
                ocaAttributes.push({
                    name: attrName,
                    type: String(attrType),
                    conformance: conformance[attrName] as 'M' | 'O' | undefined,
                    label: engLabels[attrName],
                });
            }
        });

        console.log('[MMIO DEBUG] processTarMmio: DONE. extraMetadata entries =', extraMetadata.length, 'ocaAttributes =', ocaAttributes.length);
        console.log('[MMIO DEBUG] processTarMmio: extraMetadata[0] keys =', extraMetadata[0] ? Object.keys(extraMetadata[0]).slice(0, 8) : 'none');

        return {
            mmio: mmioData,
            ocaAttributes,
            extraMetadata,
        };
    };

    /**
     * Process MMIO JSON file + separate OCA bundle file (two-file upload flow).
     * Combines them into the same extraMetadata as a TAR would produce.
     */
    const processTarFromFiles = async (mmioJsonFile: File, bundleFile: File): Promise<MmioMetadata> => {
        console.log('[MMIO DEBUG] processTarFromFiles:', mmioJsonFile.name, '+', bundleFile.name);

        const mmioText = await mmioJsonFile.text();
        const mmioData = JSON.parse(mmioText) as MmioData;

        const bundleBuffer = await bundleFile.arrayBuffer();
        try {
            // Try to parse as TAR first (it might be a .tar with bundles inside)
            const files = parseTar(bundleBuffer);
            if (files.length > 0) {
                // Reuse processTarMmio logic but inject mmioData
                return await _processWithMmioDataAndBundles(mmioData, files);
            }
        } catch {
            // Not a TAR, try as direct JSON bundle
        }

        // Fallback: treat as a single JSON bundle file
        const bundleContent = new TextDecoder().decode(bundleBuffer);
        const singleBundleFile = [{ name: bundleFile.name, content: bundleContent, buffer: bundleBuffer }];
        return await _processWithMmioDataAndBundles(mmioData, singleBundleFile);
    };

    const _processWithMmioDataAndBundles = async (
        mmioData: MmioData,
        bundleFiles: Array<{ name: string; content: string; buffer: ArrayBuffer }>
    ): Promise<MmioMetadata> => {
        const baseNs = `http://oca.example.org/123`;
        const bundlesBySaid = new Map<string, OcaBundleContent>();

        for (const bf of bundleFiles) {
            try {
                const data = JSON.parse(bf.content);
                const bundle: OcaBundleContent = data.bundle || data;
                const said = bundle.capture_base?.digest;
                if (said) bundlesBySaid.set(said, bundle);
            } catch { /* skip */ }
        }

        const extraMetadata: Array<Record<string, unknown>> = [];
        for (let i = 0; i < mmioData.modalities.length; i++) {
            const modality = mmioData.modalities[i];
            const bundleSaid = modality.oca_bundle.value;
            const entryId = `${baseNs}/${mmioData.id}/${i}/0`;
            const entry: Record<string, unknown> = {
                '@type': 'dcat:Dataset',
                '@id': entryId,
                [`${baseNs}/SAID`]: bundleSaid,
            };

            const bundle = bundlesBySaid.get(bundleSaid);
            if (bundle) {
                const attributes = bundle.capture_base?.attributes || {};
                for (const attrName of Object.keys(attributes)) {
                    entry[`${baseNs}/${attrName}`] = { '@type': 'xsd:boolean', '@value': true };
                }
            }
            extraMetadata.push(entry);
        }

        const ocaAttributes: OcaAttribute[] = [];
        bundlesBySaid.forEach((bundle) => {
            const attributes = bundle.capture_base?.attributes || {};
            const conformance = bundle.overlays?.conformance?.attribute_conformance || {};
            const engLabels = (bundle.overlays?.label || []).find(l => l.language === 'eng' || l.language === 'en')?.attribute_labels || {};
            for (const [attrName, attrType] of Object.entries(attributes)) {
                ocaAttributes.push({ name: attrName, type: String(attrType), conformance: conformance[attrName] as 'M' | 'O' | undefined, label: engLabels[attrName] });
            }
        });

        return { mmio: mmioData, ocaAttributes, extraMetadata };
    };

    return {
        processMmioFile,
        processJsonMmio,
        processTarMmio,
        processTarFromFiles,
    };
}
