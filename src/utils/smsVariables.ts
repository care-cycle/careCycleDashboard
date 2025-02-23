// Map of frontend to backend variable names
const VARIABLE_MAPPING = {
  firstname: "clientCustomer.firstName",
  lastname: "clientCustomer.lastName",
  appointmenttime: "appointmentTime",
  appointmentdate: "appointmentDate",
} as const;

/**
 * Transforms frontend variables to backend format
 * @param text - Text containing frontend variables
 * @returns Text with variables in backend format
 */
export function transformToBackendFormat(text: string): string {
  return text.replace(/{([\w]+)}/g, (match, variable) => {
    const backendVar =
      VARIABLE_MAPPING[variable as keyof typeof VARIABLE_MAPPING];
    return backendVar ? `{{${backendVar}}}` : match;
  });
}

/**
 * Transforms backend variables to frontend format
 * @param text - Text containing backend variables
 * @returns Text with variables in frontend format
 */
export function transformToFrontendFormat(text: string): string {
  const reverseMapping = Object.entries(VARIABLE_MAPPING).reduce(
    (acc, [front, back]) => {
      acc[back] = front;
      return acc;
    },
    {} as Record<string, string>,
  );

  return text.replace(/{{([\w.]+)}}/g, (match, variable) => {
    const frontendVar = reverseMapping[variable];
    return frontendVar ? `{${frontendVar}}` : match;
  });
}
