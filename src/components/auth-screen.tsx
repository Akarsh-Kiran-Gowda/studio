"use client";

import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LeafIcon } from "@/components/icons";

interface AuthScreenProps {
  onLogin: (password: string) => void;
}

export default function AuthScreen({ onLogin }: AuthScreenProps) {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasStoredData, setHasStoredData] = React.useState(false);

  React.useEffect(() => {
    setHasStoredData(!!localStorage.getItem("verdant-vista-salt"));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password) {
      setIsLoading(true);
      await onLogin(password);
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4">
      <div className="flex flex-col items-center text-center mb-8">
        <LeafIcon className="h-16 w-16 text-primary mb-4" />
        <h1 className="text-4xl font-headline font-bold text-foreground">Verdant Vista</h1>
        <p className="text-muted-foreground mt-2">Your private, secure digital journal.</p>
      </div>
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">{hasStoredData ? "Unlock Your Journal" : "Create a Password"}</CardTitle>
          <CardDescription>
            {hasStoredData 
              ? "Enter your password to access your entries." 
              : "This password will encrypt your journal. Please remember it."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              aria-label="Password"
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Unlocking..." : "Unlock"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground mt-4 text-center max-w-sm">
        All your data is encrypted and stored locally in your browser. We never see your entries or your password.
      </p>
    </main>
  );
}
