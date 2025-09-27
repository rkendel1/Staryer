'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Globe, Image, Loader2,Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';

import { updateCreatorProfile } from '../../controllers/creator-profile';
import { URLExtractionService } from '../../services/url-extraction';
import type { CreatorProfile } from '../../types';

interface StreamlinedBrandSetupStepProps {
  profile: CreatorProfile;
  onNext: () => void;
  setSubmitFunction: (fn: (() => Promise<void>) | null) => void;
}

export function StreamlinedBrandSetupStep({ profile, onNext, setSubmitFunction }: StreamlinedBrandSetupStepProps) {
  const [selectedOption, setSelectedOption] = useState<'upload' | 'url' | 'skip'>('upload');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState(profile.business_website || '');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<any>(null);
  const [uploadedLogoUrl, setUploadedLogoUrl] = useState(profile.business_logo || '');

  const handleSubmit = useCallback(async () => {
    try {
      const updates: Partial<CreatorProfile> = {};

      if (selectedOption === 'upload' && logoFile) {
        // Handle file upload
        const formData = new FormData();
        formData.append('logo', logoFile);
        formData.append('creatorId', profile.id);

        // This would typically be an API call to upload the file
        // For now, we'll simulate the upload
        const mockUploadUrl = URL.createObjectURL(logoFile);
        updates.business_logo = mockUploadUrl;
        setUploadedLogoUrl(mockUploadUrl);
        
      } else if (selectedOption === 'url' && (logoUrl || websiteUrl)) {
        if (logoUrl) {
          updates.business_logo = logoUrl;
        }

        if (websiteUrl) {
          updates.business_website = websiteUrl;
          
          // Trigger background extraction
          setIsExtracting(true);
          try {
            const extractedData = await URLExtractionService.extractFromURL(websiteUrl);
            updates.extracted_branding_data = extractedData;
            updates.branding_extraction_status = 'completed';
            setExtractionResult(extractedData);
            
            toast({
              title: "Branding extracted successfully",
              description: "We've captured your website's design elements.",
            });
          } catch (error) {
            console.error('Extraction failed:', error);
            updates.branding_extraction_status = 'failed';
            
            toast({
              title: "Extraction partially failed",
              description: "We'll continue with default branding.",
              variant: "default",
            });
          } finally {
            setIsExtracting(false);
          }
        }
      }

      // Update profile with any changes
      if (Object.keys(updates).length > 0) {
        await updateCreatorProfile(profile.id, updates);
      }

    } catch (error) {
      console.error('Error updating brand setup:', error);
      toast({
        title: "Update failed",
        description: "There was an error saving your brand setup.",
        variant: "destructive",
      });
      throw error;
    }
  }, [selectedOption, logoFile, logoUrl, websiteUrl, profile.id]);

  useEffect(() => {
    setSubmitFunction(handleSubmit);
  }, [handleSubmit, setSubmitFunction]);

  const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }
      
      setLogoFile(file);
    }
  };

  const handleQuickExtraction = async () => {
    if (!websiteUrl) return;
    
    setIsExtracting(true);
    try {
      const extractedData = await URLExtractionService.extractFromURL(websiteUrl);
      setExtractionResult(extractedData);
      
      toast({
        title: "Preview ready",
        description: "Check the extracted branding elements below.",
      });
    } catch (error) {
      console.error('Preview extraction failed:', error);
      toast({
        title: "Preview failed",
        description: "We couldn't extract branding from this URL.",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const hasExistingBranding = profile.business_logo || profile.extracted_branding_data;

  return (
    <div className="space-y-8">
      {/* Existing Branding Status */}
      {hasExistingBranding && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-900">Branding Already Set Up</p>
              <p className="text-sm text-green-700">
                {profile.business_logo ? 'Logo uploaded' : ''} 
                {profile.extracted_branding_data ? 'Brand colors and fonts extracted' : ''}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Option Selection */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Choose how to set up your branding:</Label>
        
        {/* Upload Logo Option */}
        <div 
          className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
            selectedOption === 'upload' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => setSelectedOption('upload')}
        >
          <div className="flex items-start gap-3">
            <input
              type="radio"
              name="brand-option"
              value="upload"
              checked={selectedOption === 'upload'}
              onChange={() => setSelectedOption('upload')}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Upload className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Upload Logo</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Upload your logo file directly (PNG, JPG, SVG)
              </p>
              
              {selectedOption === 'upload' && (
                <div className="space-y-3">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileChange}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {logoFile && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      {logoFile.name} ready to upload
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Website URL Option */}
        <div 
          className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
            selectedOption === 'url' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => setSelectedOption('url')}
        >
          <div className="flex items-start gap-3">
            <input
              type="radio"
              name="brand-option"
              value="url"
              checked={selectedOption === 'url'}
              onChange={() => setSelectedOption('url')}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-5 w-5 text-green-600" />
                <span className="font-medium">Extract from Website</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                We'll automatically extract your logo, colors, and fonts from your website
              </p>
              
              {selectedOption === 'url' && (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="website-url" className="text-sm">Website URL</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="website-url"
                        type="url"
                        placeholder="https://your-website.com"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleQuickExtraction}
                        disabled={!websiteUrl || isExtracting}
                        className="whitespace-nowrap"
                      >
                        {isExtracting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Extracting...
                          </>
                        ) : (
                          'Preview'
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="logo-url" className="text-sm">Or Logo URL (Optional)</Label>
                    <Input
                      id="logo-url"
                      type="url"
                      placeholder="https://your-website.com/logo.png"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
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
              name="brand-option"
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
                We'll use Staryer branding as placeholder. You can customize this later.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Extraction Results Preview */}
      {extractionResult && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Extracted Branding Preview</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-700">Colors Found:</p>
              <div className="flex gap-1 mt-1">
                {extractionResult.primaryColors?.slice(0, 5).map((color: string, index: number) => (
                  <div
                    key={index}
                    className="w-6 h-6 rounded border border-gray-300"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="font-medium text-gray-700">Fonts Found:</p>
              <p className="text-gray-600 mt-1">
                {extractionResult.fonts?.primary || 'Default system font'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-blue-50 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Don't worry about perfection!</strong> You can always customize your branding 
          later in the dashboard. This step helps us create pages that feel native to your brand.
        </p>
      </div>
    </div>
  );
}