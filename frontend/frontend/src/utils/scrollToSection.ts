export function scrollToSection(id: string, duration = 1300) {
  const element = document.getElementById(id);

  if (!element) return;

  const start = window.scrollY;
  const target = element.getBoundingClientRect().top + window.scrollY;
  const distance = target - start;

  const startTime = performance.now();

  let animationFrame: number;

  const cancelScroll = () => {
    cancelAnimationFrame(animationFrame);
    window.removeEventListener("wheel", cancelScroll);
    window.removeEventListener("touchmove", cancelScroll);
  };

  window.addEventListener("wheel", cancelScroll, { passive: true });
  window.addEventListener("touchmove", cancelScroll, { passive: true });

  function animate(currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const ease = 1 - Math.pow(1 - progress, 6);

    window.scrollTo(0, start + distance * ease);

    if (progress < 1) {
      animationFrame = requestAnimationFrame(animate);
    } else {
      window.removeEventListener("wheel", cancelScroll);
      window.removeEventListener("touchmove", cancelScroll);
    }
  }

  animationFrame = requestAnimationFrame(animate);
}