/**
 * Serializa un error en un objeto plano con todos los campos útiles para
 * diagnosticar. Cubre Error estándar, errores nativos de React Native
 * (nativeStackAndroid/iOS, userInfo, domain, code) y la cadena `cause`.
 *
 * Devuelve un objeto serializable que se puede pasar a console.log /
 * JSON.stringify y verlo entero en el Metro logger.
 */
export function describeError(err: unknown): Record<string, unknown> {
  if (err === null || err === undefined) {
    return { value: err };
  }
  if (typeof err !== "object") {
    return { value: String(err), type: typeof err };
  }

  const e = err as Record<string, unknown> & { cause?: unknown; stack?: unknown };
  const out: Record<string, unknown> = {};

  const copyIfPresent = (
    key: string,
    transform: (v: unknown) => unknown = (v) => v,
  ) => {
    if (key in e && e[key] !== undefined) out[key] = transform(e[key]);
  };

  // Campos estándar de Error
  copyIfPresent("name");
  copyIfPresent("message");
  copyIfPresent("code");
  copyIfPresent("info");
  copyIfPresent("domain");
  copyIfPresent("userInfo");

  // Stack: solo primeras líneas para no saturar logs
  if (typeof e.stack === "string") {
    out.stack = (e.stack as string).split("\n").slice(0, 6).join("\n");
  }

  // Stacks nativos (React Native)
  copyIfPresent("nativeStackAndroid");
  copyIfPresent("nativeStackIOS");

  // Cadena de error (ES2022)
  if (e.cause !== undefined) {
    out.cause = describeError(e.cause);
  }

  // Cualquier otra prop enumerable propia que no copiamos arriba
  for (const key of Object.keys(e)) {
    if (key in out) continue;
    const val = (e as Record<string, unknown>)[key];
    if (typeof val === "function") continue;
    out[key] = val;
  }

  return out;
}

/**
 * Mensaje compacto del error, útil para mostrar al usuario en __DEV__.
 * Concatena `message` + `code` si está presente.
 */
export function errorSummary(err: unknown): string {
  if (err === null || err === undefined) return "Razón desconocida";
  if (typeof err !== "object") return String(err);
  const e = err as { message?: unknown; code?: unknown };
  const parts: string[] = [];
  if (typeof e.message === "string" && e.message.length > 0) {
    parts.push(e.message);
  }
  if (e.code !== undefined) {
    parts.push(`code: ${String(e.code)}`);
  }
  return parts.length > 0 ? parts.join(" — ") : "Razón desconocida";
}
