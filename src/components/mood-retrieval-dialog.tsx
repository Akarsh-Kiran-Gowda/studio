"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DiaryEntry } from "@/types";
import { retrieveEntriesByMood } from "@/ai/flows/mood-based-retrieval";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import EntryCard from "./entry-card";
import { Sparkles, Loader2 } from "lucide-react";

interface MoodRetrievalDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  entries: DiaryEntry[];
}

export default function MoodRetrievalDialog({ isOpen, setIsOpen, entries }: MoodRetrievalDialogProps) {
  const [mood, setMood] = React.useState("");
  const [relevantEntries, setRelevantEntries] = React.useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasSearched, setHasSearched] = React.useState(false);
  const { toast } = useToast();

  const handleRetrieve = async () => {
    if (!mood) {
      toast({ title: "Please describe your mood.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    try {
      const result = await retrieveEntriesByMood({
        moodDescription: mood,
        diaryEntries: entries.map(({ id, ...rest }) => rest), // AI flow doesn't need ID
      });

      // Match AI results back to full entries with IDs
      const foundEntries = result.relevantEntries.map(aiEntry => 
        entries.find(e => e.date === aiEntry.date && e.content === aiEntry.content)
      ).filter((e): e is DiaryEntry => e !== undefined);

      setRelevantEntries(foundEntries);

    } catch (error) {
      console.error(error);
      toast({ title: "Error retrieving entries.", description: "Something went wrong.", variant: "destructive" });
      setRelevantEntries([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const onOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset state on close
      setMood("");
      setRelevantEntries([]);
      setHasSearched(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-headline text-2xl">
            <Sparkles className="h-6 w-6 text-accent" />
            Mood Based Retrieval
          </DialogTitle>
          <DialogDescription>
            Describe how you're feeling, and we'll find relevant memories from your journal.
          </DialogDescription>
        </DialogHeader>
        <div className="flex w-full items-center space-x-2">
          <Input
            placeholder="e.g., feeling nostalgic and a bit melancholic"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRetrieve()}
          />
          <Button onClick={handleRetrieve} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Find Entries"}
          </Button>
        </div>
        <ScrollArea className="h-[400px] mt-4 p-1">
          {isLoading ? (
             <div className="flex items-center justify-center h-full text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
             </div>
          ) : hasSearched ? (
            relevantEntries.length > 0 ? (
              <div className="space-y-4 pr-4">
                {relevantEntries.map((entry) => (
                  <EntryCard key={entry.id} entry={entry} onEdit={() => {}} onDelete={() => {}} />
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>No relevant entries found for this mood.</p>
              </div>
            )
          ) : null}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
