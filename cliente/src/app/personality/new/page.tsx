'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { personalityTemplates, PersonalityTemplate } from '../templates';
import { useAuth } from '@/hooks/useAuth';

const CategoryIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'briefcase':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      );
    case 'chart':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    case 'smile':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'sparkles':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      );
    case 'paintbrush':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'book':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      );
    case 'graduationCap':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path d="M12 14l9-5-9-5-9 5 9 5z" />
          <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
        </svg>
      );
    case 'lightbulb':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      );
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      );
  }
};

const TemplateCard = ({ 
  template, 
  selected, 
  onClick 
}: { 
  template: PersonalityTemplate; 
  selected: boolean; 
  onClick: () => void;
}) => {
  return (
    <div 
      className={`
        p-4 rounded-lg cursor-pointer transition-all
        ${selected 
          ? 'bg-blue-100 border-2 border-blue-500 dark:bg-blue-900 dark:border-blue-400' 
          : 'bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600'
        }
      `}
      onClick={onClick}
    >
      <div className="flex items-center mb-3">
        <div className={`p-2 rounded-md mr-3 ${selected ? 'bg-blue-200 text-blue-700 dark:bg-blue-800 dark:text-blue-200' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>
          <CategoryIcon type={template.icon} />
        </div>
        <h3 className="font-medium text-lg text-slate-900 dark:text-white">{template.name}</h3>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">{template.description}</p>
      <div className="text-xs text-slate-500 dark:text-slate-400">
        <span className="font-medium">Rasgos: </span>
        {template.traits.tone}
      </div>
    </div>
  );
};

const CategoryFilter = ({ 
  activeCategory, 
  setActiveCategory 
}: { 
  activeCategory: string; 
  setActiveCategory: (category: string) => void;
}) => {
  const categories = [
    { id: 'all', name: 'Todas' },
    { id: 'professional', name: 'Profesionales' },
    { id: 'casual', name: 'Casuales' },
    { id: 'creative', name: 'Creativas' },
    { id: 'educational', name: 'Educativas' }
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {categories.map(category => (
        <button
          key={category.id}
          onClick={() => setActiveCategory(category.id)}
          className={`
            px-4 py-2 text-sm rounded-full transition-colors
            ${activeCategory === category.id 
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100' 
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }
          `}
        >
          {category.name}
        </button>
      ))}
    </div>
  );
};

export default function TemplateSelectionPage() {
  const router = useRouter();
  const { authFetch } = useAuth();
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredTemplates = activeCategory === 'all' 
    ? personalityTemplates 
    : personalityTemplates.filter(t => t.category === activeCategory);

  const handleContinue = async () => {
    if (!selectedTemplate) {
      setError('Por favor, selecciona una plantilla para continuar');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const template = personalityTemplates.find(t => t.id === selectedTemplate);
    if (!template) {
      setError('Plantilla no encontrada');
      setLoading(false);
      return;
    }

    sessionStorage.setItem('selectedTemplate', JSON.stringify(template));
    
    router.push(`/personality/customize?template=${selectedTemplate}`);
  };

  const handleCustom = () => {
    router.push('/personality/setup');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12">
      <div className="max-w-5xl mx-auto px-4">
        {/* Encabezado */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Elige una plantilla
          </h1>
          <p className="text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Selecciona una de nuestras plantillas predefinidas como punto de partida para tu nuevo alter ego.
            Después podrás personalizarla a tu gusto.
          </p>
        </div>

        {/* Filtro de categorías */}
        <CategoryFilter 
          activeCategory={activeCategory} 
          setActiveCategory={setActiveCategory} 
        />

        {/* Grid de plantillas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {filteredTemplates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              selected={selectedTemplate === template.id}
              onClick={() => setSelectedTemplate(template.id)}
            />
          ))}
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="text-red-500 text-center mb-4">
            {error}
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <button
            onClick={handleCustom}
            className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Crear desde cero
          </button>
          <button
            onClick={handleContinue}
            disabled={!selectedTemplate || loading}
            className={`
              px-6 py-2 rounded-lg text-white font-medium
              ${!selectedTemplate || loading
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
              }
            `}
          >
            {loading ? 'Cargando...' : 'Continuar y personalizar'}
          </button>
        </div>
      </div>
    </div>
  );
}