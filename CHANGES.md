# Changes: "Book a demo" / WhatsApp fix

## The problem
Clicking any "Book a free demo" button crashed the whole site to a blank page.

Cause: in `src/components/DemoBookingModal.tsx`, `if (!isOpen) return null;` sat *before* a
`useState` call. That breaks React's Rules of Hooks, so the moment the modal opened React threw
`Rendered more hooks than during the previous render` and unmounted the entire app.

## What changed
- Every "Book a demo" button (navbar, hero, cards, CTAs, mobile bar, mobile menu) now opens
  WhatsApp directly: `https://wa.me/919031400899` with a pre-filled message.
- The floating "Chat on WhatsApp" buttons and the footer link open real WhatsApp too. The old
  `WhatsAppModal` was a simulated chat with canned replies; nothing typed in it reached WhatsApp.
- `DemoBookingModal.tsx`: hook order fixed, and the default grade / time slot now match the
  dropdown options (before, the dropdown showed one value but the form submitted another).
- New `ErrorBoundary`: if any component crashes in future, visitors see a "Reload / Chat on
  WhatsApp" screen instead of a blank page.

## Change the number or messages
Edit one file: `src/utils/whatsapp.ts` (`WHATSAPP_NUMBER`, `DEMO_MESSAGE`, `HELP_MESSAGE`).

## Good to know
- `DemoBookingModal.tsx` and `WhatsAppModal.tsx` are no longer used by the site. They were kept,
  not deleted, and can be removed whenever you like.
- Demo requests no longer create entries in the admin "Demo Booking Queue" (there is no form any
  more); they arrive on WhatsApp instead.
- Footer "Privacy Policy / Terms of Service / Student Safety Protocol" are plain text, not links.
  They need real pages or content.

## Files
Modified: `src/App.tsx`, `src/main.tsx`, `src/components/DemoBookingModal.tsx`
Added: `src/utils/whatsapp.ts`, `src/components/ErrorBoundary.tsx`, `CHANGES.md`
