const WHAPI_TOKEN = 'SsK420XOl2oGti6zG6gta5wUe5nKcl5y';
const WHAPI_URL = 'https://gate.whapi.cloud/messages/text';

export const sendWhatsAppMessage = async (to: string, text: string) => {
  try {
    // Clean phone number: remove non-digits
    const cleanPhone = to.replace(/\D/g, '');
    
    // Whapi expects the number with country code, e.g., 5511999999999
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    // Split the text to remove the raw URL and use it in a button if possible
    // However, Whapi's interactive buttons require a different endpoint.
    // To keep it simple and reliable, we'll use the text endpoint but enable preview_url.
    
    const response = await fetch(WHAPI_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHAPI_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        typing_time: 0,
        to: `${formattedPhone}@s.whatsapp.net`,
        body: text,
        view_once: false,
        preview_url: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Whapi API Error:', errorData);
      return { success: false, error: errorData };
    }

    return { success: true };
  } catch (error) {
    console.error('Whapi Service Error:', error);
    return { success: false, error };
  }
};
