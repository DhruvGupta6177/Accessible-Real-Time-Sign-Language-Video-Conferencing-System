'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Ear, Bot, Users, MessageCircle } from 'lucide-react';
import { PlaceHolderImages, ImagePlaceholder } from '@/lib/placeholder-images';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';


const features = [
  {
    title: 'Real-Time Translation',
    description: 'Instantly convert speech to text captions and sign language to spoken words.',
    icon: MessageCircle,
    image: PlaceHolderImages.find(p => p.id === 'feature-translation')
  },
  {
    title: 'Sign Language Avatar',
    description: 'A 3D avatar that performs sign language for deaf or mute users, based on spoken input.',
    icon: Bot,
    image: PlaceHolderImages.find(p => p.id === 'feature-avatar')
  },
  {
    title: 'Seamless Communication',
    description: 'An inclusive meeting experience for everyone, regardless of their hearing ability.',
    icon: Users,
    image: PlaceHolderImages.find(p => p.id === 'feature-communication')
  }
];


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
    <div className="relative min-h-screen w-full overflow-x-hidden bg-background">
      <div className="absolute inset-0 bg-gradient-animation z-0"></div>
      {heroImage && (
         <Image
          src={heroImage.imageUrl}
          alt={heroImage.description}
          data-ai-hint={heroImage.imageHint}
          fill
          className="object-cover opacity-5 dark:opacity-10 z-0"
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

        <main className="flex-1">
          <section className="flex flex-col items-center justify-center text-center px-4 py-20 md:py-32">
            <div className="max-w-3xl space-y-6">
              <h1 
                className="text-5xl md:text-7xl font-bold font-headline tracking-tight text-foreground animate-fade-in-up"
                style={{ animationDelay: '0.2s' }}
              >
                Bridge Worlds, One Sign at a Time.
              </h1>
              <p 
                className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto animate-fade-in-up"
                style={{ animationDelay: '0.4s' }}
              >
                LinguaSign is a revolutionary platform that translates sign language and speech in real-time, making video communication seamless and accessible for everyone.
              </p>
              <div 
                className="space-x-4 animate-fade-in-up"
                style={{ animationDelay: '0.6s' }}
              >
                <Button asChild size="lg">
                  <Link href="/signup">Get Started Free</Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href="/login">Join a Meeting</Link>
                </Button>
              </div>
            </div>
          </section>

          <section id="features" className="py-20 px-4 bg-background/50 backdrop-blur-sm">
            <div className="container mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold">Features Built for Connection</h2>
                <p className="text-muted-foreground mt-2">Discover how LinguaSign breaks down communication barriers.</p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {features.map((feature, index) => (
                  <Card 
                    key={feature.title} 
                    className="group transform transition-all duration-300 hover:scale-105 hover:shadow-xl animate-fade-in-up"
                    style={{ animationDelay: `${0.8 + index * 0.2}s` }}
                  >
                     {feature.image && (
                      <div className="relative h-48 w-full overflow-hidden rounded-t-lg">
                        <Image
                          src={feature.image.imageUrl}
                          alt={feature.title}
                          data-ai-hint={feature.image.imageHint}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <feature.icon className="w-8 h-8 text-primary" />
                        {feature.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

        </main>

        <footer className="py-6 text-center text-muted-foreground text-sm">
          <p>&copy; {new Date().getFullYear()} LinguaSign. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
