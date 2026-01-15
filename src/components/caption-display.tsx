"use client";

import { useRef, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from '@/lib/utils';

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
      <h3 className="text-sm font-semibold text-muted-foreground flex-shrink-0">Real-time Captions</h3>
      <ScrollArea className="flex-1 rounded-md border p-4 text-sm bg-muted/30" viewportRef={viewportRef}>
        <div className="flex flex-col gap-3">
          {captions.length === 0 && <p className="text-muted-foreground text-center">Captions will appear here...</p>}
          {captions.map((caption) => (
            <div
              key={caption.id}
              className={cn(
                "flex flex-col rounded-lg px-3 py-2 max-w-[85%] shadow-sm",
                caption.source === 'local' ? 'bg-primary/80 text-primary-foreground self-end' : 'bg-card self-start'
              )}
            >
              <p>{caption.text}</p>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
