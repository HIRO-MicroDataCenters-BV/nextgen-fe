import { jsonldFieldsEn } from './jsonld-fields';

export default defineI18nConfig(() => {
  return {
    legacy: false,
    locale: "en",
    messages: {
      en: {
        jsonld: {
          fields: jsonldFieldsEn,
          editor: {
            visual: 'Visual',
            code: 'Code',
            noMetadata: 'No metadata to display',
            addField: 'Add Field',
            validationErrors: 'Validation Errors:',
            serverErrors: 'Server Errors',
            readonly: 'Read-only',
            fromMmioReadonly: 'Loaded from MMIO file — read-only',
            categories: {
              identification: 'Identification',
              provenance: 'Provenance',
              coverage: 'Coverage',
              access: 'Access & Rights',
              distribution: 'Distributions',
              // Legacy (kept for backwards compatibility)
              basic: 'Basic Information',
              rights: 'Rights & Access',
              contact: 'Contact & Publisher',
              technical: 'Technical Details',
              other: 'Other Fields',
            },
            /** Short line under each category title in the visual editor */
            categorySubtitles: {
              identification: 'What is this dataset?',
              provenance: 'Who made it and when?',
              coverage: 'Where and when does the data apply?',
              access: 'Who can access it and under what terms?',
              distribution: 'Where and in what format is the data available?',
            },
            /** Badge next to section header — count of visible fields (not a form value) */
            sectionFieldCount: '{count} fields',
            sectionFieldCountTitle: '{count} fields in this section',
            compliance: {
              mandatory: 'Required',
              recommended: 'Recommended',
              optional: 'Optional',
              mandatoryTooltip: 'This field is required by DCAT-AP 3',
              recommendedTooltip: 'Strongly recommended for interoperability',
              optionalTooltip: 'Optional additional information',
            },
            addFieldDialog: {
              title: 'Add Metadata Field',
              description: 'Choose a metadata field to add to this dataset',
              searchPlaceholder: 'Search fields...',
              noFieldsAvailable: 'All available fields are already added',
              alreadyAdded: 'Already added',
              categories: {
                identification: 'Identification',
                provenance: 'Provenance',
                coverage: 'Coverage',
                access: 'Access & Rights',
                distribution: 'Distributions',
              },
              cancel: 'Cancel',
              confirm: 'Add Field',
            },
            addAnotherItem: 'Add another item',
            errors: 'errors',
            warnings: 'warnings',
            saving: 'Saving…',
            saved: 'Saved',
            searchPlaceholderVisual: 'Search fields…',
            searchPlaceholderCode: 'Search in code…',
            noRequiredFields: 'No required fields',
            allRequiredComplete: 'All required fields complete',
            ofRequiredFields: 'of {total} required fields complete',
            collapseField: 'Collapse',
            expandField: 'Expand',
            fieldHelp: 'About {field}',
            modeVisual: 'Visual',
            modeJson: 'JSON',
            modeToggleTitle: 'Switch between visual and JSON code view',
            bannerAllSet: 'All set!',
            bannerAllSetDesc: 'Your dataset meets DCAT-AP 3 requirements — every required field is complete.',
            bannerGettingStarted: 'Getting started?',
            bannerGettingStartedDesc: 'Fill in Title and Description first — they’re required for DCAT-AP compliance.',
            bannerDismiss: 'Dismiss',
            validation: {
              url_http_only: '{field} must be an http(s) URL',
              url_valid: '{field} must be a valid URL',
              url_s3_invalid: '{field} must be a valid S3 URL (e.g. s3://bucket/path)',
              url_file_invalid: '{field} must be a valid file URL (e.g. file://path/to/file)',
              url_rest_requires_http: '{field} must be an http(s) URL for REST API client',
              url_s3_requires_s3: '{field} must be an S3 URL (s3://bucket/path) for S3 client',
              url_file_requires_file: '{field} must be a file URL (file://path) for Local File Server',
              item_type_mismatch:
                'Dataset Type (dcterms:type) must match Item Type: use dcmitype:Dataset for Dataset, dcmitype:Software for Application',
            },
          },
        },
        app: {
          title: "NextGen",
          description:
            "Build ML models on institutional medical data at source. Accelerate research, advance treatment, change lives for the better.",
          copyright: "Copyright {year} © NextGen",
          error: {
            occurred: "An error occurred",
            unauthorized: "Unauthorized",
            timeout: "Request timeout",
            fetch: "An error occurred while fetching data",
          },
        },
        landing: {
          eyebrow: "Federated medical-data platform",
          headline: "Build ML models on institutional medical data at source.",
          subheadline:
            "Accelerate research, advance treatment, change lives for the better.",
          consortium: "In collaboration with leading academic medical centres",
          browse_tools: "Browse tools",
          built_by: "Built by",
        },
        login: {
          title: "Welcome back",
          subtitle: "Sign in to continue to NextGen",
          forgot: "Forgot password?",
          forgot_hint:
            "Password reset isn't available yet — please contact your administrator.",
          show_password: "Show password",
          hide_password: "Hide password",
          no_account: "Don't have an account?",
          contact_admin: "Contact your administrator",
          use_key: "Sign in with identity key",
          use_password: "Use email and password instead",
          session_expired: "Your session ended. Please sign in again.",
          key: {
            subtitle: "Sign in to continue to the Pathfinder platform",
            label: "Identity key file",
            privacy: "Read on this device only. Your key is never uploaded.",
            signing_in_as: "Signing in as",
            remove: "Remove key file",
            credential_label: "Credential",
            credential_privacy:
              "The grant.json your operator gave you. It's sent to sign you in; it holds no private key.",
            credential_remove: "Remove credential file",
            steps: {
              challenge: "Sign-in request received",
              sign: "Signed on this device",
              verify: "Checking your key and credential",
              session: "Starting your session",
            },
            errors: {
              invalid_key_file: {
                title: "This file isn't a key file",
                description:
                  "Choose the identity key file you were given, or ask your administrator.",
              },
              empty_key_file: {
                title: "This file is empty",
                description:
                  "Choose the identity key file you were given, or ask your administrator.",
              },
              key_file_too_large: {
                title: "This file is too large to be a key file",
                description:
                  "Key files are smaller than {maxSize}. Choose the identity key file you were given, or ask your administrator.",
              },
              key_replaced: {
                title: "This key has been replaced",
                description:
                  "A newer key has replaced this one. Export your key file again after rotating, or ask your administrator.",
              },
              invalid_credential_file: {
                title: "This file isn't a credential",
                description:
                  "Choose the grant.json your operator gave you.",
              },
              credential_mismatch: {
                title: "This credential belongs to someone else",
                description:
                  "It was issued to another identity than your key file's. Choose your own credential.",
              },
              identity_not_found: {
                title: "This identity isn't registered",
                description:
                  "The site's witness doesn't know this identity. Ask your administrator.",
              },
              witnesses_unavailable: {
                title: "Couldn't check your key right now",
                description:
                  "The services that confirm keys didn't respond. This is usually temporary — try again in a moment.",
              },
              not_available: {
                title: "Sign-in isn't available right now",
                description:
                  "The sign-in service didn't respond. Try again in a moment.",
              },
              unknown: {
                title: "Something went wrong",
                description:
                  "Your key wasn't accepted. Try again, or ask your administrator.",
              },
              credential_rejected: {
                title: "Your credential wasn't accepted",
                description: "It may have been revoked. Ask your operator for a new one.",
              },
            },
          },
        },
        status: {
          loading_data: "Loading data...",
          item_not_found: "Item not found",
        },
        title: {
          marketplace: "Marketplace",
          tools: "Tools",
          my_catalog: "My Catalog",
          settings: "Settings",
          home: "Login",
          create: "Create",
          edit: "Edit",
          actions: "Actions",
          are_you_sure: "Are you sure?",
          done: "Done",
          create_catalog_item: "Add new item",
          edit_catalog_item: "Edit item",
          unsaved_changes: "Unsaved Changes",
        },
        welcome: "Welcome",
        nextgen: "NextGen",
        general: {
          project_name: "NextGen UI",
        },
        subtitle: {
          marketplace: "Decentralised search across all institutional catalogs",
          tools:
            "Browse tools developed across the NextGen consortium. Federated tools can be deployed on the Pathfinder platform.",
          data_products: "Data Products",
          admin: "Admin",
          available_biobanks: "Available Biobanks",
          my_catalog: "Private metadata catalog",
          new_metadata_details: "New metadata details.",
          change_metadata_details: "Change metadata details.",
          marketplace_description:
            "Decentralised search across all institutional catalogs",
          short_description: "Genomic Data for Personalised Medicine.",
          create_catalog_item_desc:
            "Provide data and files for a dataset or an application.",
          edit_catalog_item_desc:
            "Update dataset metadata or upload a new MMIO file.",
        },
        text: {
          available_biobank_description:
            "Currently available institutional data products from our partners.",
        },
        alert: {
          delete_dataset: "Are you sure you want to delete {name}?",
          share_dataset:
            "Are you sure you want to share {name} with the marketplace?",
          unshare_dataset:
            "Are you sure you want to remove {name} from the marketplace?",
          delete_dataset_success: "Deleted successfully.",
          share_dataset_success: "Shared with the marketplace successfully.",
          unshare_dataset_success: "Removed from the marketplace successfully.",
          processing: "Processing your request…",
          action_failed: "Something went wrong. Please try again.",
          unsaved_changes_description:
            "You have unsaved changes. Are you sure you want to discard them?",
        },
        menu: {
          home: "Home",
          marketplace: "Marketplace",
          tools: "Tools",
          my_catalog: "My Catalog",
          credentials: "Credentials",
          settings: "Settings",
          help: "Help",
          guest_user: "Guest",
          logout: "Logout",
          theme: "Theme",
          light_mode: "Light mode",
          dark_mode: "Dark mode",
          hus_catalog: "My Catalog",
          ki_catalog: "My Catalog",
          umcu_catalog: "My Catalog",
          uva_catalog: "My Catalog",
          tum_catalog: "My Catalog",
        },
        sidebar: {
          home: "Home",
          marketplace: "Marketplace",
        },
        breadcrumb: {
          marketplace: "Marketplace",
          tools: "Tools",
          my_catalog: "My Catalog",
          create: "Create",
        },
        tools: {
          search_placeholder: "Search tools…",
          all_categories: "All categories",
          all_types: "All types",
          empty_title: "No tools found",
          empty_hint: "Try adjusting your search or filters.",
          action: {
            view: "View",
          },
          link: {
            pathfinder: "Deploy on Pathfinder",
            doi: "View DOI",
          },
          type: {
            federated: "Federated",
            library: "Library",
            utility: "Utility",
          },
        },
        filter: {
          distribution: "Distribution",
          distribution_csv: "CSV",
          distribution_mmio: "MMIO",
          distribution_dicom: "DICOM",
          distribution_nifti: "NIfTI",
          distribution_xml: "XML",
          distribution_vcf: "VCF",
          distribution_plink: "PLINK",
          "distribution_jpg/png": "JPG/PNG",
          is_deleted: "Is Deleted",
          is_shared: "Is Shared",
          catalog: "Catalog",
          status: "Status",
          isDeleted: "Is Deleted",
          isShared: "Is Shared",
          hasAge: "Has Age",
          hasSex: "Has Sex",
          hasHeight: "Has Height",
          hasMedicalConditions: "Has Medical Conditions",
          hasMetadata: "Has Metadata",
          hasDistribution: "Has Distribution",
          hasSeries: "Has Series",
          sociodemographics: "Sociodemographics",
          comorbidities: "Comorbidities",
          physical_measurements: "Physical Measurements",
          lifestyle_habits: "Lifestyle Habits",
          "med:age": "Age",
          "med:gender": "Gender",
          "med:ethnicity": "Ethnicity",
          "med:previous_myocardial_infarction":
            "Previous Myocardial Infarction",
          "med:stroke": "Stroke",
          "med:chronic_obstructive_pulmonary_disease":
            "Chronic Obstructive Pulmonary Disease",
          "med:atrial_fibrillation": "Atrial Fibrillation",
          "med:peripheral_artery_disease": "Peripheral Artery Disease",
          "med:hypertension": "Hypertension",
          "med:diabetes": "Diabetes",
          "med:hypercholesterolemia": "Hypercholesterolemia",
          "med:chronic_kidney_disease": "Chronic Kidney Disease",
          "med:height": "Height",
          "med:waist_hip_ratio": "Waist-Hip Ratio",
          "med:waist_height_ratio": "Waist-Height Ratio",
          "med:sbp": "Systolic Blood Pressure",
          "med:sex": "Sex",
          "med:asthma": "Asthma",
          "med:smoking_history": "Smoking History",
          "med:pulse_rate": "Pulse Rate",
          filter_types: {
            checkbox: "Yes/No",
            select: "Select",
            number: "Number",
            text: "Text",
          },
        },
        filters: {
          sociodemographics: "Sociodemographics",
          age: "Age",
          gender: "Gender",
          ethnicity: "Ethnicity",
          sex: "Sex",
          comorbidities: "Comorbidities",
          previous_myocardial_infarction: "Previous Myocardial Infarction",
          stroke: "Stroke",
          chronic_obstructive_pulmonary_disease:
            "Chronic Obstructive Pulmonary Disease",
          atrial_fibrillation: "Atrial Fibrillation",
          peripheral_artery_disease: "Peripheral Artery Disease",
          hypertension: "Hypertension",
          diabetes: "Diabetes",
          hypercholesterolemia: "Hypercholesterolemia",
          chronic_kidney_disease: "Chronic Kidney Disease",
          asthma: "Asthma",
          physical_measurements: "Physical Measurements",
          height: "Height",
          waist_hip_ratio: "Waist-Hip Ratio",
          waist_height_ratio: "Waist-Height Ratio",
          sbp: "Systolic Blood Pressure",
          pulse_rate: "Pulse Rate",
          lifestyle_habits: "Lifestyle Habits",
          smoking_history: "Smoking History",
          distribution: "Distribution",
          distribution_csv: "CSV",
          distribution_dicom: "DICOM",
          distribution_mmio: "MMIO",
          distribution_nifti: "NIfTI",
          "distribution_jpg/png": "JPG/PNG",
          distribution_xml: "XML",
          distribution_vcf: "VCF",
          distribution_plink: "PLINK",
          catalog: "Catalog",
          is_shared: "Is Shared",
          isShared: "Is Shared",
          "med:age": "Age",
          "med:gender": "Gender",
          "med:ethnicity": "Ethnicity",
          "med:sex": "Sex",
          "med:previous_myocardial_infarction":
            "Previous Myocardial Infarction",
          "med:stroke": "Stroke",
          "med:chronic_obstructive_pulmonary_disease":
            "Chronic Obstructive Pulmonary Disease",
          "med:atrial_fibrillation": "Atrial Fibrillation",
          "med:peripheral_artery_disease": "Peripheral Artery Disease",
          "med:hypertension": "Hypertension",
          "med:diabetes": "Diabetes",
          "med:hypercholesterolemia": "Hypercholesterolemia",
          "med:chronic_kidney_disease": "Chronic Kidney Disease",
          "med:asthma": "Asthma",
          "med:height": "Height",
          "med:waist_hip_ratio": "Waist-Hip Ratio",
          "med:waist_height_ratio": "Waist-Height Ratio",
          "med:sbp": "Systolic Blood Pressure",
          "med:pulse_rate": "Pulse Rate",
          "med:smoking_history": "Smoking History",
        },
        column: {
          name: "Name",
          biobank: "Biobank",
          description: "Description",
          last_update: "Last Update",
          id: "ID",
          actions: "Actions",
          license: "License",
          publisher: "Publisher",
          issued: "Issued",
        },
        fieldset: {
          basic_information: "Basic Information",
          classification: "Classification",
          license_access_control: "License & Access Control",
          distribution: "Distribution",
          series_information: "Series Information",
          metadata_configuration: "Metadata Configuration",
          domain_specific_attributes: "Domain-Specific Attributes",
        },
        label: {
          name: "Name",
          item_type: "Item Type",
          related_data_product: "Related Data Product",
          file: "File",
          mmio_data_file: "MMIO file",
          metadata_content: "Metadata Content",
          dataset: "Dataset",
          application: "Application",
          filters: "Filters",
          theme: "Theme",
          creator: "Creator",
          license: "License",
          issued: "Issued",
          last_update: "Last Update",
          data_product_name: "Data Product Name",
          description: "Description",
          biobank: "Biobank",
          actions: "Actions",
          issued_date: "Issued Date",
          email: "Email",
          password: "Password",
          last_updated: "Last Updated",
          title: "Title",
          publisher: "Publisher",
          dataset_identifier: "Dataset Identifier",
          dataset_id: "Dataset ID",
          keywords: "Keywords",
          themes: "Themes",
          distribution_description: "Distribution Description",
          media_type: "Media Type",
          file_size: "File Size",
          unit_label: "Unit Label",
          availability: "Availability",
          checksum_algorithm: "Checksum Algorithm",
          checksum_value: "Checksum Value",
          access_url: "Access URL",
          distribution_service_id: "Distribution Service ID",
          distribution_service_title: "Distribution Service Title",
          distribution_endpoint_url: "Distribution Endpoint URL",
          series_reference: "Series Reference",
          metadata_filename: "Metadata Filename",
          extra_metadata_schema: "Extra Metadata Schema",
          has_age: "Has Age",
          has_sex: "Has Sex",
          has_height: "Has Height",
          has_medical_conditions: "Has (Medical Conditions)",
          mmio_json_desc: "MMIO schema only",
          mmio_tar_desc: "MMIO + OCA bundle",
          or: "or",
          or_drag_drop: "or drop",
          uploaded: "Uploaded",
          optional: "optional",
        },
        action: {
          proceed: "Proceed",
          datasets: "Datasets",
          applications: "Applications",
          save: "Save",
          edit_dataset: "Edit",
          delete_dataset: "Delete",
          share_dataset: "Share",
          unshare_dataset: "Unshare",
          contacts: "Contacts",
          github: "GitHub",
          add_dataset: "Add Dataset",
          previous: "Previous",
          next: "Next",
          clear_filters: "Clear all",
          available_biobanks: "Available Biobanks",
          create: "Create",
          edit: "Edit",
          delete: "Delete",
          cancel: "Cancel",
          try_again: "Try again",
          please_wait: "Please wait…",
          update: "Update",
          save_changes: "Save Changes",
          discard: "Discard",
          click_to_browse: "Click to browse",
          create_new: "Create New",
          login: "Login",
          filter: "Filter",
          update_file: "Update File",
          view: "View",
          upload_file: "Upload File",
          back_to_catalog: "Back to Catalog",
          back_to_marketplace: "Back to Marketplace",
          for_researchers: "For Researchers",
          for_data_providers: "For Data Providers",
          items_selected: "Items selected",
          clear_all: "Clear all",
          pass_to_training: "Pass to Training",
          add_new_item: "Add New Item",
          open: "Open",
          table_view: "Table view",
          card_view: "Card view",
          select_item: "Select {name}",
        },
        placeholder: {
          enter_name: "Enter a name",
          select_data_product_directory: "Select a data product directory",
          select_data_product: "Select a data product",
          select_file: "Select a file",
          search: "Search {type}...",
          search_filters: "Search filters...",
          select_filter: "Select filter",
          select_license: "Select license",
          pick_date: "Pick a date",
          data_product_name: "Enter a data product name",
          name_from_metadata:
            "Same as Title in Metadata Content (dcterms:title)",
          creator: "Enter a creator name",
          email: "Enter your email",
          password: "Enter your password",
          enter_metadata_content: "Enter metadata content",
          loading: "Loading...",
          select_option: "Select an option",
        },
        hint: {
          uploading: "Uploading...",
          upload_mmio_first: "Upload MMIO file first",
          tar_contains_bundle: ".tar already contains both MMIO and OCA bundle",
          tar_mmio_archive:
            ".tar should contain mmio.json and OCA bundle files",
          accepted_file_types_json_jar:
            "Single MMIO descriptor: unarchived .json or .tar archive",
          your: "Your",
          in: "In",
          all: "All",
          no_results: "No results found",
          no_results_hint: "Try adjusting your search or filters.",
          shared: "Shared",
          no_datasets_found: "No datasets found",
          of: "of",
          rows_selected: "row(s) selected",
          page: "Page",
          showing: "Showing",
          to: "to",
          data_products: "data products",
          out_of: "out of",
          no_found: "No found",
          quarter: "Q{quarter}, {year}",
          try_changing_search_query_or_filters:
            "Try changing search query or filters, filters is required",
          open_menu: "Open menu",
          related_data_product_required:
            "Related Data Product is required to submit this request.",
          related_data_product_no_options:
            "No related data products available. Please create one before proceeding.",
        },
        credentials: {
          operators_only: {
            title: "For site admins and operators only",
            description:
              "Issuing credentials needs the site admin or operator role. Sign in with such a credential.",
          },
          title: "Credentials",
          subtitle:
            "Issue verifiable credentials (ACDC) from this site's DKMS issuer.",
          hub: {
            label: "Signed by:",
            site_issuer: "{site} issuer",
            explain:
              "Every credential here is signed with this identity. ds-login only accepts credentials from it.",
            retry: "Retry",
            aid_copied: "Issuer AID copied",
            service: {
              checking: "Checking…",
              online: "Online",
              offline: "Offline",
            },
            witness: {
              checking: "Checking witness…",
              published: "Key published on witness",
              missing: "Key not on any witness",
              unknown: "Witness not reachable",
              hint: "Verifiers look up the issuer's key at a DKMS witness.",
            },
            login: {
              ok: "Logins can verify",
              warn: "Logins can't verify yet",
              idle: "Login check pending",
              hint: "ds-login checks each credential's signature with the issuer's published key.",
            },
            explain_missing:
              "Credentials are signed, but no witness has this issuer's key, so ds-login rejects them at login. The issuer needs to be incepted with witnesses.",
            explain_unknown:
              "The witness didn't answer, so it's unclear whether logins can verify these credentials.",
          },
          issue_button: "Issue credential",
          issued: {
            search: "Search name, email, AID, role or institute",
            filter_label: "Show credentials",
            filter: {
              all: "All",
              valid: "Valid",
              revoked: "Revoked",
            },
            col_holder: "Holder",
            col_status: "Status",
            state: {
              checking: "Checking…",
              valid: "Valid",
              revoked: "Revoked",
              unknown: "Status unknown",
            },
            revoke: "Revoke",
            no_match: "No credentials match.",
            none: "No credentials issued from this browser yet.",
            local_note:
              "The list is kept in this browser; the status comes from the issuer.",
          },
          revoke: {
            title: "Revoke this credential?",
            description:
              "{name} can no longer sign in as {role} with it. This can't be undone; issue a new credential to give the role back.",
            reason: "Reason (optional)",
            reason_placeholder: "Left the project",
            cancel: "Cancel",
            confirm: "Revoke",
            done: "Credential revoked",
          },
          roles: {
            researcher: {
              label: "Researcher",
              hint: "Finds and uses data",
            },
            data_provider: {
              label: "Data provider",
              hint: "Publishes datasets in this site's catalog",
            },
            operator: {
              label: "Operator",
              hint: "Issues and revokes researcher and data provider credentials",
            },
            site_admin: {
              label: "Site admin",
              hint: "Runs this site; may do everything",
            },
          },
          form: {
            title: "Issue a credential",
            description:
              "States a role for an identity, signed by this site's issuer.",
            section_who: "Who",
            section_what: "What it says",
            section_advanced: "Advanced",
            subject_aid: "Subject AID",
            aid_placeholder: "Paste the holder's AID (44 characters)",
            subject_aid_hint:
              "The holder's KERI identity, from their wallet.",
            schema_said: "Schema SAID",
            schema_said_hint:
              "Which kind of credential this is. The issuer does not check it yet.",
            role: "Role",
            invalid_role: "You may not issue this role.",
            name: "Name",
            email: "Email",
            institute: "Institute",
            submit: "Issue credential",
            new: "Issue another",
            required_note: "Required",
            invalid_identifier:
              "Must be a KERI identifier: 44 characters of A–Z, a–z, 0–9, - or _",
          },
          preview: {
            label: "Preview",
            issued_label: "Issued credential",
            kind: "Verifiable credential · ACDC",
            at: "at",
            for: "for",
            holder: "Holder",
            sealed_by: "Sealed by {issuer}",
            seal_pending: "The seal appears when {issuer} signs.",
            draft: "Draft",
            signed: "Signed",
            org_missing: "Organisation not set",
            hint: "Fills in as you type. Nothing is signed until you issue it.",
          },
          result: {
            issued_to: "Issued to",
            issued_by: "Issued by",
            issued_at: "Issued at",
            grant_json: "Show grant JSON",
            copy: "Copy grant",
            copied: "Grant copied to the clipboard",
            said_copied: "SAID copied",
            download: "Download",
            toast: "Credential issued",
          },
        },
        common: {
          remove: "Remove",
        },
        validation: {
          required: "This field is required",
          email: "This field must be a valid email address",
          password: "This field must be at least 8 characters long",
          confirm_password: "This field must match the password",
          required_min_length:
            "This field must be at least {min} characters long",
          required_max_length:
            "This field must be at most {max} characters long",
          required_date: "This field must be a valid date",
          related_data_product_required:
            "Related Data Product is required to submit this request.",
          catalog_save_missing_filename:
            "Could not resolve the data file name. Re-select your JSON or TAR file and try again.",
        },
        training: {
          success_title: "Continue with training",
          success_description:
            "You will be redirected to the training builder to build the training pipelines with the selected datasets.",
        },
        home: {
          contacts: {
            linkedin: "NextGen LinkedIn",
            youtube: "NextGen YouTube",
            twitter: "NextGen X (Twitter)",
          },
          roadmap: {
            item: [
              {
                description: "Workshop on legal and privacy concerns",
              },
              {
                description:
                  "Data and governance landscape mapped. Project organisation and guidelines, definitions and planning, initial specifications",
              },
              {
                description: "Blueprint for annotation methods",
              },
              {
                description:
                  "Initial development of genomics analytical tools, Pathfinder development, Initial exploration of ethical issues, drivers and barriers",
              },
              {
                description:
                  "Overview of regulatory and legal concerns for all tools",
              },
              {
                description:
                  "NextGen platform specification (blueprint), vs genomic analysis tools, privacy assessment.",
              },
              {
                description: "Synthetic data approach",
              },
              {
                description: "Health economics questionnaire finalize",
              },
              {
                description: "NextGen platform prototype available",
              },
              {
                description:
                  "NextGen prototype ready for pilot preparation, data sets, next steps ethics, barriers and drivers, dissemination and communication fully deployed",
              },
              {
                description:
                  "Identify main concerns for drivers, barriers and Cost-Benefit Analysis",
              },
              {
                description: "NextGen platform sandbox available to consortium",
              },
              {
                description: "Health economics data collection complete",
              },
              {
                description:
                  "Pilot deployment, first assessments of multimodal workflows including genomics, federated AI/ML data analytic platform,pathfinder operational for piloting.",
              },
              {
                description:
                  "Full assessment of pilots, final update tools and methods, clinical validation, pathfinder finalisations.",
              },
              {
                description:
                  "Project finalisation, final delivery platform, full legal and ethical compliance, sustainability plan based on drivers, barriers, cost-benefit analysis",
              },
            ],
            title: "Roadmap",
            subtitle: "NextGen Milestones",
          },
          card: [
            {
              title: "Hidden Data Products",
              description:
                "Discover previously inaccessible datasets across institutions through our decentralized search.",
            },
            {
              title: "Full Compliance",
              description:
                "Access sensitive data while maintaining full compliance with patient privacy laws.",
            },
            {
              title: "Better Models",
              description:
                "Train ML models on diverse, multi-institutional data without extraction or duplication.",
            },
            {
              title: "Share Value, not Data",
              description:
                "Make your datasets discoverable while keeping them secure and at your grounds.",
            },
            {
              title: "Total Access Control",
              description:
                "Define exactly who can use your data and how through enforced policies.",
            },
            {
              title: "Full Transparency",
              description:
                "Track every interaction with your data through immutable usage logs.",
            },
          ],
          footer: {
            title: "Real-World Impact",
            subtitle: "Cardiovascular Research Network",
            description:
              "A multi-institution team used NextGen to build predictive models across hospitals without transferring sensitive patient data. Their federated learning approach incorporated genetic markers, imaging data, and clinical records while maintaining complete regulatory compliance.",
            result:
              "Result: accelerated research timeline while ensuring data sovereignty and regulatory compliance.",
          },
        },
        client_selector: {
          label: "Client",
          placeholder: "Select a client",
          interfaces: {
            s3: "S3",
            file: "Local File Server",
            rest: "REST API",
          },
          status: {
            checking: "Checking connection...",
            valid: "Client is reachable",
            error: "Client unreachable",
          },
          error_description:
            "The selected client is not reachable. Please check the service configuration or try a different client.",
        },
        zodI18n: {
          types: {
            string: "Expected string",
            null: "Expected null",
            object: "Expected object",
          },
          errors: {
            required: "This field is required",
            email: "This field must be a valid email address",
            password: "This field must be at least 8 characters long",
            confirm_password: "This field must match the password",
            required_min_length:
              "This field must be at least {min} characters long",
            too_small: {
              string: {
                inclusive: "This field is required",
              },
            },
            invalid_string: {
              email: "This field must be a valid email address",
            },
            invalid_type: "Invalid type received",
            invalid_type_received_undefined: "Invalid type received",
            invalid_type_received_null: "Invalid type received",
            invalid_type_received_number: "Invalid type received",
            invalid_type_received_string: "Invalid type received",
            invalid_type_received_boolean: "Invalid type received",
            invalid_type_received_object: "Invalid type received",
            invalid_type_received_array: "Invalid type received",
            invalid_union: "Invalid value",
            custom: "Validation failed",
          },
        },
      },
    },
  };
});
