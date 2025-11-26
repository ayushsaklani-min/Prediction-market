// Chainlink Functions Source Code
// This runs in the Chainlink DON to fetch real AI predictions

// Arguments: [marketId, eventId, description, closeTimestamp]
const marketId = args[0];
const eventId = args[1];
const description = args[2];
const closeTimestamp = parseInt(args[3]);

// Secrets: OPENAI_API_KEY, NEWS_API_KEY
const openaiKey = secrets.OPENAI_API_KEY;
const newsApiKey = secrets.NEWS_API_KEY;

// Step 1: Fetch relevant news and data
async function fetchNewsData() {
  const query = encodeURIComponent(eventId);
  const newsUrl = `https://newsapi.org/v2/everything?q=${query}&sortBy=publishedAt&apiKey=${newsApiKey}&pageSize=10`;
  
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
  return articles.slice(0, 5).map(a => ({
    title: a.title,
    description: a.description,
    publishedAt: a.publishedAt
  }));
}

// Step 2: Fetch crypto/market data if relevant
async function fetchMarketData() {
  // Check if this is a crypto-related market
  const cryptoKeywords = ['btc', 'eth', 'bitcoin', 'ethereum', 'crypto'];
  const isCrypto = cryptoKeywords.some(kw => 
    eventId.toLowerCase().includes(kw) || description.toLowerCase().includes(kw)
  );

  if (!isCrypto) {
    return null;
  }

  // Fetch from CoinGecko (free API, no key needed)
  const coinGeckoUrl = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true";
  
  const marketRequest = Functions.makeHttpRequest({
    url: coinGeckoUrl,
    method: "GET"
  });

  const marketResponse = await marketRequest;
  
  if (marketResponse.error) {
    console.error("Market API error:", marketResponse.error);
    return null;
  }

  return marketResponse.data;
}

// Step 3: Call OpenAI GPT-4 for analysis
async function getAIPrediction(newsData, marketData) {
  const systemPrompt = `You are an expert prediction market analyst. Analyze the provided information and predict the probability (0-100) that the following event will occur: "${description}".

Event ID: ${eventId}
Close Date: ${new Date(closeTimestamp * 1000).toISOString()}

Provide your response in JSON format:
{
  "probability": <number 0-100>,
  "confidence": <number 0-100>,
  "reasoning": "<brief explanation>",
  "key_factors": ["<factor1>", "<factor2>", "<factor3>"]
}`;

  const userPrompt = `Recent News:\n${JSON.stringify(newsData, null, 2)}\n\nMarket Data:\n${JSON.stringify(marketData, null, 2)}`;

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
      temperature: 0.3,
      max_tokens: 500,
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

// Main execution
try {
  // Fetch data sources
  const newsData = await fetchNewsData();
  const marketData = await fetchMarketData();

  // Get AI prediction
  const prediction = await getAIPrediction(newsData, marketData);

  // Validate probability
  let probability = Math.round(prediction.probability);
  if (probability < 10) probability = 10;
  if (probability > 90) probability = 90;

  // Create commitment hash
  const salt = "oraclex-v2";
  const commitmentData = `${probability}|${prediction.reasoning}|${salt}`;
  const commitmentHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(commitmentData));

  // Return result
  const result = {
    marketId: marketId,
    probability: probability,
    confidence: prediction.confidence,
    reasoning: prediction.reasoning,
    keyFactors: prediction.key_factors,
    commitmentHash: commitmentHash,
    timestamp: Math.floor(Date.now() / 1000),
    modelVersion: "gpt-4-turbo-preview",
    dataSources: {
      news: newsData.length,
      market: marketData ? "included" : "not_applicable"
    }
  };

  // Encode result for on-chain submission
  return Functions.encodeString(JSON.stringify(result));

} catch (error) {
  console.error("Error:", error);
  throw error;
}
