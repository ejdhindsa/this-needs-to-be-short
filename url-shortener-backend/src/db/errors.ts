export function isUniqueViolation(err: unknown): boolean {
  if (typeof err !== "object" || err === null) {
    return false;
  }

  const code = "code" in err ? (err as { code: unknown }).code : undefined;
  if (code === "23505") {
    return true;
  }

  if ("cause" in err) {
    const cause = (err as { cause: unknown }).cause;
    if (typeof cause === "object" && cause !== null && "code" in cause) {
      return (cause as { code: unknown }).code === "23505";
    }
  }

  return false;
}
