
import React, { useCallback, useState } from 'react';
import { UploadIcon, CameraIcon } from './Icons';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  onCameraRequest: () => void;
  title?: string;
  subtitle?: string;
  compact?: boolean;
}

const UploadZone: React.FC<UploadZoneProps> = ({ 
  onFileSelect, 
  onCameraRequest,
  title = "上傳新單品",
  subtitle = "AI 自動分析類別與材質",
  compact = false
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className={`w-full ${compact ? '' : 'max-w-xl mx-auto'}`}>
      <div 
        className={`relative group overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-300 ${
          isDragging 
            ? 'border-primary bg-primary/5 scale-[1.02]' 
            : 'border-slate-200 bg-white hover:border-primary/50 hover:shadow-lg'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-8 px-4' : 'py-16 px-6'} space-y-6`}>
          
          <div className="space-y-2">
            {!compact && (
              <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-tr from-blue-50 to-purple-50 flex items-center justify-center mb-4">
                 <UploadIcon className="text-primary w-8 h-8" />
              </div>
            )}
            <h2 className={`font-display font-bold text-slate-800 ${compact ? 'text-lg' : 'text-2xl'}`}>
              {title}
            </h2>
            <p className="text-slate-500 font-light text-sm">
              {subtitle}
            </p>
          </div>

          <div className="flex flex-row gap-4 w-full justify-center">
            {/* Upload Button */}
            <label className="cursor-pointer relative group/btn">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileInput}
              />
              <div className={`bg-slate-900 text-white rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 ${compact ? 'px-4 py-2 text-sm' : 'px-6 py-3'}`}>
                <UploadIcon className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
                <span className="font-medium">相簿</span>
              </div>
            </label>

            {/* Camera Button */}
            <button 
              onClick={onCameraRequest}
              className={`bg-white border border-slate-200 text-slate-700 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors active:scale-95 ${compact ? 'px-4 py-2 text-sm' : 'px-6 py-3'}`}
            >
              <CameraIcon className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
              <span className="font-medium">拍照</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadZone;
