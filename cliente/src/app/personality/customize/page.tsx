'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getTemplateById, PersonalityTemplate } from '../templates'; 
import { useAuth } from '@/hooks/useAuth';

function PersonalityCustomizeContent() {
  const router = useRouter();
  const params = useSearchParams();
  const templateId = params.get('template');
  const { authFetch } = useAuth();

  const [name, setName] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [tone, setTone] = useState('');
  const [hobbies, setHobbies] = useState('');
  const [quirks, setQuirks] = useState('');
  const [specialties, setSpecialties] = useState('');
  const [teachingStyle, setTeachingStyle] = useState('');
  const [communicationStyle, setCommunicationStyle] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [template, setTemplate] = useState<PersonalityTemplate | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    const storedTemplate = sessionStorage.getItem('selectedTemplate');
    if (storedTemplate) {
      try {
        const parsedTemplate = JSON.parse(storedTemplate);
        setTemplate(parsedTemplate);
        populateFormFromTemplate(parsedTemplate);
        return;
      } catch (e) {
        console.error('Error parsing stored template:', e);
      }
    }

    if (templateId) {
      const foundTemplate = getTemplateById(templateId);
      if (foundTemplate) {
        setTemplate(foundTemplate);
        populateFormFromTemplate(foundTemplate);
      } else {
        setError('Plantilla no encontrada');
      }
    } else {
      router.push('/personality/new');
    }
  }, [templateId, router]);

  const populateFormFromTemplate = (template: PersonalityTemplate) => {
    setName(template.traits.name);
    setAge(template.traits.age);
    setTone(template.traits.tone);
    setHobbies(template.traits.hobbies.join(', '));
    setQuirks(template.traits.quirks);
    
    if (template.traits.specialties) {
      setSpecialties(template.traits.specialties.join(', '));
    }
    if (template.traits.teachingStyle) {
      setTeachingStyle(template.traits.teachingStyle);
    }
    if (template.traits.communicationStyle) {
      setCommunicationStyle(template.traits.communicationStyle);
    }
  };

  const generatePreview = () => {
    setPreview('Generando vista previa...');
    
    setTimeout(() => {
      let previewText = '';
      
      if (template?.category === 'professional') {
        previewText = `Hola, soy ${name}. Estoy aquí para asistirte de manera ${tone}. Mis especialidades incluyen ${specialties}. ¿En qué puedo ayudarte hoy?`;
      } else if (template?.category === 'casual') {
        previewText = `¡Hola! Me llamo ${name} y me encanta charlar sobre ${hobbies}. ${quirks}. ¿Qué tal tu día?`;
      } else if (template?.category === 'educational') {
        previewText = `Saludos, soy ${name}. Mi enfoque de enseñanza es ${teachingStyle}. Estoy aquí para ayudarte a entender cualquier tema de forma ${tone}. ¿Qué te gustaría aprender hoy?`;
      } else if (template?.category === 'creative') {
        previewText = `¡Hola! Soy ${name}, y mi estilo es bastante ${tone}. ${quirks}. ¿Qué tipo de proyecto creativo tienes en mente?`;
      } else {
        previewText = `Hola, soy ${name}. Mi tono es ${tone} y me interesan temas como ${hobbies}. ${quirks}. ¿En qué puedo ayudarte?`;
      }
      
      setPreview(previewText);
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const hobbiesArray = hobbies.split(',').map(h => h.trim()).filter(Boolean);
    const specialtiesArray = specialties ? specialties.split(',').map(s => s.trim()).filter(Boolean) : undefined;

    const traits = {
      name,
      age: typeof age === 'string' ? parseInt(age) : age,
      tone,
      hobbies: hobbiesArray,
      quirks,
      ...(specialtiesArray && { specialties: specialtiesArray }),
      ...(teachingStyle && { teachingStyle }),
      ...(communicationStyle && { communicationStyle }),
    };

    try {
      const res = await authFetch('/users/me/personalities', {
        method: 'POST',
        body: JSON.stringify({ traits }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Error al crear la personalidad');
      }

      const { id } = await res.json();

      await authFetch(`/users/me/personalities/${id}/select`, {
        method: 'POST',
      });

      router.push(`/chat?pid=${id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (!template && !error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-700 dark:text-slate-300">Cargando plantilla...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Encabezado */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Personaliza tu Alter Ego
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Ajusta los detalles de la plantilla <span className="font-medium">{template?.name}</span> para crear tu alter ego personalizado.
          </p>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-md text-sm mb-6">
            {error}
          </div>
        )}

        {/* Formulario de personalización */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nombre */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nombre
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>

            {/* Edad */}
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Edad
              </label>
              <input
                id="age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value === '' ? '' : parseInt(e.target.value))}
                required
                min="1"
                max="120"
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>

            {/* Tono */}
            <div className="md:col-span-2">
              <label htmlFor="tone" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tono de comunicación
              </label>
              <input
                id="tone"
                type="text"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                required
                placeholder="Formal, amigable, técnico, humorístico, etc."
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>

            {/* Hobbies */}
            <div className="md:col-span-2">
              <label htmlFor="hobbies" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Intereses y hobbies (separados por comas)
              </label>
              <input
                id="hobbies"
                type="text"
                value={hobbies}
                onChange={(e) => setHobbies(e.target.value)}
                required
                placeholder="Lectura, música, arte, deportes, tecnología, etc."
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              />
            </div>

            {/* Quirks */}
            <div className="md:col-span-2">
              <label htmlFor="quirks" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Rasgos únicos o peculiaridades
              </label>
              <textarea
                id="quirks"
                value={quirks}
                onChange={(e) => setQuirks(e.target.value)}
                required
                rows={2}
                placeholder="Algún rasgo distintivo o hábito comunicativo particular..."
                className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white custom-scrollbar"
              />
            </div>

            {/* Campos específicos según categoría */}
            {template?.category === 'professional' && (
              <div className="md:col-span-2">
                <label htmlFor="specialties" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Especialidades profesionales (separadas por comas)
                </label>
                <input
                  id="specialties"
                  type="text"
                  value={specialties}
                  onChange={(e) => setSpecialties(e.target.value)}
                  placeholder="Gestión de proyectos, análisis de datos, marketing digital, etc."
                  className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>
            )}

            {template?.category === 'educational' && (
              <div className="md:col-span-2">
                <label htmlFor="teachingStyle" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Estilo de enseñanza
                </label>
                <input
                  id="teachingStyle"
                  type="text"
                  value={teachingStyle}
                  onChange={(e) => setTeachingStyle(e.target.value)}
                  placeholder="Socrático, paso a paso, visual, basado en ejemplos, etc."
                  className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>
            )}

            {['casual', 'professional'].includes(template?.category || '') && (
              <div className="md:col-span-2">
                <label htmlFor="communicationStyle" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Estilo de comunicación
                </label>
                <input
                  id="communicationStyle"
                  type="text"
                  value={communicationStyle}
                  onChange={(e) => setCommunicationStyle(e.target.value)}
                  placeholder="Directo, empático, detallado, conciso, etc."
                  className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
              </div>
            )}
          </div>

          {/* Vista previa */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-md font-medium text-slate-800 dark:text-slate-200">Vista previa</h3>
              <button
                type="button"
                onClick={generatePreview}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Generar vista previa
              </button>
            </div>
            <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-4 min-h-[80px] flex items-center">
              {preview ? (
                <p className="text-slate-800 dark:text-slate-200">{preview}</p>
              ) : (
                <p className="text-slate-500 dark:text-slate-400 text-center w-full">
                  Haz clic en &quot;Generar vista previa&quot; para ver cómo respondería esta personalidad
                </p>
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-end">
            <button
              type="button"
              onClick={() => router.push('/personality/new')}
              className="px-6 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Volver a plantillas
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`
                px-6 py-2 rounded-lg text-white font-medium
                ${loading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
                }
              `}
            >
              {loading ? 'Guardando...' : 'Guardar y comenzar chat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PersonalityCustomizePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-700 dark:text-slate-300">Cargando...</p>
        </div>
      </div>
    }>
      <PersonalityCustomizeContent />
    </Suspense>
  );
}