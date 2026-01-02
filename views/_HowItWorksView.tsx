
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Sparkles, 
  CheckCircle, 
  UserCheck, 
  Search, 
  Trophy, 
  ArrowRight,
  Briefcase,
  Users
} from 'lucide-react';
import { contentService } from '../services/contentService';
import { SiteContent } from '../types';

const HowItWorksView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'client' | 'pro'>('client');
  const [content, setContent] = useState<SiteContent>(contentService.getContent());

  useEffect(() => {
    window.scrollTo(0, 0);
    contentService.fetchContent().then(setContent);
  }, []);

  const clientIcons = [<FileText size={32} />, <Sparkles size={32} />, <CheckCircle size={32} />];
  const clientColors = ["bg-blue-50 text-blue-600", "bg-purple-50 text-purple-600", "bg-emerald-50 text-emerald-600"];

  const proIcons = [<UserCheck size={32} />, <Search size={32} />, <Trophy size={32} />];
  const proColors = ["bg-indigo-50 text-indigo-600", "bg-amber-50 text-amber-600", "bg-rose-50 text-rose-600"];

  const clientSteps = content.howItWorks.clientSteps.map((step, i) => ({
    ...step,
    icon: clientIcons[i],
    color: clientColors[i]
  }));

  const proSteps = content.howItWorks.proSteps.map((step, i) => ({
    ...step,
    icon: proIcons[i],
    color: proColors[i]
  }));

  return (
    <div className="bg-slate-50 min-h-screen pt-20 pb-32">
      <div className="max-w-[1250px] mx-auto px-6">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
            {content.howItWorks.header.title} <span className="text-indigo-600">{content.branding.platformName}</span>
          </h1>
          <p className="text-xl text-slate-500 leading-relaxed">
            {content.howItWorks.header.subtitle}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-16">
          <div className="bg-white p-1.5 rounded-full shadow-lg shadow-indigo-500/10 border border-slate-100 inline-grid grid-cols-2 relative min-w-[320px] sm:min-w-[400px]">
            <button
              onClick={() => setActiveTab('client')}
              className={`flex items-center justify-center space-x-2 px-6 py-4 rounded-full text-sm font-bold transition-all duration-300 relative z-10 ${
                activeTab === 'client' 
                  ? 'text-white' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Users size={18} />
              <span>{content.howItWorks.tabs.clientLabel}</span>
            </button>
            <button
              onClick={() => setActiveTab('pro')}
              className={`flex items-center justify-center space-x-2 px-6 py-4 rounded-full text-sm font-bold transition-all duration-300 relative z-10 ${
                activeTab === 'pro' 
                  ? 'text-white' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Briefcase size={18} />
              <span>{content.howItWorks.tabs.proLabel}</span>
            </button>

            {/* Sliding Background */}
            <div 
              className={`absolute top-1.5 bottom-1.5 rounded-full bg-indigo-600 shadow-md transition-all duration-300 ease-in-out w-[calc(50%-6px)] ${
                activeTab === 'client' ? 'left-1.5' : 'left-[calc(50%+3px)]'
              }`}
            ></div>
          </div>
        </div>

        {/* Steps Content */}
        <div className="bg-white rounded-[24px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.05)] border border-slate-200 p-8 lg:p-16 overflow-hidden relative">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10">
            {(activeTab === 'client' ? clientSteps : proSteps).map((step, idx) => (
              <div 
                key={idx} 
                className="group relative flex flex-col items-center text-center space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700"
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                <div className={`w-24 h-24 ${step.color} rounded-[24px] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {step.icon}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 mb-3">{step.title}</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">{step.description}</p>
                </div>
                
                {/* Connector Line (Desktop only, except last item) */}
                {idx < 2 && (
                  <div className="hidden lg:block absolute top-12 left-1/2 w-full h-0.5 bg-slate-100 -z-10 translate-x-[50%]">
                     <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-200 rounded-full"></div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-20 text-center animate-in fade-in duration-1000 delay-500">
            <div className="inline-block p-10 rounded-[24px] bg-slate-50 border border-slate-100">
              <h4 className="text-2xl font-black text-slate-900 mb-6">
                {activeTab === 'client' ? content.howItWorks.cta.titleClient : content.howItWorks.cta.titlePro}
              </h4>
              <Link
                to={activeTab === 'client' ? '/post-job' : '/register?role=pro'}
                className="inline-flex items-center px-10 py-5 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all text-lg group"
              >
                {activeTab === 'client' ? content.howItWorks.cta.buttonClient : content.howItWorks.cta.buttonPro}
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
              </Link>
            </div>
          </div>

          {/* Background Decorative Blobs */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-indigo-50/50 rounded-full blur-3xl -z-0"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-blue-50/50 rounded-full blur-3xl -z-0"></div>
        </div>

      </div>
    </div>
  );
};

export default HowItWorksView;
