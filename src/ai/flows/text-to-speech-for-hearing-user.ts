'use server';
/**
 * @fileOverview Converts text generated from sign language into synthesized speech for hearing users.
 *
 * - textToSpeechForHearingUser - A function that converts text to speech.
 * - TextToSpeechForHearingUserInput - The input type for the textToSpeechForHearingUser function.
 * - TextToSpeechForHearingUserOutput - The return type for the textToSpeechForHearingUser function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

const TextToSpeechForHearingUserInputSchema = z.object({
  text: z.string().describe('The text to convert to speech.'),
});
export type TextToSpeechForHearingUserInput = z.infer<typeof TextToSpeechForHearingUserInputSchema>;

const TextToSpeechForHearingUserOutputSchema = z.object({
  media: z.string().describe('The audio data as a data URI.'),
});
export type TextToSpeechForHearingUserOutput = z.infer<typeof TextToSpeechForHearingUserOutputSchema>;

export async function textToSpeechForHearingUser(input: TextToSpeechForHearingUserInput): Promise<TextToSpeechForHearingUserOutput> {
  return textToSpeechForHearingUserFlow(input);
}

const textToSpeechForHearingUserFlow = ai.defineFlow(
  {
    name: 'textToSpeechForHearingUserFlow',
    inputSchema: TextToSpeechForHearingUserInputSchema,
    outputSchema: TextToSpeechForHearingUserOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' },
          },
        },
      },
      prompt: input.text,
    });
    if (!media) {
      throw new Error('no media returned');
    }
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    return {
      media: 'data:audio/wav;base64,' + (await toWav(audioBuffer)),
    };
  }
);

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
