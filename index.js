const express = require("express");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { default: axios } = require("axios");

const genAI = new GoogleGenerativeAI(process.env.Gemini_Api_Key);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

app.get("/test-ai", async (req, res) => {
  const prompt = req.query?.prompt;
  if (!prompt) {
    res.send({ message: "Please provide a prompt in query" });
  }

  const result = await model.generateContent(prompt);
  res.send({ answer: result.response.text() });
});

app.get("/rumor-detector", async (req, res) => {
  const prompt = req.query?.prompt;
  if (!prompt) {
    res.send({ message: "Please provide a prompt in query" });
  }

  const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: [{ text: "Hello" }],
      },
      {
        role: "model",
        parts: [{ text: "Great to meet you. What would you like to know?" }],
      },
    ],
  });

  let result = await chat.sendMessage(prompt);
  res.send({ Output: result.response.text() });
});

// chatgpt er moto kore dhape dhape text asar jonne evabe ei promt use kora jete pare , chatapp hisabe calano jay
app.get("/strem-text", async (req, res) => {
  const prompt = req.query?.prompt;
  if (!prompt) {
    return res.send({ message: "Please provide a prompt in query" });
  }
  const result = await model.generateContentStream(prompt);

  for await (const chunk of result.stream) {
    // const chunkText = chunk.text();
    // process.stdout.write(chunkText);

    res.write(chunk.text() + " ");
  }
  res.end();
});

app.get("/chatbot-strem", async (req, res) => {
  const prompt = req.query?.prompt;
  if (!prompt) {
    return res.send({ message: "Please provide a Prompt text here" });
  }

  const chat = model.startChat({
    history: [
      {
        role: "user",
        parts: [{ text: "Hello" }],
      },
      {
        role: "model",
        parts: [{ text: "Great to meet you. What would you like to know?" }],
      },
    ],
  });

  let result = await chat.sendMessageStream(prompt);
  for await (const chunk of result.stream) {
    res.write(chunk.text() + " ");
  }
  res.end();
});

// daynamic vabe user er search history information chat gpt save kore rakhbe jevabe

app.get("/daynamic-history", async (req, res) => {
  const prompt = req.query?.prompt;
  if (!prompt) {
    return res.send({ message: "Please Provide a Valide Prompt " });
  }

  if (!global.chatHistory) {
    global.chatHistory = [
      { role: "user", parts: [{ text: "hello" }] },
      {
        role: "model",
        parts: [{ text: "Great to meet you. What would you like to know?" }],
      },
    ];
  }

  global.chatHistory.push({ role: "user", parts: [{ text: prompt }] });

  const chat = model.startChat({
    history: global.chatHistory,
  });

  const result = await chat.sendMessageStream(prompt);
  let fullResponse = "";
  for await (const chunk of result.stream) {
    const chunkText = chunk.text() + "";
    fullResponse += chunkText;
    res.write(chunkText);
  }
  res.end();
  global.chatHistory.push({
    role: "model",
    parts: [{ text: fullResponse.trim() }],
  });
});

// daynamic vabe json data create korar jonne
app.get("/genarate-json", async (req, res) => {
  const prompt = req.query?.prompt;
  if (!prompt) {
    return res.send({ message: "Please provide a Prompt text here" });
  }

  const finalPrompt = `Generate a JSON array following this schema:
  [
    { "key": "value" }
  ]
  Now, list a few ${prompt} using this JSON format. Return only valid JSON without extra text.`;

  const result = await model.generateContent(finalPrompt);
  const output = result.response.text().trim();
  const finalOutput = JSON.parse(output.slice(7, -4));
  res.send(finalOutput);
});

// kono image er url ba image theke er details ber korar jonne
app.get("/generate-details", async (req, res) => {
  const prompt = req.query?.prompt;
  if (!prompt) {
    return res.send({ message: " Please provide a prompt text here" });
  }
  const response = await axios.get(prompt, { responseType: "arraybuffer" });
  const responsedata = {
    inlineData: {
      data: Buffer.from(response.data).toString("base64"),
      mimeType: "image/png",
    },
  };
  const result = await model.generateContent([
    "tell the details of the image ",
    responsedata,
  ]);
  // console.log(result.response.text());
  res.send(result.response.text());
});

app.get("/", (req, res) => {
  res.send({ mess: "crack the power of AI is running" });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
