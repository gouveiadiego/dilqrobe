
import React from 'react';
import { SubscriptionManager } from '@/components/subscription/SubscriptionManager';

export function SubscriptionPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6 text-center">Gerenciar Assinatura</h1>
      <SubscriptionManager />
    </div>
  );
}

export default SubscriptionPage;
