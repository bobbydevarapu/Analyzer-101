import { useEffect, useRef } from "react";

export const useScrollAnimation = (options?: IntersectionObserverInit) => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("animate-fade-in-up");
        observer.unobserve(entry.target);
      }
    }, {
      threshold: 0.1,
      ...options,
    });

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [options]);

  return ref;
};

export const useScrollAnimationGroup = () => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        const children = entry.target.querySelectorAll(".stagger-item");
        children.forEach((child, index) => {
          (child as HTMLElement).style.animationDelay = `${index * 100}ms`;
          child.classList.add("animate-fade-in-up");
        });
        observer.unobserve(entry.target);
      }
    }, {
      threshold: 0.1,
    });

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return ref;
};
