import { escapeHtml } from './utils.js';

// Configure Marked
// Assuming 'marked' is loaded globally from CDN as requested in plan
// If not, we should check availability.
if (typeof marked !== 'undefined') {
    marked.setOptions({
        breaks: true, // Enable GFM line breaks
        gfm: true,
        headerIds: false, // Prevent adding ids to headers
        mangle: false // Prevent email mangling
    });
}

export function renderContent(content, useMarkdown = false) {
    if (!content) return '';

    if (useMarkdown && typeof marked !== 'undefined') {
        try {
            return marked.parse(content);
        } catch (e) {
            console.error("Markdown parse error:", e);
            return escapeHtml(content);
        }
    }

    return escapeHtml(content);
}
