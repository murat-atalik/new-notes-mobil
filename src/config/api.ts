import { Platform } from 'react-native';

const localApiUrl = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

const configuredApiUrl = (globalThis as { MOBILE_API_URL?: string }).MOBILE_API_URL;

export const API_BASE_URL = configuredApiUrl?.trim() || localApiUrl;
