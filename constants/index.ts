/** Client types from connector metadata (supported_interfaces) */
export const CLIENT_TYPES = {
    S3: 's3',
    FILE: 'file',
    REST: 'rest',
} as const;

export type ClientTypeKey = (typeof CLIENT_TYPES)[keyof typeof CLIENT_TYPES];

/** URL validation config per client type. Extend when adding new clients. */
export const CLIENT_URL_CONFIG: Record<
    string,
    {
        allowedProtocols: string[];
        urlPattern?: RegExp;
        protocolPrefix?: string;
        invalidFormatKey: string;
        wrongProtocolKey: string;
    }
> = {
    [CLIENT_TYPES.S3]: {
        allowedProtocols: ['s3:'],
        urlPattern: /^s3:\/\/[a-zA-Z0-9._-]+(\/.*)?$/,
        protocolPrefix: 's3://',
        invalidFormatKey: 'url_s3_invalid',
        wrongProtocolKey: 'url_s3_requires_s3',
    },
    [CLIENT_TYPES.FILE]: {
        allowedProtocols: ['file:'],
        urlPattern: /^file:\/\/.+/,
        protocolPrefix: 'file://',
        invalidFormatKey: 'url_file_invalid',
        wrongProtocolKey: 'url_file_requires_file',
    },
    [CLIENT_TYPES.REST]: {
        allowedProtocols: ['http:', 'https:'],
        invalidFormatKey: 'url_rest_requires_http',
        wrongProtocolKey: 'url_rest_requires_http',
    },
};

export const filters = [
  {
    key: "sociodemographic",
    label: "Sociodemographic",
    items: [
      {
        key: "simple",
        label: "Simple",
      },
      {
        key: "advanced",
        label: "Advanced",
      },
      {
        key: "all",
        label: "All",
      },
      {
        key: "none",
        label: "None",
      },
    ],
  },
  {
    key: "comorbidities",
    label: "Comorbidities",
    items: [
      {
        key: "red",
        label: "Red",
      },
      {
        key: "green",
        label: "Green",
      },
      {
        key: "blue",
        label: "Blue",
      },
    ],
  },
  {
    key: "measurements",
    label: "Measurements",
  },
  {
    key: "lifestyle",
    label: "Lifestyle",
  },
  {
    key: "clinicalData",
    label: "Clinical Data",
  },
  {
    key: "imagingData",
    label: "Imaging Data",
  },
  {
    key: "deviceData",
    label: "Device Data",
  },
  {
    key: "gwas",
    label: "GWAS",
  },
];

