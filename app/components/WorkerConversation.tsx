'use client';

import { useConversation } from '@11labs/react';
import { useCallback, useEffect, useState } from 'react';

interface WorkerConversationProps {
  merchantName: string;
  merchantId: string;
  readerId: string;
  workerId: string;
  workerFirstMessage: string;
  workerPrompt: string;
  workerLanguage: string;
  workerVoiceId: string;
  workerAgentId: string;
}

export function WorkerConversation({
  merchantName,
  merchantId,
  readerId,
  workerId,
  workerFirstMessage,
  workerPrompt,
  workerLanguage,
  workerVoiceId,
  workerAgentId
}: WorkerConversationProps) {
  const [isMicrophonePermissionGranted, setIsMicrophonePermissionGranted] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [productId] = useState('prod_placeholder');
  const [paymentIntentId] = useState('pi_placeholder');

  // Define client tools before creating the conversation
  const clientTools = {
    logMessage: async ({ message }: { message: string }) => {
      console.log(message);
    },
  };

  const getSignedUrl = async (): Promise<string> => {
    // Include the worker's agentId and workerId in the request
    const url = new URL("/api/get-signed-url", window.location.origin);
    url.searchParams.append("agentId", workerAgentId);
    url.searchParams.append("workerId", workerId);

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Failed to get signed url: ${response.statusText}`);
    }
    const { signedUrl } = await response.json();
    return signedUrl;
  };

  const conversation = useConversation({
    apiKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY,
    onConnect: () => console.log('Connected'),
    onDisconnect: () => console.log('Disconnected'),
    onMessage: (message: { content: string }) => console.log('Message:', message),
    onError: (error: Error) => {
      console.error('Conversation error:', error);
      setError(error);
    },
    clientTools,
  });

  const startConversation = useCallback(async () => {
    try {
      console.log('Fetching signed URL...');
      const signedUrl = await getSignedUrl();
      console.log('Got signed URL:', signedUrl);

      console.log('Starting conversation session...');
      await conversation.startSession({
        agentId: workerAgentId, // Use the worker's agentId instead of environment variable
        signedUrl,
        dynamicVariables: {
          merchantName: merchantName,
          merchantId: merchantId,
          readerId: readerId,
          workerId: workerId,
          productId: productId,
          paymentIntentId: paymentIntentId,
          currency: 'gbp'
        },
        overrides: {
          agent: {
            firstMessage: workerFirstMessage,
            prompt: {
              prompt: `
              You are a friendly and efficient virtual assistant for a market stall. 
              Your primary role is to take payments and assist with any questions the customer may have.
              You should use the provided knowledge base to offer accurate and helpful responses.
  
              If the customer requests to make a purchase or should help them do that 
  
              Your high-level goals are:
              - Support the customer with their purchase
              - Answer questions about the products and services
              - Get the customer to pay for the product
              - When a user has changed their mind about the product or quantity, chain tool usages so as not to repeat issues
  
              You have access to the following tools:
              - get_product_info: Use this tool to get specific product information, only respond with the product name
              - get_product_match: Use this tool to search for a product after a customer has asked for a product and retrieve a product id to match the product they have names
              - create_payment_intent: Use this tool to create a payment intent for an order to allow it to be sent to the terminal also add the product data to the payment intent metadata
              - display_terminal_payment: Use this tool to display the payment on the terminal
              - collect_card_payment: Use this tool to collect a card payment on the terminal                
              - cancel_payment: Use this tool to cancel a payment intent on the terminal

              The reader id is: {{readerId}}
              The merchant id is: {{merchantId}}
  
              General Guidelines:
              - Be professional, empathetic and clear.
              - Don't use any jargon like payment intent or terminal
              - Keep responses concise and friendly for voice (avoid reading out the whole response or raw urls or technical terms)              
              - WHen you ask the user to give a quantity, expect a number as the next response.
              - When you have the information you need
              - Try and sound natural and human, don't sound like an AI agent/robot
              - Be conversational and natural in your responses. Use occasional filler words (like "um", "uh", "ah").
              - when given a message from a tool result, say that next
              - When a user has changed their mind about the product or quantity, chain tool usages so as not to repeat tasks

              Here is a bit more information, use it but remember your core role is to take payments and assist with any questions the customer may have.
              
              Info:
              ${workerPrompt}
              `
            },
            language: workerLanguage,
          },
          tts: {
            voiceId: workerVoiceId,
          }
        }
      });
    } catch (error) {
      console.error('Failed to start conversation:', error);
      setError(error as Error);
    }
  }, [conversation, merchantName, merchantId, readerId, workerFirstMessage, workerPrompt, workerLanguage, workerVoiceId, workerAgentId, workerId]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  // Request microphone permission
  useEffect(() => {
    const requestMicrophonePermission = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setIsMicrophonePermissionGranted(true);
      } catch (error) {
        console.error('Failed to request microphone permission:', error);
        setError(error as Error);
      }
    };

    requestMicrophonePermission();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        {/* Status indicator */}
        <div className="flex items-center gap-2 mb-6">
          <div
            className={`w-2 h-2 rounded-full ${conversation.status === 'connected'
              ? 'bg-green-500'
              : 'bg-gray-300'
              }`}
          />
          <span className="text-sm text-gray-600">
            {conversation.status === 'connected'
              ? 'Connected'
              : 'Disconnected'}
          </span>
          {conversation.isSpeaking && (
            <span className="text-sm text-gray-600 ml-2">
              • Speaking
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={startConversation}
            disabled={conversation.status === 'connected'}
            className="flex-1 px-4 py-2.5 bg-[#635bff] hover:bg-[#5851ea] text-white text-sm font-medium rounded-md transition-colors disabled:bg-gray-100 disabled:text-gray-400"
          >
            Start Conversation
          </button>
          <button
            onClick={stopConversation}
            disabled={conversation.status !== 'connected'}
            className="flex-1 px-4 py-2.5 text-gray-700 bg-white hover:bg-gray-50 text-sm font-medium rounded-md border border-gray-300 transition-colors disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200"
          >
            End Conversation
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-md">
            <p className="text-sm text-red-600">
              {error.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 