'use client';

import React, { useCallback, useState } from 'react';
import { AlertCircle, CheckCircle,FileImage, Upload, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/utils/cn';

interface FileUploadProps {
  accept?: string;
  maxSize?: number; // in bytes
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  className?: string;
  disabled?: boolean;
  currentFile?: File | null;
  currentUrl?: string;
  placeholder?: string;
  error?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB default
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export function FileUpload({
  accept = 'image/*',
  maxSize = MAX_FILE_SIZE,
  onFileSelect,
  onFileRemove,
  className,
  disabled = false,
  currentFile,
  currentUrl,
  placeholder = 'Upload your logo or image',
  error,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = useCallback((file: File): boolean => {
    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        variant: 'destructive',
        description: 'Please upload a valid image file (JPEG, PNG, GIF, or WebP).',
      });
      return false;
    }

    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      toast({
        variant: 'destructive',
        description: `File size must be less than ${maxSizeMB}MB. Current file is ${Math.round(file.size / (1024 * 1024))}MB.`,
      });
      return false;
    }

    return true;
  }, [maxSize]);

  const handleFileSelect = useCallback((file: File) => {
    if (!validateFile(file)) {
      return;
    }

    setIsUploading(true);
    try {
      onFileSelect(file);
      toast({
        description: 'File selected successfully!',
      });
    } catch (error) {
      console.error('Error selecting file:', error);
      toast({
        variant: 'destructive',
        description: 'Failed to select file. Please try again.',
      });
    } finally {
      setIsUploading(false);
    }
  }, [onFileSelect, validateFile]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [disabled, handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleRemove = useCallback(() => {
    onFileRemove();
    toast({
      description: 'File removed successfully.',
    });
  }, [onFileRemove]);

  const hasFile = currentFile || currentUrl;

  return (
    <div className={cn('space-y-2', className)}>
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 transition-colors',
          {
            'border-primary bg-primary/5': isDragOver && !disabled,
            'border-gray-300 hover:border-gray-400': !isDragOver && !disabled && !error,
            'border-red-300 bg-red-50': error,
            'border-green-300 bg-green-50': hasFile && !error,
            'border-gray-200 bg-gray-50 cursor-not-allowed': disabled,
          }
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleInputChange}
          disabled={disabled || isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        <div className="text-center">
          {hasFile ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-green-700">
                  {currentFile ? currentFile.name : 'Current logo'}
                </p>
                {currentFile && (
                  <p className="text-xs text-gray-500">
                    {Math.round(currentFile.size / 1024)}KB
                  </p>
                )}
                {currentUrl && !currentFile && (
                  <div className="mt-2">
                    <img
                      src={currentUrl}
                      alt="Current logo"
                      className="h-16 w-auto mx-auto rounded border"
                    />
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemove}
                disabled={disabled}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-center">
                {isUploading ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                ) : (
                  <Upload className={cn('h-8 w-8', {
                    'text-gray-400': !error,
                    'text-red-400': error,
                  })} />
                )}
              </div>
              <div className="space-y-1">
                <p className={cn('text-sm font-medium', {
                  'text-gray-700': !error,
                  'text-red-700': error,
                })}>
                  {placeholder}
                </p>
                <p className="text-xs text-gray-500">
                  Drag and drop or click to select
                </p>
                <p className="text-xs text-gray-400">
                  Maximum file size: {Math.round(maxSize / (1024 * 1024))}MB
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}