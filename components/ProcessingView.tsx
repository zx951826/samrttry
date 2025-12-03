
import React from 'react';

const ProcessingView: React.FC<{text?: string}> = ({text = "Gemini AI 正在分析..."}) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-8 animate-fade-in">
      <div className="relative">
        <div className="absolute inset-0 bg-blue-400 blur-2xl opacity-20 animate-pulse"></div>
        <div className="relative w-20 h-20 border-4 border-blue-100 border-t-primary rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
             {/* Gemini Logo abstract shape */}
             <div className="w-8 h-8 bg-gradient-to-tr from-primary to-accent-purple rounded-lg animate-pulse-soft"></div>
        </div>
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-xl font-display font-bold text-slate-800 tracking-wide gemini-text">{text}</h3>
        <p className="text-slate-500 text-sm">正在運用 Google Cloud 高效運算中</p>
      </div>
    </div>
  );
};

export default ProcessingView;
