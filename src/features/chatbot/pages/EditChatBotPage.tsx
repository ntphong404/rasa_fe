"use client";

import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Network } from "lucide-react";
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
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-cyan-50 to-blue-50">
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Bot className="h-6 w-6 text-cyan-600" />
            {t("Edit ChatBot")}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {t("Update details for the chatbot.")}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-4">
              {/* Basic Info Card */}
              <div className="bg-white border rounded-lg p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
                  <Bot className="h-4 w-4 text-cyan-600" />
                  {t("Basic Information")}
                </h3>
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
              </div>

              {/* Network Configuration Card */}
              <div className="bg-white border rounded-lg p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
                  <Network className="h-4 w-4 text-blue-600" />
                  {t("Network Configuration")}
                </h3>
                <div className="space-y-4">
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
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-6 pb-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("Cancel")}
              </Button>
              <Button type="submit" className="bg-cyan-600 hover:bg-cyan-700">
                {t("Save Changes")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}