export const MIN_PASSWORD_LENGTH = 8;

/** Shown under password fields and in validation errors. */
export const PASSWORD_POLICY_HINT =
  "At least 8 characters, with uppercase, lowercase, and a number.";

const HAS_LOWER = /[a-z]/;
const HAS_UPPER = /[A-Z]/;
const HAS_DIGIT = /[0-9]/;

export function validateNewPassword(
  password: string,
  confirm: string,
): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (!HAS_LOWER.test(password) || !HAS_UPPER.test(password)) {
    return "Password must include both uppercase and lowercase letters.";
  }
  if (!HAS_DIGIT.test(password)) {
    return "Password must include at least one number.";
  }
  if (password !== confirm) {
    return "Passwords do not match.";
  }
  return null;
}
