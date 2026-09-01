const ABSOLUTE_OR_SPECIAL_URL_V128 = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i;

function configuredPublicUrlV128(): string {
  return (process.env.PUBLIC_URL || "").trim();
}

function normalizedAssetPathV128(value: string): string {
  return value.replace(/^(?:(?:\.\/)|\/)+/, "");
}

/**
 * Resolve an app-owned public asset without assuming that the CRA build is
 * mounted at the origin root. External URLs, protocol-relative URLs and app
 * hash routes are intentionally left untouched.
 */
export function publicAssetUrlV128(
  value: string,
  publicUrl = configuredPublicUrlV128()
): string {
  const input = value.trim();
  if (!input || ABSOLUTE_OR_SPECIAL_URL_V128.test(input)) return input;

  const assetPath = normalizedAssetPathV128(input);
  const base = publicUrl.trim().replace(/\/+$/, "");
  if (!base || base === "/") return `/${assetPath}`;
  if (base === ".") {
    return input.startsWith("./") ? input : `./${assetPath}`;
  }

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(base)) {
    const normalizedBase = `${base}/`;
    const existingPrefix = new URL(normalizedBase).pathname.replace(/\/+$/, "");
    if (existingPrefix && input.startsWith(`${existingPrefix}/`)) {
      return new URL(input, new URL(normalizedBase).origin).toString();
    }
    return new URL(assetPath, normalizedBase).toString();
  }

  const basePath = `/${base.replace(/^\/+/, "")}`;
  if (input === basePath || input.startsWith(`${basePath}/`)) return input;
  return `${basePath}/${assetPath}`;
}

/** Verify that a runtime URL is inside an expected app-owned public folder. */
export function isPublicAssetWithinV128(
  value: string,
  expectedFolder: string,
  publicUrl = configuredPublicUrlV128()
): boolean {
  try {
    const origin = "https://public-asset.invalid";
    const actual = new URL(publicAssetUrlV128(value, publicUrl), origin);
    const expected = new URL(
      publicAssetUrlV128(`${expectedFolder.replace(/\/+$/, "")}/`, publicUrl),
      origin
    );
    return (
      actual.origin === expected.origin &&
      actual.pathname.startsWith(expected.pathname)
    );
  } catch {
    return false;
  }
}
