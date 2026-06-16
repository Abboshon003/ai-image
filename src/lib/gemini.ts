import { GoogleGenerativeAI } from '@google/generative-ai'
import type { ClothingAnalysis, ScentAnalysis, OutfitSuggestion } from '../types'


function getModel() {
  const key = localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY as string
  if (!key) throw new Error('No Gemini API key found. Go to Settings and add your key from aistudio.google.com')
  return new GoogleGenerativeAI(key).getGenerativeModel({ model: 'gemini-2.0-flash' })
}

export async function analyzeClothingImage(base64Image: string, mimeType = 'image/jpeg'): Promise<ClothingAnalysis> {
  const model = getModel()
  const prompt = `Analyze this clothing item and return ONLY valid JSON with this exact structure, no markdown, no explanation:
{
  "category": "string (tops/bottoms/outerwear/shoes/accessories/dresses/activewear)",
  "subCategory": "string (e.g. oxford shirt, chinos, bomber jacket)",
  "primaryColor": "string",
  "secondaryColors": ["string"],
  "pattern": "string (solid/striped/plaid/floral/graphic/textured/other)",
  "formality": ["string (casual/smart casual/business casual/business formal/black tie)"],
  "season": ["string (spring/summer/fall/winter/all-season)"],
  "fit": "string (slim/regular/relaxed/oversized)",
  "styleTags": ["string"],
  "bestFor": ["string"],
  "aiConfidence": 0.85,
  "aiNotes": "string"
}`

  const result = await model.generateContent([
    { inlineData: { data: base64Image, mimeType } },
    prompt,
  ])

  const text = result.response.text().trim()
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No valid JSON returned from Gemini')
  const parsed = JSON.parse(jsonMatch[0])
  return {
    ...parsed,
    aiConfidence: parsed.aiConfidence ?? parsed.confidence ?? 0.8,
    aiNotes: parsed.aiNotes ?? parsed.notes ?? '',
  }
}

export async function analyzeScentItem(name: string, brand: string, description: string): Promise<ScentAnalysis> {
  const model = getModel()
  const prompt = `Analyze this fragrance and return ONLY valid JSON with this exact structure, no markdown:
{
  "scentFamily": "string (floral/woody/fresh/oriental/citrus/aquatic/gourmand/spicy/earthy)",
  "notes": ["string (e.g. bergamot, sandalwood, vanilla)"],
  "season": ["string (spring/summer/fall/winter/all-season)"],
  "occasion": ["string (casual/office/evening/date/sport/formal)"],
  "intensity": "string (light/moderate/strong/intense)",
  "aiTags": ["string"]
}

Fragrance: ${name} by ${brand}
Description: ${description || 'No description provided'}`

  const result = await model.generateContent(prompt)
  const text = result.response.text().trim()
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No valid JSON returned from Gemini')
  return JSON.parse(jsonMatch[0])
}

export async function generateOutfit(
  wardrobeItems: Array<{ id: string; category: string; subCategory: string; primaryColor: string; formality: string[]; season: string[]; styleTags: string[] }>,
  occasion: string,
  styleProfile: { preferredStyles: string[]; preferredColors: string[]; goals: string } | null,
  scents: Array<{ id: string; name: string; brand: string; scentFamily: string; occasion: string[]; season: string[] }>
): Promise<OutfitSuggestion> {
  const model = getModel()

  const wardrobeContext = wardrobeItems.map(i =>
    `ID:${i.id} | ${i.subCategory} (${i.category}) | Color: ${i.primaryColor} | Formality: ${i.formality.join(', ')} | Season: ${i.season.join(', ')} | Tags: ${i.styleTags.join(', ')}`
  ).join('\n')

  const scentContext = scents.length > 0
    ? scents.map(s => `ID:${s.id} | ${s.name} by ${s.brand} | Family: ${s.scentFamily} | Best for: ${s.occasion.join(', ')}`).join('\n')
    : 'No scents available'

  const profileContext = styleProfile
    ? `Style goals: ${styleProfile.goals}. Preferred styles: ${styleProfile.preferredStyles.join(', ')}. Preferred colors: ${styleProfile.preferredColors.join(', ')}.`
    : 'No style profile set'

  const prompt = `You are a personal stylist. Create an outfit for the occasion: "${occasion}".

Available wardrobe items:
${wardrobeContext}

Available scents:
${scentContext}

User style profile:
${profileContext}

Return ONLY valid JSON with this exact structure, no markdown:
{
  "outfitName": "string",
  "itemIds": ["uuid of selected items from the list above"],
  "scentId": "uuid or null",
  "explanation": "string - why this outfit works for the occasion",
  "scentExplanation": "string or null - why this scent pairs well",
  "whyItWorks": ["string - 2-4 specific reasons"]
}`

  const result = await model.generateContent(prompt)
  const text = result.response.text().trim()
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No valid JSON returned from Gemini')
  return JSON.parse(jsonMatch[0])
}
