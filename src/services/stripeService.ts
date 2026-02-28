import { loadStripe } from '@stripe/stripe-js';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

export const stripeService = {
  /**
   * Redirects user to Stripe Checkout
   * @param userEmail User email for pre-filling
   */
  async redirectToCheckout(userEmail: string) {
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userEmail }),
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.message || errorData.error || 'Failed to create checkout session');
        } else {
          const textError = await response.text();
          console.error('Non-JSON error response:', textError);
          throw new Error('O servidor retornou um erro inesperado. Verifique se as chaves do Stripe estão configuradas.');
        }
      }

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('Stripe session URL not found');
      }
    } catch (error: any) {
      console.error('Stripe Redirect Error:', error);
      alert(`Erro no pagamento: ${error.message}`);
    }
  }
};
