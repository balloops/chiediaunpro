
import React, { useState } from 'react';
import { FormDefinition, FormField } from '../types';
import { Sparkles, ChevronDown } from 'lucide-react';

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
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [descTouched, setDescTouched] = useState(false);

  const updateDetail = (key: string, value: any) => {
    setDetails((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleBlur = (key: string) => {
    setTouched(prev => ({ ...prev, [key]: true }));
  };

  // Helper per controllare se un campo è invalido (assumendo che i campi custom siano tutti required per ora)
  const isFieldInvalid = (fieldId: string, required: boolean = true) => {
    if (!required) return false;
    const val = details[fieldId];
    const isEmpty = Array.isArray(val) ? val.length === 0 : !val;
    return touched[fieldId] && isEmpty;
  };

  const renderField = (field: FormField) => {
    const isError = isFieldInvalid(field.id, field.required);
    const borderClass = isError ? 'border-red-500 bg-red-50 focus:border-red-500' : 'border-slate-200 focus:border-indigo-600';

    switch (field.type) {
      case 'select':
        return (
          <div key={field.id} className="space-y-4">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">{field.label}</label>
            <div className="relative">
               <select
                  value={details[field.id] || ''}
                  onChange={(e) => updateDetail(field.id, e.target.value)}
                  onBlur={() => handleBlur(field.id)}
                  className={`w-full bg-white border-2 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 outline-none appearance-none transition-all shadow-sm ${borderClass}`}
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
            {isError && <p className="text-red-500 text-xs font-bold ml-1">Campo obbligatorio</p>}
          </div>
        );

      case 'radio_group':
        return (
          <div key={field.id} className="space-y-4">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">{field.label}</label>
            <div className="grid grid-cols-2 gap-4" onMouseLeave={() => handleBlur(field.id)}>
              {field.options?.map(opt => {
                const isSelected = details[field.id] === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => updateDetail(field.id, opt)}
                    className={`py-4 px-6 text-sm font-black rounded-2xl transition-all border-2 ${
                      isSelected 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-200' 
                        : isError 
                           ? 'bg-red-50 border-red-300 text-red-600' 
                           : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {isError && <p className="text-red-500 text-xs font-bold ml-1">Campo obbligatorio</p>}
          </div>
        );

      case 'checkbox_group':
        return (
          <div key={field.id} className="space-y-4">
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">{field.label}</label>
            <div className="flex flex-wrap gap-3" onMouseLeave={() => handleBlur(field.id)}>
              {field.options?.map(opt => {
                const isSelected = details[field.id] === opt; // Current implementation treats checkbox group as single select in styling often, but logically usually multiple. 
                // However, based on the prompt "Funzionalità Extra" it should be multiple. Let's fix logic to allow multiple if needed, or stick to single if that's the current usage.
                // Assuming checkbox_group implies multiple selection for "features".
                const currentVal = details[field.id] || [];
                const isChecked = Array.isArray(currentVal) ? currentVal.includes(opt) : currentVal === opt;

                return (
                  <button
                    key={opt}
                    onClick={() => {
                        const prev = Array.isArray(details[field.id]) ? details[field.id] : [];
                        const next = prev.includes(opt) ? prev.filter((i:string) => i !== opt) : [...prev, opt];
                        updateDetail(field.id, next);
                    }}
                    className={`py-3 px-5 text-xs font-bold rounded-xl transition-all border ${
                      isChecked 
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
            {isError && <p className="text-red-500 text-xs font-bold ml-1">Campo obbligatorio</p>}
          </div>
        );

      case 'multiselect':
        return (
           <div key={field.id} className="space-y-4">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">{field.label}</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3" onMouseLeave={() => handleBlur(field.id)}>
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
                                : isError ? 'border-red-300 bg-red-50 text-red-600' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300'
                          }`}
                       >
                          {opt}
                       </button>
                    );
                 })}
              </div>
              {isError && <p className="text-red-500 text-xs font-bold ml-1">Seleziona almeno un'opzione</p>}
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
                  onBlur={() => handleBlur(field.id)}
                  placeholder={field.placeholder || ''}
                  className={`w-full bg-white border-2 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 outline-none transition-all ${borderClass}`}
               />
               {isError && <p className="text-red-500 text-xs font-bold ml-1">Campo obbligatorio</p>}
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
                  onBlur={() => handleBlur(field.id)}
                  placeholder={field.placeholder || ''}
                  className={`w-full bg-white border-2 rounded-2xl px-6 py-4 text-sm font-medium text-slate-900 outline-none transition-all resize-none ${borderClass}`}
               />
               {isError && <p className="text-red-500 text-xs font-bold ml-1">Campo obbligatorio</p>}
            </div>
         );

      default:
        return null;
    }
  };

  const isDescError = descTouched && !description;

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
        
        <div className={`relative group bg-white rounded-[24px] border-2 p-2 transition-all shadow-sm ${isDescError ? 'border-red-500 bg-red-50' : 'border-slate-200 focus-within:border-indigo-600 focus-within:shadow-[0_0_0_4px_rgba(79,70,229,0.1)] hover:border-slate-300'}`}>
          <textarea 
            rows={8}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={() => setDescTouched(true)}
            className="w-full bg-transparent border-none p-8 text-slate-800 text-lg focus:outline-none leading-relaxed placeholder:text-slate-300 placeholder:font-normal font-medium resize-none"
            placeholder={formDefinition.descriptionPlaceholder || "Descrivi il tuo progetto qui..."}
          />
          
          <div className={`p-4 rounded-b-[24px] border-t flex items-center justify-end ${isDescError ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
             {isDescError && <span className="text-xs font-bold text-red-500 mr-auto ml-2">Campo obbligatorio</span>}
             
             {/* AI Button */}
             <button
               onClick={onRefine}
               disabled={isRefining || !description}
               className="mr-auto text-[10px] font-black uppercase tracking-widest text-indigo-600 flex items-center hover:underline disabled:opacity-50"
             >
                {isRefining ? <span className="animate-pulse">Miglioramento in corso...</span> : <> <Sparkles size={14} className="mr-1" /> Migliora con AI</>}
             </button>

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
