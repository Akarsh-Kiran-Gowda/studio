'use server';

/**
 * @fileOverview Recognizes events within a diary entry using AI.
 *
 * - recognizeEvent - A function that takes entry content and identifies any potential event.
 * - EventRecognitionInput - The input type for the recognizeEvent function.
 * - EventRecognitionOutput - The return type for the recognizeEvent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EventRecognitionInputSchema = z.object({
  entryContent: z
    .string()
    .describe('The text content of the diary entry to be analyzed.'),
  currentDate: z.string().describe('The current date in ISO format, to help resolve relative dates like "tomorrow".'),
});
export type EventRecognitionInput = z.infer<typeof EventRecognitionInputSchema>;

const EventRecognitionOutputSchema = z.object({
  hasEvent: z
    .boolean()
    .describe('Whether a potential future event was found in the entry.'),
  event: z.object({
      title: z.string().describe('A concise title for the event.'),
      date: z.string().describe('The full date and time of the event in ISO 8601 format.'),
    })
    .optional()
    .describe('The details of the event, if one was found.'),
});
export type EventRecognitionOutput = z.infer<typeof EventRecognitionOutputSchema>;

export async function recognizeEvent(input: EventRecognitionInput): Promise<EventRecognitionOutput> {
  return eventRecognitionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'eventRecognitionPrompt',
  input: {schema: EventRecognitionInputSchema},
  output: {schema: EventRecognitionOutputSchema},
  prompt: `You are an AI assistant that detects future events in a user's diary entry.
The user is writing in their journal. Your task is to determine if they mention a specific, future event, like an appointment, meeting, or celebration.
The current date is {{{currentDate}}}. Use this to resolve relative dates (e.g., "tomorrow", "next Friday").

If you find a future event, set hasEvent to true and provide the event title and its full date and time in ISO 8601 format.
If there is no mention of a specific future event, or the event is in the past, set hasEvent to false.

Do not create events for vague plans, past events, or general statements. For example, "I should work out more" is not an event. "My birthday was last week" is a past event. "I have a dentist appointment tomorrow at 3 PM" is a valid future event.

Diary Entry:
"{{{entryContent}}}"`,
});

const eventRecognitionFlow = ai.defineFlow(
  {
    name: 'eventRecognitionFlow',
    inputSchema: EventRecognitionInputSchema,
    outputSchema: EventRecognitionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
