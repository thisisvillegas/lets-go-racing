import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface ReminderInput {
    title: string;
    notes: string;
    dueDate?: Date;
    listName?: string;
}

interface ReminderResult {
    success: boolean;
    reminderId?: string;
    error?: string;
}

class AppleRemindersService {
    private defaultList = 'Brain Dump';

    async createReminder(input: ReminderInput): Promise<ReminderResult> {
        const { title, notes, dueDate, listName = this.defaultList } = input;

        // Escape special characters for AppleScript
        const escapedTitle = this.escapeForAppleScript(title);
        const escapedNotes = this.escapeForAppleScript(notes);
        const escapedListName = this.escapeForAppleScript(listName);

        let script = `
tell application "Reminders"
    try
        set targetList to list "${escapedListName}"
    on error
        make new list with properties {name:"${escapedListName}"}
        set targetList to list "${escapedListName}"
    end try

    set newReminder to make new reminder at end of targetList with properties {name:"${escapedTitle}", body:"${escapedNotes}"}
`;

        if (dueDate) {
            const dateStr = this.formatDateForAppleScript(dueDate);
            script += `    set due date of newReminder to date "${dateStr}"\n`;
        }

        script += `
    return id of newReminder
end tell
`;

        try {
            const { stdout, stderr } = await execAsync(`osascript -e '${script}'`);

            if (stderr) {
                console.error('AppleScript stderr:', stderr);
            }

            return {
                success: true,
                reminderId: stdout.trim()
            };
        } catch (error: any) {
            console.error('Failed to create Apple Reminder:', error);
            return {
                success: false,
                error: error.message || 'Failed to create reminder'
            };
        }
    }

    async checkIntegrationStatus(): Promise<{ available: boolean; lists?: string[]; error?: string }> {
        try {
            const { stdout } = await execAsync(`osascript -e 'tell application "Reminders" to return name of lists'`);

            // Parse the comma-separated list of list names
            const lists = stdout.trim().split(', ').map(name => name.trim());

            return {
                available: true,
                lists
            };
        } catch (error: any) {
            return {
                available: false,
                error: error.message || 'Reminders app not accessible'
            };
        }
    }

    async ensureListExists(listName: string): Promise<boolean> {
        const escapedName = this.escapeForAppleScript(listName);

        const script = `
tell application "Reminders"
    try
        set targetList to list "${escapedName}"
        return true
    on error
        make new list with properties {name:"${escapedName}"}
        return true
    end try
end tell
`;

        try {
            await execAsync(`osascript -e '${script}'`);
            return true;
        } catch (error) {
            console.error('Failed to ensure list exists:', error);
            return false;
        }
    }

    private escapeForAppleScript(str: string): string {
        return str
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
    }

    private formatDateForAppleScript(date: Date): string {
        // Format: "December 25, 2025 at 9:00:00 AM"
        return date.toLocaleString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    }
}

export const appleRemindersService = new AppleRemindersService();
