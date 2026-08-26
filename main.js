(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------
     Scroll reveal
  --------------------------------------------------------- */
  function initScrollReveal() {
    var items = document.querySelectorAll("[data-reveal]");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    items.forEach(function (el) { observer.observe(el); });
  }

  /* ---------------------------------------------------------
     Paper questions reveal in sequence (paper "assembles")
  --------------------------------------------------------- */
  function initPaperAssembly() {
    var qs = document.querySelectorAll(".paper-q");
    if (!qs.length) return;
    var revealed = false;
    var target = document.querySelector(".paper-sheet");
    if (!target) return;

    function reveal() {
      if (revealed) return;
      revealed = true;
      qs.forEach(function (q, i) {
        if (reduceMotion) {
          q.style.opacity = 1;
          q.style.transform = "none";
          return;
        }
        setTimeout(function () {
          q.style.transition = "opacity .5s ease, transform .5s ease";
          q.style.opacity = 1;
          q.style.transform = "translateY(0)";
        }, i * 220);
      });
    }

    if (!("IntersectionObserver" in window)) { reveal(); return; }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { reveal(); obs.disconnect(); }
      });
    }, { threshold: 0.3 });
    obs.observe(target);
  }

  /* ---------------------------------------------------------
     Chat transcript types in sequentially
  --------------------------------------------------------- */
  function initChatSequence() {
    var msgs = document.querySelectorAll("[data-chat-msg]");
    if (!msgs.length) return;
    var panel = document.querySelector(".chat-panel");
    if (!panel) return;
    var started = false;

    function run() {
      if (started) return;
      started = true;
      msgs.forEach(function (m, i) {
        if (reduceMotion) {
          m.style.opacity = 1;
          m.style.transform = "none";
          return;
        }
        setTimeout(function () {
          m.style.transition = "opacity .45s ease, transform .45s ease";
          m.style.opacity = 1;
          m.style.transform = "translateY(0)";
        }, i * 500);
      });
    }

    if (!("IntersectionObserver" in window)) { run(); return; }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { run(); obs.disconnect(); } });
    }, { threshold: 0.35 });
    obs.observe(panel);
  }

  /* ---------------------------------------------------------
     Timeline items reveal with a slide-in
  --------------------------------------------------------- */
  function initTimeline() {
    var items = document.querySelectorAll(".tl-item");
    if (!items.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.style.opacity = 1; el.style.transform = "none"; });
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.transition = "opacity .6s ease, transform .6s ease";
          entry.target.style.opacity = 1;
          entry.target.style.transform = "translateX(0)";
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.25 });
    items.forEach(function (el) { obs.observe(el); });
  }

  /* ---------------------------------------------------------
     Leaderboard: periodically reshuffle points slightly and
     re-sort rows, with a smooth reorder animation.
  --------------------------------------------------------- */
  function initLeaderboard() {
    var board = document.getElementById("leaderboard");
    if (!board || reduceMotion) return;

    function tick() {
      var rows = Array.prototype.slice.call(board.querySelectorAll(".lb-row"));
      var firstRects = {};
      rows.forEach(function (r) { firstRects[r.dataset.points + r.querySelector(".lb-name").textContent] = r.getBoundingClientRect(); });

      // bump one random row's points
      var idx = Math.floor(Math.random() * rows.length);
      var row = rows[idx];
      var pts = parseInt(row.dataset.points, 10) + Math.floor(Math.random() * 15) + 5;
      row.dataset.points = pts;
      row.querySelector(".lb-points").textContent = pts;

      rows.sort(function (a, b) { return parseInt(b.dataset.points, 10) - parseInt(a.dataset.points, 10); });
      rows.forEach(function (r, i) {
        r.querySelector(".lb-rank").textContent = i + 1;
        board.appendChild(r);
      });

      // FLIP animation
      rows.forEach(function (r) {
        var key = r.dataset.points_prev_key;
      });
      rows.forEach(function (r) {
        var last = r.getBoundingClientRect();
        var first = firstRects[Object.keys(firstRects).find(function (k) { return k.endsWith(r.querySelector(".lb-name").textContent); })];
        if (!first) return;
        var dy = first.top - last.top;
        if (dy) {
          r.style.transform = "translateY(" + dy + "px)";
          r.style.transition = "none";
          requestAnimationFrame(function () {
            r.style.transition = "transform .5s ease";
            r.style.transform = "translateY(0)";
          });
        }
      });
    }

    setInterval(tick, 3200);
  }

  /* ---------------------------------------------------------
     Phone waiting-screen countdown
  --------------------------------------------------------- */
  function initCountdown() {
    var el = document.getElementById("countdown");
    if (!el) return;
    var seconds = 12;

    function render() {
      var m = Math.floor(seconds / 60).toString().padStart(2, "0");
      var s = (seconds % 60).toString().padStart(2, "0");
      el.textContent = m + ":" + s;
    }
    render();
    if (reduceMotion) return;

    setInterval(function () {
      seconds = seconds > 0 ? seconds - 1 : 12;
      render();
    }, 1000);
  }

  /* ---------------------------------------------------------
     Scroll progress bar + nav shrink
  --------------------------------------------------------- */
  function initScrollChrome() {
    var bar = document.getElementById("scrollProgress");
    var nav = document.getElementById("siteNav");
    if (!bar && !nav) return;

    function update() {
      var doc = document.documentElement;
      var scrollTop = doc.scrollTop || document.body.scrollTop;
      var height = doc.scrollHeight - doc.clientHeight;
      var pct = height > 0 ? (scrollTop / height) * 100 : 0;
      if (bar) bar.style.width = pct + "%";
      if (nav) nav.classList.toggle("scrolled", scrollTop > 40);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
  }

  /* ---------------------------------------------------------
     Button ripple effect
  --------------------------------------------------------- */
  function initRipples() {
    var buttons = document.querySelectorAll(".btn");
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        if (reduceMotion) return;
        var rect = btn.getBoundingClientRect();
        var size = Math.max(rect.width, rect.height) * 1.6;
        var ripple = document.createElement("span");
        ripple.className = "ripple";
        ripple.style.width = ripple.style.height = size + "px";
        ripple.style.left = (e.clientX - rect.left - size / 2) + "px";
        ripple.style.top = (e.clientY - rect.top - size / 2) + "px";
        btn.appendChild(ripple);
        setTimeout(function () { ripple.remove(); }, 650);
      });
    });
  }

  /* ---------------------------------------------------------
     Subtle tilt-on-hover for cards
  --------------------------------------------------------- */
  function initTilt() {
    if (reduceMotion) return;
    var selector = ".choice-card, .module-card, .qtype-card, .benefit-tile, .tb-card, .reuse-tile";
    var cards = document.querySelectorAll(selector);
    cards.forEach(function (card) {
      card.style.transformStyle = "preserve-3d";
      card.addEventListener("mousemove", function (e) {
        var rect = card.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        var rx = (y * -6).toFixed(2);
        var ry = (x * 6).toFixed(2);
        card.style.transform = "perspective(600px) rotateX(" + rx + "deg) rotateY(" + ry + "deg) translateY(-3px)";
      });
      card.addEventListener("mouseleave", function () {
        card.style.transform = "";
      });
    });
  }

  /* ---------------------------------------------------------
     Nav smooth-scroll for in-page links
  --------------------------------------------------------- */
  function initSmoothLinks() {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href").slice(1);
        var target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      });
    });
  }

  /* ---------------------------------------------------------
     Question types interactive tab switcher
  --------------------------------------------------------- */
  function initQuestionTypeTabs() {
    var tabs = document.querySelectorAll(".qtab-chip, .qtab-btn");
    if (!tabs.length) return;

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var targetType = tab.getAttribute("data-qtype");
        if (!targetType) return;

        // Deactivate active tab, desc, paper
        tabs.forEach(function (t) { t.classList.remove("active"); });
        document.querySelectorAll(".desc-content").forEach(function (d) { d.classList.remove("active"); });
        document.querySelectorAll(".paper-content").forEach(function (p) { p.classList.remove("active"); });

        // Activate selected
        tab.classList.add("active");
        var activeDesc = document.getElementById("desc-" + targetType);
        var activePaper = document.getElementById("paper-" + targetType);
        if (activeDesc) activeDesc.classList.add("active");
        if (activePaper) activePaper.classList.add("active");
      });
    });
  }

  /* ---------------------------------------------------------
     Live Game Module 3-Second Auto-Switching Tabs & Animations
  --------------------------------------------------------- */
  function initLiveGameTabs() {
    var tabs = document.querySelectorAll(".live-game-tab");
    if (!tabs.length) return;

    var currentIdx = 0;
    var autoTimer = null;
    var tabKeys = ["waiting", "quiz", "leaderboard"];

    function switchTab(key) {
      tabs.forEach(function (t) {
        if (t.getAttribute("data-game-tab") === key) {
          t.classList.add("active");
        } else {
          t.classList.remove("active");
        }
      });

      // Switch left description
      document.querySelectorAll(".live-tab-content").forEach(function (desc) {
        desc.classList.toggle("active", desc.id === "live-desc-" + key);
      });

      // Switch right phone screen
      document.querySelectorAll(".phone-app-screen").forEach(function (screen) {
        screen.classList.toggle("active", screen.id === "phone-screen-" + key);
      });
    }

    function startAutoRotation() {
      stopAutoRotation();
      autoTimer = setInterval(function () {
        currentIdx = (currentIdx + 1) % tabKeys.length;
        switchTab(tabKeys[currentIdx]);
      }, 4000);
    }

    function stopAutoRotation() {
      if (autoTimer) clearInterval(autoTimer);
    }

    tabs.forEach(function (tab, idx) {
      tab.addEventListener("click", function () {
        var key = tab.getAttribute("data-game-tab");
        currentIdx = idx;
        switchTab(key);
        startAutoRotation(); // restart 3s timer on manual click
      });
    });

    startAutoRotation();

    // 1. Countdown timer loop for waiting screen
    var countVal = 12;
    var countEl = document.getElementById("live-countdown-val");
    if (countEl) {
      setInterval(function () {
        countVal = countVal > 1 ? countVal - 1 : 15;
        countEl.textContent = "00:" + (countVal < 10 ? "0" + countVal : countVal);
      }, 1000);
    }

    // 2. Question slide switcher loop (only active slide display: flex, inactive display: none)
    var qSlideIdx = 0;
    var qSlides = document.querySelectorAll("#q-slider-track .q-slide");
    var qNumEl = document.getElementById("q-num-val");
    if (qSlides.length) {
      setInterval(function () {
        qSlideIdx = (qSlideIdx + 1) % qSlides.length;
        qSlides.forEach(function (slide, idx) {
          if (idx === qSlideIdx) {
            slide.classList.add("active");
          } else {
            slide.classList.remove("active");
          }
        });
        if (qNumEl) qNumEl.textContent = qSlideIdx + 1;
      }, 2500);
    }

    // 3. Dynamic leaderboard reordering loop for leaderboard screen
    var lbList = document.getElementById("phone-lb-list");
    if (lbList) {
      var isSwapped = false;
      setInterval(function () {
        isSwapped = !isSwapped;
        var p1 = lbList.querySelector('[data-player="aarav"]');
        var p2 = lbList.querySelector('[data-player="priya"]');
        if (p1 && p2) {
          if (isSwapped) {
            p1.querySelector(".lb-pts").textContent = "2,720";
            p2.querySelector(".lb-pts").textContent = "2,890";
            p2.querySelector(".lb-num").textContent = "1";
            p1.querySelector(".lb-num").textContent = "2";
            lbList.insertBefore(p2, p1);
          } else {
            p1.querySelector(".lb-pts").textContent = "2,950";
            p2.querySelector(".lb-pts").textContent = "2,890";
            p1.querySelector(".lb-num").textContent = "1";
            p2.querySelector(".lb-num").textContent = "2";
            lbList.insertBefore(p1, p2);
          }
        }
      }, 2000);
    }
  }

  /* ---------------------------------------------------------
     Walkthrough Section 3-Second Auto-Switching Tabs & Screens
  --------------------------------------------------------- */
  function initWalkthroughTabs() {
    var wtTabs = document.querySelectorAll(".wt-tab");
    if (!wtTabs.length) return;

    var currentWtIdx = 0;
    var wtAutoTimer = null;
    var wtStepKeys = ["1", "2", "3", "4", "5"];

    function switchWtTab(stepKey) {
      wtTabs.forEach(function (t) {
        if (t.getAttribute("data-wt-step") === stepKey) {
          t.classList.add("active");
        } else {
          t.classList.remove("active");
        }
      });

      // Switch left description
      document.querySelectorAll(".wt-tab-content").forEach(function (desc) {
        desc.classList.toggle("active", desc.id === "wt-desc-" + stepKey);
      });

      // Switch right phone screen
      document.querySelectorAll("#walkthrough .phone-app-screen").forEach(function (screen) {
        screen.classList.toggle("active", screen.id === "wt-phone-screen-" + stepKey);
      });
    }

    function startWtAutoRotation() {
      stopWtAutoRotation();
      wtAutoTimer = setInterval(function () {
        currentWtIdx = (currentWtIdx + 1) % wtStepKeys.length;
        switchWtTab(wtStepKeys[currentWtIdx]);
      }, 4000);
    }

    function stopWtAutoRotation() {
      if (wtAutoTimer) clearInterval(wtAutoTimer);
    }

    wtTabs.forEach(function (tab, idx) {
      tab.addEventListener("click", function () {
        var key = tab.getAttribute("data-wt-step");
        currentWtIdx = idx;
        switchWtTab(key);
        startWtAutoRotation(); // restart 3s timer on manual click
      });
    });

    startWtAutoRotation();
  }

  /* ---------------------------------------------------------
     Early Access Form Submission to Google Apps Script
  --------------------------------------------------------- */
  function initEarlyAccessForm() {
    var GOOGLE_SCRIPT_URL =
      "https://script.google.com/macros/s/AKfycbxWC8_B4f-ZtSULoOvbcJPky9_lwuJNCFEDv8WQ3uUF4AnlcnYD6cMPmkxc0cL24iVr9A/exec";

    var form = document.getElementById("earlyAccessForm");
    if (!form) return;

    var submitButton = document.getElementById("submitEarlyAccess");
    var feedbackDiv = document.getElementById("formFeedback");

    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      var data = {
        name: (document.getElementById("teacherName") || {}).value || "",
        school: (document.getElementById("teacherSchool") || {}).value || "",
        email: (document.getElementById("teacherEmail") || {}).value || "",
        phone: (document.getElementById("teacherPhone") || {}).value || "",
        feedback: (document.getElementById("teacherFeedback") || {}).value || "",
        timestamp: new Date().toISOString()
      };

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Submitting...";
      }

      if (feedbackDiv) {
        feedbackDiv.style.display = "none";
        feedbackDiv.className = "form-feedback";
        feedbackDiv.textContent = "";
      }

      try {
        await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(data)
        });

        form.reset();

        if (submitButton) {
          submitButton.textContent = "You're on the list! ✓";
        }

        if (feedbackDiv) {
          feedbackDiv.className = "form-feedback success";
          feedbackDiv.textContent = "Thank you! We've received your request and will reach out with your beta invite.";
          feedbackDiv.style.display = "block";
        }

      } catch (error) {
        console.error("Form submission error:", error);

        if (submitButton) {
          submitButton.textContent = "Something went wrong. Try again.";
        }

        if (feedbackDiv) {
          feedbackDiv.className = "form-feedback error";
          feedbackDiv.textContent = "Submission failed. Please check your connection and try again.";
          feedbackDiv.style.display = "block";
        }
      }

      setTimeout(function () {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = "Get Early Access & Beta Invites →";
        }
      }, 4000);
    });
  }

  /* ---------------------------------------------------------
     Init
  --------------------------------------------------------- */
  document.addEventListener("DOMContentLoaded", function () {
    initScrollReveal();
    initPaperAssembly();
    initChatSequence();
    initTimeline();
    initLeaderboard();
    initCountdown();
    initScrollChrome();
    initRipples();
    initTilt();
    initSmoothLinks();
    initQuestionTypeTabs();
    initLiveGameTabs();
    initWalkthroughTabs();
    initEarlyAccessForm();
  });
})();
