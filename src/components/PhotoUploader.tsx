import React, { useRef, useState } from 'react';
import { Camera, Upload, Trash2, User, RefreshCw, Check } from 'lucide-react';
import { processImageFile } from '../utils/imageUpload';

interface PhotoUploaderProps {
  currentPhoto?: string;
  name?: string;
  onChange: (photoDataUrl: string) => void;
  label?: string;
  shape?: 'circle' | 'rounded';
  size?: 'sm' | 'md' | 'lg';
  helperText?: string;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  currentPhoto = '',
  name = 'User',
  onChange,
  label = 'Foto Profil',
  shape = 'rounded',
  size = 'md',
  helperText = 'Format JPG, PNG, atau WebP. Foto otomatis dikompresi & disimpan ke database.',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const sizeClasses = {
    sm: 'w-14 h-14',
    md: 'w-20 h-20',
    lg: 'w-24 h-24 sm:w-28 sm:h-28',
  }[size];

  const roundedClasses = shape === 'circle' ? 'rounded-full' : 'rounded-2xl';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const base64Data = await processImageFile(file, 400, 0.85);
      onChange(base64Data);
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 2000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memproses file foto.');
    } finally {
      setIsProcessing(false);
      // Reset input value so same file can be re-selected if desired
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = () => {
    onChange('');
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-bold text-slate-700">
          {label}
        </label>
      )}

      <div className="flex items-center gap-4">
        {/* Preview Area */}
        <div className="relative group shrink-0">
          <div
            className={`${sizeClasses} ${roundedClasses} overflow-hidden bg-slate-100 border-2 border-slate-200 group-hover:border-amber-400 transition-colors shadow-xs flex items-center justify-center`}
          >
            {currentPhoto ? (
              <img
                src={currentPhoto}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-emerald-50 text-emerald-800 font-black text-lg select-none">
                {name ? (
                  <span>{name.charAt(0).toUpperCase()}</span>
                ) : (
                  <User className="w-8 h-8 text-slate-400" />
                )}
              </div>
            )}
          </div>

          {/* Quick Camera Overlay */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            title="Klik untuk memilih foto"
            className="absolute -bottom-1 -right-1 p-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-full shadow-md border-2 border-white transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : uploadSuccess ? (
              <Check className="w-3.5 h-3.5 text-emerald-950" />
            ) : (
              <Camera className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Action Buttons & Info */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png,image/jpeg,image/webp,image/jpg"
              className="hidden"
            />

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Mengompresi...
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  Pilih / Unggah Foto
                </>
              )}
            </button>

            {currentPhoto && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl transition-colors cursor-pointer border border-red-200/60"
              >
                <Trash2 className="w-3 h-3" />
                Hapus
              </button>
            )}
          </div>

          {helperText && (
            <p className="text-[11px] text-slate-500 leading-tight">
              {helperText}
            </p>
          )}

          {errorMessage && (
            <p className="text-[11px] text-red-600 font-semibold">
              ⚠️ {errorMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhotoUploader;
