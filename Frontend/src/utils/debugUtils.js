// Debug utilities for troubleshooting data issues

export const logResponseData = (response, context = 'Response') => {
  console.group(`🔍 ${context} Debug Info`);
  console.log('Full Response Object:', response);
  console.log('Response ID:', response?._id);
  console.log('Form ID:', response?.form);
  console.log('Submitter Name:', response?.submitterName);
  console.log('Submitter Email:', response?.submitterEmail);
  console.log('Answers Object:', response?.answers);
  console.log('Answers Type:', typeof response?.answers);
  console.log('Answers Keys:', response?.answers ? Object.keys(response.answers) : 'No answers');
  console.log('Submitted At:', response?.submittedAt);
  console.groupEnd();
};

export const logFormData = (form, context = 'Form') => {
  console.group(`📋 ${context} Debug Info`);
  console.log('Full Form Object:', form);
  console.log('Form ID:', form?._id);
  console.log('Schema JSON:', form?.schemaJson);
  console.log('Schema Type:', typeof form?.schemaJson);
  console.log('Schema Length:', Array.isArray(form?.schemaJson) ? form.schemaJson.length : 'Not array');
  console.log('Created At:', form?.createdAt);
  console.groupEnd();
};

export const validateResponseData = (response) => {
  const issues = [];
  
  if (!response) {
    issues.push('Response object is null or undefined');
    return issues;
  }
  
  if (!response._id) issues.push('Missing response ID');
  if (!response.form) issues.push('Missing form reference');
  
  // Only warn about missing fields for non-legacy data
  if (!response.submitterName) issues.push('Missing submitter name (may be legacy response)');
  if (!response.submitterEmail) issues.push('Missing submitter email (may be legacy response)');
  
  if (!response.answers) {
    issues.push('Missing answers object');
  } else if (typeof response.answers !== 'object') {
    issues.push('Answers is not an object');
  } else if (Object.keys(response.answers).length === 0) {
    issues.push('Answers object is empty');
  }
  
  if (!response.submittedAt) issues.push('Missing submission date');
  
  return issues;
};

export const validateFormData = (form) => {
  const issues = [];
  
  if (!form) {
    issues.push('Form object is null or undefined');
    return issues;
  }
  
  if (!form._id) issues.push('Missing form ID');
  if (!form.schemaJson) issues.push('Missing schema JSON');
  if (!Array.isArray(form.schemaJson)) issues.push('Schema JSON is not an array');
  if (!form.createdAt) issues.push('Missing creation date');
  
  return issues;
}; 