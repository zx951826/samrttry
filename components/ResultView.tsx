
import React from 'react';
import { AnalysisResult, Category } from '../types';
import { CheckIcon, SparklesIcon } from './Icons';

interface ResultViewProps {
  imageSrc: string;
  result: AnalysisResult;
  onConfirm: () => void;
  onRetake: () => void;
}

const ResultView: React.FC<ResultViewProps> = ({ imageSrc, result, onConfirm, onRetake }) => {
  return (
    <div className="w-full max-w-4xl mx-auto animate-slide-up pb-24">
      
      <div className="glass-panel rounded-3xl p-6 md:p-8 shadow-xl shadow-blue-900/5">
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Image */}
          <div className="w-full md:w-1/3">
             <div className="relative rounded-2xl overflow-hidden aspect-[3/4] shadow-inner bg-slate-50">
               <img src={imageSrc} alt="Item" className="w-full h-full object-cover" />
               <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-primary shadow-sm">
                 {result.category}
               </div>
             </div>
          </div>

          {/* Details */}
          <div className="w-full md:w-2/3 flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                   <SparklesIcon className="w-5 h-5 text-accent-purple" />
                   <h2 className="text-2xl font-display font-bold text-slate-800">AI 分析報告</h2>
                </div>
                <p className="text-slate-600 leading-relaxed bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  {result.description}
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                  穿搭建議
                </h3>
                <div className="text-sm text-slate-600 space-y-2 whitespace-pre-wrap">
                  {result.stylingTips}
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8 pt-6 border-t border-slate-100">
               <button 
                 onClick={onRetake}
                 className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
               >
                 重新拍攝
               </button>
               <button 
                 onClick={onConfirm}
                 className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-white font-medium shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 transition-all flex items-center justify-center gap-2"
               >
                 <CheckIcon className="w-5 h-5" />
                 加入衣櫥
               </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ResultView;
