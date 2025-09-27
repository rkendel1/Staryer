'use server';

import { revalidatePath } from 'next/cache'; // Import revalidatePath
import { redirect } from 'next/navigation';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { AIEmbedCustomizerService } from '@/features/creator/services/ai-embed-customizer';
import { type EmbedGenerationOptions, EnhancedEmbedGeneratorService, type EnhancedEmbedType,type GeneratedEmbed } from '@/features/creator/services/enhanced-embed-generator';
import { openaiServerClient } from '@/libs/openai/openai-server-client'; // Import openaiServerClient
import { getBrandingStyles } from '@/utils/branding-utils';
import type { ColorPalette } from '@/utils/color-palette-utils';
import { generateAutoGradient } from '@/utils/gradient-utils';

import { getBrandingSuggestions, getOrCreateCreatorProfile, updateCreatorProfile } from '../controllers/creator-profile';
import { generateStripeOAuthLink } from '../controllers/stripe-connect';
import { createWhiteLabeledPage } from '../controllers/white-labeled-pages';
import { BackgroundTaskService } from '../services/background-tasks';
import type { CreatorProfile, CreatorProfileUpdate } from '../types';

export async function updateCreatorProfileAction(profileData: CreatorProfileUpdate) {
  const user = await getAuthenticatedUser();

  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  const updatedProfile = await updateCreatorProfile(user.id, profileData);

  // If onboarding is completed, revalidate relevant paths
  if (profileData.onboarding_completed === true) {
    revalidatePath(`/c/${updatedProfile.page_slug}`); // Use page_slug
    revalidatePath(`/c/${updatedProfile.page_slug}/pricing`); // Use page_slug
    revalidatePath('/creator/dashboard');
  }

  return updatedProfile;
}

export async function createStripeConnectAccountAction(environment: 'test' | 'production' = 'test'): Promise<{ stripeConnectUrl: string }> {
  const user = await getAuthenticatedUser();

  if (!user?.id || !user.email) {
    throw new Error('Not authenticated');
  }

  try {
    // Generate the OAuth link for Standard accounts, specifying the 'creator' flow and environment
    const stripeConnectUrl = await generateStripeOAuthLink(user.id, user.email, 'creator', environment);

    // We don't update stripe_account_id here, it will be updated in the callback route
    // after the user completes the OAuth flow.

    return { stripeConnectUrl };
  } catch (error) {
    console.error('Error generating Stripe OAuth link:', error);
    throw new Error('Failed to generate Stripe Connect link');
  }
}

export async function completeOnboardingStepAction(step: number) {
  const user = await getAuthenticatedUser();

  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  const nextStep = step + 1;
  // This action will only update the step.
  // The 'onboarding_completed' flag will be explicitly set by the ReviewStep
  // when the user chooses to launch their SaaS.
  return updateCreatorProfile(user.id, {
    onboarding_step: nextStep,
  });
}

export async function initializeCreatorOnboardingAction() {
  const user = await getAuthenticatedUser();

  if (!user?.id) {
    redirect('/login');
  }

  // Get or create creator profile
  const profile = await getOrCreateCreatorProfile(user.id);

  if (profile.onboarding_completed) {
    redirect('/creator/dashboard');
  }

  return profile;
}

export async function getBrandingSuggestionsAction() {
  const user = await getAuthenticatedUser();

  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  return getBrandingSuggestions(user.id);
}

export async function applyColorPaletteAction(palette: ColorPalette) {
  const user = await getAuthenticatedUser();

  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  return updateCreatorProfile(user.id, {
    brand_color: palette.primary,
    brand_gradient: palette.gradient as any,
    brand_pattern: palette.pattern as any,
  });
}

export async function createDefaultWhiteLabeledPagesAction(pageConfig: {
  heroTitle: string;
  heroSubtitle: string;
  ctaText: string;
  showTestimonials: boolean;
  showPricing: boolean;
  showFaq: boolean;
}) {
  const user = await getAuthenticatedUser();

  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  const creatorId = user.id;

  // Create landing page
  await createWhiteLabeledPage({
    creator_id: creatorId,
    page_slug: 'landing',
    page_title: 'Home',
    page_config: pageConfig as any,
    active: true,
  });

  // Create pricing page
  await createWhiteLabeledPage({
    creator_id: creatorId,
    page_slug: 'pricing',
    page_title: 'Pricing',
    page_config: pageConfig as any,
    active: true,
  });
}

export async function generateAIPageContentAction(
  creatorProfile: CreatorProfile,
  pageType: 'home' | 'pricing' | 'account',
  iterativePrompt?: string
): Promise<string> {
  // Ensure the user is authenticated (this action is called from a client component,
  // but it's good practice to re-verify if it's a server action)
  const user = await getAuthenticatedUser();
  if (!user?.id || user.id !== creatorProfile.id) {
    throw new Error('Not authenticated or unauthorized to generate AI page content.');
  }

  // Determine the embed type based on the pageType
  let embedType: EnhancedEmbedType;
  switch (pageType) {
    case 'home':
      embedType = 'hero_section'; // Use hero section for the home page
      break;
    case 'pricing':
      embedType = 'pricing_table'; // Use pricing table for the pricing page
      break;
    case 'account':
      embedType = 'header'; // Use a generic header/simple component for account page for now
      break;
    default:
      embedType = 'custom'; // Fallback
  }

  // Get or start an AI session for this specific page type
  let aiSession = await AIEmbedCustomizerService.getSessionByCreatorAndType(creatorProfile.id, embedType);

  if (!aiSession) {
    // If no session exists, start a new one with enhanced initial branding options
    const initialOptions: EmbedGenerationOptions = {
      embedType: embedType,
      creator: creatorProfile,
      customization: {
        primaryColor: creatorProfile.brand_color || '#3b82f6',
        fontFamily: creatorProfile.extracted_branding_data?.fonts?.primary || 'Inter, system-ui, sans-serif',
        title: pageType === 'home' 
          ? `Welcome to ${creatorProfile.business_name || 'Your SaaS'}` 
          : pageType === 'pricing'
            ? `${creatorProfile.business_name || 'Your SaaS'} Pricing`
            : `Manage Your ${creatorProfile.business_name || 'SaaS'} Account`,
        description: pageType === 'home' 
          ? creatorProfile.business_description || 'Transform your business with our powerful solution'
          : pageType === 'pricing'
            ? `Choose the perfect plan for your ${creatorProfile.business_description || 'business needs'}`
            : 'Manage your subscription, billing, and account preferences',
        ctaText: pageType === 'home' 
          ? 'Start Your Journey' 
          : pageType === 'pricing'
            ? 'Choose Your Plan'
            : 'Update Account',
        // Enhanced customization based on creator profile
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '32px',
        showLogo: true,
        voiceAndTone: {
          tone: creatorProfile.extracted_branding_data?.voiceAndTone?.tone || 'professional',
          voice: creatorProfile.extracted_branding_data?.voiceAndTone?.voice || 'friendly'
        }
      },
    };
    aiSession = await AIEmbedCustomizerService.startSession(creatorProfile.id, embedType, initialOptions);
    
    // Auto-generate an initial page with business context if no iterative prompt provided
    if (!iterativePrompt) {
      const contextualPrompt = `Create a ${pageType} page that perfectly represents ${creatorProfile.business_name || 'this business'}. 
      ${creatorProfile.business_description ? `The business focuses on: ${creatorProfile.business_description}.` : ''}
      Make it professional, engaging, and optimized for conversion. Use modern design principles and ensure brand consistency.`;
      
      const result = await AIEmbedCustomizerService.processMessage(
        openaiServerClient,
        aiSession.id,
        contextualPrompt
      );
      aiSession = await AIEmbedCustomizerService.getSession(aiSession.id) || aiSession;
    }
  }

  // If an iterative prompt is provided, process it with the AI
  if (iterativePrompt) {
    const result = await AIEmbedCustomizerService.processMessage(
      openaiServerClient, // Pass the actual openaiServerClient
      aiSession.id,
      iterativePrompt
    );
    // After processing, fetch the updated session to get the latest currentOptions
    aiSession = await AIEmbedCustomizerService.getSession(aiSession.id) || aiSession;
  }

  // Use the currentOptions from the AI session to generate the embed
  const generationOptions: EmbedGenerationOptions = {
    embedType: embedType,
    creator: creatorProfile,
    product: undefined, // Products are not directly part of page content generation here
    customization: aiSession.currentOptions.customization,
  };

  const generatedEmbed = await EnhancedEmbedGeneratorService.generateEmbed(generationOptions);

  // Combine HTML and CSS for srcDoc
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${pageType.charAt(0).toUpperCase() + pageType.slice(1)} Page Preview</title>
      <style>
        body { margin: 0; padding: 0; font-family: ${aiSession.currentOptions.customization?.fontFamily || 'sans-serif'}; background-color: ${aiSession.currentOptions.customization?.backgroundColor || '#f9fafb'}; }
        ${generatedEmbed.css}
      </style>
    </head>
    <body>
      ${generatedEmbed.html}
    </body>
    </html>
  `;
}

export async function completeOnboardingAction() {
  const user = await getAuthenticatedUser();

  if (!user?.id) {
    throw new Error('Not authenticated');
  }

  // Mark onboarding as complete
  const updatedProfile = await updateCreatorProfile(user.id, {
    onboarding_completed: true,
    onboarding_completed_date: new Date().toISOString(),
  });

  // Revalidate relevant paths
  revalidatePath('/creator/dashboard');
  revalidatePath('/creator/onboarding');
  if (updatedProfile.page_slug) {
    revalidatePath(`/c/${updatedProfile.page_slug}`);
    revalidatePath(`/c/${updatedProfile.page_slug}/pricing`);
  }

  // Queue background tasks for automatic white-label generation
  BackgroundTaskService.queueCreatorTasks(user.id, updatedProfile);

  return updatedProfile;
}