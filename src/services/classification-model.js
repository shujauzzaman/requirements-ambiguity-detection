const API_URL = "https://shujauzzaman20--ambiguity-detector-v2-fastapi-app.modal.run";

export const fetchClassificationResponse = async (story) => {
  try {
    const response = await fetch(`${API_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ story }),
    });

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return "⚠️ The AI model is starting up, please try again in a moment.";
    }

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();

    const isAmbiguous = data.detected_types.length > 0 || data.has_ambiguity;

    if (isAmbiguous) {
      const detectedList = `<br/><br/>Here are the ambiguity types we found:<br/><b>${data.detected_types.join("<br/>")}</b>`;
      return `Hmm, looks like your user story has a few ambiguity issues. Don't worry though — a little refinement can go a long way! 😊${detectedList}<br/><br/>💡 Try to be more specific about the actions, actors, and expected outcomes in your story.`;
    } else {
      return `Awesome work! 🎉 Your user story is clear, well-defined, and ready for development. Keep it up — this is exactly how great requirements look!`;
    }

  } catch (error) {
    console.error("AI service error:", error);
    return "⚠️ Failed to get AI response. Please try again.";
  }
};