'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Copy, Mail } from "lucide-react";
import { InstagramLogo, TelegramLogo, WhatsAppLogo } from "./social-icons";

interface ShareDialogProps {
  roomUrl: string;
  children: React.ReactNode;
}

export default function ShareDialog({ roomUrl, children }: ShareDialogProps) {
  const { toast } = useToast();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(roomUrl);
    toast({ title: "Link Copied!", description: "The room link has been copied to your clipboard." });
  };

  const shareOptions = [
    { 
      name: 'WhatsApp', 
      Icon: WhatsAppLogo,
      url: `https://wa.me/?text=${encodeURIComponent(`Join my LinguaSign meeting: ${roomUrl}`)}`
    },
    { 
      name: 'Telegram', 
      Icon: TelegramLogo,
      url: `https://t.me/share/url?url=${encodeURIComponent(roomUrl)}&text=${encodeURIComponent('Join my LinguaSign meeting')}`
    },
    { 
      name: 'Email', 
      Icon: Mail,
      url: `mailto:?subject=${encodeURIComponent('Join my LinguaSign Meeting')}&body=${encodeURIComponent(`Click the link to join the video call: ${roomUrl}`)}`
    },
    { 
      name: 'Instagram', 
      Icon: InstagramLogo,
      // Instagram does not have a direct share URL API for DMs, this is a placeholder
      action: () => alert('Sharing to Instagram DMs is not directly supported. Please copy the link and share it manually.')
    },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share Meeting</DialogTitle>
          <DialogDescription>
            Invite others to join your meeting.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="room-link" className="text-left">
              Meeting Link
            </Label>
            <div className="flex gap-2">
              <Input id="room-link" value={roomUrl} readOnly />
              <Button variant="outline" size="icon" onClick={handleCopyLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-left">
              Share on social media
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {shareOptions.map(({ name, Icon, url, action }) => (
                 <Button
                    key={name}
                    variant="outline"
                    className="flex flex-col h-20 gap-2"
                    onClick={() => {
                        if (action) {
                            action();
                        } else if (url) {
                            window.open(url, '_blank', 'noopener,noreferrer');
                        }
                    }}
                >
                    <Icon className="h-6 w-6" />
                    <span className="text-xs">{name}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
