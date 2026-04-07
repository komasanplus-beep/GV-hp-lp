/**
 * useSeoHead - document.head にSEOメタを動的に適用するフック
 * react-helmetは未インストールのため、DOM直接操作で安全に実装
 */
import { useEffect } from 'react';

export function useSeoHead({ title, description, ogTitle, ogDescription, ogImage, canonicalUrl, keywords } = {}) {
  useEffect(() => {
    const prev = {
      title: document.title,
    };

    // Title
    if (title) {
      document.title = title;
    }

    // Helper to set/create meta tag
    const setMeta = (selector, content) => {
      if (!content) return null;
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        const attr = selector.match(/\[name="(.+?)"\]/)?.[1];
        const prop = selector.match(/\[property="(.+?)"\]/)?.[1];
        if (attr) el.setAttribute('name', attr);
        if (prop) el.setAttribute('property', prop);
        document.head.appendChild(el);
        el._injected = true;
      }
      el.setAttribute('content', content);
      return el;
    };

    // Helper to set/create link tag
    const setLink = (rel, href) => {
      if (!href) return null;
      let el = document.querySelector(`link[rel="${rel}"]`);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', rel);
        document.head.appendChild(el);
        el._injected = true;
      }
      el.setAttribute('href', href);
      return el;
    };

    const els = [
      setMeta('[name="description"]', description),
      setMeta('[name="keywords"]', keywords?.join(', ')),
      setMeta('[property="og:title"]', ogTitle || title),
      setMeta('[property="og:description"]', ogDescription || description),
      setMeta('[property="og:image"]', ogImage),
      setMeta('[property="og:type"]', 'website'),
      setLink('canonical', canonicalUrl),
    ].filter(Boolean);

    return () => {
      // Restore title
      document.title = prev.title;
      // Remove injected tags
      els.forEach(el => { if (el._injected) el.remove(); });
    };
  }, [title, description, ogTitle, ogDescription, ogImage, canonicalUrl, keywords]);
}