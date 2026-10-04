/* Comportamentos comuns das amostras: WhatsApp, menu, aparecer ao rolar */
(function () {
  const wa = document.body.dataset.wa || "5500000000000";
  document.querySelectorAll("[data-msg]").forEach(a => { a.href = "https://wa.me/" + wa + "?text=" + encodeURIComponent(a.dataset.msg); a.target = "_blank"; a.rel = "noopener"; });
  const y = document.getElementById("year"); if (y) y.textContent = new Date().getFullYear();
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce && "IntersectionObserver" in window) {
    document.documentElement.classList.add("anim");
    const io = new IntersectionObserver(en => en.forEach(x => { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } }), { threshold: .1 });
    document.querySelectorAll(".rv").forEach(el => io.observe(el));
  }
  const mb = document.getElementById("menuBtn"), nav = document.getElementById("nav");
  if (mb && nav) { mb.onclick = () => { const o = nav.classList.toggle("open"); mb.setAttribute("aria-expanded", o); }; nav.addEventListener("click", e => { if (e.target.closest("a")) nav.classList.remove("open"); }); }
  const faq = document.querySelectorAll("details"); faq.forEach(d => d.addEventListener("toggle", () => { if (d.open) faq.forEach(o => { if (o !== d) o.open = false; }); }));
})();
