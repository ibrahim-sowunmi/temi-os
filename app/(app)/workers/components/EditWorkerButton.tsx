'use client';

import { useState } from 'react';
import { Edit2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Worker {
  id: string;
  name: string;
  agentId: string;
  language: string;
  firstMessage: string | null;
  prompt: string | null;
  voiceId: string | null;
  merchantId: string;
  locations?: { id: string; displayName: string }[];
}

interface EditWorkerButtonProps {
  worker: Worker;
}

export default function EditWorkerButton({ worker }: EditWorkerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Form state
  const [name, setName] = useState(worker.name);
  const [language, setLanguage] = useState(worker.language);
  const [firstMessage, setFirstMessage] = useState(worker.firstMessage || '');
  const [prompt, setPrompt] = useState(worker.prompt || '');
  const [voiceId, setVoiceId] = useState(worker.voiceId || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/worker?id=${worker.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          language,
          firstMessage: firstMessage || null,
          prompt: prompt || null,
          voiceId: voiceId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update worker');
      }

      // Close panel and refresh page
      setIsOpen(false);
      router.refresh();
    } catch (error: any) {
      console.error('Error updating worker:', error);
      setError(error.message || 'An error occurred while updating the worker');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50 transition-colors"
        title="Edit worker"
      >
        <Edit2 size={18} />
      </button>

      {/* Slide-out panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/20" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="absolute inset-y-0 right-0 max-w-full flex">
            <div className="relative w-screen max-w-md">
              <div className="h-full flex flex-col bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                  <h2 className="text-xl font-semibold text-gray-900">Edit Worker</h2>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-md">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}
                  
                  <form id="editWorkerForm" onSubmit={handleSubmit}>
                    <div className="space-y-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                          Name *
                        </label>
                        <input
                          type="text"
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="agentId" className="block text-sm font-medium text-gray-700 mb-1">
                          Agent ID
                        </label>
                        <div className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-gray-500">
                          {worker.agentId}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Agent ID cannot be modified</p>
                      </div>
                      
                      <div>
                        <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                          Language *
                        </label>
                        <select
                          id="language"
                          value={language}
                          onChange={(e) => setLanguage(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="en">English</option>
                          <option value="fr">French</option>
                          <option value="es">Spanish</option>
                          <option value="de">German</option>
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="voiceId" className="block text-sm font-medium text-gray-700 mb-1">
                          Voice ID
                        </label>
                        <input
                          type="text"
                          id="voiceId"
                          value={voiceId}
                          onChange={(e) => setVoiceId(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., 56AoDkrOh6qfVPDXZ7Pt"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="firstMessage" className="block text-sm font-medium text-gray-700 mb-1">
                          First Message
                        </label>
                        <textarea
                          id="firstMessage"
                          value={firstMessage}
                          onChange={(e) => setFirstMessage(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Custom first message to greet customers"
                        ></textarea>
                      </div>
                      
                      <div>
                        <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
                          Prompt
                        </label>
                        <textarea
                          id="prompt"
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          rows={6}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Custom instructions for this worker"
                        ></textarea>
                      </div>
                    </div>
                  </form>
                </div>
                
                {/* Footer with actions */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="editWorkerForm"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 