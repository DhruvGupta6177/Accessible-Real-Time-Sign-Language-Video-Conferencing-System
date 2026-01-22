'use server';

/**
 * @fileOverview A flow that translates speech to sign language avatar animation commands.
 *
 * - speechToSignAvatarForDeafUser - A function that handles the speech to sign translation and avatar animation process.
 * - SpeechToSignAvatarForDeafUserInput - The input type for the speechToSignAvatarForDeafUser function.
 * - SpeechToSignAvatarForDeafUserOutput - The return type for the speechToSignAvatarForDeafUser function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SpeechToSignAvatarForDeafUserInputSchema = z.object({
  spokenText: z.string().describe('The text spoken by the hearing user.'),
});
export type SpeechToSignAvatarForDeafUserInput = z.infer<typeof SpeechToSignAvatarForDeafUserInputSchema>;

const SpeechToSignAvatarForDeafUserOutputSchema = z.object({
  avatarAnimationCommands: z.string().describe('Commands to animate a 3D avatar to perform sign language.'),
});
export type SpeechToSignAvatarForDeafUserOutput = z.infer<typeof SpeechToSignAvatarForDeafUserOutputSchema>;

export async function speechToSignAvatarForDeafUser(input: SpeechToSignAvatarForDeafUserInput): Promise<SpeechToSignAvatarForDeafUserOutput> {
  try {
    return await speechToSignAvatarForDeafUserFlow(input);
  } catch (error) {
    console.warn('Speech to sign avatar failed');
    return { avatarAnimationCommands: '[AI unavailable]' };
  }
}

const signSelectionTool = ai.defineTool({
  name: 'selectOptimalSign',
  description: 'Select the optimal sign from among those representing semantically similar but slightly different signing styles, so that the visual register of the output matches the text input.',
  inputSchema: z.object({
    text: z.string().describe('The text to be translated into sign language.'),
    possibleSigns: z.array(z.string()).describe('An array of possible sign language representations for the text.'),
  }),
  outputSchema: z.string().describe('The selected sign language representation.'),
}, async (input) => {
  // TODO: Replace with actual implementation to select the optimal sign.
  // This is a placeholder; in a real application, this would use a more sophisticated selection process.
  return input.possibleSigns[0] || ''; // Return the first sign as a default.
});

const prompt = ai.definePrompt({
  name: 'speechToSignAvatarPrompt',
  tools: [signSelectionTool],
  input: {schema: SpeechToSignAvatarForDeafUserInputSchema},
  output: {schema: SpeechToSignAvatarForDeafUserOutputSchema},
  prompt: `You are a sign language expert. Convert the given text into commands to animate a 3D avatar to perform sign language.

Text: {{{spokenText}}}

Consider the context and choose appropriate signs. If there are multiple ways to sign a word or phrase, select the most common or easily understood sign. Return only the avatar animation commands.

If a tool is available to select the optimal sign, use it.

Output the avatar animation commands:
`, // add safe
});

const speechToSignAvatarForDeafUserFlow = ai.defineFlow(
  {
    name: 'speechToSignAvatarForDeafUserFlow',
    inputSchema: SpeechToSignAvatarForDeafUserInputSchema,
    outputSchema: SpeechToSignAvatarForDeafUserOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
