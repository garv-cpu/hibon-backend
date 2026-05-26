const languageNames: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  es: "Spanish"
};

const detectSourceLanguage = (text: string) => {
  if (/[\u0900-\u097F]/.test(text)) {
    return "hi";
  }

  if (/[áéíóúñ¿¡]/i.test(text)) {
    return "es";
  }

  return "en";
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

    if (endpoint) {
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

      if (response.ok) {
        const data =
          await response.json();

        const translatedText =
          data.translatedText ||
          data.translation ||
          text;

        return {
          text: translatedText,
          targetLanguage,
          languageName:
            languageNames[targetLanguage],
          translated:
            translatedText !== text
        };
      }
    }

    const sourceLanguage =
      detectSourceLanguage(text);

    if (sourceLanguage === targetLanguage) {
      return {
        text,
        targetLanguage,
        languageName:
          languageNames[targetLanguage],
        translated: true
      };
    }

    const fallbackUrl =
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        text
      )}&langpair=${sourceLanguage}|${targetLanguage}`;

    const fallbackResponse =
      await fetch(fallbackUrl);

    if (!fallbackResponse.ok) {
      return {
        text,
        targetLanguage,
        languageName:
          languageNames[targetLanguage],
        translated: false,
        message:
          "Translation is temporarily unavailable"
      };
    }

    const fallbackData =
      await fallbackResponse.json();

    const translatedText =
      fallbackData?.responseData?.translatedText ||
      fallbackData?.matches?.[0]?.translation ||
      text;

    return {
      text: translatedText,
      targetLanguage,
      languageName:
        languageNames[targetLanguage],
      translated:
        translatedText !== text
    };
  }
}
