export async function isUrlSafe(
  targetUrl: string,
  fetchImplementation: typeof fetch = fetch,
): Promise<boolean> {
  const apiKey = process.env.SAFE_BROWSING_API_KEY;
  const safeBrowsingEndpoint =
    "https://safebrowsing.googleapis.com/v4/threatMatches:find?key=";

  if (!apiKey) {
    throw new Error("Missing Safe Browsing API Key");
  }

  const endpoint = safeBrowsingEndpoint + apiKey;

  const requestPayload = {
    client: { clientId: "unwreck-shortener", clientVersion: "1.0.0" },
    threatInfo: {
      threatTypes: [
        "MALWARE",
        "SOCIAL_ENGINEERING",
        "UNWANTED_SOFTWARE",
        "POTENTIALLY_HARMFUL_APPLICATION",
      ],
      platformTypes: ["ANY_PLATFORM"],
      threatEntryTypes: ["URL"],
      threatEntries: [{ url: targetUrl }],
    },
  };

  const timeoutSignal = AbortSignal.timeout(3000);

  const response = await fetchImplementation(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestPayload),
    signal: timeoutSignal,
  });

  if (!response.ok) {
    throw new Error(`Safe browsing error: ${response.status}`);
  }

  const body = (await response.json()) as { matches?: unknown[] };
  const hasThreatMatches = Array.isArray(body.matches) && body.matches.length > 0;

  return !hasThreatMatches;
}
