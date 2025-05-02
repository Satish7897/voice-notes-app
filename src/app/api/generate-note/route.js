import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

const token = process.env["GITHUB_TOKEN"];
const endpoint = "https://models.github.ai/inference";
const model = "openai/gpt-4.1";

export async function POST(request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return new Response(JSON.stringify({ error: 'No text provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!token) {
      return new Response(JSON.stringify({ error: 'GitHub token is not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const client = ModelClient(
      endpoint,
      new AzureKeyCredential(token),
    );

    const response = await client.path("/chat/completions").post({
      body: {
        messages: [
          { 
            role: "system", 
            content: `You are a note-taking assistant that creates well-structured, organized notes in HTML format. Follow these rules strictly:

1. Use proper HTML tags:
   - <h2> for titles
   - <ul> for lists
   - <li> for list items
   - <p> for paragraphs
   - <strong> for emphasis

2. Format the output with proper HTML structure:
   - Title in <h2> tags
   - List items in <ul> and <li> tags
   - Proper nesting of HTML elements

3. Content organization:
   - Group related items together
   - Remove filler words
   - Keep the original meaning but make it concise
   - Use proper punctuation

Example format:
<h2>Title</h2>
<ul>
  <li>First item</li>
  <li>Second item</li>
  <li>Third item</li>
</ul>`
          },
          { 
            role: "user", 
            content: `Please create well-formatted HTML notes from this transcript: ${text}`
          }
        ],
        temperature: 0.7,
        top_p: 1.0,
        model: model
      }
    });

    if (isUnexpected(response)) {
      throw response.body.error;
    }

    const note = response.body.choices[0].message.content;

    return new Response(JSON.stringify({ note }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("The sample encountered an error:", error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to generate note' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 