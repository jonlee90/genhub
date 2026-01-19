interface CreateProjectHiddenFieldsProps {
  currentStep: number;
  projectType: string;
  formValues: {
    project_type: string;
    name: string;
    description: string;
    client_name: string;
    client_email: string;
    client_phone: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    start_date: string;
    end_date: string;
    budget: string;
  };
}

export function CreateProjectHiddenFields({
  currentStep,
  projectType,
  formValues,
}: CreateProjectHiddenFieldsProps) {
  return (
    <>
      {currentStep > 0 && (
        <input
          type="hidden"
          name="project_type"
          value={formValues.project_type}
        />
      )}
      {currentStep > 1 && (
        <>
          <input type="hidden" name="name" value={formValues.name} />
          <input
            type="hidden"
            name="description"
            value={formValues.description}
          />
          <input
            type="hidden"
            name="client_name"
            value={formValues.client_name}
          />
          <input
            type="hidden"
            name="client_email"
            value={formValues.client_email}
          />
          <input
            type="hidden"
            name="client_phone"
            value={formValues.client_phone}
          />
        </>
      )}
      {currentStep > 2 && (
        <>
          <input type="hidden" name="address" value={formValues.address} />
          <input type="hidden" name="city" value={formValues.city} />
          <input type="hidden" name="state" value={formValues.state} />
          <input type="hidden" name="zip_code" value={formValues.zip_code} />
        </>
      )}
      {currentStep === 0 && (
        <input type="hidden" name="project_type" value={projectType} />
      )}
    </>
  );
}
