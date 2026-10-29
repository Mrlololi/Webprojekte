/**
 * KittyCats - the animation layer.
 *
 * Everything is visible in the HTML. This file only adds motion, and only
 * when GSAP has loaded and the system does not ask for reduced motion.
 *
 *   Hero      GSAP timeline: blink + tail flick, about 4 s, replayed on re-entry
 *   01        SVG path morph: GSAP attr: { d } tweens, scrubbed by ScrollTrigger
 *   02        ScrollTrigger.batch(): tiles lift in, reverse when scrolled back
 *   03        CSS scroll-driven (view()) in kittycats.css; IntersectionObserver
 *             fallback here
 *   04        ScrollTrigger scrub parallax from 768px, a fade on phones
 *   Follower  CSS scroll() timeline; ScrollTrigger scrub fallback here
 *
 * GSAP 3.15.0 and ScrollTrigger are self-hosted in ../assets/vendor/
 * (GreenSock standard "no charge" license, https://gsap.com/standard-license).
 */
(function () {
  'use strict';

  var supports = function (rule) {
    return !!(window.CSS && CSS.supports && CSS.supports(rule));
  };
  var hasIO = 'IntersectionObserver' in window;

  /* ---------- Spiders: dangle only when they come into view ---------- */

  if (hasIO) {
    var spiderWatch = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle('is-visible', entry.isIntersecting);
      });
    });
    document.querySelectorAll('.web-divider, .hero__art').forEach(function (el) {
      spiderWatch.observe(el);
    });
  }

  /* ---------- 03 fallback: stretch once per entry without scroll timelines ---------- */

  if (!supports('animation-timeline: view()') && hasIO) {
    var cardWatch = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) entry.target.classList.add('is-in');
        // Below the screen again: ready to stretch on the next entry.
        else if (entry.boundingClientRect.top > 0) entry.target.classList.remove('is-in');
      });
    }, { threshold: 0.35 });
    document.querySelectorAll('.cat-card').forEach(function (card) {
      cardWatch.observe(card);
    });
  }

  /* ---------- GSAP from here on ---------- */

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  if (!gsap || !ScrollTrigger) return;

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  var $ = function (selector) { return document.querySelector(selector); };
  var $$ = function (selector) { return gsap.utils.toArray(selector); };

  // A quick blink: eyes shut and open again (--blink scales the eyes in the symbol).
  function blink(timeline, target, at) {
    timeline
      .to(target, { '--blink': 0.1, duration: 0.09, ease: 'power2.in' }, at)
      .to(target, { '--blink': 1, duration: 0.15, ease: 'power2.out' }, at + 0.09);
  }

  // Every data-to-* attribute is the end value of the attribute of the same name.
  function endAttrs(el) {
    var attrs = {};
    Array.prototype.forEach.call(el.attributes, function (a) {
      if (a.name.indexOf('data-to-') === 0) attrs[a.name.slice(8)] = a.value;
    });
    return attrs;
  }

  var moodParts = $$('.mood-cat [data-to-d], .mood-cat [data-to-rx], .mood-cat [data-to-stroke-width]');

  /* ---------- Hero: blink and tail flick, then rest ---------- */

  function heroScene() {
    var kitten = $('.hero__kitten');
    var cat = $('.hero__cat');
    if (!kitten || !cat) return;
    gsap.set([kitten, cat], { '--blink': 1, '--tail': '0deg' });

    var scene = gsap.timeline({ paused: true });
    scene.to(cat, { '--tail': '-12deg', duration: 0.45, ease: 'sine.inOut', yoyo: true, repeat: 5 }, 0.2);
    scene.to(kitten, { '--tail': '14deg', duration: 0.35, ease: 'sine.inOut', yoyo: true, repeat: 3 }, 1);
    blink(scene, kitten, 0.5);
    blink(scene, cat, 1.7);
    blink(scene, kitten, 2.9);
    blink(scene, kitten, 3.25);

    // Plays while the hero is on screen, replays after it was left.
    ScrollTrigger.create({
      trigger: '.hero',
      start: 'top bottom',
      end: 'bottom top',
      onToggle: function (self) {
        if (self.isActive) scene.restart();
        else scene.pause();
      }
    });
  }

  /* ---------- 01: the cat's mood follows the scroll (path morph) ---------- */

  function moodMorph(wide) {
    var cat = $('.mood-cat');
    if (!cat || !moodParts.length) return;
    var morph = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: wide
        // Desktop: the heading (and the cat) stay put while the cards stack.
        ? { trigger: '.questions__cards', start: 'top 55%', end: 'bottom 75%', scrub: 0.6 }
        // Phones: the heading scrolls away, so the change happens on the way past.
        : { trigger: cat, start: 'top 80%', end: 'bottom 25%', scrub: 0.6 }
    });
    moodParts.forEach(function (part) {
      morph.to(part, { attr: endAttrs(part) }, 0);
    });
  }

  /* ---------- 02: tiles lift into the grid, and back out when scrolled above ---------- */

  function galleryEntrance() {
    var tiles = $$('.gallery__grid .morph');
    if (!tiles.length) return;
    gsap.set(tiles, { opacity: 0, y: 24 });
    var show = function (batch) {
      gsap.to(batch, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', stagger: 0.07, overwrite: true });
      batch.forEach(function (tile, i) {
        var kitten = tile.querySelector('.morph__kitten');
        if (!kitten) return;
        var wink = gsap.timeline({ delay: 0.4 + i * 0.12 });
        blink(wink, kitten, 0);
      });
    };
    ScrollTrigger.batch(tiles, {
      start: 'top 88%',
      onEnter: show,
      onEnterBack: show,
      onLeaveBack: function (batch) {
        gsap.to(batch, { opacity: 0, y: 24, duration: 0.3, ease: 'power2.in', stagger: 0.04, overwrite: true });
      }
    });
  }

  /* ---------- 04: parallax from 768px, a fade on phones ---------- */

  function aboutScene(wide) {
    var person = $('.person');
    var items = $$('.checklist li');
    if (items.length) {
      gsap.from(items, {
        opacity: 0,
        x: -20,
        duration: 0.4,
        ease: 'power2.out',
        stagger: 0.08,
        scrollTrigger: { trigger: '.checklist', start: 'top 85%', toggleActions: 'play none none reverse' }
      });
    }
    if (!person) return;
    if (wide) {
      gsap.fromTo(person, { y: 40 }, {
        y: -16,
        ease: 'none',
        scrollTrigger: { trigger: '.split', start: 'top bottom', end: 'bottom top', scrub: 0.8 }
      });
    } else {
      gsap.from(person, {
        opacity: 0,
        y: 24,
        duration: 0.5,
        ease: 'power2.out',
        scrollTrigger: { trigger: person, start: 'top 85%', toggleActions: 'play none none reverse' }
      });
    }
  }

  /* ---------- The kitten on the bottom edge ---------- */

  function follower() {
    var walker = $('.follower__walker');
    var cat = $('.follower__cat');
    if (!walker || !cat) return function () {};
    var cssTimeline = supports('animation-timeline: scroll()');

    // Fallback for browsers without CSS scroll timelines: the same walk, scrubbed.
    if (!cssTimeline) {
      var walk = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { start: 0, end: 'max', scrub: true, invalidateOnRefresh: true }
      });
      walk.to(walker, { x: function () { return walker.parentNode.clientWidth - walker.offsetWidth; } }, 0);
      walk.fromTo('.follower__trail', { scaleX: 0 }, { scaleX: 1 }, 0);
    }

    // Tail swings with the scroll speed and settles when you stop.
    gsap.set(cat, { '--tail': '0deg' });
    var settle = gsap.delayedCall(0.2, function () {
      gsap.to(cat, { '--tail': '0deg', duration: 0.6, ease: 'power2.out', overwrite: true });
    }).pause();

    ScrollTrigger.create({
      start: 0,
      end: 'max',
      onUpdate: function (self) {
        walker.classList.toggle('is-back', self.direction < 0);
        var swing = gsap.utils.clamp(-28, 28, self.getVelocity() / -60);
        gsap.to(cat, { '--tail': swing + 'deg', duration: 0.25, ease: 'power1.out', overwrite: true });
        if (!cssTimeline) gsap.set(cat, { y: -3 * Math.abs(Math.sin(self.progress * Math.PI * 36)) });
        settle.restart(true);
      }
    });

    return function () {
      walker.classList.remove('is-back');
    };
  }

  /* ---------- One branch per situation ---------- */

  var mm = gsap.matchMedia();
  mm.add({
    motion: '(prefers-reduced-motion: no-preference)',
    reduce: '(prefers-reduced-motion: reduce)',
    wide: '(min-width: 48em)'
  }, function (context) {
    var c = context.conditions;

    // Reduced motion: no animation, every scene in its final state.
    if (c.reduce) {
      moodParts.forEach(function (part) { gsap.set(part, { attr: endAttrs(part) }); });
      return;
    }

    heroScene();
    moodMorph(c.wide);
    galleryEntrance();
    aboutScene(c.wide);
    return follower();
  });
})();
