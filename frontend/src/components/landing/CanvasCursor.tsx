import { useEffect, useRef } from "react";

const CanvasCursor = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const mouse = useRef({ x: 0, y: 0 });
  const coreCursor = useRef({ x: 0, y: 0 });
  const ringCursor = useRef({ x: 0, y: 0 });
  const hasMouse = useRef(false);
  const isPointerHover = useRef(false);

  // ✅ delay buffer
  const history = useRef<{ x: number; y: number }[]>([]);
  const delayFrames = 18; // increase for more delay

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const styles = getComputedStyle(document.querySelector(".landing-page")!);
    const core = styles.getPropertyValue("--cursor-core").trim();
    const glow = styles.getPropertyValue("--cursor-glow").trim();

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    document.body.style.cursor = "none";

    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;

      const target = e.target as HTMLElement | null;
      const shouldUsePointer = Boolean(
        target?.closest(
          'a, button, input, textarea, select, [role="button"], [data-cursor-pointer="true"]'
        )
      );

      if (shouldUsePointer !== isPointerHover.current) {
        isPointerHover.current = shouldUsePointer;
        document.body.style.cursor = shouldUsePointer ? "pointer" : "none";
      }

      if (!hasMouse.current) {
        coreCursor.current.x = e.clientX;
        coreCursor.current.y = e.clientY;
        ringCursor.current.x = e.clientX;
        ringCursor.current.y = e.clientY;
        hasMouse.current = true;
      }
    };

    const animate = () => {
      const coreDx = mouse.current.x - coreCursor.current.x;
      const coreDy = mouse.current.y - coreCursor.current.y;

      // ✅ smoother core (not too aggressive)
      coreCursor.current.x += coreDx * 0.32;
      coreCursor.current.y += coreDy * 0.32;

      // ✅ store history
      history.current.push({
        x: coreCursor.current.x,
        y: coreCursor.current.y,
      });

      // ✅ delayed + SMOOTH follow (this is the key fix)
      if (history.current.length > delayFrames) {
        const delayed = history.current.shift();

        if (delayed) {
          ringCursor.current.x += (delayed.x - ringCursor.current.x) * 0.18;
          ringCursor.current.y += (delayed.y - ringCursor.current.y) * 0.18;
        }
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!hasMouse.current) {
        requestAnimationFrame(animate);
        return;
      }

      // === GOLD DOT ===
      ctx.beginPath();
      ctx.arc(coreCursor.current.x, coreCursor.current.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = core;
      ctx.fill();

      // === GLOW ===
      const glowGradient = ctx.createRadialGradient(
        coreCursor.current.x,
        coreCursor.current.y,
        0,
        coreCursor.current.x,
        coreCursor.current.y,
        14
      );

      glowGradient.addColorStop(0, core);
      glowGradient.addColorStop(0.4, glow);
      glowGradient.addColorStop(1, "transparent");

      ctx.beginPath();
      ctx.arc(coreCursor.current.x, coreCursor.current.y, 14, 0, Math.PI * 2);
      ctx.fillStyle = glowGradient;
      ctx.fill();

      // === WHITE DELAYED RING ===
      ctx.beginPath();
      ctx.arc(ringCursor.current.x, ringCursor.current.y, 18, 0, Math.PI * 2);

      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 1.8;

      ctx.shadowColor = "rgba(255,255,255,0.7)";
      ctx.shadowBlur = 8;

      ctx.stroke();

      ctx.shadowBlur = 0;

      requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", resize);

    document.body.style.cursor = "none";
    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", resize);
      document.body.style.cursor = "auto";
    };
  }, []);

  return <canvas ref={canvasRef} className="cursor-canvas" />;
};

export default CanvasCursor;