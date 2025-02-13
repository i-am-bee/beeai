export function isStringTerminalParameterSafe(value: string) {
  return /^[a-zA-Z0-9_-]*$/.test(value);
}
