import { z } from 'zod';

/**
 * Verified extension IDs (Chrome Web Store / Firefox Add-ons IDs).
 * Populate this list once the extensions are published.
 */
export const VERIFIED_EXTENSION_IDS: string[] = [];

/**
 * Known verified extension display names. This is a weaker signal than an
 * extension ID because any unverified extension can claim one of these names,
 * so it is only used to decide UI messaging, not whether the flow is allowed.
 */
export const VERIFIED_EXTENSION_NAMES: string[] = ['URnetwork'];

export const extensionParamsSchema = z.object({
  extension_name: z.string().min(1, 'Extension name is required'),
  extension_version: z.string().min(1, 'Extension version is required'),
  state: z.string().min(8, 'State parameter must be at least 8 characters'),
});

export type ExtensionParams = z.infer<typeof extensionParamsSchema>;

export type VerifiedReason = 'verified-id' | 'verified-name' | 'unverified';

export type ExtensionValidationResult =
  | { success: true; data: ExtensionParams; isVerified: boolean; verifiedReason: VerifiedReason }
  | { success: false; error: string };

/**
 * Checks whether an extension is considered verified.
 *
 * TODO: Once extension IDs are available, accept the ID here and check it
 * against VERIFIED_EXTENSION_IDS. The name-based check below is only a
 * convenience signal for UI copy.
 */
export function isVerifiedExtension(extensionName: string, extensionId?: string): boolean {
  // When we have real IDs, prefer ID verification:
  if (extensionId && VERIFIED_EXTENSION_IDS.includes(extensionId)) return true;
  return VERIFIED_EXTENSION_NAMES.includes(extensionName);
}

export function validateExtensionParams(
  searchParams: URLSearchParams
): ExtensionValidationResult {
  const raw = {
    extension_name: searchParams.get('extension_name') ?? '',
    extension_version: searchParams.get('extension_version') ?? '',
    state: searchParams.get('state') ?? '',
  };

  const result = extensionParamsSchema.safeParse(raw);

  if (!result.success) {
    return { success: false, error: result.error.issues[0]?.message ?? 'Invalid parameters' };
  }

  const isVerified = isVerifiedExtension(result.data.extension_name);
  const verifiedReason: VerifiedReason = isVerified ? 'verified-name' : 'unverified';

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
