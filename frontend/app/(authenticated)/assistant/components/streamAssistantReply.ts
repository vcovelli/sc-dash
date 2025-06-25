export async function streamAssistantReply(message: string, onChunk: (chunk: string) => void): Promise<string> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/assistant/stream/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  });

  if (!res.ok || !res.body) throw new Error(`Stream failed: ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let fullReply = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    fullReply += chunk;
    onChunk(chunk);
  }

  return fullReply;
}
