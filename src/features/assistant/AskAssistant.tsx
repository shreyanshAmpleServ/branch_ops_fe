import React from 'react';
import { Card, Button, Input } from '../../components/ui';
import { Bot, Send, Sparkles } from 'lucide-react';

export const AskAssistant: React.FC = () => {
  return (
    <div className="page-container flex flex-col h-[calc(100vh-120px)]">
      <div className="flex items-center justify-between mb-5 shrink-0">
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
          <Sparkles className="h-6 w-6 text-primary" /> AI Assistant
        </h1>
        <Button variant="ghost">Clear Chat</Button>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden p-0 bg-surface/50 border border-border">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div className="bg-surface p-4 rounded-2xl rounded-tl-sm border border-border max-w-[80%]">
              <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                Hello! I am your AI assistant. How can I help you today?
              </p>
            </div>
          </div>
          
          <div className="flex gap-4 flex-row-reverse">
            <div className="h-10 w-10 rounded-full bg-surface-hover flex items-center justify-center shrink-0 border border-border">
              <span className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>ME</span>
            </div>
            <div className="bg-primary p-4 rounded-2xl rounded-tr-sm max-w-[80%]">
              <p className="text-sm text-white">
                Show me the latest quotations we sent to Acme Corp.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div className="bg-surface p-4 rounded-2xl rounded-tl-sm border border-border max-w-[80%]">
              <p className="text-sm mb-3" style={{ color: 'var(--color-text)' }}>
                Here are the latest quotations for Acme Corp:
              </p>
              <div className="bg-surface-hover p-3 rounded-lg border border-border">
                <p className="font-semibold text-sm" style={{ color: 'var(--color-primary)' }}>QT-2026-001</p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Amount: $12,500 - Status: Sent</p>
              </div>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-surface shrink-0">
          <div className="relative">
            <input 
              placeholder="Ask me anything..." 
              className="w-full bg-surface-hover border border-border rounded-xl pl-4 pr-12 py-3 text-sm outline-none focus:border-primary transition-colors"
              style={{ color: 'var(--color-text)' }}
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};
