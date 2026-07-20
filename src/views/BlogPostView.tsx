
import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Calendar, ExternalLink } from 'lucide-react';
import SEO from '../../components/SEO';
import { getPostBySlug, BlogBlock } from '../data/blogPosts';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

const renderBlock = (block: BlogBlock, idx: number) => {
  switch (block.type) {
    case 'h2':
      return <h2 key={idx} className="text-2xl font-black text-slate-900 mt-10 mb-4">{block.text}</h2>;
    case 'list':
      return (
        <ul key={idx} className="space-y-2 my-4 list-disc list-inside text-slate-600">
          {block.items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      );
    case 'links':
      return (
        <ul key={idx} className="space-y-2 my-4">
          {block.items.map((item, i) => {
            const isInternal = item.url.startsWith('/');
            const linkClass = 'inline-flex items-center text-indigo-600 hover:text-indigo-700 font-semibold underline underline-offset-2';
            return (
              <li key={i}>
                {isInternal ? (
                  <Link to={item.url} className={linkClass}>{item.label}</Link>
                ) : (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
                    {item.label}
                    <ExternalLink size={14} className="ml-1.5 shrink-0" />
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      );
    case 'p':
    default:
      return <p key={idx} className="text-slate-600 leading-relaxed my-4">{block.text}</p>;
  }
};

const BlogPostView: React.FC = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const post = slug ? getPostBySlug(slug) : undefined;

  useEffect(() => { window.scrollTo(0, 0); }, [slug]);

  if (!post) {
    return (
      <>
        <SEO title="Articolo non trovato" description="L'articolo richiesto non è disponibile." noindex />
        <div className="min-h-screen flex items-center justify-center bg-slate-50 flex-col p-6 text-center">
          <h1 className="text-3xl font-black text-slate-900 mb-4">Articolo non trovato</h1>
          <Link to="/blog" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold">Torna al Blog</Link>
        </div>
      </>
    );
  }

  const handleCtaClick = () => {
    navigate('/post-job');
  };

  return (
    <div className="min-h-screen bg-white pt-20 pb-32">
      <SEO title={post.title} description={post.excerpt} path={`/blog/${post.slug}`} />
      <article className="max-w-[750px] mx-auto px-6">
        <Link to="/blog" className="inline-flex items-center text-slate-500 hover:text-indigo-600 font-bold text-sm mb-8 transition-colors">
          <ArrowLeft size={16} className="mr-1" />
          Tutti gli articoli
        </Link>

        <div className="flex items-center space-x-2 text-xs text-slate-500 font-bold uppercase tracking-wide mb-4">
          <Calendar size={14} />
          <span>{formatDate(post.publishedAt)}</span>
        </div>

        <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-8 leading-tight">
          {post.title}
        </h1>

        <div>
          {post.body.map((block, idx) => renderBlock(block, idx))}
        </div>

        <div className="mt-16 bg-slate-900 rounded-[24px] p-10 text-center">
          <h2 className="text-2xl font-black text-white mb-4">Pronto a ricevere preventivi?</h2>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Descrivi il tuo progetto gratuitamente e ricevi proposte da professionisti selezionati.
          </p>
          <button
            onClick={handleCtaClick}
            className="px-8 py-4 bg-white text-slate-900 font-black rounded-2xl hover:bg-indigo-50 transition-all inline-flex items-center"
          >
            Pubblica Richiesta Gratis
            <ArrowRight size={18} className="ml-2" />
          </button>
          {post.relatedServiceSlug && (
            <div className="mt-4">
              <Link to={`/service/${post.relatedServiceSlug}`} className="text-slate-400 hover:text-white text-sm font-medium underline">
                Scopri di più su questo servizio
              </Link>
            </div>
          )}
        </div>
      </article>
    </div>
  );
};

export default BlogPostView;
