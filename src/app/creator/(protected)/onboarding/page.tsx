'use client';

import { useEffect,useState } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter

import { Button } from '@/components/ui/button';
import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser
import { initializeCreatorOnboardingAction } from '@/features/creator-onboarding/actions/onboarding-actions';
import { StreamlinedOnboardingFlow } from '@/features/creator-onboarding/components/streamlined/StreamlinedOnboardingFlow';
import type { CreatorProfile } from '@/features/creator-onboarding/types';

export default function CreatorOnboardingPage() {
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter(); // Initialize useRouter

  useEffect(() => {
    const initializeOnboarding = async () => {
      try {
        const creatorProfile = await initializeCreatorOnboardingAction();
        setProfile(creatorProfile);
        // If onboarding is already completed, redirect immediately
        if (creatorProfile.onboarding_completed) {
          router.push('/creator/dashboard');
        }
      } catch (error) {
        console.error('Failed to initialize onboarding:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeOnboarding();
  }, [router]); // Add router to dependency array

  const handleOnboardingComplete = (completed?: boolean) => {
    if (completed) {
      router.push('/creator/dashboard/setup-tasks');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing your creator account...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4 text-gray-900">Unable to Access Creator Onboarding</h1>
          <p className="text-gray-600 mb-6">
            There was an issue setting up your creator account. Please try again or contact support.
          </p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Render the streamlined onboarding flow
  return (
    <StreamlinedOnboardingFlow
      profile={profile}
      onComplete={handleOnboardingComplete}
    />
  );
}