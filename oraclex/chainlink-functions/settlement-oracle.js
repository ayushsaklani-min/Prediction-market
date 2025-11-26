// Chainlink Functions Source Code for Market Settlement
// This runs in the Chainlink DON to determine the actual outcome

// Arguments: [marketId, eventId, description, resolutionTimestamp]
const marketId = args[0];
const eventId = args[1];
const description = args[2];
const resolutionTimestamp = parseInt(args[3]);

// Secrets: OPENAI_API_KEY, NEWS_API_KEY, SPORTS_API_KEY
const openaiKey = secrets.OPENAI_API_KEY;
const newsApiKey = secrets.NEWS_API_KEY;

// Step 1: Fetch outcome data from multiple sources
async function fetchOutcomeData() {
  const query = encodeURIComponent(eventId);
  const newsUrl = `https://newsapi.org/v2/everything?q=${query}&from=${new Date(resolutionTimestamp * 1000).toISOString()}&sortBy=publishedAt&apiKey=${newsApiKey}&pageSize=20`;
  
  const newsRequest = Functions.makeHttpRequest({
    url: newsUrl,
    method: "GET"
  });

  const newsResponse = await newsRequest;
  
  if (newsResponse.error) {
    console.error("News API error:", newsResponse.error);
    return [];
  }

  const articles = newsResponse.data.articles || [];
  return articles.slice(0, 10).map(a => ({
    title: a.title,
    description: a.description,
    content: a.content,
    publishedAt: a.publishedAt,
    source: a.source.name
  }));
}

// Step 2: Use GPT-4 to determine outcome
async function determineOutcome(outcomeData) {
  const systemPrompt = `You are an expert fact-checker and outcome verifier for prediction markets. 

Your task is to determine if the following event occurred: "${description}"

Event ID: ${eventId}
Resolution Date: ${new Date(resolutionTimestamp * 1000).toISOString()}

Based on the provided news articles and data, determine:
1. Did the event occur? (YES or NO)
2. How confident are you? (0-100)
3. What evidence supports your conclusion?

Provide your response in JSON format:
{
  "outcome": "YES" or "NO",
  "confidence": <number 0-100>,
  "evidence": ["<evidence1>", "<evidence2>", "<evidence3>"],
  "reasoning": "<detailed explanation>",
  "sources_count": <number of sources consulted>
}

Be extremely careful and conservative. If there is any ambiguity or insufficient evidence, indicate low confidence.`;

  const userPrompt = `News Articles and Data:\n${JSON.stringify(outcomeData, null, 2)}`;

  const openaiUrl = "https://api.openai.com/v1/chat/completions";
  
  const openaiRequest = Functions.makeHttpRequest({
    url: openaiUrl,
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openaiKey}`,
      "Content-Type": "application/json"
    },
    data: {
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.1, // Very low temperature for factual determination
      max_tokens: 800,
      response_format: { type: "json_object" }
    }
  });

  const openaiResponse = await openaiRequest;
  
  if (openaiResponse.error) {
    throw new Error(`OpenAI API error: ${openaiResponse.error}`);
  }

  const content = openaiResponse.data.choices[0].message.content;
  return JSON.parse(content);
}

// Step 3: Cross-verify with multiple sources if possible
async function crossVerify(outcome) {
  // For high-stakes markets, we could add additional verification layers:
  // - Check multiple news sources
  // - Verify with official APIs (sports scores, election results, etc.)
  // - Use consensus from multiple AI models
  
  // For now, we'll use confidence threshold
  if (outcome.confidence < 70) {
    throw new Error(`Insufficient confidence (${outcome.confidence}%) to determine outcome. Manual resolution required.`);
  }

  return outcome;
}

// Main execution
try {
  // Fetch outcome data
  const outcomeData = await fetchOutcomeData();

  if (outcomeData.length === 0) {
    throw new Error("No data sources available to determine outcome. Manual resolution required.");
  }

  // Determine outcome using AI
  const outcome = await determineOutcome(outcomeData);

  // Cross-verify
  const verifiedOutcome = await crossVerify(outcome);

  // Convert to binary result
  const result = verifiedOutcome.outcome === "YES" ? 1 : 0;

  // Create proof hash
  const proofData = JSON.stringify({
    outcome: verifiedOutcome.outcome,
    confidence: verifiedOutcome.confidence,
    evidence: verifiedOutcome.evidence,
    reasoning: verifiedOutcome.reasoning,
    timestamp: Math.floor(Date.now() / 1000)
  });
  const proofHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(proofData));

  // Return result
  const response = {
    marketId: marketId,
    result: result,
    outcome: verifiedOutcome.outcome,
    confidence: verifiedOutcome.confidence,
    evidence: verifiedOutcome.evidence,
    reasoning: verifiedOutcome.reasoning,
    sourcesCount: verifiedOutcome.sources_count,
    proofHash: proofHash,
    timestamp: Math.floor(Date.now() / 1000),
    modelVersion: "gpt-4-turbo-preview"
  };

  // Encode result for on-chain submission
  // Format: [marketId, result (0 or 1), proofHash]
  return Functions.encodeUint256(result);

} catch (error) {
  console.error("Settlement error:", error);
  throw error;
}
