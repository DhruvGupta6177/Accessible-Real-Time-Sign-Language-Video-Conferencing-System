import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

let ai: any = null;

try {
  ai = genkit({
    plugins: [googleAI()],
    model: 'googleai/gemini-2.5-flash',
  });
} catch (error) {
  console.warn('Genkit initialization failed - AI features disabled');
  ai = { definePrompt: () => ({}), defineFlow: () => () => Promise.resolve({}) };
}

export { ai };
