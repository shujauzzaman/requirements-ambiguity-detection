const API_URL = "https://shujauzzaman20--classify.modal.run";

export const fetchClassificationResponse = async (story) => {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_story: story }),  // ← renamed field
    });

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return "⚠️ The AI model is starting up, please try again in a moment.";
    }

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();

    if (data.is_ambiguous) {
      const detectedList = data.ambiguity_types?.length
        ? `<br/><br/>Here are the ambiguity types we found:<br/><b>${data.ambiguity_types.join("<br/>")}</b>`
        : "";

      const explanation = data.explanation
        ? `<br/><br/>📝 ${data.explanation}`
        : "";

      const questions = data.clarification_questions?.length
        ? `<br/><br/>❓ <b>Clarification questions:</b><br/>${data.clarification_questions.join("<br/>")}`
        : "";

      const improved = data.improved_version
        ? `<br/><br/>✨ <b>Improved version:</b><br/>${data.improved_version}`
        : "";

      return `Hmm, looks like your user story has a few ambiguity issues. Don't worry though — a little refinement can go a long way! 😊${detectedList}${explanation}${questions}${improved}`;
    } else {
      return `Awesome work! 🎉 Your user story is clear, well-defined, and ready for development. Keep it up — this is exactly how great requirements look!`;
    }

  } catch (error) {
    console.error("AI service error:", error);
    return "⚠️ Failed to get AI response. Please try again.";
  }
};