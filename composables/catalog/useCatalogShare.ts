interface UseCatalogShareOptions {
  shareDataset: (
    id: string,
    options?: { showToast?: boolean },
  ) => Promise<boolean>;
  unshareDataset: (
    id: string,
    options?: { showToast?: boolean },
  ) => Promise<boolean>;
}

/**
 * Share / unshare a dataset via the catalog service's dedicated endpoints
 * (`POST /datasets/{id}/share/` · `/unshare/`). These atomically flip the
 * dataset node's `dspace:isShared` flag server-side in a single call, without
 * re-saving the whole document — which would also reset `dcterms:issued`,
 * reassign the publisher and re-run SHACL validation.
 */
export const useCatalogShare = ({
  shareDataset,
  unshareDataset,
}: UseCatalogShareOptions) => {
  // The confirm dialog renders success/error itself, so suppress API toasts.
  const setDatasetShared = (id: string, shared: boolean): Promise<boolean> =>
    shared
      ? shareDataset(id, { showToast: false })
      : unshareDataset(id, { showToast: false });

  return { setDatasetShared };
};
