'use client';

import { useMemo } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';

export interface Meeting {
  id: string;
  hostId: string;
  inviteLink: string;
  startTime: string;
  endTime?: string;
}

export function useMeetings() {
  const { user } = useUser();
  const firestore = useFirestore();

  const meetingsQuery = useMemoFirebase(() => {
    if (!user) return null;
    const meetingsColRef = collection(firestore, 'users', user.uid, 'meetings');
    return query(meetingsColRef, orderBy('startTime', 'desc'));
  }, [user, firestore]);

  const { data: meetings, isLoading, error } = useCollection<Meeting>(meetingsQuery);

  return { meetings, isLoading, error };
}
