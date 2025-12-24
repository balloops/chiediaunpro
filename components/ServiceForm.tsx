
import React from 'react';
import { FormDefinition, FormField } from '../types';
import { Sparkles, Check, ChevronDown } from 'lucide-react';

interface ServiceFormProps {
  formDefinition: FormDefinition;
  description: string;
  setDescription: (val: string) => void;
  details: Record<string, any>;
  setDetails: (val: any) => void;
  onRefine: () => void;
  isRefining: boolean;
}

const ServiceForm: React.FC<ServiceFormProps> = ({ 
  formDefinition,
  description, 
  setDescription, 
  details, 
  setDetails, 
  onRefine,
  isRefining 
}) => {
  const updateDetail = (key: string, value: any) => {
    setDetails((prev: any) => ({ ...prev, [key]: value }));
  };

  const renderField = (field: FormField) => {
    switch (field.type) {
      case 'select':
        return (
          <div key={field.id} className="space-y-4">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">{field.label}</label>
            <div className="relative">
               <select
                  value={details[field.id] || ''}
                  onChange={(e) => updateDetail(field.id, e.target.value)}
                  className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-500/10 outline-none appearance-none transition-all shadow-sm"
               >
                  <option value="">Seleziona...</option>
                  {field.options?.map(opt => (
                     <option key={opt} value={opt}>{opt}</option>
                  ))}
               </select>
               <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronDown size={18} />
               </div>
            </div>
          </div>
        );

      case 'checkbox_group':
        return (
          <div key={field.id} className="space-y-4">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">{field.label}</label>
            <div className="flex flex-wrap gap-3">
              {field.options?.map(opt => {
                const isSelected = details[field.id] === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => updateDetail(field.id, opt)}
                    className={`flex-1 py-3.5 px-6 text-xs font-black rounded-xl transition-all border ${
                      isSelected 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                        : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'multiselect':
        return (
           <div key={field.id} className="space-y-4">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">{field.label}</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                 {field.options?.map(opt => {
                    const current = details[field.id] || [];
                    const isSelected = current.includes(opt);
                    return (
                       <button
                          key={opt}
                          onClick={() => {
                             const next = isSelected ? current.filter((i: string) => i !== opt) : [...current, opt];
                             updateDetail(field.id, next);
                          }}
                          className={`p-4 rounded-xl border-2 transition-all text-center text-xs font-bold ${
                             isSelected
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300'
                          }`}
                       >
                          {opt}
                       </button>
                    );
                 })}
              </div>
           </div>
        );
      
      case 'text':
         return (
            <div key={field.id} className="space-y-4">
               <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">{field.label}</label>
               <input 
                  type="text"
                  value={details[field.id] || ''}
                  onChange={(e) => updateDetail(field.id, e.target.value)}
                  placeholder={field.placeholder || ''}
                  className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:border-indigo-600 outline-none transition-all"
               />
            </div>
         );

      case 'textarea':
         return (
            <div key={field.id} className="space-y-4">
               <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">{field.label}</label>
               <textarea 
                  rows={3}
                  value={details[field.id] || ''}
                  onChange={(e) => updateDetail(field.id, e.target.value)}
                  placeholder={field.placeholder || ''}
                  className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 text-sm font-medium text-slate-900 focus:border-indigo-600 outline-none transition-all resize-none"
               />
            </div>
         );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-12">
      {/* Dynamic Fields Section */}
      {formDefinition.fields.length > 0 && (
         <div className="px-1 sm:px-4 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {formDefinition.fields.map(renderField)}
         </div>
      )}

      {/* Description Section (Always Present) */}
      <section className="px-1 sm:px-4">
        <div className="flex items-start space-x-5 mb-6">
          <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200">
             <Sparkles size={24} />
          </div>
          <div>
             <h4 className="text-xl font-black text-slate-900 leading-tight uppercase tracking-tight">Dettagli del Progetto</h4>
             <p className="text-base text-slate-500 font-medium mt-1">Descrivi la tua idea liberamente. L'AI può aiutarti a migliorarla.</p>
          </div>
        </div>
        
        <div className="relative group bg-white rounded-[24px] border-2 border-slate-200 p-2 focus-within:border-indigo-600 focus-within:shadow-[0_0_0_4px_rgba(79,70,229,0.1)] transition-all shadow-sm hover:border-slate-300">
          <div className="absolute -top-4 right-8 bg-slate-900 p-0.5 rounded-xl shadow-xl group-focus-within:scale-105 transition-transform z-10">
            <button 
              onClick={onRefine}
              disabled={isRefining || !description}
              className={`flex items-center space-x-2 bg-slate-900 px-5 py-2.5 rounded-[10px] text-white font-black text-[10px] uppercase tracking-widest transition-all border border-white/20 ${isRefining ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-800'}`}
            >
              <Sparkles size={14} className={`text-indigo-400 ${isRefining ? 'animate-spin' : ''}`} />
              <span>{isRefining ? 'Ottimizzazione...' : 'Migliora con AI'}</span>
            </button>
          </div>
          
          <textarea 
            rows={8}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-transparent border-none p-8 text-slate-800 text-lg focus:outline-none leading-relaxed placeholder:text-slate-300 placeholder:font-normal font-medium resize-none"
            placeholder={formDefinition.descriptionPlaceholder || "Descrivi il tuo progetto qui..."}
          />
          
          <div className="p-4 bg-slate-50 rounded-b-[24px] border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-3 text-[10px] text-slate-500 font-bold uppercase tracking-widest ml-4">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
              <span>L'AI può aiutarti a scrivere meglio</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono mr-4 font-bold bg-white px-2 py-1 rounded-md border border-slate-200">
              {description.length} caratteri
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ServiceForm;
