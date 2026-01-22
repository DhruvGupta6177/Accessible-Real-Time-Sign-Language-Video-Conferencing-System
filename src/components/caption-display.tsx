"use client";

import { useRef, useEffect } from 'react';
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { cn } from '@/lib/utils';
import { MessageCircle } from 'lucide-react';

type Caption = {
  id: number;
  text: string;
  source: "local" | "remote";
};

interface CaptionDisplayProps {
  captions: Caption[];
}

export default function CaptionDisplay({ captions }: CaptionDisplayProps) {
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [captions]);

  return (
    <div className="flex-1 flex flex-col gap-2 min-h-0">
      <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
        <MessageCircle className="w-4 h-4" />
        Chat & Captions
      </h3>
      <ScrollAreaPrimitive.Root className="flex-1 rounded-md border bg-muted/30 overflow-hidden">
        <ScrollAreaPrimitive.Viewport ref={viewportRef} className="h-full w-full rounded-[inherit] p-4 text-sm">
        <div className="flex flex-col gap-3">
          {captions.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <MessageCircle className="w-8 h-8 mb-2" />
              <p>Chat messages and captions will appear here.</p>
            </div>
          )}
          {captions.map((caption) => (
            <div
              key={caption.id}
              className={cn(
                "flex flex-col rounded-lg px-3 py-2 max-w-[85%] shadow-sm",
                caption.source === 'local' ? 'bg-primary/90 text-primary-foreground self-end' : 'bg-card self-start'
              )}
            >
              <p>{caption.text}</p>
            </div>
          ))}
        </div>
        </ScrollAreaPrimitive.Viewport>
      </ScrollAreaPrimitive.Root>
    </div>
  );
}
