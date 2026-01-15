'use client';

import { useUser } from '@/firebase';
import LoginPage from '@/app/login/page';
import DashboardPage from './dashboard/page';

export default function Home() {
  const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (user) {
    return <DashboardPage />;
  }

  return <LoginPage />;
}
