// Characters Word's XML parser rejects (everything below U+0020 except tab, LF and CR).
const XML_INVALID_CONTROLS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g;

/** Copy of `value` without XML-invalid control characters; visible text and line breaks are untouched. */
export function stripXmlInvalidControls<T>(value: T): T {
  if (typeof value === "string") return value.replace(XML_INVALID_CONTROLS, "") as T;
  if (Array.isArray(value)) return value.map(stripXmlInvalidControls) as T;
  if (value !== null && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, stripXmlInvalidControls(item)])) as T;
  }
  return value;
}
