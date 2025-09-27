'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, CreditCard, ExternalLink, Shield,Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

import { createStripeConnectAccountAction } from '../../actions/onboarding-actions';
import type { CreatorProfile } from '../../types';

interface StreamlinedStripeConnectStepProps {
  profile: CreatorProfile;
  onNext: () => void;
  setSubmitFunction: (fn: (() => Promise<void>) | null) => void;
}

export function StreamlinedStripeConnectStep({ profile, onNext, setSubmitFunction }: StreamlinedStripeConnectStepProps) {
  const [selectedOption, setSelectedOption] = useState<'test' | 'production' | 'skip'>('test');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectUrl, setConnectUrl] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    if (selectedOption === 'skip') {
      // No action needed for skip
      return;
    }

    try {
      setIsConnecting(true);
      
      // Create Stripe Connect account link
      const { stripeConnectUrl } = await createStripeConnectAccountAction(selectedOption);
      
      if (stripeConnectUrl) {
        // Redirect to Stripe Connect
        window.location.href = stripeConnectUrl;
      } else {
        throw new Error('Failed to create Stripe Connect URL');
      }
    } catch (error) {
      console.error('Error connecting Stripe:', error);
      toast({
        title: "Connection failed",
        description: "There was an error connecting to Stripe. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [selectedOption]);

  useEffect(() => {
    setSubmitFunction(selectedOption !== 'skip' ? handleSubmit : null);
  }, [handleSubmit, selectedOption, setSubmitFunction]);

  const isAlreadyConnected = profile.stripe_account_enabled;

  return (
    <div className="space-y-8">
      {/* Already Connected Status */}
      {isAlreadyConnected && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-900">Stripe Already Connected</p>
              <p className="text-sm text-green-700">
                You can start accepting payments immediately
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Introduction */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <CreditCard className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Connect Stripe for Payments
        </h3>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Connect your Stripe account to start accepting payments. Choose test mode to experiment 
          safely, or production mode if you're ready for real transactions.
        </p>
      </div>

      {/* Benefits */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-900">Instant Setup</span>
          </div>
          <p className="text-sm text-blue-800">
            We'll auto-populate your business details from Stripe
          </p>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-900">Secure OAuth</span>
          </div>
          <p className="text-sm text-green-800">
            We never see your Stripe credentials - everything is secured by OAuth
          </p>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-purple-600" />
            <span className="font-medium text-purple-900">Easy Migration</span>
          </div>
          <p className="text-sm text-purple-800">
            Start with test mode, then deploy to production seamlessly
          </p>
        </div>
      </div>

      {/* Option Selection */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Choose your environment:</h4>
        
        {/* Test Mode Option */}
        <div 
          className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
            selectedOption === 'test' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => setSelectedOption('test')}
        >
          <div className="flex items-start gap-3">
            <input
              type="radio"
              name="stripe-option"
              value="test"
              checked={selectedOption === 'test'}
              onChange={() => setSelectedOption('test')}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">RECOMMENDED</div>
                <span className="font-medium">Test Mode</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Perfect for testing and development. No real money involved.
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Safe environment to experiment</li>
                <li>• Use test cards (4242 4242 4242 4242)</li>
                <li>• Easy upgrade to production later</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Production Mode Option */}
        <div 
          className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
            selectedOption === 'production' 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => setSelectedOption('production')}
        >
          <div className="flex items-start gap-3">
            <input
              type="radio"
              name="stripe-option"
              value="production"
              checked={selectedOption === 'production'}
              onChange={() => setSelectedOption('production')}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium">Production Mode</span>
                <div className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">LIVE</div>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Ready to accept real payments from customers immediately.
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• Real payment processing</li>
                <li>• Requires Stripe account verification</li>
                <li>• Start earning revenue right away</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Skip Option */}
        <div 
          className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
            selectedOption === 'skip' 
              ? 'border-gray-400 bg-gray-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => setSelectedOption('skip')}
        >
          <div className="flex items-start gap-3">
            <input
              type="radio"
              name="stripe-option"
              value="skip"
              checked={selectedOption === 'skip'}
              onChange={() => setSelectedOption('skip')}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-gray-600" />
                <span className="font-medium">Skip for Now</span>
              </div>
              <p className="text-sm text-gray-600">
                Set up payments later. You can still create products and test your pages.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* What Happens Next */}
      {selectedOption !== 'skip' && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">What happens when you connect:</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              You'll be redirected to Stripe's secure connection page
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              We'll auto-populate your business information
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Your existing Stripe products will be imported
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Payment processing will be ready immediately
            </div>
          </div>
        </div>
      )}

      {/* Educational Content for Test vs Production */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 Pro Tip: Start with Test Mode</h4>
        <p className="text-sm text-blue-800 mb-2">
          Most creators start with test mode to perfect their setup, then seamlessly deploy to production. 
          Your embeds and pages work exactly the same in both environments.
        </p>
        <div className="text-xs text-blue-700">
          <strong>Test Mode:</strong> Use 4242 4242 4242 4242 for testing • 
          <strong> Production:</strong> Real cards and real money
        </div>
      </div>

      {/* Connection Status */}
      {isConnecting && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600" />
            <div>
              <p className="font-medium text-yellow-900">Connecting to Stripe...</p>
              <p className="text-sm text-yellow-700">
                You'll be redirected to Stripe in a moment.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}