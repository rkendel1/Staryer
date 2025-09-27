'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { SuccessAnimation, useSuccessAnimation } from '@/components/ui/success-animation';

import { completeOnboardingAction,completeOnboardingStepAction } from '../../actions/onboarding-actions';
import type { CreatorProfile } from '../../types';

import { StreamlinedBrandSetupStep } from './StreamlinedBrandSetupStep';
import { StreamlinedStripeConnectStep } from './StreamlinedStripeConnectStep';
import { StreamlinedWelcomeStep } from './StreamlinedWelcomeStep';

// Simplified 3-step onboarding flow
const STREAMLINED_STEPS = [
  {
    id: 1,
    title: 'Welcome to Staryer',
    description: 'Complete your account setup in just a few clicks',
    component: 'StreamlinedWelcomeStep',
    required: true,
  },
  {
    id: 2,
    title: 'Brand Setup',
    description: 'Upload your logo or let us extract it from your website',
    component: 'StreamlinedBrandSetupStep',
    required: false, // Optional step
  },
  {
    id: 3,
    title: 'Payment Setup',
    description: 'Connect Stripe to start accepting payments',
    component: 'StreamlinedStripeConnectStep',
    required: false, // Optional step
  },
];

interface StreamlinedOnboardingFlowProps {
  profile: CreatorProfile;
  onComplete: (completed?: boolean) => void;
}

export function StreamlinedOnboardingFlow({ profile, onComplete }: StreamlinedOnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFunction, setSubmitFunction] = useState<(() => Promise<void>) | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  
  const { isVisible, triggerSuccess } = useSuccessAnimation();

  // Initialize completed steps based on profile
  useEffect(() => {
    const completed = new Set<number>();
    
    // Step 1 is always completed if we have a profile
    if (profile.id) {
      completed.add(1);
    }
    
    // Step 2 is completed if we have branding data
    if (profile.business_logo || profile.extracted_branding_data) {
      completed.add(2);
    }
    
    // Step 3 is completed if Stripe is connected
    if (profile.stripe_account_enabled) {
      completed.add(3);
    }
    
    setCompletedSteps(completed);
  }, [profile]);

  const handleNext = async () => {
    if (submitFunction) {
      setIsSubmitting(true);
      try {
        await submitFunction();
        
        // Mark current step as completed
        await completeOnboardingStepAction(currentStep);
        setCompletedSteps(prev => new Set([...prev, currentStep]));
        
        // Move to next step or complete onboarding
        if (currentStep < STREAMLINED_STEPS.length) {
          setCurrentStep(currentStep + 1);
        } else {
          // All steps completed - finish onboarding
          await handleCompleteOnboarding();
        }
      } catch (error) {
        console.error('Error completing step:', error);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // No submit function, just move to next step
      if (currentStep < STREAMLINED_STEPS.length) {
        setCurrentStep(currentStep + 1);
      } else {
        await handleCompleteOnboarding();
      }
    }
  };

  const handleSkip = async () => {
    // Skip optional steps
    const step = STREAMLINED_STEPS[currentStep - 1];
    if (!step.required) {
      if (currentStep < STREAMLINED_STEPS.length) {
        setCurrentStep(currentStep + 1);
      } else {
        await handleCompleteOnboarding();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCompleteOnboarding = async () => {
    try {
      // Mark onboarding as completed and trigger background tasks
      await completeOnboardingAction();
      
      triggerSuccess();
      
      // Small delay to show success animation
      setTimeout(() => {
        onComplete(true);
      }, 1500);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const currentStepData = STREAMLINED_STEPS[currentStep - 1];
  const isLastStep = currentStep === STREAMLINED_STEPS.length;
  const canSkip = !currentStepData.required;
  const isStepCompleted = completedSteps.has(currentStep);

  const renderStepComponent = () => {
    switch (currentStepData.component) {
      case 'StreamlinedWelcomeStep':
        return (
          <StreamlinedWelcomeStep
            profile={profile}
            onNext={handleNext}
            setSubmitFunction={setSubmitFunction}
          />
        );
      case 'StreamlinedBrandSetupStep':
        return (
          <StreamlinedBrandSetupStep
            profile={profile}
            onNext={handleNext}
            setSubmitFunction={setSubmitFunction}
          />
        );
      case 'StreamlinedStripeConnectStep':
        return (
          <StreamlinedStripeConnectStep
            profile={profile}
            onNext={handleNext}
            setSubmitFunction={setSubmitFunction}
          />
        );
      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Get Started with Staryer
            </h1>
            <span className="text-sm text-gray-500">
              Step {currentStep} of {STREAMLINED_STEPS.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / STREAMLINED_STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold mb-2 text-gray-900">
              {currentStepData.title}
            </h2>
            <p className="text-gray-600">
              {currentStepData.description}
            </p>
          </div>

          {renderStepComponent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1 || isSubmitting}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="flex gap-3">
            {canSkip && (
              <Button
                variant="outline"
                onClick={handleSkip}
                disabled={isSubmitting}
              >
                Skip for now
              </Button>
            )}
            
            <Button
              onClick={handleNext}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  {isLastStep ? 'Completing...' : 'Saving...'}
                </>
              ) : (
                <>
                  {isLastStep ? 'Complete Setup' : 'Continue'}
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Success Animation */}
      <SuccessAnimation 
        isVisible={isVisible}
        message="Welcome to Staryer! Your account is ready."
      />
    </div>
  );
}