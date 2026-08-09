import type { ConfigContext, ExpoConfig } from 'expo/config';
import { readFileSync } from 'node:fs';

function readGoogleWebClientId(path: string): string | undefined {
  try {
    const config = JSON.parse(readFileSync(path, 'utf8')) as {
      client?: Array<{ oauth_client?: Array<{ client_id?: string; client_type?: number }> }>;
    };
    return config.client
      ?.flatMap((client) => client.oauth_client ?? [])
      .find((client) => client.client_type === 3)
      ?.client_id?.trim();
  } catch {
    return undefined;
  }
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const googleServicesFile =
    process.env.GOOGLE_SERVICES_JSON ?? './google-services.json';
  const googleWebClientId =
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
    readGoogleWebClientId(googleServicesFile);

  return {
    ...config,
    android: {
      ...config.android,
      googleServicesFile,
    },
    extra: {
      ...config.extra,
      googleWebClientId,
    },
  };
};
