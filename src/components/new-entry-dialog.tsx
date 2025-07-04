"use client";

import * as React from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DatePicker } from "@/components/ui/date-picker";
import { DiaryEntry } from "@/types";

interface NewEntryDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSave: (entry: DiaryEntry | Omit<DiaryEntry, "id">) => void;
  entry?: DiaryEntry | null;
  onFinished?: () => void;
}

const entrySchema = z.object({
  date: z.date({ required_error: "A date is required." }),
  content: z.string().min(1, "Your entry cannot be empty."),
});

export default function NewEntryDialog({ isOpen, setIsOpen, onSave, entry, onFinished }: NewEntryDialogProps) {
  const form = useForm<z.infer<typeof entrySchema>>({
    resolver: zodResolver(entrySchema),
    defaultValues: {
      date: entry ? new Date(entry.date) : new Date(),
      content: entry ? entry.content : "",
    },
  });

  React.useEffect(() => {
    if (isOpen) {
        form.reset({
            date: entry ? new Date(entry.date) : new Date(),
            content: entry ? entry.content : "",
        });
    }
  }, [isOpen, entry, form]);


  const onSubmit = (values: z.infer<typeof entrySchema>) => {
    const dataToSave = {
      ...values,
      date: values.date.toISOString(),
    };
    if (entry) {
      onSave({ ...entry, ...dataToSave });
    } else {
      onSave(dataToSave);
    }
    setIsOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
      if(onFinished) onFinished();
    }
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{entry ? "Edit Entry" : "New Entry"}</DialogTitle>
          <DialogDescription>
            {entry ? "Make changes to your journal entry." : "Add a new entry to your journal. Your thoughts are safe here."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <DatePicker 
                        date={field.value}
                        setDate={field.onChange}
                        className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Today's Thoughts</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Write about your day..."
                      className="resize-none h-48"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Save Entry</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
