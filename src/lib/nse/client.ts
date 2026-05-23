const baseUrl = "https://www.nseindia.com";

let cookieJar = "";

const headers = {
  accept: "application/json,text/plain,*/*",
  "accept-language": "en-US,en;q=0.9",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  referer: "https://www.nseindia.com/market-data/live-equity-market"
};

const timeoutSignal = () => AbortSignal.timeout(8000);

async function refreshSession() {
  const response = await fetch(baseUrl, {
    headers: {
      "user-agent": headers["user-agent"],
      "accept-language": headers["accept-language"]
    },
    cache: "no-store",
    signal: timeoutSignal()
  });
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) {
    cookieJar = setCookie
      .split(",")
      .map((part) => part.split(";")[0])
      .join("; ");
  }
}

export async function fetchNseJson<T>(path: string, retries = 1): Promise<T> {
  if (!cookieJar) {
    await refreshSession();
  }

  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        headers: {
          ...headers,
          cookie: cookieJar
        },
        cache: "no-store",
        signal: timeoutSignal()
      });

      if (response.status === 401 || response.status === 403) {
        cookieJar = "";
        await refreshSession();
        throw new Error(`NSE rejected request with ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(`NSE request failed with ${response.status}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
    }
  }

  throw lastError ?? new Error("NSE request failed");
}

export async function fetchNseText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "user-agent": headers["user-agent"],
      "accept-language": headers["accept-language"]
    },
    cache: "no-store",
    signal: timeoutSignal()
  });
  if (!response.ok) {
    throw new Error(`NSE text request failed with ${response.status}`);
  }
  return response.text();
}
