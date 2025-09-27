'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Rocket, Users, Zap } from 'lucide-react';

import type { CreatorProfile } from '../../types';

interface StreamlinedWelcomeStepProps {
  profile: CreatorProfile;
  onNext: () => void;
  setSubmitFunction: (fn: (() => Promise<void>) | null) => void;
}

export function StreamlinedWelcomeStep({ profile, onNext, setSubmitFunction }: StreamlinedWelcomeStepProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // No submit function needed for welcome step
    setSubmitFunction(null);
    
    // Simulate a brief loading/preparation time
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [setSubmitFunction]);

  return (
    <div className="space-y-8">
      {/* Welcome Message */}
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Rocket className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome to Staryer, {profile.business_name || 'Creator'}!
        </h3>
        
        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
          You're about to transform how you deliver your SaaS products. 
          We'll have you up and running in just a few minutes.
        </p>
      </div>

      {/* Value Propositions */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="text-center p-6 bg-blue-50 rounded-lg">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="h-6 w-6 text-blue-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Instant Setup</h4>
          <p className="text-sm text-gray-600">
            Get your white-labeled SaaS portal running in minutes, not hours
          </p>
        </div>

        <div className="text-center p-6 bg-green-50 rounded-lg">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-6 w-6 text-green-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Native Experience</h4>
          <p className="text-sm text-gray-600">
            Your customers get a seamless experience that matches your brand
          </p>
        </div>

        <div className="text-center p-6 bg-purple-50 rounded-lg">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-6 w-6 text-purple-600" />
          </div>
          <h4 className="font-semibold text-gray-900 mb-2">Complete Solution</h4>
          <p className="text-sm text-gray-600">
            Billing, authentication, and customer management - all included
          </p>
        </div>
      </div>

      {/* What Happens Next */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="font-semibold text-gray-900 mb-4">What happens next?</h4>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
              <span className="text-xs font-bold text-blue-600">1</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Brand Setup (Optional)</p>
              <p className="text-xs text-gray-600">Upload your logo or let us extract it from your website</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
              <span className="text-xs font-bold text-blue-600">2</span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Payment Setup (Optional)</p>
              <p className="text-xs text-gray-600">Connect Stripe to start accepting payments immediately</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
              <CheckCircle className="h-3 w-3 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Automatic White-Label Generation</p>
              <p className="text-xs text-gray-600">We'll create your branded pages and embeds in the background</p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Status */}
      {isReady && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-900">Account Ready</p>
              <p className="text-sm text-green-700">
                Your Staryer account is set up and ready to go!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}