import OpenAI from 'openai';
import { AppConfig } from '@/config/app';

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

interface GenerateDescriptionParams {
  name: string;
  city?: string;
  country?: string;
  targetLanguage: string;
}

export async function generateDescription({
  name,
  city,
  country,
  targetLanguage
}: GenerateDescriptionParams): Promise<string> {
  try {
    const location = [city, country].filter(Boolean).join(', ');
    const languageName = AppConfig.TTS.LANGUAGES[targetLanguage as keyof typeof AppConfig.TTS.LANGUAGES] || targetLanguage;
    
    const systemMessage = AppConfig.OPENAI.PROMPTS.SYSTEM_MESSAGE(languageName);
    const prompt = AppConfig.OPENAI.PROMPTS.USER_MESSAGE(name, location, languageName);

    const response = await openai.chat.completions.create({
      model: AppConfig.OPENAI.MODEL,
      messages: [
        {
          role: "system",
          content: systemMessage
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: AppConfig.OPENAI.PARAMS.TEMPERATURE,
      max_tokens: AppConfig.OPENAI.PARAMS.MAX_TOKENS,
      presence_penalty: AppConfig.OPENAI.PARAMS.PRESENCE_PENALTY,
      frequency_penalty: AppConfig.OPENAI.PARAMS.FREQUENCY_PENALTY
    });

    return response.choices[0]?.message?.content?.trim() || '';
  } catch (error) {
    console.error('Error generating description:', error);
    throw new Error('Failed to generate description');
  }
}