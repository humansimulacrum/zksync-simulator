import fetch from 'make-fetch-happen';
import { Response } from 'node-fetch';

const handleFetchResponse = async (response: Response) => {
  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Too many requests. Rate limit exceeded.');
    }
    throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
  }

  if (response.headers.get('content-type')?.includes('json')) {
    return response.json();
  }

  throw new Error('Response is not JSON.');
};

export const fetchData = async (url: string, proxy?: string) => {
  try {
    const response = await fetch(url, { proxy });
    return await handleFetchResponse(response);
  } catch (error: any) {
    console.error('Error fetching data:', error.message);
    throw error;
  }
};

export const postData = async (url: string, proxy: string, body: any) => {
  const opts = {
    method: 'post',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  };

  try {
    const response = await fetch(url, { ...opts, proxy });
    return await handleFetchResponse(response);
  } catch (error: any) {
    console.error('Error posting data:', error.message);
    throw error;
  }
};
