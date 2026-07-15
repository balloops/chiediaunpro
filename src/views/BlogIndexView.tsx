
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar } from 'lucide-react';
import SEO from '../../components/SEO';
import { getPublishedPosts } from '../data/blogPosts';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

const BlogIndexView: React.FC = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const posts = getPublishedPosts();

  return (
    <div className="min-h-screen bg-slate-50 pt-20 pb-32">
      <SEO
        title="Blog e Risorse"
        description="Guide pratiche su prezzi, professionisti digitali e come portare avanti il tuo progetto: siti web, e-commerce, branding e marketing."
        path="/blog"
      />
      <div className="max-w-[1000px] mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
            Blog e Risorse
          </h1>
          <p className="text-xl text-slate-500 leading-relaxed">
            Guide pratiche per orientarti tra prezzi, scelte e professionisti digitali.
          </p>
        </div>

        {posts.length === 0 ? (
          <p className="text-center text-slate-400">Nuovi articoli in arrivo a breve.</p>
        ) : (
          <div className="grid gap-6">
            {posts.map(post => (
              <Link
                key={post.slug}
                to={`/blog/${post.slug}`}
                className="block bg-white rounded-[24px] border border-slate-200 p-8 hover:border-indigo-200 hover:shadow-lg transition-all group"
              >
                <div className="flex items-center space-x-2 text-xs text-slate-400 font-bold uppercase tracking-wide mb-3">
                  <Calendar size={14} />
                  <span>{formatDate(post.publishedAt)}</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors">
                  {post.title}
                </h2>
                <p className="text-slate-500 leading-relaxed mb-4">{post.excerpt}</p>
                <span className="inline-flex items-center text-indigo-600 font-bold text-sm">
                  Leggi l'articolo
                  <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogIndexView;
