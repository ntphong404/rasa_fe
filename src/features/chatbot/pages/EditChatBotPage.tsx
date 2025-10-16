"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { chatBotService } from "../api/service";
import { ChatBot } from "../api/dto/ChatBotResponse";

const editChatBotSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  ip: z.string().min(1, { message: "IP address is required" }),
  rasaPort: z.number().min(1, { message: "Rasa port is required" }),
  flaskPort: z.number().min(1, { message: "Flask port is required" }),
  roles: z.array(z.string()).default([]),
});

interface EditChatBotDialogProps {
  chatBot: ChatBot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChatBotUpdated: () => void;
}

export function EditChatBotDialog({
  chatBot,
  open,
  onOpenChange,
  onChatBotUpdated,
}: EditChatBotDialogProps) {
  const { t } = useTranslation();

  const form = useForm<z.infer<typeof editChatBotSchema>>({
    resolver: zodResolver(editChatBotSchema),
    defaultValues: {
      name: "",
      ip: "",
      rasaPort: 5005,
      flaskPort: 5000,
      roles: [],
    },
  });

  useEffect(() => {
    if (chatBot) {
      form.reset({
        name: chatBot.name || "",
        ip: chatBot.ip || "",
        rasaPort: chatBot.rasaPort || 5005,
        flaskPort: chatBot.flaskPort || 5000,
        roles: chatBot.roles?.map((role: string | { _id: string; name?: string }) => 
          typeof role === 'string' ? role : role._id
        ) || [],
      });
    }
  }, [chatBot, form]);

  const onSubmit = async (data: z.infer<typeof editChatBotSchema>) => {
    if (!chatBot) return;
    try {
      await chatBotService.updateChatBot(chatBot._id, {
      _id: chatBot._id,
      ...data,
    });
      onChatBotUpdated();
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Error updating chatbot:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-lg max-h-[80vh] overflow-y-auto p-4">
        <DialogHeader>
          <DialogTitle>{t("Edit ChatBot")}</DialogTitle>
          <DialogDescription>
            {t("Update details for the chatbot.")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("ChatBot Name")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("Enter chatbot name")}
                      {...field}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ip"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("IP Address")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("Enter IP address (e.g., 192.168.1.100)")}
                      {...field}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rasaPort"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Rasa Port")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="5005"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="flaskPort"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("Flask Port")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="5000"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit">{t("Save")}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}