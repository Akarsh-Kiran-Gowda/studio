"use client";

import * as React from "react";
import { DiaryEntry } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Search, Sparkles, Download, Upload } from "lucide-react";
import EntryCard from "./entry-card";
import NewEntryDialog from "./new-entry-dialog";
import MoodRetrievalDialog from "./mood-retrieval-dialog";
import { LeafIcon } from "./icons";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader, SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";

interface DiaryAppProps {
  entries: DiaryEntry[];
  onUpdateEntries: (entries: DiaryEntry[]) => void;
  encryptionKey: CryptoKey;
}

export default function DiaryApp({ entries, onUpdateEntries, encryptionKey }: DiaryAppProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isNewEntryDialogOpen, setIsNewEntryDialogOpen] = React.useState(false);
  const [editingEntry, setEditingEntry] = React.useState<DiaryEntry | null>(null);
  const [isMoodDialogOpen, setIsMoodDialogOpen] = React.useState(false);
  const { toast } = useToast();

  const sortedEntries = React.useMemo(() => {
    return [...entries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [entries]);

  const filteredEntries = sortedEntries.filter((entry) =>
    entry.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddEntry = (newEntry: Omit<DiaryEntry, "id">) => {
    const entryWithId = { ...newEntry, id: crypto.randomUUID() };
    onUpdateEntries([entryWithId, ...entries]);
  };

  const handleUpdateEntry = (updatedEntry: DiaryEntry) => {
    onUpdateEntries(
      entries.map((entry) => (entry.id === updatedEntry.id ? updatedEntry : entry))
    );
    setEditingEntry(null);
  };

  const handleDeleteEntry = (id: string) => {
    onUpdateEntries(entries.filter((entry) => entry.id !== id));
  };

  const handleEdit = (entry: DiaryEntry) => {
    setEditingEntry(entry);
    setIsNewEntryDialogOpen(true);
  };

  const handleExport = () => {
    const salt = localStorage.getItem("verdant-vista-salt");
    const data = localStorage.getItem("verdant-vista-data");

    if (!salt || !data) {
      toast({
        title: "Nothing to Export",
        description: "You don't have any journal entries saved yet.",
        variant: "destructive",
      });
      return;
    }

    const backupData = JSON.stringify({ salt, data });
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
    </SidebarProvider>
  );
}
