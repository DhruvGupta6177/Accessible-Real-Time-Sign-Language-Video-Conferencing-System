# **App Name**: LinguaSign

## Core Features:

- Meet-like Video Call: Establish a peer-to-peer video call between two users using WebRTC, initiated by an invite link.
- Speech-to-Text: Convert spoken words from a hearing user into real-time text captions using Whisper or Google STT.
- Sign-to-Text: Translate sign language gestures from a deaf user into text using MediaPipe Hands and an LSTM/CNN model.
- Text-to-Speech: Convert translated text into synthesized speech using gTTS or Azure TTS, outputting the audio to the hearing user.
- Speech-to-Sign Avatar: Animate a 3D avatar to perform sign language based on text input, providing visual translation for deaf users. The LLM will be used as a tool, where needed, to select the optimal sign, from among those representing semantically similar but slightly different signing styles, so that the visual register of the output matches the text input. 

## Style Guidelines:

- Primary color: Soft sky blue (#87CEEB) to evoke a sense of calm and communication.
- Background color: Very light blue (#F0F8FF), near-white, to keep focus on the video and translated text.
- Accent color: Muted violet (#8A2BE2), drawing the eye and harmonizing well with blue without causing distraction.
- Body and headline font: 'PT Sans', a humanist sans-serif, for clarity and approachability in both headings and text.
- Code font: 'Source Code Pro' for any technical displays or code snippets.
- Use clear, minimalist icons for call controls and settings to ensure ease of use.
- Prioritize a clean and intuitive layout with video feeds prominently displayed and captions easily readable.
- Implement subtle animations to enhance user experience, such as smooth transitions for caption updates.