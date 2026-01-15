import { Bot } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "./ui/scroll-area";

interface AvatarDisplayProps {
  animationCommands: string;
}

export default function AvatarDisplay({ animationCommands }: AvatarDisplayProps) {
  return (
    <div className="flex-1 flex flex-col gap-2 min-h-0">
       <h3 className="text-sm font-semibold text-muted-foreground">Sign Language Avatar</h3>
      <Card className="flex-1 flex flex-col bg-muted/30">
        <CardContent className="p-4 flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-24 h-24 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Bot className="w-12 h-12 text-accent" />
          </div>
          {animationCommands ? (
            <div className="w-full text-left min-h-0">
              <p className="text-xs text-muted-foreground mb-1">Animation Commands:</p>
              <ScrollArea className="h-24 w-full rounded-md bg-background p-2 border">
                <pre className="font-code text-xs">
                    <code>{animationCommands}</code>
                </pre>
              </ScrollArea>
            </div>
          ) : (
            <p className="text-muted-foreground text-center text-sm">Avatar will animate here based on speech.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
