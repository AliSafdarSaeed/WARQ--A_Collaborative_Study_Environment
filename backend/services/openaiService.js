const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENROUTER_API_KEY });

exports.moderateContent = async (text) => {
  try {
    const result = await openai.moderations.create({ input: text });
    return result.results[0].flagged;
  } catch (e) {
    return false; // fallback: allow if moderation fails
  }
};

// Analyze a single activity for AI-driven insights
exports.analyzeActivity = async ({ userId, action, duration, projectId, noteId }) => {
  // Example: Use OpenAI to analyze if user is struggling based on duration/action
  try {
    const prompt = `A student performed the following action: ${action} on note/project ${noteId || projectId}. Duration: ${duration} seconds. Suggest if the student might be struggling or excelling.`;
    const completion = await openai.chat.completions.create({
      model: "openai/gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,
    });
    return { aiComment: completion.choices[0].message.content.trim() };
  } catch (e) {
    return null;
  }
};

// Predict study patterns based on analytics data
exports.predictStudyPatterns = async ({ userId, analytics }) => {
  // Example: Use OpenAI to suggest improvements based on analytics
  try {
    const actions = analytics.map(a => `${a.action} on ${a.noteId || a.projectId} for ${a.duration} seconds`).join("; ");
    const prompt = `A student performed these actions: ${actions}. Suggest what topics or study habits they should focus on to improve.`;
    const completion = await openai.chat.completions.create({
      model: "openai/gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 120,
    });
    return { suggestion: completion.choices[0].message.content.trim() };
  } catch (e) {
    return null;
  }
};
