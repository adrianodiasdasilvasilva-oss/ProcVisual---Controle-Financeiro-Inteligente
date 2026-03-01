const WHAPI_TOKEN = 'SsK420XOl2oGti6zG6gta5wUe5nKcl5y';
const WHAPI_URL = 'https://gate.whapi.cloud/messages/text';

export const sendWhatsAppMessage = async (to: string, text: string) => {
  try {
    // Clean phone number: remove non-digits
    const cleanPhone = to.replace(/\D/g, '');
    
    // Whapi expects the number with country code, e.g., 5511999999999
    // If the number doesn't start with 55 (Brazil), we might need to adjust, 
    // but assuming Brazil for now as per the pt-BR context.
    const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;

    const response = await fetch(WHAPI_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHAPI_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        typing_time: 0,
        to: `${formattedPhone}@s.whatsapp.net`,
        body: text
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
