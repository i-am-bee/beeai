import { api } from '@/api';
import { CreateProviderBody } from './types';

export async function createProvider(body: CreateProviderBody) {
  const response = await api.post('provider', { json: body });

  if (!response.ok) {
    throw new Error('Failed to post data');
  }

  return response.json(); // Return the response JSON
}
