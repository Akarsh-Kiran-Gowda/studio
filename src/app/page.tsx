"use client";

import * as React from "react";
import { useToast } from "@/hooks/use-toast";
import { DiaryEntry, EncryptedData } from "@/types";
import { deriveKey, encrypt, decrypt } from "@/lib/crypto";
import AuthScreen from "@/components/auth-screen";
import DiaryApp from "@/components/diary-app";
import { Leaf } from "lucide-react";

const SALT_KEY = "verdant-vista-salt";
const DATA_KEY = "verdant-vista-data";

export default function Home() {
  const [key, setKey] = React.useState<CryptoKey | null>(null);
  const [entries, setEntries] = React.useState<DiaryEntry[]>([]);
  const [isUnlocked, setIsUnlocked] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  const handleLogin = async (password: string) => {
    setLoading(true);
    try {
      let salt = localStorage.getItem(SALT_KEY);
      let saltBytes: Uint8Array;

      if (salt) {
        saltBytes = Uint8Array.from(atob(salt), (c) => c.charCodeAt(0));
      } else {
        saltBytes = window.crypto.getRandomValues(new Uint8Array(16));
        localStorage.setItem(SALT_KEY, btoa(String.fromCharCode(...saltBytes)));
      }

      const derivedKey = await deriveKey(password, saltBytes);
      setKey(derivedKey);

      const encryptedDataJSON = localStorage.getItem(DATA_KEY);
      if (encryptedDataJSON) {
        const encryptedData: EncryptedData = JSON.parse(encryptedDataJSON);
        const decryptedEntries = await decrypt<DiaryEntry[]>(derivedKey, encryptedData);
        setEntries(decryptedEntries);
      } else {
        setEntries([]);
      }
      setIsUnlocked(true);
    } catch (error) {
      console.error("Login failed:", error);
      toast({
        title: "Error",
        description: "Failed to decrypt data. Please check your password.",
        variant: "destructive",
      });
      setIsUnlocked(false);
    } finally {
      setLoading(false);
    }
  };
  
  React.useEffect(() => {
    // This effect runs once on mount to check if we can skip the auth screen.
    // In a real app, you might use session management instead of this approach.
    // For this client-only demo, we just set loading to false to show the auth screen.
    setLoading(false);
  }, []);

  const handleUpdateEntries = async (updatedEntries: DiaryEntry[]) => {
    if (!key) {
      toast({
        title: "Error",
        description: "No encryption key available. Please log in again.",
        variant: "destructive",
      });
      setIsUnlocked(false);
      return;
    }

    try {
      setEntries(updatedEntries);
      const encryptedData = await encrypt(key, updatedEntries);
      localStorage.setItem(DATA_KEY, JSON.stringify(encryptedData));
    } catch (error) {
      console.error("Failed to save entries:", error);
      toast({
        title: "Error",
        description: "Failed to save your journal entry.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Leaf className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your journal...</p>
        </div>
      </div>
    );
  }

  if (!isUnlocked || !key) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  return (
    <DiaryApp
      entries={entries}
      onUpdateEntries={handleUpdateEntries}
      encryptionKey={key}
    />
  );
}
