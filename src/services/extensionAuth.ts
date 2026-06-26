import { z } from 'zod';

/**
 * Verified extension IDs (Chrome Web Store / Firefox Add-ons IDs).
 * Populate this list once the extensions are published.
 *
 * Until the extension provides a verified ID, the user will see an
 * "Unverified extension" warning.
 */
export const VERIFIED_EXTENSION_IDS: string[] = [];

export const extensionParamsSchema = z.object({
  extension_id: z.string().optional(),
  extension_name: z.string().min(1, 'Extension name is required'),
  extension_version: z.string().min(1, 'Extension version is required'),
  state: z.string().min(8, 'State parameter must be at least 8 characters'),
});

export type ExtensionParams = z.infer<typeof extensionParamsSchema>;

export type VerifiedReason = 'verified-id' | 'unverified';

export type ExtensionValidationResult =
  | { success: true; data: ExtensionParams; isVerified: boolean; verifiedReason: VerifiedReason }
  | { success: false; error: string };

/**
 * Checks whether an extension is considered verified.
 *
 * TODO: Accept the extension ID from the extension via URL and check it
 * against VERIFIED_EXTENSION_IDS. Until then, all extensions are treated as
 * unverified so the user sees a warning (beta, dev, and self-built builds).
 */
export function isVerifiedExtension(extensionId?: string): boolean {
  return Boolean(extensionId && VERIFIED_EXTENSION_IDS.includes(extensionId));
}

export function validateExtensionParams(
  searchParams: URLSearchParams
): ExtensionValidationResult {
  const raw = {
    extension_id: searchParams.get('extension_id') ?? undefined,
    extension_name: searchParams.get('extension_name') ?? '',
    extension_version: searchParams.get('extension_version') ?? '',
    state: searchParams.get('state') ?? '',
  };

  const result = extensionParamsSchema.safeParse(raw);

  if (!result.success) {
    return { success: false, error: result.error.issues[0]?.message ?? 'Invalid parameters' };
  }

  const isVerified = isVerifiedExtension(result.data.extension_id);
  const verifiedReason: VerifiedReason = isVerified ? 'verified-id' : 'unverified';

  return { success: true, data: result.data, isVerified, verifiedReason };
}

export function logExtensionAuthEvent(
  action: 'approve' | 'deny',
  extensionName: string,
  extensionVersion: string,
  isVerified: boolean
): void {
  console.warn(
    `[ExtensionAuth] action=${action} extension="${extensionName}" version="${extensionVersion}" verified=${isVerified} timestamp=${new Date().toISOString()}`
  );
}
