import fetch from 'make-fetch-happen';

export const fetchData = async (url: string, proxy?: string) => {
  const response = await fetch(url, { proxy });
  if (response.headers.get('content-type').includes('json')) {
    const json = await response.json();
    return json;
  }

  // TODO: Make proper handling for fetch errors (429 etc)
  throw new Error('fetch error');
};

export const postData = async (url: string, proxy: string, body: any) => {
  const opts = {
    method: 'post',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  };

  const response = await fetch(url, { ...opts, proxy });

  if (response.headers.get('content-type').includes('json')) {
    const json = await response.json();
    return json;
  }

  // TODO: Make proper handling for fetch errors (429 etc)
  throw new Error('fetch error');
};
