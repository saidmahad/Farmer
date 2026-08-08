// utils/adviceGenerator.js
//
// Turns the structured Crops row into farmer-facing natural-language
// guidance. Works in two modes:
//
//   1. Template mode (default, no external dependency): combines the
//      planting/irrigation/fertilizer fields into a readable narrative
//      using domain-aware phrasing and the crop's season/pest data.
//
//   2. AI-enhanced mode: if ANTHROPIC_API_KEY is set in the environment,
//      the same structured data is sent to the Claude API to produce a
//      more conversational, context-aware version. Falls back to
//      template mode automatically if the API call fails, so the
//      feature never breaks the endpoint.

function buildTemplateAdvice(crop) {
  const parts = [
    `${crop.crop_name}${crop.local_name ? ` (${crop.local_name})` : ''} grows best when planted ` +
      `during ${crop.season || 'the recommended local season'}.`,
    `Planting: ${crop.planting_method}`,
    `Irrigation: ${crop.irrigation}`,
    `Fertilizer: ${crop.fertilizer}`
  ];

  if (crop.common_pests) {
    parts.push(`Watch for: ${crop.common_pests}.`);
  }
  if (crop.days_to_harvest) {
    parts.push(`Expected time to harvest: ${crop.days_to_harvest}.`);
  }

  return parts.join('\n\n');
}

async function buildAIAdvice(crop) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const prompt =
    `You are an agricultural extension officer advising a smallholder farmer. ` +
    `Using ONLY the facts below, write a short, warm, practical advisory (150-220 words) ` +
    `covering planting, irrigation, and fertilizer, in plain everyday language. ` +
    `Do not invent facts not present below.\n\n` +
    `Crop: ${crop.crop_name} (${crop.local_name || 'n/a'})\n` +
    `Season: ${crop.season || 'n/a'}\n` +
    `Planting method: ${crop.planting_method}\n` +
    `Irrigation: ${crop.irrigation}\n` +
    `Fertilizer: ${crop.fertilizer}\n` +
    `Common pests: ${crop.common_pests || 'n/a'}\n` +
    `Days to harvest: ${crop.days_to_harvest || 'n/a'}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) return null;
    const data = await response.json();
    const text = (data.content || [])
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim();

    return text || null;
  } catch (err) {
    console.error('AI advice generation failed, falling back to template:', err.message);
    return null;
  }
}

/**
 * Returns { text, source } where source is 'ai' or 'template'.
 */
async function generateAdvice(crop) {
  const aiText = await buildAIAdvice(crop);
  if (aiText) {
    return { text: aiText, source: 'ai' };
  }
  return { text: buildTemplateAdvice(crop), source: 'template' };
}

module.exports = { generateAdvice, buildTemplateAdvice };
