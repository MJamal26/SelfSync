/**
 * Food AI — powered by Groq + Llama 4 Scout Vision
 * Free tier: 30 RPM, no daily cap (signup at console.groq.com)
 */

import { GROQ_API_KEY } from './keys';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL    = 'meta-llama/llama-4-scout-17b-16e-instruct';

// ── Prompts ───────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert nutritionist and food scientist with 20+ years of clinical experience in calorie counting and dietary assessment.

Your specialisations:
• Indian cuisine — North/South Indian, street food, dabbas, restaurant portions
• International cuisines — Italian, Chinese, American, Middle Eastern, etc.
• Accurate portion estimation using visual reference points in the image

You use a strict, disciplined approach:
1. You NEVER identify food in non-food images (walls, people, animals, objects → is_food: false)
2. You identify EVERY visible component before estimating calories
3. You use visual anchors to estimate weight/volume before calculating calories
4. You respond ONLY with raw JSON — zero markdown, zero explanation outside the JSON`;

const USER_PROMPT = `Analyse this image using the following steps:

━━ STEP 1 — IS THIS FOOD? ━━
Look carefully. Is there food, drink or any edible item clearly visible?
• If NO → return {"is_food":false,"name":"","calories":0,"confidence":"high","note":"describe what you actually see","ingredients":[]}
• If YES → continue to Step 2

━━ STEP 2 — IDENTIFY EVERY COMPONENT ━━
List every dish, ingredient, and side item you can see.
Be specific: "Butter Chicken" not "curry", "Basmati Rice" not "rice", "Garlic Naan" not "bread".

━━ STEP 3 — ESTIMATE PORTION SIZE ━━
Use visual anchors in the image:
• Standard dinner plate ≈ 26 cm → ~500-700 g of food
• Standard bowl ≈ 400 ml capacity → ~350-400 g curries/liquids
• A closed fist ≈ 1 cup / 240 ml
• Open palm (flat) ≈ 85 g of protein
• Restaurant portions are typically 25-35% larger than home-cooked

━━ STEP 4 — CALCULATE CALORIES ━━
Use these reference values (per 100 g unless specified):

INDIAN FOODS:
Cooked rice: 130 kcal | Raw rice → 3× after cooking
Chapati/Roti (1 piece, 30 g): 70-80 kcal
Paratha (1 piece, 60 g): 150-200 kcal (add 40 kcal if shallow-fried)
Dal (cooked): 90-100 kcal | Dal Makhani: 150 kcal
Paneer: 265 kcal | Paneer dish (1 serving restaurant): 350-450 kcal
Chicken (cooked, no bone): 165 kcal | Chicken curry: 180-200 kcal
Mutton/Lamb (cooked): 250 kcal
Biryani — home: 200-250 kcal/100 g | restaurant (1 plate): 500-650 kcal
Samosa (1 medium, 80 g): 250-280 kcal
Idli (1 piece, 40 g): 40 kcal | Dosa (1 medium): 120-160 kcal
Butter (1 tsp): 35 kcal | Ghee (1 tsp): 45 kcal

COMMON FOODS:
Egg (1 large boiled): 75 kcal | Fried egg: 90 kcal
White bread (1 slice): 75 kcal | Brown bread: 65 kcal
Pasta (cooked): 130 kcal | Pizza (1 slice, 100 g): 250-280 kcal
French fries (100 g): 312 kcal | Fried items: add 30-50% to base calories
Milk tea/Chai (200 ml, with sugar): 80-100 kcal
Soft drink (300 ml can): 130 kcal | Lassi (250 ml, sweet): 180 kcal
Banana: 90 kcal | Apple: 52 kcal | Mango (100 g): 60 kcal

━━ RESPOND WITH ONLY THIS JSON ━━
{"is_food":true,"name":"Butter Chicken with Garlic Naan","calories":620,"confidence":"high","note":"1 bowl curry ~280g + 2 naan ~160g","ingredients":["butter chicken curry","garlic naan"]}

Field rules:
• is_food: true ONLY when food/drink is clearly visible
• name: full specific name including all main components
• calories: total kcal for everything visible in the image
• confidence: "high" (clearly identifiable) | "medium" (partially visible/blurry) | "low" (very unclear)
• note: your serving size estimation reasoning
• ingredients: list of every component you identified`;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FoodAnalysis {
  is_food:     boolean;
  name:        string;
  calories:    number;
  confidence:  'high' | 'medium' | 'low';
  note?:       string;
  ingredients: string[];
}

// ── API ───────────────────────────────────────────────────────────────────────

async function groqFetch(body: object): Promise<Response> {
  return fetch(GROQ_URL, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify(body),
  });
}

/**
 * Analyse a food photo with Groq Llama 4 Vision.
 * @param base64Image  Raw base64 string (no data: URI prefix)
 * @param mimeType     e.g. 'image/jpeg'
 * @throws  Error with message 'NOT_FOOD' when no food is detected
 */
export async function analyzeFood(
  base64Image: string,
  mimeType: string = 'image/jpeg',
): Promise<FoodAnalysis> {
  if (!base64Image) throw new Error('No image data received from camera.');

  const body = {
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role:    'user',
        content: [
          {
            type:      'image_url',
            image_url: { url: `data:${mimeType};base64,${base64Image}` },
          },
          { type: 'text', text: USER_PROMPT },
        ],
      },
    ],
    temperature:     0.05,
    max_tokens:      500,  // more room for reasoning + ingredients list
    response_format: { type: 'json_object' },
  };

  let response: Response;
  try {
    response = await groqFetch(body);
  } catch (err: any) {
    throw new Error(`Network error — check internet connection.\n${err?.message ?? ''}`);
  }

  // Rate limit → retry once after 10 s
  if (response.status === 429) {
    await new Promise<void>(resolve => setTimeout(resolve, 10000));
    try {
      response = await groqFetch(body);
    } catch (err: any) {
      throw new Error(`Network error on retry.\n${err?.message ?? ''}`);
    }
    if (response.status === 429) {
      throw new Error('Rate limit hit — please wait a moment and try again.');
    }
  }

  if (!response.ok) {
    const errText = await response.text();
    let detail = errText;
    try { detail = JSON.parse(errText)?.error?.message ?? errText; } catch {}
    throw new Error(`Groq error ${response.status}: ${detail.slice(0, 300)}`);
  }

  const data = await response.json();
  const text: string = data?.choices?.[0]?.message?.content ?? '';
  if (!text) throw new Error('Empty response from AI. Try a clearer photo.');

  const cleaned = text.replace(/```json|```/gi, '').trim();

  let parsed: FoodAnalysis;
  try {
    parsed = JSON.parse(cleaned) as FoodAnalysis;
  } catch {
    throw new Error(`Couldn't parse AI response. Try a clearer photo.\nRaw: ${text.slice(0, 100)}`);
  }

  // ── Non-food guard ────────────────────────────────────────────────
  // Throw a special sentinel so CalorieTrackerScreen shows the right UI
  if (!parsed.is_food) {
    const saw = parsed.note ? ` (${parsed.note})` : '';
    throw new Error(`NOT_FOOD: No food detected in this photo${saw}. Point the camera at a meal or drink.`);
  }

  return {
    is_food:     true,
    name:        String(parsed.name ?? 'Unknown food').trim(),
    calories:    Math.round(Number(parsed.calories ?? 200)),
    confidence:  (['high', 'medium', 'low'].includes(parsed.confidence)
      ? parsed.confidence : 'medium') as FoodAnalysis['confidence'],
    note:        parsed.note,
    ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients : [],
  };
}
