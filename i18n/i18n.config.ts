export default defineI18nConfig(() => {
  return {
    legacy: false,
    locale: "en",
    messages: {
      en: {
        app: {
          title: "NextGen",
          description:
            "Build ML models on institutional medical data at source. Accelerate research, advance treatment, change lives for the better.",
          copyright: "Copyright {year} © NextGen",
        },
        status: {
          loading_data: "Loading data...",
          item_not_found: "Item not found",
        },
        title: {
          marketplace: "Marketplace",
          my_catalog: "My Catalog",
          settings: "Settings",
          home: "Login",
          create: "Create",
          edit: "Edit",
          actions: "Actions",
          are_you_sure: "Are you sure?",
        },
        welcome: "Welcome11",
        nextgen: "NextGen",
        general: {
          project_name: "NextGen UI",
        },
        subtitle: {
          marketplace: "Decentralised search across all institutional catalogs",
          data_products: "Data Products",
          available_biobanks: "Available Biobanks",
          my_catalog: "Private metadata catalog",
          new_metadata_details: "New metadata details.",
          change_metadata_details: "Change metadata details.",
          marketplace_description:
            "Decentralised search across all institutional catalogs",
        },
        text: {
          available_biobank_description:
            "Currently available institutional data products from our partners.",
        },
        alert: {
          delete_dataset: "Are you sure you want to delete {name}?",
        },
        menu: {
          home: "Home",
          marketplace: "Marketplace",
          my_catalog: "My Catalog",
          settings: "Settings",
          help: "Help",
          logout: "Logout",
        },
        sidebar: {
          home: "Home",
          marketplace: "Marketplace",
        },
        filter: {
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
          age: "Age",
          gender: "Gender",
          ethnicity: "Ethnicity",
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
          physical_measurements: "Physical Measurements",
          height: "Height",
          waist_hip_ratio: "Waist-Hip Ratio",
          waist_height_ratio: "Waist-Height Ratio",
          sbp: "Systolic Blood Pressure",
          lifestyle_habits: "Lifestyle Habits",
          smoking_history: "Smoking History",
          filter_types: {
            checkbox: "Yes/No",
            select: "Select",
            number: "Number",
            text: "Text",
          },
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
          metadata_content: "Metadata Content",
        },
        action: {
          save: "Save",
          edit_dataset: "Edit",
          delete_dataset: "Delete",
          contacts: "Contacts",
          github: "GitHub",
          add_dataset: "Add Dataset",
          previous: "Previous",
          next: "Next",
          clear_filters: "Clear Filters",
          available_biobanks: "Available Biobanks",
          create: "Create",
          edit: "Edit",
          delete: "Delete",
          cancel: "Cancel",
          update: "Update",
          save_changes: "Save Changes",
          discard: "Discard",
          create_new: "Create New",
          login: "Login",
          filter: "Filter",
          update_file: "Update File",
          view: "View",
          upload_file: "Upload File",
          back_to_catalog: "Back to Catalog",
          for_researchers: "For Researchers",
          for_data_providers: "For Data Providers",
        },
        placeholder: {
          search: "Search...",
          select_filter: "Select filter",
          select_license: "Select license",
          pick_date: "Pick a date",
          data_product_name: "Enter a data product name",
          creator: "Enter a creator name",
          email: "Enter your email",
          password: "Enter your password",
          enter_metadata_content: "Enter metadata content",
        },
        hint: {
          in: "In",
          all: "All",
          no_results: "No results found",
          of: "of",
          rows_selected: "row(s) selected",
          page: "Page",
          showing: "Showing",
          to: "to",
          data_products: "data products",
          out_of: "out of",
          no_found: "No found",
          quarter: "Q{quarter}, {year}",
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
        },
        home: {
          roadmap: {
            item: [
              {
                description:
                  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus interdum hendrerit ex vitae sodales. Donec id leo ipsum. Phasellus volutpat aliquet mauris, et blandit nulla laoreet vitae.",
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
              "A multi-institution team used Dataspace to build predictive models across hospitals without transferring sensitive patient data. Their federated learning approach incorporated genetic markers, imaging data, and clinical records while maintaining complete regulatory compliance.",
            result:
              "Result: accelerated research timeline while ensuring data sovereignty and regulatory compliance.",
          },
        },
        zodI18n: {
          errors: {
            required: "This field is required",
            email: "This field must be a valid email address",
            password: "This field must be at least 8 characters long",
            confirm_password: "This field must match the password",
            required_min_length:
              "This field must be at least {min} characters long",
            invalid_type: "Invalid type received",
            invalid_type_received_undefined: "Invalid type received",
            invalid_type_received_null: "Invalid type received",
            invalid_type_received_number: "Invalid type received",
            invalid_type_received_string: "Invalid type received",
            invalid_type_received_boolean: "Invalid type received",
            invalid_type_received_object: "Invalid type received",
            invalid_type_received_array: "Invalid type received",
          },
        },
      },
    },
  };
});
