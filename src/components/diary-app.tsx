"use client";

import * as React from "react";
import { DiaryEntry, AppEvent } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search, Sparkles, Download, Upload, CalendarClock, Trash2, Bell, BellOff, Calendar as CalendarIcon } from "lucide-react";
import EntryCard from "./entry-card";
import NewEntryDialog from "./new-entry-dialog";
import MoodRetrievalDialog from "./mood-retrieval-dialog";
import { LeafIcon } from "./icons";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader, SidebarInset, SidebarProvider, SidebarSeparator } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { recognizeEvent, EventRecognitionOutput } from "@/ai/flows/event-recognition";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format } from "date-fns";

interface DiaryAppProps {
  entries: DiaryEntry[];
  onUpdateEntries: (entries: DiaryEntry[]) => void;
  events: AppEvent[];
  onUpdateEvents: (events: AppEvent[]) => void;
  encryptionKey: CryptoKey;
}

export default function DiaryApp({ entries, onUpdateEntries, events, onUpdateEvents, encryptionKey }: DiaryAppProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isNewEntryDialogOpen, setIsNewEntryDialogOpen] = React.useState(false);
  const [editingEntry, setEditingEntry] = React.useState<DiaryEntry | null>(null);
  const [isMoodDialogOpen, setIsMoodDialogOpen] = React.useState(false);
  const [detectedEvent, setDetectedEvent] = React.useState<EventRecognitionOutput['event'] | null>(null);
  const [isEventConfirmOpen, setIsEventConfirmOpen] = React.useState(false);
  const { toast } = useToast();

  const sortedEntries = React.useMemo(() => {
    return [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [entries]);

  const upcomingEvents = React.useMemo(() => {
    return events
      .filter(event => new Date(event.date) >= new Date())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events]);

  const filteredEntries = sortedEntries.filter((entry) =>
    entry.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const checkForEvent = async (content: string) => {
    try {
      const result = await recognizeEvent({
        entryContent: content,
        currentDate: new Date().toISOString(),
      });
      if (result.hasEvent && result.event) {
        setDetectedEvent(result.event);
        setIsEventConfirmOpen(true);
      }
    } catch (error) {
      console.error("Event recognition failed:", error);
      toast({ title: "Could not check for events.", variant: "destructive" });
    }
  };

  const handleAddEntry = async (newEntry: Omit<DiaryEntry, "id">) => {
    const entryWithId = { ...newEntry, id: crypto.randomUUID() };
    onUpdateEntries([entryWithId, ...entries]);
    await checkForEvent(newEntry.content);
  };

  const handleUpdateEntry = async (updatedEntry: DiaryEntry) => {
    onUpdateEntries(
      entries.map((entry) => (entry.id === updatedEntry.id ? updatedEntry : entry))
    );
    setEditingEntry(null);
    await checkForEvent(updatedEntry.content);
  };

  const handleDeleteEntry = (id: string) => {
    onUpdateEntries(entries.filter((entry) => entry.id !== id));
  };

  const handleEdit = (entry: DiaryEntry) => {
    setEditingEntry(entry);
    setIsNewEntryDialogOpen(true);
  };

  const handleSaveEvent = () => {
    if (detectedEvent) {
      const newEvent: AppEvent = {
        id: crypto.randomUUID(),
        title: detectedEvent.title!,
        date: detectedEvent.date!,
      };
      onUpdateEvents([...events, newEvent]);
      toast({
        title: "Event Saved",
        description: `"${newEvent.title}" has been added to your upcoming events.`,
      });
    }
    setIsEventConfirmOpen(false);
    setDetectedEvent(null);
  };

  const handleDeleteEvent = (id: string) => {
    onUpdateEvents(events.filter(event => event.id !== id));
  };


  const handleExport = () => {
    const salt = localStorage.getItem("verdant-vista-salt");
    const data = localStorage.getItem("verdant-vista-data");
    const eventsData = localStorage.getItem("verdant-vista-events");

    if (!salt || !data) {
      toast({
        title: "Nothing to Export",
        description: "You don't have any journal entries saved yet.",
        variant: "destructive",
      });
      return;
    }

    const backupData = JSON.stringify({ salt, data, events: eventsData });
    const blob = new Blob([backupData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `verdant-vista-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      title: "Export Successful",
      description: "Your journal has been saved to your downloads folder.",
    });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error("Invalid file content");
        }
        const backup = JSON.parse(text);
        if (backup.salt && backup.data) {
          localStorage.setItem("verdant-vista-salt", backup.salt);
          localStorage.setItem("verdant-vista-data", backup.data);
          if (backup.events) {
            localStorage.setItem("verdant-vista-events", backup.events);
          }
          alert("Import successful! The page will now reload. Please unlock your journal with your original password.");
          window.location.reload();
        } else {
          throw new Error("Invalid backup file format.");
        }
      } catch (error) {
        console.error("Import failed:", error);
        toast({
          title: "Import Failed",
          description: "Please check the backup file format and try again.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const triggerImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = handleImport;
    input.click();
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
            <div className="flex items-center gap-2">
                <LeafIcon className="w-8 h-8 text-primary"/>
                <h1 className="text-2xl font-headline font-bold">Verdant Vista</h1>
            </div>
        </SidebarHeader>
        <SidebarContent>
            <SidebarGroup>
                <Button className="w-full" onClick={() => setIsNewEntryDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> New Entry
                </Button>
                <div className="relative mt-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search entries..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                 <Button variant="outline" className="w-full mt-4" onClick={() => setIsMoodDialogOpen(true)}>
                    <Sparkles className="mr-2 h-4 w-4 text-accent" /> Mood Retrieval
                </Button>
            </SidebarGroup>
            <SidebarSeparator />
            <SidebarGroup>
                <h2 className="text-lg font-headline px-2 mb-2 flex items-center gap-2">
                  <CalendarClock className="h-5 w-5" /> Upcoming Events
                </h2>
                {upcomingEvents.length > 0 ? (
                  <ul className="space-y-2 px-2">
                    {upcomingEvents.map(event => (
                      <li key={event.id} className="group flex items-center justify-between text-sm p-2 rounded-md hover:bg-sidebar-accent">
                        <div>
                          <p className="font-semibold">{event.title}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(event.date), "EEE, MMM d, yyyy 'at' h:mm a")}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => handleDeleteEvent(event.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-2 text-sm text-muted-foreground">No upcoming events.</p>
                )}
            </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <Button variant="outline" className="w-full" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" /> Export Journal
          </Button>
          <Button variant="outline" className="w-full mt-2" onClick={triggerImport}>
              <Upload className="mr-2 h-4 w-4" /> Import Journal
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          {filteredEntries.length > 0 ? (
            <div className="grid gap-6 animate-in fade-in-50">
              {filteredEntries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  onEdit={() => handleEdit(entry)}
                  onDelete={() => handleDeleteEntry(entry.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <LeafIcon className="w-16 h-16 mb-4" />
              <h2 className="text-xl font-semibold">Your journal is empty</h2>
              <p className="mt-2">Click "New Entry" to start writing.</p>
            </div>
          )}
        </main>
      </SidebarInset>
      
      <NewEntryDialog
        isOpen={isNewEntryDialogOpen}
        setIsOpen={setIsNewEntryDialogOpen}
        onSave={editingEntry ? handleUpdateEntry : handleAddEntry}
        entry={editingEntry}
        onFinished={() => setEditingEntry(null)}
      />

      <MoodRetrievalDialog
        isOpen={isMoodDialogOpen}
        setIsOpen={setIsMoodDialogOpen}
        entries={entries}
      />

      <AlertDialog open={isEventConfirmOpen} onOpenChange={setIsEventConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2"><CalendarIcon className="h-5 w-5" /> Event Found!</AlertDialogTitle>
            <AlertDialogDescription>
              I noticed you mentioned an event. Would you like to save it to your "Upcoming Events" list?
              <div className="font-semibold text-foreground bg-muted p-3 rounded-md mt-4">
                <p>{detectedEvent?.title}</p>
                <p className="text-sm font-normal">{detectedEvent?.date ? format(new Date(detectedEvent.date), "PPPPp") : ''}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDetectedEvent(null)}><BellOff className="mr-2"/>No, thanks</AlertDialogCancel>
            <AlertDialogAction onClick={handleSaveEvent}><Bell className="mr-2" />Yes, save it</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}
