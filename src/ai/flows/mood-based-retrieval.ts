'use server';

/**
 * @fileOverview Retrieves relevant diary entries based on the user's current mood.
 *
 * - retrieveEntriesByMood - A function that takes a mood description and retrieves relevant diary entries.
 * - MoodBasedRetrievalInput - The input type for the retrieveEntriesByMood function.
 * - MoodBasedRetrievalOutput - The return type for the retrieveEntriesByMood function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MoodBasedRetrievalInputSchema = z.object({
  moodDescription: z
    .string()
    .describe('A description of the user\'s current mood.'),
  diaryEntries: z
    .array(z.object({date: z.string(), content: z.string()}))
    .describe('An array of diary entries, each with a date and content.'),
});
export type MoodBasedRetrievalInput = z.infer<typeof MoodBasedRetrievalInputSchema>;

const MoodBasedRetrievalOutputSchema = z.object({
  relevantEntries: z
    .array(z.object({date: z.string(), content: z.string()}))
    .describe('An array of diary entries that are relevant to the user\'s current mood.'),
});
export type MoodBasedRetrievalOutput = z.infer<typeof MoodBasedRetrievalOutputSchema>;

export async function retrieveEntriesByMood(input: MoodBasedRetrievalInput): Promise<MoodBasedRetrievalOutput> {
  return retrieveEntriesByMoodFlow(input);
}

const prompt = ai.definePrompt({
  name: 'moodBasedRetrievalPrompt',
  input: {schema: MoodBasedRetrievalInputSchema},
  output: {schema: MoodBasedRetrievalOutputSchema},
  prompt: `You are an AI assistant designed to retrieve relevant diary entries based on the user\'s current mood.

  The user is currently feeling: {{{moodDescription}}}

  Here are the diary entries:
  {{#each diaryEntries}}
  Date: {{this.date}}
  Content: {{this.content}}
  ---
  {{/each}}

  Based on the user\'s mood, identify the diary entries that are most relevant and might provide insight or perspective. Return only entries that have a strong relevance to the mood description.
  Return the relevant entries in the following JSON format:
  {{json relevantEntries}}`,
});

const retrieveEntriesByMoodFlow = ai.defineFlow(
  {
    name: 'retrieveEntriesByMoodFlow',
    inputSchema: MoodBasedRetrievalInputSchema,
    outputSchema: MoodBasedRetrievalOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
