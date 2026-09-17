# Google Ads readiness update

The site is prepared for paid-traffic instrumentation without adding an unconfigured Google Ads conversion ID.

Implemented:

- Existing GA4 measurement ID `G-1WXBX1R7EH` preserved as the only analytics implementation.
- Telegram links consistently target `https://t.me/lastchriseae`.
- Telegram, Knowledge Library, contact-page, and email links receive stable `data-conversion` identifiers.
- A GA4 `conversion_target_click` event is emitted for identified action clicks when GA4 is available; this is an analytics event, not a fake Ads conversion.
- External Telegram links opened in new tabs receive `rel="noopener noreferrer"`.
- Privacy Policy page repaired with valid HTML, canonical metadata, Open Graph metadata, GA4, navigation, and clear analytics/privacy language.
- Web manifest given a valid site name, description, start URL, display mode, and theme colors.

Before launching campaigns:

1. Verify the live site serves the intended canonical URLs with `200` responses.
2. Configure Google Ads conversion actions in the Ads account for the desired actions.
3. Add the real Google Ads conversion linker/tag or Google tag configuration supplied by the Ads account; do not invent IDs.
4. Import or map GA4 key events to Google Ads only after confirming attribution requirements.
5. Test Telegram, email, Knowledge Library and Contact interactions in GA4 DebugView and browser network tools.
6. Confirm privacy/cookie consent requirements for the target jurisdictions before collecting advertising-related signals.
7. Use dedicated campaign landing pages only after their content, canonical, CTA and tracking behavior are verified.
