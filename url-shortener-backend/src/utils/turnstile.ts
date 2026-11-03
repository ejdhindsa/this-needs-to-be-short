export interface TurnstileResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
}

export async function verifyTurnstile(
  token: string,
  ip?: string,
  fetchImplementation: typeof fetch = fetch,
) {
  const turnstileKey = process.env.TURNSTILE_SECRET_KEY;

  if (!turnstileKey) {
    throw new Error("Missing Turnstile Secret Key");
  }

  const turnstileEndpoint =
    "https://challenges.cloudflare.com/turnstile/v0/siteverify";
  const timeoutSignal = AbortSignal.timeout(5000);

  const requestPayload = {
    secret: turnstileKey,
    response: token,
    ...(ip ? { remoteip: ip } : {}),
  };

  const response = await fetchImplementation(turnstileEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestPayload),
    signal: timeoutSignal,
  });

  if (!response.ok) {
    throw new Error(
      `Turnstile verification failed with status: ${response.status}`,
    );
  }

  const body = (await response.json()) as TurnstileResponse;

  return body.success === true;
}
