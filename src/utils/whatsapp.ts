// Single source of truth for the Tutor Monk WhatsApp number and click-to-chat links.
// Change the number or the pre-filled messages here and every button on the site follows.

// Country code + number, digits only (this is +91 90314 00899).
export const WHATSAPP_NUMBER = '919031400899';
export const WHATSAPP_DISPLAY = '+91 90314 00899';

// Text that appears pre-typed in the visitor's WhatsApp message box.
export const DEMO_MESSAGE =
  "Hello Tutor Monk! I'd like to book a free 1:1 demo class.\n\n" +
  'Student name:\n' +
  'Grade:\n' +
  'Subject:\n' +
  'Country / time zone:\n' +
  'Preferred day & time:';

export const HELP_MESSAGE = 'Hello Tutor Monk! I have a question about your online classes.';

export const buildWhatsAppUrl = (message: string): string =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

// Opens WhatsApp in a new tab/app. Must be called straight from a click handler so
// browsers do not treat it as a pop-up. If a browser blocks the new tab anyway
// (some in-app browsers do), fall back to opening WhatsApp in the current tab.
export function openWhatsApp(message: string): void {
  const url = buildWhatsAppUrl(message);
  const win = window.open(url, '_blank');
  if (win) {
    try {
      win.opener = null;
    } catch {
      /* ignore */
    }
  } else {
    window.location.href = url;
  }
}

export const openDemoWhatsApp = (): void => openWhatsApp(DEMO_MESSAGE);
export const openHelpWhatsApp = (): void => openWhatsApp(HELP_MESSAGE);
