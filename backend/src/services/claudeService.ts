import Anthropic from '@anthropic-ai/sdk';
import { ParsedIdea } from '../database';

interface ParseResult {
    ideas: ParsedIdea[];
    processingTimeMs: number;
    model: string;
}

class ClaudeService {
    private client: Anthropic;
    private model = 'claude-sonnet-4-20250514';

    constructor() {
        const apiKey = process.env.CLAUDE_API_KEY;
        if (!apiKey) {
            console.warn('CLAUDE_API_KEY not set - Claude parsing will not work');
        }
        this.client = new Anthropic({
            apiKey: apiKey || 'placeholder'
        });
    }

    async parseBrainDump(content: string, existingBuckets: string[]): Promise<ParseResult> {
        const startTime = Date.now();

        const systemPrompt = this.getSystemPrompt(existingBuckets);
        const userMessage = this.getUserMessage(content);

        try {
            const response = await this.client.messages.create({
                model: this.model,
                max_tokens: 4096,
                system: systemPrompt,
                messages: [{ role: 'user', content: userMessage }]
            });

            const ideas = this.parseResponse(response);

            return {
                ideas,
                processingTimeMs: Date.now() - startTime,
                model: this.model
            };
        } catch (error: any) {
            console.error('Claude API error:', error.message);
            throw new Error(`Failed to parse brain dump: ${error.message}`);
        }
    }

    private getSystemPrompt(existingBuckets: string[]): string {
        const bucketList = existingBuckets.length > 0
            ? existingBuckets.join(', ')
            : 'Work, Music, Social, Motorcycles, Health, Ideas, Unsorted';

        return `You are an AI assistant specialized in parsing brain dumps - stream-of-consciousness notes from voice recordings or rapid note-taking sessions. Your job is to:

1. IDENTIFY discrete ideas, tasks, and thoughts within a jumbled, context-switching text
2. SEPARATE them into individual, actionable items
3. CATEGORIZE each into one of the user's buckets: ${bucketList}
4. EXTRACT any time-bound elements (deadlines, reminders, scheduled items)
5. DETERMINE if each item is actionable (a todo) or just a note/thought

Rules:
- Preserve the original meaning and context
- Create concise titles (max 80 characters)
- Keep the full original text segment in the content field
- If uncertain about bucket, suggest "Unsorted"
- For dates/times, interpret relative terms like "tomorrow", "next week" based on current date
- Return ONLY valid JSON, no markdown code blocks or explanations
- Suggest 0-3 relevant labels per idea (short, lowercase, hyphenated)

Output format (JSON only):
{
  "ideas": [
    {
      "title": "Brief summary of the idea",
      "content": "Full original text segment from the brain dump",
      "suggestedBucket": "Work",
      "isActionable": true,
      "suggestedLabels": ["urgent", "project-x"],
      "suggestedReminder": "2025-12-26T09:00:00Z"
    }
  ]
}

If suggestedReminder is not applicable, omit it or set to null.`;
    }

    private getUserMessage(content: string): string {
        const currentDate = new Date().toISOString().split('T')[0];

        return `Current date: ${currentDate}

Brain dump content:
---
${content}
---

Parse this into discrete ideas and return JSON only.`;
    }

    private parseResponse(response: Anthropic.Message): ParsedIdea[] {
        // Extract text from response
        const textBlock = response.content.find(block => block.type === 'text');
        if (!textBlock || textBlock.type !== 'text') {
            throw new Error('No text response from Claude');
        }

        let jsonText = textBlock.text.trim();

        // Remove markdown code blocks if present
        if (jsonText.startsWith('```json')) {
            jsonText = jsonText.slice(7);
        } else if (jsonText.startsWith('```')) {
            jsonText = jsonText.slice(3);
        }
        if (jsonText.endsWith('```')) {
            jsonText = jsonText.slice(0, -3);
        }
        jsonText = jsonText.trim();

        try {
            const parsed = JSON.parse(jsonText);

            if (!parsed.ideas || !Array.isArray(parsed.ideas)) {
                throw new Error('Invalid response format: missing ideas array');
            }

            // Validate and sanitize each idea
            return parsed.ideas.map((idea: any) => ({
                title: String(idea.title || 'Untitled').slice(0, 80),
                content: String(idea.content || ''),
                suggestedBucket: String(idea.suggestedBucket || 'Unsorted'),
                isActionable: Boolean(idea.isActionable),
                suggestedLabels: Array.isArray(idea.suggestedLabels)
                    ? idea.suggestedLabels.map((l: any) => String(l).toLowerCase().slice(0, 20))
                    : [],
                suggestedReminder: idea.suggestedReminder || undefined
            }));
        } catch (error: any) {
            console.error('Failed to parse Claude response:', jsonText);
            throw new Error(`Failed to parse Claude response: ${error.message}`);
        }
    }
}

export const claudeService = new ClaudeService();
