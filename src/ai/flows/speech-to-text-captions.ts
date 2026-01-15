'use server';
/**
 * @fileOverview Converts spoken words into real-time text captions.
 *
 * - speechToTextCaptions - A function that handles the speech to text conversion process.
 * - SpeechToTextCaptionsInput - The input type for the speechToTextCaptions function.
 * - SpeechToTextCaptionsOutput - The return type for the speechToTextCaptions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SpeechToTextCaptionsInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "The audio data as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type SpeechToTextCaptionsInput = z.infer<typeof SpeechToTextCaptionsInputSchema>;

const SpeechToTextCaptionsOutputSchema = z.object({
  captions: z.string().describe('The generated text captions from the speech.'),
});
export type SpeechToTextCaptionsOutput = z.infer<typeof SpeechToTextCaptionsOutputSchema>;

export async function speechToTextCaptions(input: SpeechToTextCaptionsInput): Promise<SpeechToTextCaptionsOutput> {
  return speechToTextCaptionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'speechToTextCaptionsPrompt',
  input: {schema: SpeechToTextCaptionsInputSchema},
  output: {schema: SpeechToTextCaptionsOutputSchema},
  prompt: `You are a real-time captioning service. Please transcribe the following audio into text captions.\n\nAudio: {{media url=audioDataUri}}`,
});

const speechToTextCaptionsFlow = ai.defineFlow(
  {
    name: 'speechToTextCaptionsFlow',
    inputSchema: SpeechToTextCaptionsInputSchema,
    outputSchema: SpeechToTextCaptionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
