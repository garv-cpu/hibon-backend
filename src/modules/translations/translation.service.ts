const languageNames: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  es: "Spanish"
};

interface TranslateInput {
  text: string;
  targetLanguage: "en" | "hi" | "es";
}

export class TranslationService {
  static async translate({
    text,
    targetLanguage
  }: TranslateInput) {
    const endpoint =
      process.env.TRANSLATE_API_URL;

    if (!endpoint) {
      return {
        text,
        targetLanguage,
        languageName:
          languageNames[targetLanguage],
        translated: false,
        message:
          "Translation provider is not configured"
      };
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        q: text,
        source: "auto",
        target: targetLanguage,
        format: "text"
      })
    });

    if (!response.ok) {
      return {
        text,
        targetLanguage,
        languageName:
          languageNames[targetLanguage],
        translated: false,
        message:
          "Translation provider failed"
      };
    }

    const data =
      await response.json();

    return {
      text:
        data.translatedText ||
        data.translation ||
        text,
      targetLanguage,
      languageName:
        languageNames[targetLanguage],
      translated:
        Boolean(
          data.translatedText ||
            data.translation
        )
    };
  }
}
