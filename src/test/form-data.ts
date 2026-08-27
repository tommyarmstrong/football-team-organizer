/** Build a FormData from a plain record (arrays become repeated keys). */
export function formDataFrom(
  fields: Record<string, string | Blob | Array<string | Blob>>,
): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (Array.isArray(value)) {
      for (const item of value) formData.append(key, item);
    } else {
      formData.set(key, value);
    }
  }
  return formData;
}
