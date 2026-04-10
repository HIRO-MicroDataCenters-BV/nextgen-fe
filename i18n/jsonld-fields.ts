export const jsonldFieldsEn = {
    // ── IDENTIFICATION ───────────────────────────────────────────────────
    'dcterms:title': {
        label: 'Title',
        description: 'The name of the dataset — be clear and descriptive',
        placeholder: 'e.g., Cardiovascular Genomic Cohort 2024',
    },
    'dcterms:description': {
        label: 'Description',
        description: 'A clear, plain-language summary of what the dataset contains',
        placeholder: 'Describe the dataset, its content, and how it was collected',
    },
    'dcterms:identifier': {
        label: 'Identifier',
        description: 'A unique identifier for this dataset (e.g. an internal catalogue ID)',
        placeholder: 'e.g., clinical-gwas-cardiology-001',
    },
    'dcat:keyword': {
        label: 'Keywords',
        description: 'Keywords or tags that help researchers find this dataset',
        placeholder: 'e.g., genomics, cardiology',
    },
    'dcat:theme': {
        label: 'Theme / Category',
        description: 'The main thematic category of the dataset',
        placeholder: 'http://publications.europa.eu/resource/authority/data-theme/HEAL',
    },
    'dcterms:type': {
        label: 'Dataset Type',
        description: 'The nature or classification of the dataset',
    },
    'dcat:landingPage': {
        label: 'Landing Page',
        description: 'A webpage where users can learn more about and access the dataset',
        placeholder: 'https://example.com/dataset-info',
    },

    // ── PROVENANCE ───────────────────────────────────────────────────────
    'dcterms:publisher': {
        label: 'Publisher',
        description: 'The organisation responsible for making the dataset available',
    },
    'dcterms:creator': {
        label: 'Creator',
        description: 'The person or organisation that created or collected the dataset',
    },
    'dcterms:issued': {
        label: 'Release Date',
        description: 'The date the dataset was first published',
    },
    'dcterms:modified': {
        label: 'Last Updated',
        description: 'The date the dataset was most recently changed',
    },
    'dcat:version': {
        label: 'Version',
        description: 'Version number or name of this dataset',
        placeholder: 'e.g., 1.0.0',
    },
    'dcterms:accrualPeriodicity': {
        label: 'Update Frequency',
        description: 'How often the dataset is updated (e.g., annually, monthly)',
    },
    'dcat:inSeries': {
        label: 'Part of Series',
        description: 'The dataset series this dataset belongs to',
    },

    // ── COVERAGE ─────────────────────────────────────────────────────────
    'dcterms:spatial': {
        label: 'Geographical Coverage',
        description: 'The geographic region(s) covered by the data',
    },
    'dcterms:temporal': {
        label: 'Time Period Covered',
        description: 'The time range of the data (start and end dates)',
    },
    'dcat:startDate': {
        label: 'Start Date',
        description: 'Start of the time period covered',
        placeholder: '2024-01-01',
    },
    'dcat:endDate': {
        label: 'End Date',
        description: 'End of the time period covered',
        placeholder: '2024-12-31',
    },
    'dcterms:language': {
        label: 'Language',
        description: 'The language(s) in which the dataset content is available',
    },

    // ── ACCESS ───────────────────────────────────────────────────────────
    'dcterms:accessRights': {
        label: 'Access Rights',
        description: 'Who is allowed to access this dataset (Public / Restricted / Non-Public)',
    },
    'dcterms:license': {
        label: 'Licence',
        description: 'The licence that governs use of this dataset',
        placeholder: 'e.g., CC-BY-4.0, EUPL-1.2',
    },
    'dcat:contactPoint': {
        label: 'Contact Point',
        description: 'Who to contact for questions or requests about this dataset',
    },

    // ── DISTRIBUTION FIELDS ───────────────────────────────────────────────
    'dcat:distribution': {
        label: 'Distributions',
        description: 'Available formats and access points for this dataset',
    },
    'dcat:accessURL': {
        label: 'Access URL',
        description: 'The URL that gives access to this distribution',
        placeholder: 'https://example.com/data',
    },
    'dcat:downloadURL': {
        label: 'Download URL',
        description: 'A direct download link for this distribution',
        placeholder: 'https://example.com/data.csv',
    },
    'dcat:mediaType': {
        label: 'Media Type',
        description: 'The IANA media type of the file (e.g. text/csv)',
        placeholder: 'text/csv',
    },
    'dcat:format': {
        label: 'Format',
        description: 'The file format of this distribution',
        placeholder: 'e.g., CSV, JSON, DICOM',
    },
    'dcat:byteSize': {
        label: 'File Size',
        description: 'The size of the file in bytes',
    },
    'data:availability': {
        label: 'Availability',
        description: 'Planned availability of this distribution',
    },
    'spdx:checksum': {
        label: 'Checksum',
        description: 'A hash value for verifying the integrity of the downloaded file',
    },
    'spdx:checksumValue': {
        label: 'Checksum Value',
        description: 'The hexadecimal hash value',
    },
    'spdx:algorithm': {
        label: 'Hash Algorithm',
        description: 'The algorithm used (e.g., SHA-256)',
    },

    // ── CONTACT SUB-FIELDS ────────────────────────────────────────────────
    'vcard:fn': {
        label: 'Contact Name',
        description: 'Full name of the contact person or team',
        placeholder: 'e.g., Dr. Jane Smith or Data Access Office',
    },
    'vcard:hasEmail': {
        label: 'Email Address',
        description: 'Contact email address',
        placeholder: 'mailto:contact@example.com',
    },
    'vcard:hasTelephone': {
        label: 'Phone Number',
        description: 'Contact phone number',
        placeholder: 'tel:+31-20-555-0100',
    },
    'vcard:hasURL': {
        label: 'Website',
        description: 'Website or contact page URL',
        placeholder: 'https://example.com/contact',
    },

    // ── AGENT / PUBLISHER SUB-FIELDS ──────────────────────────────────────
    'foaf:name': {
        label: 'Name',
        description: 'Name of the person or organisation',
        placeholder: 'e.g., Amsterdam UMC',
    },
    'skos:prefLabel': {
        label: 'Label',
        description: 'A human-readable label',
    },

    // ── DSPACE ───────────────────────────────────────────────────────────
    'dspace:extraMetadata': {
        label: 'Extra Metadata',
        description: 'Additional semantic metadata from uploaded MMIO files (read-only)',
    },
    'dspace:region': {
        label: 'Region',
        description: 'Database region (managed automatically)',
    },
};
