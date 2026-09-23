import { Platform } from 'react-native';

import { MOBILE_API_URL } from './api.local';

const localApiUrl = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

export const API_BASE_URL = MOBILE_API_URL.trim() || localApiUrl;
