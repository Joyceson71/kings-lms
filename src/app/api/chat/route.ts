import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

// Initialize the OpenAI provider pointing to IBM Bob's API
const ibmBob = createOpenAI({
  apiKey: process.env.IBM_BOB_API_KEY,
  // Using a likely endpoint URL based on standard API design.
  // Update this if IBM Bob provides a different endpoint.
  baseURL: 'https://bob.ibm.com/v1',
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // Call the IBM Bob API via the Vercel AI SDK
    const result = streamText({
      model: ibmBob('bob-agent'), // Replace with specific model ID if required
      messages,
      system: 'You are IBM Bob, a helpful AI development partner and coding assistant integrated into the Kings EC Platform.',
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Error communicating with IBM Bob API:", error);
    return new Response(JSON.stringify({ error: "Failed to communicate with IBM Bob" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
