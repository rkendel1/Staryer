import { createDefaultWhiteLabelPages } from '@/features/creator/services/white-label-page-service';

import { updateCreatorProfile } from '../controllers/creator-profile';
import type { CreatorProfile } from '../types';

import { URLExtractionService } from './url-extraction';

/**
 * Background Task Service
 * Handles automatic white-label generation and branding extraction
 */
export class BackgroundTaskService {
  /**
   * Initialize all background tasks for a newly onboarded creator
   */
  static async initializeCreatorTasks(creatorId: string, profile: CreatorProfile) {
    try {
      console.log(`Starting background tasks for creator ${creatorId}`);

      // Run tasks in parallel
      await Promise.allSettled([
        this.generateWhiteLabelPages(creatorId, profile),
        this.extractBrandingData(creatorId, profile),
        this.generateEmbedAssets(creatorId, profile),
        this.setupRedirectRules(creatorId, profile),
      ]);

      console.log(`Background tasks completed for creator ${creatorId}`);
    } catch (error) {
      console.error(`Background tasks failed for creator ${creatorId}:`, error);
    }
  }

  /**
   * Generate default white-labeled pages
   */
  private static async generateWhiteLabelPages(creatorId: string, profile: CreatorProfile) {
    try {
      console.log(`Generating white-label pages for creator ${creatorId}`);
      
      await createDefaultWhiteLabelPages(creatorId, profile);
      
      // Update profile to mark pages as generated
      await updateCreatorProfile(creatorId, {
        white_label_pages_generated: true,
        white_label_generation_date: new Date().toISOString(),
      });

      console.log(`✅ White-label pages generated for creator ${creatorId}`);
    } catch (error) {
      console.error(`❌ Failed to generate white-label pages for creator ${creatorId}:`, error);
      
      // Mark as failed but don't throw
      await updateCreatorProfile(creatorId, {
        white_label_pages_generated: false,
        white_label_generation_error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Extract branding data from website if URL provided but not yet extracted
   */
  private static async extractBrandingData(creatorId: string, profile: CreatorProfile) {
    // Skip if no website URL or already extracted
    if (!profile.business_website || profile.branding_extraction_status === 'completed') {
      return;
    }

    try {
      console.log(`Extracting branding data for creator ${creatorId} from ${profile.business_website}`);

      // Update status to in_progress
      await updateCreatorProfile(creatorId, {
        branding_extraction_status: 'in_progress',
      });

      const extractedData = await URLExtractionService.extractFromURL(profile.business_website);

      // Update profile with extracted data
      await updateCreatorProfile(creatorId, {
        extracted_branding_data: extractedData,
        branding_extraction_status: 'completed',
        branding_extraction_date: new Date().toISOString(),
      });

      console.log(`✅ Branding data extracted for creator ${creatorId}`);
    } catch (error) {
      console.error(`❌ Failed to extract branding data for creator ${creatorId}:`, error);
      
      await updateCreatorProfile(creatorId, {
        branding_extraction_status: 'failed',
        branding_extraction_error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Generate embeddable JS assets with creator's branding
   */
  private static async generateEmbedAssets(creatorId: string, profile: CreatorProfile) {
    try {
      console.log(`Generating embed assets for creator ${creatorId}`);

      // Get branding data (either uploaded or extracted)
      const branding = profile.extracted_branding_data || {
        primaryColors: ['#6366f1'],
        fonts: { primary: 'Inter, sans-serif' },
      };

      // Generate CSS variables for embed
      const embedCSS = this.generateEmbedCSS(branding, profile);
      
      // Generate header component
      const headerComponent = this.generateHeaderComponent(profile, branding);

      // Update profile with generated assets
      await updateCreatorProfile(creatorId, {
        embed_assets_generated: true,
        embed_css: embedCSS,
        embed_header_component: headerComponent,
        embed_generation_date: new Date().toISOString(),
      });

      console.log(`✅ Embed assets generated for creator ${creatorId}`);
    } catch (error) {
      console.error(`❌ Failed to generate embed assets for creator ${creatorId}:`, error);
      
      await updateCreatorProfile(creatorId, {
        embed_assets_generated: false,
        embed_generation_error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Setup redirect rules for creators vs subscribers
   */
  private static async setupRedirectRules(creatorId: string, profile: CreatorProfile) {
    try {
      console.log(`Setting up redirect rules for creator ${creatorId}`);

      const redirectRules = {
        creator: {
          login_redirect: '/creator/dashboard',
          logout_redirect: '/login',
        },
        subscriber: {
          login_redirect: `/c/${profile.page_slug}/account`,
          logout_redirect: `/c/${profile.page_slug}`,
        },
      };

      // Update profile with redirect rules
      await updateCreatorProfile(creatorId, {
        redirect_rules: redirectRules,
        redirect_rules_generated: true,
        redirect_setup_date: new Date().toISOString(),
      });

      console.log(`✅ Redirect rules setup for creator ${creatorId}`);
    } catch (error) {
      console.error(`❌ Failed to setup redirect rules for creator ${creatorId}:`, error);
    }
  }

  /**
   * Generate CSS for embeds based on extracted branding
   */
  private static generateEmbedCSS(branding: any, profile: CreatorProfile): string {
    const primaryColor = branding.primaryColors?.[0] || '#6366f1';
    const secondaryColor = branding.secondaryColors?.[0] || '#e2e8f0';
    const fontFamily = branding.fonts?.primary || 'Inter, system-ui, sans-serif';

    return `
/* Staryer Embed Styles for ${profile.business_name || 'Creator'} */
:root {
  --staryer-primary: ${primaryColor};
  --staryer-secondary: ${secondaryColor};
  --staryer-font-family: ${fontFamily};
  --staryer-border-radius: ${branding.borderRadius || '8px'};
}

.staryer-embed {
  font-family: var(--staryer-font-family);
  color: #1f2937;
  line-height: 1.5;
}

.staryer-button {
  background-color: var(--staryer-primary);
  color: white;
  border: none;
  border-radius: var(--staryer-border-radius);
  padding: 12px 24px;
  font-family: var(--staryer-font-family);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.staryer-button:hover {
  filter: brightness(0.95);
  transform: translateY(-1px);
}

.staryer-card {
  background: white;
  border-radius: var(--staryer-border-radius);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}
    `.trim();
  }

  /**
   * Generate header component with creator's branding
   */
  private static generateHeaderComponent(profile: CreatorProfile, branding: any): string {
    const businessName = profile.business_name || 'Creator';
    const logo = profile.business_logo || '/staryer-placeholder-logo.svg';
    const primaryColor = branding.primaryColors?.[0] || '#6366f1';

    return `
<!-- Staryer Header Component for ${businessName} -->
<header class="staryer-header" style="
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem 0;
  font-family: var(--staryer-font-family, 'Inter', sans-serif);
">
  <div style="
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
  ">
    <div style="display: flex; align-items: center; gap: 12px;">
      <img 
        src="${logo}" 
        alt="${businessName}" 
        style="height: 32px; width: auto;"
      />
      <span style="
        font-size: 1.25rem;
        font-weight: 600;
        color: #1f2937;
      ">${businessName}</span>
    </div>
    
    <div style="display: flex; align-items: center; gap: 16px;">
      <a href="/account" style="
        color: #6b7280;
        text-decoration: none;
        font-weight: 500;
      ">Account</a>
      <a href="/support" style="
        color: #6b7280;
        text-decoration: none;
        font-weight: 500;
      ">Support</a>
    </div>
  </div>
</header>
    `.trim();
  }

  /**
   * Queue background tasks (for production with actual queue system)
   */
  static async queueCreatorTasks(creatorId: string, profile: CreatorProfile) {
    // In production, this would add tasks to a queue system like Bull, Agenda, or similar
    // For now, we'll run them immediately in the background
    
    // Don't await - let it run in background
    this.initializeCreatorTasks(creatorId, profile).catch(error => {
      console.error('Background task queue failed:', error);
    });
  }
}