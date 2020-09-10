import got from 'got';
import notifier from 'node-notifier';

export async function doRequest(url: string) {
  url = `${process.env.DRONE_HOST}${url}`;

	try {
		const response = await got(url, {
      responseType: 'json',
      headers: {
        Authorization: `Bearer ${process.env.DRONE_API_KEY}`
      }
    });
    if (response.statusCode !== 200) {
      throw new Error(`Could not fetch data ${url}, response: ${response.body}`)
    }
		return response.body;
	} catch (error) {
    throw new Error(`Could not fetch data ${url}, error: ${error}`)
	}
}

export function sendNotification(title: string, message: string, url?: string) {
  notifier.notify({
    title,
    message,
    open: url
  });
}