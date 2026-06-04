"use strict";
/**
 * AI Planner and Prompt Engineering Layer
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAIItinerary = generateAIItinerary;
/**
 * Builds the system instructions prompt detailing constraints, layout models,
 * JSON formats, and fallback logic for OpenAI.
 */
function buildSystemPrompt() {
    return `You are an expert enterprise-grade travel planner. You generate highly optimized itineraries for users based on destination, duration, budget, travel style, and interests.
  
  CRITICAL RULES:
  1. Return ONLY valid JSON matching the exact schema specified. No markdown ticks, no extra text.
  2. Ensure the locations are real places in the destination.
  3. Guess coordinates (latitude, longitude) as accurately as possible for Leaflet map mapping.
  4. Ensure activities map correctly to their categories ("restaurant", "hotel", "attraction").
  5. Distribute daily costs logically within the user's budget boundaries.
  6. Enforce realistic travel paths (i.e. morning activities near afternoon activities to minimize travel times).
  
  JSON STRUCTURE:
  {
    "destination": "Name of destination",
    "totalEstimatedCost": 120.0,
    "currency": "USD",
    "days": [
      {
        "dayIndex": 1,
        "dateIndex": "Day 1",
        "activities": [
          {
            "timeSlot": "09:00 - 11:00",
            "activityName": "Name of attraction",
            "locationName": "Full address or landmark name",
            "estimatedCost": 25.0,
            "category": "attraction",
            "latitude": 21.0285,
            "longitude": 105.8048,
            "notes": "Advice on tickets and navigation"
          }
        ]
      }
    ]
  }`;
}
/**
 * Builds the customized user prompt payload.
 */
function buildUserPrompt(params) {
    return `Generate a travel itinerary for:
  - Destination: ${params.destination}
  - Duration: ${params.durationDays} days
  - Daily Budget Limit: $${params.dailyBudget} USD per day
  - Travel Style: ${params.travelStyle}
  - Interests: ${params.interests.join(', ')}
  
  Ensure all timeslots are sequenced correctly from morning (e.g. 08:00) to evening (e.g. 21:00).`;
}
/**
 * Generates an itinerary using OpenAI client integration.
 * Includes fallback mocks to ensure runtime availability without active keys.
 */
async function generateAIItinerary(params) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your_openai_key_here') {
        console.warn('⚠️ OpenAI API Key is missing. Returning structured mock itinerary.');
        return generateFallbackMock(params);
    }
    try {
        // Standard fetch to OpenAI API v1 Chat Completions
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini', // Lightweight, cost-efficient for schema parsing
                messages: [
                    { role: 'system', content: buildSystemPrompt() },
                    { role: 'user', content: buildUserPrompt(params) },
                ],
                temperature: 0.7,
                response_format: { type: 'json_object' },
            }),
        });
        if (!response.ok) {
            throw new Error(`OpenAI API responded with status ${response.status}`);
        }
        const data = await response.json();
        const resultJson = JSON.parse(data.choices[0].message.content);
        return resultJson;
    }
    catch (error) {
        console.error('❌ Failed to retrieve AI itinerary from OpenAI:', error);
        return generateFallbackMock(params);
    }
}
/**
 * Generates a mock itinerary stub for localized offline testing.
 */
function generateFallbackMock(params) {
    const days = [];
    for (let i = 1; i <= params.durationDays; i++) {
        days.push({
            dayIndex: i,
            dateIndex: `Day ${i}`,
            activities: [
                {
                    timeSlot: '08:00 - 09:30',
                    activityName: `${params.destination} Morning Tour`,
                    locationName: `Central Square, ${params.destination}`,
                    estimatedCost: params.dailyBudget * 0.15,
                    category: 'attraction',
                    latitude: 21.028511 + (i * 0.005),
                    longitude: 105.804817 + (i * 0.005),
                    notes: 'Wear comfortable shoes.',
                },
                {
                    timeSlot: '12:00 - 13:30',
                    activityName: `Local Delicacy Tasting`,
                    locationName: `Traditional Market, ${params.destination}`,
                    estimatedCost: params.dailyBudget * 0.25,
                    category: 'restaurant',
                    latitude: 21.029511 + (i * 0.005),
                    longitude: 105.805817 + (i * 0.005),
                    notes: 'Highly rated by street food bloggers.',
                },
                {
                    timeSlot: '15:00 - 18:00',
                    activityName: `${params.interests[0] || 'Sightseeing'} Experience`,
                    locationName: `Scenic Viewpoint, ${params.destination}`,
                    estimatedCost: params.dailyBudget * 0.3,
                    category: 'attraction',
                    latitude: 21.031511 + (i * 0.005),
                    longitude: 105.806817 + (i * 0.005),
                    notes: 'Great spot for sunsets and photography.',
                }
            ],
        });
    }
    return {
        destination: params.destination,
        totalEstimatedCost: params.dailyBudget * params.durationDays * 0.7,
        currency: 'USD',
        days,
    };
}
