const { OpenAI } = require("openai");
const Note = require("../models/noteModel");
const { moderateContent } = require("../services/openaiService");

// OpenRouter/OpenAI client setup
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'http://localhost:3000',
    'X-Title': 'WARQ Study Platform',
  },
});

// Helper: Build prompt for each AI type
function buildPrompt(type, note, options = {}) {
  switch (type) {
    case "summary":
      return `Summarize the following note:\n\n${note.content}`;
    case "flashcards":
      return `Create flashcards from the following note. Format each flashcard as 'Q: ... A: ...':\n\n${note.content}`;
    case "quiz":
      return `Generate a quiz with answers from the following note. Provide questions and answers:\n\n${note.content}`;
    case "explain":
      return `Explain the following note in simple terms:\n\n${note.content}`;
    case "mindmap":
      return `Create a hierarchical mind map (as a bullet list) for the following note:\n\n${note.content}`;
    case "keywords":
      return `Extract the most important keywords from the following note:\n\n${note.content}`;
    case "action_items":
      return `List actionable items or tasks based on the following note:\n\n${note.content}`;
    case "expand":
      return `Expand and elaborate on the following note for deeper understanding:\n\n${note.content}`;
    case "translate":
      if (!options.language) throw new Error("Target language required in options.language");
      return `Translate the following note to ${options.language}:\n\n${note.content}`;
    case "custom":
      if (!options.customPrompt) throw new Error("Custom prompt required in options.customPrompt");
      return `${options.customPrompt}\n\n${note.content}`;
    default:
      throw new Error("Invalid AI type");
  }
}

// Main AI content generation endpoint
exports.generateAIContent = async (req, res) => {
  try {
    const { noteId, type, options } = req.body;
    if (!noteId || !type) {
      return res.status(400).json({ success: false, message: "noteId and type are required" });
    }

    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }
    if (!note.content || note.content.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Note content is empty" });
    }

    // AI moderation (optional, expand as needed)
    if (await moderateContent(note.content)) {
      return res.status(400).json({ success: false, message: "Inappropriate content detected" });
    }

    let prompt;
    try {
      prompt = buildPrompt(type, note, options);
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: "openai/gpt-4o",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
      });
    } catch (aiError) {
      console.error("AI API error:", aiError);
      return res.status(502).json({ success: false, message: "AI service error", error: aiError.message });
    }

    const aiResult = completion?.choices?.[0]?.message?.content?.trim();
    if (!aiResult) {
      return res.status(500).json({ success: false, message: "Failed to generate AI content (empty response)" });
    }

    // Save summary if type is summary
    if (type === "summary") {
      note.summary = aiResult;
      await note.save();
    }

    res.status(200).json({ success: true, data: { type, result: aiResult } });
  } catch (error) {
    console.error("AI generation error:", error);
    res.status(500).json({ success: false, message: "Failed to generate AI content", error: error.message });
  }
};

// Legacy summary endpoint (POST)
exports.generateSummary = async (req, res) => {
  try {
    const { noteId } = req.body;
    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }

    const prompt = `Summarize the following note:\n\n${note.content}`;
    const completion = await openai.chat.completions.create({
      model: "openai/gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
    });

    const summary = completion.choices[0].message.content.trim();
    note.summary = summary;
    await note.save();

    res.status(200).json({ success: true, data: { summary } });
  } catch (error) {
    console.error("Error generating summary:", error);
    res.status(500).json({ success: false, message: "Failed to generate summary" });
  }
};

// GET /api/ai/summary?noteId=...
exports.getSummary = async (req, res) => {
  try {
    const { noteId } = req.query;
    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }
    if (!note.summary) {
      return res.status(404).json({ success: false, message: "Summary not found. Generate it first." });
    }
    res.status(200).json({ success: true, data: { summary: note.summary } });
  } catch (error) {
    console.error("Error fetching summary:", error);
    res.status(500).json({ success: false, message: "Failed to fetch summary" });
  }
};

