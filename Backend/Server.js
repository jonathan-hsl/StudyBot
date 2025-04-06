// Adaptive-Study-Assistant/backend/server.js
const express = require('express');
const bodyParser = require('body-parser');
const multer  = require('multer');
const axios = require('axios');
const cors = require('cors');
const pdfParse = require('pdf-parse');
const cheerio = require('cheerio');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5001;

// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' });

app.use(bodyParser.json());
app.use(cors());

// Dummy video transcription function
async function transcribeVideo(filePath) {
  // In production, integrate a transcription API.
  // Here we simulate by returning a fixed string.
  return "Simulated transcription text for the video.";
}

// Function to fetch text from a URL using axios and cheerio.
async function extractTextFromUrl(url) {
  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    // Simple extraction: get all paragraph text. (Improve as needed.)
    let text = "";
    $('p').each((i, el) => {
      text += $(el).text() + "\n";
    });
    return text;
  } catch (error) {
    console.error("Error fetching URL:", error);
    return "";
  }
}

app.post('/api/process-source', upload.single('file'), async (req, res) => {
  try {
    const { sourceType, inputText, url } = req.body;
    let extractedText = "";

    if (sourceType === "text") {
      if (!inputText) {
        return res.status(400).json({ error: "No text provided." });
      }
      extractedText = inputText;
    } else if (sourceType === "pdf") {
      if (!req.file) {
        return res.status(400).json({ error: "No PDF file uploaded." });
      }
      const fs = require('fs');
      const fileBuffer = fs.readFileSync(req.file.path);
      const pdfData = await pdfParse(fileBuffer);
      extractedText = pdfData.text;
    } else if (sourceType === "video") {
      if (!req.file) {
        return res.status(400).json({ error: "No video file uploaded." });
      }
      // Simulate transcription. Replace with actual API call as needed.
      extractedText = await transcribeVideo(req.file.path);
    } else if (sourceType === "url") {
      if (!url) {
        return res.status(400).json({ error: "No URL provided." });
      }
      extractedText = await extractTextFromUrl(url);
    } else {
      return res.status(400).json({ error: "Invalid sourceType." });
    }

    // Call OpenAI API with the extracted text.
    const prompt = `You are an expert study assistant.
Given the following content, produce a JSON object with four keys: "summary", "detailedNotes", "flashcards", and "quizzes".
- "summary" should be a concise summary.
- "detailedNotes" should be a comprehensive study guide.
- "flashcards" should be an array of objects, each with "term" and "definition".
- "quizzes" should be an array of objects, each with "question" and "answer".
Ensure the JSON is valid.
Content:
${extractedText}`;

    const openaiResponse = await axios.post('https://api.openai.com/v1/completions', {
      model: "text-davinci-003",
      prompt: prompt,
      max_tokens: 800,
      temperature: 0.7,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      }
    });

    let responseText = openaiResponse.data.choices[0].text.trim();
    let resultJSON;
    try {
      resultJSON = JSON.parse(responseText);
    } catch (e) {
      console.error("JSON parse error:", e);
      return res.status(500).json({ error: "Failed to parse API response as JSON", raw: responseText });
    }
    res.json(resultJSON);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Processing error" });
  }
});

app.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});
