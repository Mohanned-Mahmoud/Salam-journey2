import { useEffect, useRef } from "react";

/**
 * Adds the `is-visible` class to elements with the `reveal` class
 * once they enter the viewport. Use inside a section/page component.
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const elements = Array.from(root.querySelectorAll<HTMLElement>(".reveal"));
    if (elements.length === 0) return;

    // Fail open: if IntersectionObserver doesn't fire reliably in a given
    // browser/profile, we still want content to become visible.
    const fallbackTimer = window.setTimeout(() => {
      elements.forEach((el) => el.classList.add("is-visible"));
    }, 600);

    if (typeof IntersectionObserver === "undefined") {
      elements.forEach((el) => el.classList.add("is-visible"));
      window.clearTimeout(fallbackTimer);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, idx) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const delay = Number(el.dataset.revealDelay ?? idx * 90);
            window.setTimeout(() => el.classList.add("is-visible"), delay);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );

    elements.forEach((el) => observer.observe(el));
    return () => {
      window.clearTimeout(fallbackTimer);
      observer.disconnect();
    };
  }, []);

  return ref;
}
