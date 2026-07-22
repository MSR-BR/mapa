const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function readEmail(formData: FormData) {
  const value = formData.get("email");
  const email = typeof value === "string" ? value.trim().toLowerCase() : "";

  return EMAIL_PATTERN.test(email) && email.length <= 254 ? email : null;
}

export function readPassword(formData: FormData) {
  const value = formData.get("password");

  return typeof value === "string" && value.length >= 8 && value.length <= 128
    ? value
    : null;
}
