import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getProperties } from '@/data/mockProperties';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '@/lib/rateLimit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 200,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "missing_key", // Fallback handles gracefully
});

// Tools available to Claude
const tools = [
  {
    name: "search_catalog",
    description: "Search the ScoutIt property catalog for spaces matching the user's criteria. Returns a list of spaces.",
    input_schema: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "The city or neighborhood to search in (e.g. 'BGC', 'Makati', 'Siargao'). Leave empty if not specified."
        },
        space_type: {
          type: "string",
          description: "The category of space (e.g. 'Residential', 'Commercial', 'Hospitality', 'STR', 'Restaurants', 'Venues/Events'). Leave empty if not specified."
        },
        max_budget: {
          type: "number",
          description: "Maximum budget in PHP. If user says 'under 50M', this is 50000000."
        }
      }
    }
  },
  {
    name: "save_to_wishlist",
    description: "Save a specific property to the user's wishlist/board.",
    input_schema: {
      type: "object",
      properties: {
        property_id: {
          type: "string",
          description: "The exact slug or ID of the property to save (e.g. 'aurelia-residences')."
        }
      },
      required: ["property_id"]
    }
  }
];

export async function POST(request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    await limiter.check(10, ip); // 10 messages per minute
  } catch (error) {
    return NextResponse.json({ error: "Rate limit exceeded. Try again later." }, { status: 429 });
  }

  try {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized: Missing token" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized: Invalid session" }, { status: 401 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ reply: "I cannot connect to the ScoutIt neural network. Please configure the ANTHROPIC_API_KEY in the environment settings." });
    }

    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages array" }, { status: 400 });
    }

    // Filter out initial welcome message if we want, or map it.
    // The frontend sends standard { role, content } objects.
    const validMessages = messages.filter(m => m.role === 'user' || m.role === 'assistant');

    // System prompt sets the persona
    const systemPrompt = `You are QuestIT, the ultra-premium VIP AI Concierge for ScoutIt.
ScoutIt is an exclusive Space Intelligence Platform in the Philippines covering Residential, Commercial, and high-end short-term rentals.
Your personality is highly luxurious, conversational, and meticulously helpful. 
You act like a high-end butler or private agent.
Always format your messages beautifully. Use short paragraphs. You can use markdown bolding to emphasize property names.
You have tools to search the catalog and save properties for the user. Do not make up properties; ALWAYS use the search_catalog tool to find real listings before recommending them.
If a user asks to save a property, use the save_to_wishlist tool.`;

    let msg = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      system: systemPrompt,
      messages: validMessages,
      tools: tools,
    });

    // Check if Claude wants to use a tool
    if (msg.stop_reason === "tool_use") {
      const toolUses = msg.content.filter(block => block.type === "tool_use");
      const toolResults = [];

      for (const toolUse of toolUses) {
        const { name, input, id } = toolUse;

        if (name === "search_catalog") {
          const { location, space_type, max_budget } = input;
          let allProps = getProperties();
          
          if (location) {
            const locLow = location.toLowerCase();
            allProps = allProps.filter(p => p.city.toLowerCase().includes(locLow) || p.location.toLowerCase().includes(locLow) || p.title.toLowerCase().includes(locLow));
          }
          if (space_type) {
            allProps = allProps.filter(p => p.spaceCategory && p.spaceCategory.toLowerCase() === space_type.toLowerCase());
          }
          if (max_budget) {
            allProps = allProps.filter(p => {
              const m = String(p.listed_price).replace(/,/g, "").match(/\d+(\.\d+)?/);
              const val = m ? Number(m[0]) : null;
              return val !== null && val <= max_budget;
            });
          }

          // Return only essential details to Claude so we don't blow up the context window
          const simplifiedProps = allProps.map(p => ({
            id: p.slug,
            title: p.title,
            city: p.city,
            category: p.spaceCategory,
            price: p.listed_price,
            beds: p.beds,
            size: p.floor_sqm ? p.floor_sqm + ' sqm' : null,
            aesthetic: p.aestheticTag
          }));

          toolResults.push({
            type: "tool_result",
            tool_use_id: id,
            content: simplifiedProps.length > 0 ? JSON.stringify(simplifiedProps) : "No properties found matching the criteria."
          });
        }

        else if (name === "save_to_wishlist") {
          const { property_id } = input;
          // Mock saving to wishlist
          console.log(`[QuestIT] Saved property ${property_id} to wishlist`);
          toolResults.push({
            type: "tool_result",
            tool_use_id: id,
            content: `Successfully saved ${property_id} to the user's Vault.`
          });
        }
      }

      // Return the tool results back to Claude for the final response
      const updatedMessages = [
        ...validMessages,
        { role: "assistant", content: msg.content },
        { role: "user", content: toolResults }
      ];

      const finalMsg = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        system: systemPrompt,
        messages: updatedMessages,
        tools: tools,
      });

      const finalReply = finalMsg.content.find(block => block.type === "text")?.text || "I have completed the task.";
      return NextResponse.json({ reply: finalReply });
    }

    // No tool used, just standard text response
    const replyText = msg.content.find(block => block.type === "text")?.text || "I am processing your request.";
    return NextResponse.json({ reply: replyText });

  } catch (error) {
    console.error("QuestIT API Error:", error);
    return NextResponse.json({ error: "Concierge system offline." }, { status: 500 });
  }
}
