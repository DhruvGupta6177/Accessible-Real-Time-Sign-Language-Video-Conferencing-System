'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Ear } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const heroImage = PlaceHolderImages.find(p => p.id === 'hero-background');

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (user) {
    router.replace('/dashboard');
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }


  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <div className="absolute inset-0 bg-gradient-animation z-0"></div>
      {heroImage && (
         <Image
          src={heroImage.imageUrl}
          alt={heroImage.description}
          data-ai-hint={heroImage.imageHint}
          fill
          className="object-cover opacity-10 z-0"
        />
      )}
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="py-4 px-6 md:px-10 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <Ear className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-bold text-foreground">LinguaSign</h1>
          </Link>
          <div className="space-x-2">
            <Button asChild variant="ghost">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <div className="max-w-3xl space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold font-headline tracking-tight text-foreground">
              Bridge Worlds, One Sign at a Time.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              LinguaSign is a revolutionary platform that translates sign language and speech in real-time, making video communication seamless and accessible for everyone.
            </p>
            <div className="space-x-4">
              <Button asChild size="lg">
                <Link href="/signup">Get Started Free</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/login">Join a Meeting</Link>
              </Button>
            </div>
          </div>
        </main>

        <footer className="py-6 text-center text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} LinguaSign. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
