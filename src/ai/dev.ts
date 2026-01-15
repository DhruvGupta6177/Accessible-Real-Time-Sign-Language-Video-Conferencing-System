import { config } from 'dotenv';
config();

import '@/ai/flows/speech-to-text-captions.ts';
import '@/ai/flows/speech-to-sign-avatar-for-deaf-user.ts';
import '@/ai/flows/text-to-speech-for-hearing-user.ts';
import '@/ai/flows/sign-to-text-translation.ts';