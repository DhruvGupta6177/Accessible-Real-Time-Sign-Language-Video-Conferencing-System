'use server';

/**
 * @fileOverview A sign language to text translation AI agent.
 *
 * - signToTextTranslation - A function that handles the sign language to text translation process.
 * - SignToTextTranslationInput - The input type for the signToTextTranslation function.
 * - SignToTextTranslationOutput - The return type for the signToTextTranslation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SignToTextTranslationInputSchema = z.object({
  signVideoDataUri: z
    .string()
    .describe(
      "A video of a person signing, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type SignToTextTranslationInput = z.infer<typeof SignToTextTranslationInputSchema>;

const SignToTextTranslationOutputSchema = z.object({
  translation: z.string().describe('The translated text of the sign language video.'),
});
export type SignToTextTranslationOutput = z.infer<typeof SignToTextTranslationOutputSchema>;

export async function signToTextTranslation(input: SignToTextTranslationInput): Promise<SignToTextTranslationOutput> {
  try {
    return await signToTextTranslationFlow(input);
  } catch (error) {
    console.warn('Sign to text failed');
    return { translation: '[AI unavailable]' };
  }
}

const prompt = ai.definePrompt({
  name: 'signToTextTranslationPrompt',
  input: {schema: SignToTextTranslationInputSchema},
  output: {schema: SignToTextTranslationOutputSchema},
  prompt: `You are an expert sign language translator. You will receive a video of a person signing, and you will translate it into text.

Video: {{media url=signVideoDataUri}}`,
});

const signToTextTranslationFlow = ai.defineFlow(
  {
    name: 'signToTextTranslationFlow',
    inputSchema: SignToTextTranslationInputSchema,
    outputSchema: SignToTextTranslationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
