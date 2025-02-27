'use client';

import React, { useEffect, useState } from 'react';
import { WorkerConversation } from './WorkerConversation';

interface Merchant {
  id: string;
  businessName: string;
}

interface Terminal {
  id: string;
  name: string;
  stripeTerminalId: string;
  locationId: string;
  deviceType: string;
}

interface Worker {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  agentId: string;
  language: string;
  firstMessage: string | null;
  prompt: string | null;
  voiceId: string | null;
  merchantId: string;
  merchant: Merchant;
}

interface WorkerDeployCardProps {
  worker: Worker;
  merchantName: string;
}

export function WorkerDeployCard({ worker, merchantName }: WorkerDeployCardProps) {
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [selectedTerminal, setSelectedTerminal] = useState<Terminal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch terminals for this merchant
  useEffect(() => {
    const fetchTerminals = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/merchant/${worker.merchantId}/terminals`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch terminals');
        }
        
        const data = await response.json();
        setTerminals(data);
        
        // Select the first terminal by default if available
        if (data.length > 0) {
          setSelectedTerminal(data[0]);
        }
      } catch (err) {
        console.error('Error fetching terminals:', err);
        setError('Could not load terminals. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTerminals();
  }, [worker.merchantId]);
  
  // Handle terminal selection change
  const handleTerminalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const terminalId = e.target.value;
    const terminal = terminals.find(t => t.id === terminalId) || null;
    setSelectedTerminal(terminal);
  };
  
  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-medium">{worker.name}</h3>
          <p className="text-sm text-gray-500">
            Last updated: {new Date(worker.updatedAt).toLocaleString()}
          </p>
        </div>
        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
          Ready to deploy
        </span>
      </div>
      
      {/* Terminal selection */}
      <div className="mb-4">
        <label htmlFor={`terminal-select-${worker.id}`} className="block text-sm font-medium text-gray-700 mb-1">
          Select Terminal
        </label>
        
        {isLoading ? (
          <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
        ) : error ? (
          <div className="text-red-500 text-sm">{error}</div>
        ) : terminals.length === 0 ? (
          <div className="text-amber-500 text-sm">No terminals available for this merchant</div>
        ) : (
          <select
            id={`terminal-select-${worker.id}`}
            value={selectedTerminal?.id || ''}
            onChange={handleTerminalChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            {terminals.map(terminal => (
              <option key={terminal.id} value={terminal.id}>
                {terminal.name || `Terminal (${terminal.deviceType})`}
              </option>
            ))}
          </select>
        )}
      </div>
      
      {/* Conversation component - client side only */}
      {selectedTerminal ? (
        <WorkerConversation
          merchantName={merchantName}
          merchantId={worker.merchantId}
          readerId={selectedTerminal.stripeTerminalId}
          workerId={worker.id}
          workerFirstMessage={worker.firstMessage || `Hey There! How can I help you today with ${merchantName}?`}
          workerPrompt={worker.prompt || "You are a friendly and efficient virtual assistant."}
          workerLanguage={worker.language || "en"}
          workerVoiceId={worker.voiceId || "56AoDkrOh6qfVPDXZ7Pt"}
          workerAgentId={worker.agentId}
        />
      ) : (
        <div className="p-4 bg-gray-100 rounded text-center">
          <p className="text-gray-500">Please select a terminal to deploy the worker</p>
        </div>
      )}
    </div>
  );
} 