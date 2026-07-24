/**
 * app.js - Core logic for UmrahFlow PWA
 * Includes State Management, Localization, Audio Recording via IndexedDB, and UI Interaction.
 */

// ==========================================
// STATE MANAGEMENT & CONSTANTS
// ==========================================
const state = {
  currentStep: 1,
  lang: 'ar',
  tawafRound: 1,
  tawafZone: 1,
  saiLeg: 1,
  textReminders: [],
  warningsAcknowledged: false, // New state for Step 1 -> 2 block
  theme: 'dark',               // 'dark' or 'high-contrast'
  fontScale: 'normal'          // 'normal', 'large', 'xlarge'
};

const DBNAME = "UmrahFlowAudioDB";
const STORENAME = "voiceNotes";
let db;

// Translations Dictionary (Minimal subset for example)
const translations = {
  en: {
    "title": "UmrahFlow",
    "step1": "Ihram", "step2": "Haram", "step3": "Tawaf", "step4": "Sa'i", "step5": "Halq",
    "warnings_title": "Ihram Restrictions",
    "warning_ack_desc": "You must ensure avoidance of the following restrictions before proceeding:",
    "warning1": "Cutting hair or clipping nails.",
    "warning2": "Using perfume or scented soap.",
    "warning3": "Covering the head (for men).",
    "warning4": "Marriage contract or sexual intimacy.",
    "warning5": "Arguing, fighting, or hunting.",
    "i_acknowledge": "I pledge to avoid these restrictions.",
    "confirm_and_continue": "Confirm & Continue",
    "cancel": "Cancel",
    "close": "Close & Resume",
    "step1_title": "Preparation & Ihram",
    "step1_desc": "Prepare the body and enter the state of Ihram.",
    "cleanliness": "Cleanliness & Ghusl",
    "cleanliness_detail": "Clip nails, remove unwanted hair, perform Ghusl, and apply perfume to the body (not garments).",
    "attire_men": "Men's Attire",
    "attire_men_detail": "Two clean, white, unstitched garments (Rida and Izar). Open sandals.",
    "attire_women": "Women's Attire",
    "attire_women_detail": "Loose, concealing clothes. Avoid Niqab and gloves.",
    "miqat_dua": "Intention at Miqat",
    "miqat_dua_ar": "«Labbayka Allahumma 'Umrah»",
    "miqat_dua_trans": "Labbayka Allahumma 'Umrah",
    "miqat_dua_en": "\"Here I am, O Allah, for Umrah.\"",
    "talbiyah": "Continuous Talbiyah",
    "talbiyah_ar": "«Labbayka Allahumma labbayk...»",
    "talbiyah_trans": "Labbayka Allahumma labbayk, labbayka la sharika laka labbayk. Innal-hamda wan-ni'mata laka wal-mulk, la sharika lak.",
    "talbiyah_en": "\"Here I am, O Allah, here I am. Here I am, You have no partner, here I am. Verily all praise and grace are Yours, and the dominion. You have no partner.\"",
    "step2_title": "Entering Al-Masjid Al-Haram",
    "entrance_instruction": "Enter with your right foot and recite:",
    "entrance_dua_ar": "«بِسْمِ اللهِ، وَالصَّلَاةُ وَالسَّلَامُ عَلَى رَسُولِ اللهِ، اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ»",
    "entrance_dua_trans": "Bismillahi, was-salatu was-salamu 'ala rasulillah. Allahummaftah li abwaba rahmatik.",
    "entrance_dua_en": "\"In the name of Allah, and prayers and peace be upon the Messenger of Allah. O Allah, open for me the gates of Your mercy.\"",
    "niyyah_cond_ar": "«فَإِنْ حَبَسَنِي حَابِسٌ فَمَحِلِّي حَيْثُ حَبَسْتَنِي»",
    "niyyah_cond_en": "\"If I am prevented by any obstacle, my place is wherever You have prevented me.\"",
    "kaaba_dua_ar": "«اللَّهُمَّ زِدْ هَذَا الْبَيْتَ تَشْرِيفاً وَتَعْظِيماً وَتَكْرِيماً وَمَهَابَةً»",
    "kaaba_dua_en": "\"O Allah, increase this House in honor, reverence, respect, and awe.\"",
    "zamzam_dua_ar": "«اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا وَاسِعًا وَشِفَاءً مِنْ كُلِّ دَاءٍ»",
    "zamzam_dua_en": "\"O Allah, I ask You for beneficial knowledge, abundant provision, and healing from every illness.\"",
    "iq_title": "Suggested Focus (Ibn al-Qayyim)",
    "iq_r1_title": "Praise & Gratitude",
    "iq_r1_desc": "Dedicate this round to praising Allah and thanking Him for His blessings.",
    "iq_r2_title": "Salawat",
    "iq_r2_desc": "Send abundant prayers upon the Prophet Muhammad ﷺ.",
    "iq_r3_title": "Repentance",
    "iq_r3_desc": "Seek forgiveness (Istighfar) for your sins and shortcomings.",
    "iq_r4_title": "Personal Needs",
    "iq_r4_desc": "Ask Allah for your worldly and hereafter needs with insistence.",
    "iq_r5_title": "Personal Needs",
    "iq_r5_desc": "Continue asking using Allah's Beautiful Names (e.g., Ya Shafi, Ya Razzak).",
    "iq_r6_title": "Personal Needs",
    "iq_r6_desc": "Pray for your family, friends, and the Ummah.",
    "iq_r7_title": "Closing with Salawat",
    "iq_r7_desc": "End your Tawaf by again sending prayers upon the Prophet ﷺ.",
    "step3_title": "Tawaf (Circling the Kaaba)",
    "z1_title": "Zone 1: The Black Stone",
    "z1_action": "Point to the Black Stone and recite",
    "z1_dua_ar": "«بِسْمِ اللَّهِ وَاللَّهُ أَكْبَرُ»",
    "z1_dua_en": "\"In the name of Allah, Allah is the Greatest\"",
    "z2_title": "Zone 2: Circumambulation",
    "z2_action": "Keep Kaaba on your left (Men: perform Ramal). Make personal Du'aa.",
    "z2_dua_ar": "الدعاء بما تيسر من خيري الدنيا والآخرة",
    "z2_dua_en": "Make any personal Du'aa, praise Allah, or seek forgiveness.",
    "z3_title": "Zone 3: Rukn Yamani to Black Stone",
    "z3_action": "Recite this Sunnah Du'aa until you reach the Black Stone",
    "z3_dua_ar": "«رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ»",
    "z3_dua_en": "\"Our Lord, give us in this world [that which is] good and in the Hereafter [that which is] good and protect us from the punishment of the Fire.\"",
    "reset": "Reset",
    "tawaf_prep": "Men's Prep: Idtiba (Expose right shoulder).",
    "yamani_to_stone": "Between Yamani Corner and Black Stone:",
    "yamani_dua_ar": "«رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ»",
    "yamani_dua_en": "\"Our Lord, give us in this world [that which is] good and in the Hereafter [that which is] good and protect us from the punishment of the Fire.\"",
    "post_tawaf_title": "Post-Tawaf Actions",
    "post_tawaf_1": "Cover right shoulder",
    "post_tawaf_2": "Pray 2 Rak'ahs behind Maqam Ibrahim",
    "post_tawaf_3": "Drink Zamzam water",
    "step4_title": "Sa'i (Safa and Marwah)",
    "sai_start_verse_ar": "«إِنَّ الصَّفَا وَالْمَرْوَةَ مِن شَعَائِرِ اللَّهِ ۖ فَمَنْ حَجَّ الْبَيْتَ أَوِ اعْتَمَرَ فَلَا جُنَاحَ عَلَيْهِ أَن يَطَّوَّفَ بِهِمَا ۚ وَمَن تَطَوَّعَ خَيْرًا فَإِنَّ اللَّهَ شَاكِرٌ عَلِيمٌ»",
    "sai_start_verse_en": "\"Indeed, as-Safa and al-Marwah are among the symbols of Allah. So whoever makes Hajj to the House or performs 'Umrah - there is no blame upon him for walking between them. And whoever volunteers good - then indeed, Allah is appreciative and Knowing.\" (I begin with what Allah began with.)",
    "sai_jogging": "Jogging (Men)",
    "sai_hill_dua": "When standing on Safa or Marwah:",
    "sai_hill_dua_ar": "«اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، اللَّهُ أَكْبَرُ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، يُحْيِي وَيُمِيتُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ، أَنْجَزَ وَعْدَهُ، وَنَصَرَ عَبْدَهُ، وَهَزَمَ الْأَحْزَابَ وَحْدَهُ»",
    "sai_hill_dua_en": "\"Allah is the Greatest, Allah is the Greatest, Allah is the Greatest. There is no deity but Allah alone, without partner. To Him belongs the dominion, and to Him belongs all praise. He gives life and causes death, and He is over all things competent. There is no deity but Allah alone; He fulfilled His promise, granted victory to His servant, and defeated the allied factions alone.\"",
    "step5_title": "Halq/Taqseer (Exiting Ihram)",
    "shave_men": "Shaving/Trimming for Men",
    "shave_men_detail": "Complete shaving (Halq) is highly recommended, or trim hair evenly.",
    "trim_women": "Trimming for Women",
    "trim_women_detail": "Gather hair and cut a fingertip's length.",
    "congrats_title": "Umrah Mubarak!",
    "prev": "Previous", "next": "Next",
    "current_round": "Current Round",
    "next_round": "Next Round",
    "next_hint": "Next Hint",
    "undo": "Undo",
    "reminders_title": "Personal Reminders",
    "assign_reminder_to": "Assign to specific step/round:",
    "reminder_placeholder": "Type note...",
    "add_reminder": "Add Note",
    "text_notes": "Saved Text Notes:",
    "voice_notes": "Saved Voice Notes:"
  },
  ar: {
    "title": "مُيَسِّر العُمْرَة",
    "niyyah_cond_ar": "«فَإِنْ حَبَسَنِي حَابِسٌ فَمَحِلِّي حَيْثُ حَبَسْتَنِي»",
    "niyyah_cond_en": "\"If I am prevented by any obstacle, my place is wherever You have prevented me.\"",
    "kaaba_dua_ar": "«اللَّهُمَّ زِدْ هَذَا الْبَيْتَ تَشْرِيفاً وَتَعْظِيماً وَتَكْرِيماً وَمَهَابَةً»",
    "kaaba_dua_en": "\"O Allah, increase this House in honor, reverence, respect, and awe.\"",
    "zamzam_dua_ar": "«اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا وَرِزْقًا وَاسِعًا وَشِفَاءً مِنْ كُلِّ دَاءٍ»",
    "zamzam_dua_en": "اللهم إني أسألك علماً نافعاً ورزقاً واسعاً وشفاءً من كل داء",
    "iq_title": "اقتراح للدعاء (ابن القيم)",
    "iq_r1_title": "الحمد والثناء",
    "iq_r1_desc": "خصص هذا الشوط لحمد الله والثناء عليه وشكره على نعمه.",
    "iq_r2_title": "الصلاة على النبي",
    "iq_r2_desc": "أكثر من الصلاة والسلام على النبي محمد ﷺ.",
    "iq_r3_title": "التوبة والاستغفار",
    "iq_r3_desc": "استغفر الله من ذنوبك وتقصيرك وتب إليه.",
    "iq_r4_title": "الدعاء والإلحاح",
    "iq_r4_desc": "ادع الله بحاجاتك الدنيوية والأخروية وألح في الدعاء.",
    "iq_r5_title": "أسماء الله الحسنى",
    "iq_r5_desc": "ادع الله بأسمائه الحسنى (يا شافي، يا رزاق، يا رحمن).",
    "iq_r6_title": "الدعاء للغير",
    "iq_r6_desc": "ادع لأهلك وأصدقائك وللمسلمين أجمعين.",
    "iq_r7_title": "الختم بالصلاة على النبي",
    "iq_r7_desc": "اختم طوافك بالصلاة والسلام على النبي ﷺ.",
    "z1_title": "المنطقة 1: الحجر الأسود",
    "z1_action": "أشر بيدك وقل الدعاء",
    "z1_dua_ar": "«بِسْمِ اللَّهِ وَاللَّهُ أَكْبَرُ»",
    "z1_dua_en": "\"Bismillahi wallahu Akbar\"",
    "z2_title": "المنطقة 2: الطواف العام",
    "z2_action": "اجعل الكعبة على يسارك (الرمل للرجال). ادعُ بما تشاء.",
    "z2_dua_ar": "الدعاء بما تيسر من خيري الدنيا والآخرة",
    "z2_dua_en": "Personal Du'aa, Dhikr, and Istighfar.",
    "z3_title": "المنطقة 3: الركن اليماني إلى الحجر الأسود",
    "z3_action": "اقرأ هذا الدعاء حتى تصل للحجر الأسود",
    "z3_dua_ar": "«رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ»",
    "z3_dua_en": "\"Rabbana atina fid-dunya hasanah...\"",
  }
};

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  initIndexedDB();
  loadState();
  initUIEventListeners();
  applyLocalization();
  applyThemeAndFont();
  renderCounters();
  renderTextReminders();
});

function loadState() {
  const savedState = localStorage.getItem("umrahFlowState");
  if (savedState) {
    const parsed = JSON.parse(savedState);
    Object.assign(state, parsed);
    // Backward compatibility if new fields are missing
    if (state.theme === undefined) state.theme = 'dark';
    if (state.fontScale === undefined) state.fontScale = 'normal';
    if (state.warningsAcknowledged === undefined) state.warningsAcknowledged = false;
    if (state.tawafZone === undefined) state.tawafZone = 1;
  }
  goToStep(state.currentStep, true); // true = skip warning check on load
}

function saveState() {
  localStorage.setItem("umrahFlowState", JSON.stringify(state));
}

// ==========================================
// ACCESSIBILITY & THEMES
// ==========================================
function applyThemeAndFont() {
  document.documentElement.setAttribute('data-theme', state.theme);
  document.documentElement.setAttribute('data-font-scale', state.fontScale);
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'high-contrast' : 'dark';
  applyThemeAndFont();
  saveState();
}

function toggleFontScale() {
  if (state.fontScale === 'normal') state.fontScale = 'large';
  else if (state.fontScale === 'large') state.fontScale = 'xlarge';
  else state.fontScale = 'normal';
  applyThemeAndFont();
  saveState();
}

// ==========================================
// UI EVENT LISTENERS
// ==========================================
function initUIEventListeners() {
  // Nav
  document.getElementById("prevBtn").addEventListener("click", () => goToStep(state.currentStep - 1));
  document.getElementById("nextBtn").addEventListener("click", () => goToStep(state.currentStep + 1));
  document.querySelectorAll(".nav-step-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      goToStep(parseInt(e.currentTarget.getAttribute("data-step")));
    });
  });

  // Theme & Font
  document.getElementById("themeToggleBtn").addEventListener("click", toggleTheme);
  document.getElementById("fontToggleBtn").addEventListener("click", toggleFontScale);
  
  // Language
  document.getElementById("langToggle").addEventListener("click", () => {
    state.lang = state.lang === 'ar' ? 'en' : 'ar';
    document.documentElement.setAttribute("dir", state.lang === 'ar' ? "rtl" : "ltr");
    document.getElementById("langToggle").textContent = state.lang === 'ar' ? "EN" : "AR";
    applyLocalization();
    renderCounters();
    saveState();
  });

  // Checkboxes (save state)
  document.querySelectorAll('.checklist-cb').forEach(cb => {
    const saved = localStorage.getItem(`cb_${cb.id}`);
    if (saved === 'true') cb.checked = true;
    cb.addEventListener('change', (e) => {
      localStorage.setItem(`cb_${e.target.id}`, e.target.checked);
    });
  });

  // Mahzoorat Modal
  document.getElementById("cb_ack_warnings").addEventListener("change", (e) => {
    document.getElementById("btnConfirmMahzoorat").disabled = !e.target.checked;
  });
  document.getElementById("btnConfirmMahzoorat").addEventListener("click", () => {
    state.warningsAcknowledged = true;
    saveState();
    document.getElementById("mahzooratModal").style.display = "none";
    goToStep(2); // Proceed
  });
  document.getElementById("btnCancelMahzoorat").addEventListener("click", () => {
    document.getElementById("mahzooratModal").style.display = "none";
  });

  // Reminder Modal
  document.getElementById("btnDismissPopup").addEventListener("click", () => {
    document.getElementById("reminderPopupModal").style.display = "none";
    document.getElementById("popupReminderContentContainer").innerHTML = ""; // clean up audio elements if any
  });

  // Post-Tawaf Sunnah 2 Raka'at & Zamzam Modal
  const btnDismissPostTawaf = document.getElementById("btnDismissPostTawaf");
  if (btnDismissPostTawaf) {
    btnDismissPostTawaf.addEventListener("click", () => {
      document.getElementById("postTawafModal").style.display = "none";
      goToStep(4); // Proceed to Sa'i
    });
  }

  // Bottom Sheets
  document.getElementById("tawafSheetHandle").addEventListener("click", () => {
    document.getElementById("tawafBottomSheet").classList.toggle("collapsed");
  });
  document.getElementById("saiSheetHandle").addEventListener("click", () => {
    document.getElementById("saiBottomSheet").classList.toggle("collapsed");
  });

  // Undo Buttons
  const tawafUndoBtn2 = document.getElementById("tawafUndoBtn2");
  if (tawafUndoBtn2) {
    tawafUndoBtn2.addEventListener("click", () => {
      if (state.tawafZone > 1) {
        state.tawafZone--;
        triggerHaptic('undo');
      } else if (state.tawafRound > 1) {
        state.tawafRound--;
        state.tawafZone = 3;
        triggerHaptic('undo');
        animateNumber("tawafNumber");
      }
      renderCounters();
      saveState();
    });
  }
  
  const saiUndoBtn2 = document.getElementById("saiUndoBtn2");
  if (saiUndoBtn2) {
    saiUndoBtn2.addEventListener("click", () => {
      if (state.saiLeg > 1) {
        state.saiLeg--;
        triggerHaptic('undo');
        animateNumber("saiNumber");
        renderCounters();
        saveState();
      }
    });
  }

  // Next Round / Hint Buttons
  const tawafNextRoundBtn = document.getElementById("tawafNextRoundBtn");
  if (tawafNextRoundBtn) {
    tawafNextRoundBtn.addEventListener("click", () => {
      if (state.tawafRound < 7) {
        state.tawafRound++;
        state.tawafZone = 1;
        triggerHaptic(state.tawafRound === 7 ? 'success' : 'medium');
        animateNumber("tawafNumber");
        checkAutomatedReminders('step3_round_' + state.tawafRound);
        renderCounters();
        saveState();
      }
    });
  }

  const tawafNextHintBtn = document.getElementById("tawafNextHintBtn");
  if (tawafNextHintBtn) {
    tawafNextHintBtn.addEventListener("click", () => {
      if (state.tawafRound <= 7) {
        if (state.tawafZone < 3) {
          state.tawafZone++;
          triggerHaptic('light');
          if (state.tawafRound === 7 && state.tawafZone === 3) {
            triggerHaptic('success');
            document.getElementById("postTawafModal").style.display = "flex";
          }
        } else {
          if (state.tawafRound < 7) {
            state.tawafRound++;
            state.tawafZone = 1;
            triggerHaptic(state.tawafRound === 7 ? 'success' : 'medium');
            animateNumber("tawafNumber");
            checkAutomatedReminders('step3_round_' + state.tawafRound);
          } else {
            triggerHaptic('success');
            document.getElementById("postTawafModal").style.display = "flex";
          }
        }
        renderCounters();
        saveState();
      }
    });
  }

  const saiNextRoundBtn = document.getElementById("saiNextRoundBtn");
  if (saiNextRoundBtn) {
    saiNextRoundBtn.addEventListener("click", () => {
      if (state.saiLeg < 7) {
        state.saiLeg++;
        triggerHaptic(state.saiLeg === 7 ? 'success' : 'medium');
        animateNumber("saiNumber");
        renderCounters();
        saveState();
        checkAutomatedReminders('step4_leg_' + state.saiLeg);
      }
    });
  }

  document.getElementById("tawafResetBtn").addEventListener("click", () => {
    if (confirm("Reset Tawaf counter?")) { state.tawafRound = 1; state.tawafZone = 1; renderCounters(); saveState(); }
  });

  document.getElementById("saiResetBtn").addEventListener("click", () => {
    if (confirm("Reset Sa'i counter?")) { state.saiLeg = 1; renderCounters(); saveState(); }
  });

  const tawafPrevHintBtn = document.getElementById("tawafPrevHintBtn");
  if (tawafPrevHintBtn) {
    tawafPrevHintBtn.addEventListener("click", () => {
      if (state.tawafZone > 1) {
        state.tawafZone--;
        triggerHaptic('light');
      } else if (state.tawafRound > 1) {
        state.tawafRound--;
        state.tawafZone = 3;
        triggerHaptic('undo');
        animateNumber("tawafNumber");
      }
      renderCounters();
      saveState();
    });
  }

  // Touch Swipe Gesture Support
  function enableSwipeGesture(elementIdOrQuery, onSwipeNext, onSwipePrev) {
    const el = typeof elementIdOrQuery === 'string' && elementIdOrQuery.startsWith('.') ? document.querySelector(elementIdOrQuery) : document.getElementById(elementIdOrQuery);
    if (!el) return;
    let startX = 0;
    let startY = 0;

    el.addEventListener('touchstart', e => {
      startX = e.changedTouches[0].screenX;
      startY = e.changedTouches[0].screenY;
    }, { passive: true });

    el.addEventListener('touchend', e => {
      const endX = e.changedTouches[0].screenX;
      const endY = e.changedTouches[0].screenY;
      const diffX = endX - startX;
      const diffY = endY - startY;

      if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX < 0) {
          onSwipeNext();
        } else {
          onSwipePrev();
        }
      }
    }, { passive: true });
  }

  // Swipe on Counter Numbers -> Change Round
  enableSwipeGesture('stepContainer3', 
    () => document.getElementById('tawafNextRoundBtn')?.click(), 
    () => document.getElementById('tawafUndoBtn2')?.click()
  );

  enableSwipeGesture('stepContainer4', 
    () => document.getElementById('saiNextRoundBtn')?.click(), 
    () => document.getElementById('saiUndoBtn2')?.click()
  );

  // Swipe on Du'aa Card -> Change Hint / Zone
  enableSwipeGesture('tawafDuaCard', 
    () => document.getElementById('tawafNextHintBtn')?.click(), 
    () => document.getElementById('tawafPrevHintBtn')?.click()
  );
  // Reminders
  document.getElementById("addReminderBtn").addEventListener("click", addTextReminder);
  document.getElementById("voiceRecordBtn").addEventListener("click", toggleRecording);
}

// ==========================================
// NAVIGATION & MODALS
// ==========================================
function goToStep(stepNum, skipWarningCheck = false) {
  if (stepNum < 1 || stepNum > 5) return;

  // Intercept Step 1 -> Step 2
  if (state.currentStep === 1 && stepNum === 2 && !state.warningsAcknowledged && !skipWarningCheck) {
    document.getElementById("mahzooratModal").style.display = "flex";
    return; // Block navigation
  }

  state.currentStep = stepNum;
  saveState();

  // Update Nav
  document.querySelectorAll(".nav-step-btn").forEach(btn => btn.classList.remove("active"));
  const activeBtn = document.querySelector(`.nav-step-btn[data-step="${stepNum}"]`);
  if (activeBtn) {
    activeBtn.classList.add("active");
    activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center' });
  }

  // Update Content
  document.querySelectorAll(".step-container").forEach(el => el.classList.remove("active"));
  document.getElementById(`stepContainer${stepNum}`).classList.add("active");

  // Update Footer buttons
  document.getElementById("prevBtn").style.visibility = stepNum === 1 ? "hidden" : "visible";
  document.getElementById("nextBtn").style.visibility = stepNum === 5 ? "hidden" : "visible";

  // Hide bottom sheets when leaving steps
  if (stepNum !== 3) document.getElementById("tawafBottomSheet").classList.add("collapsed");
  if (stepNum !== 4) document.getElementById("saiBottomSheet").classList.add("collapsed");
}

function checkAutomatedReminders(targetKey) {
  let foundReminder = false;
  const container = document.getElementById("popupReminderContentContainer");
  container.innerHTML = ""; // Clear previous

  // Check Text Notes
  state.textReminders.forEach(r => {
    if (r.target === targetKey) {
      const p = document.createElement("p");
      p.style.fontSize = "18px";
      p.textContent = r.text;
      container.appendChild(p);
      foundReminder = true;
    }
  });

  // Check Voice Notes
  if (!db) return;
  const transaction = db.transaction([STORENAME], "readonly");
  const store = transaction.objectStore(STORENAME);
  const request = store.getAll();

  request.onsuccess = (e) => {
    const results = e.target.result;
    results.forEach(r => {
      if (r.target === targetKey) {
        const audio = document.createElement("audio");
        audio.controls = true;
        const blobUrl = URL.createObjectURL(r.blob);
        audio.src = blobUrl;
        audio.style.width = "100%";
        audio.style.marginTop = "10px";
        container.appendChild(audio);
        foundReminder = true;
        
        // Auto play
        setTimeout(() => audio.play().catch(e => console.log("Auto-play prevented")), 300);
      }
    });

    if (foundReminder) {
      document.getElementById("reminderPopupModal").style.display = "flex";
    }
  };
}

// ==========================================
// HAPTIC FEEDBACK & ANIMATIONS
// ==========================================
function triggerHaptic(type = 'light') {
  if (!('vibrate' in navigator)) return;
  try {
    if (type === 'light') navigator.vibrate(40);
    else if (type === 'medium') navigator.vibrate(80);
    else if (type === 'success') navigator.vibrate([60, 40, 100]);
    else if (type === 'undo') navigator.vibrate([30, 30]);
  } catch (e) {
    // Ignore if not permitted
  }
}

function animateNumber(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.classList.remove("number-pop");
  void el.offsetWidth; // Trigger reflow to restart keyframe animation
  el.classList.add("number-pop");
}

// ==========================================
// COUNTERS LOGIC
// ==========================================
function renderCounters() {
  const dict = translations[state.lang] || {};
  const roundPrefix = state.lang === 'ar' ? 'الطواف: الشوط' : 'Tawaf: Round';
  const legPrefix = state.lang === 'ar' ? 'السعي: الشوط' : 'Sa\'i: Leg';
  const ofStr = state.lang === 'ar' ? 'من' : 'of';

  // Tawaf Undo Button Visibility
  const tUndo2 = document.getElementById("tawafUndoBtn2");
  if (tUndo2) tUndo2.style.display = (state.tawafRound > 1 || state.tawafZone > 1) ? "block" : "none";

  // Tawaf
  document.getElementById("tawafLabel").textContent = `${roundPrefix} ${state.tawafRound} ${ofStr} 7`;
  document.getElementById("tawafNumber").textContent = state.tawafRound;
  
  // Zone Dots
  for (let i = 1; i <= 3; i++) {
    const dot = document.getElementById(`zDot${i}`);
    if (dot) {
      dot.className = "zone-dot";
      if (i === state.tawafZone) dot.classList.add("active");
    }
  }

  // Zone Content Rendering
  const zKey = `z${state.tawafZone}`;
  const tTitle = document.getElementById("tawafZoneTitle");
  const tAction = document.getElementById("tawafZoneAction");
  const tDuaAr = document.getElementById("tawafFocusDuaAr");
  const tDuaEn = document.getElementById("tawafFocusDuaEn");

  if (tTitle && dict[`${zKey}_title`]) tTitle.textContent = dict[`${zKey}_title`];
  if (tAction && dict[`${zKey}_action`]) tAction.textContent = dict[`${zKey}_action`];
  if (tDuaAr && dict[`${zKey}_dua_ar`]) tDuaAr.textContent = dict[`${zKey}_dua_ar`];
  if (tDuaEn && dict[`${zKey}_dua_en`]) tDuaEn.textContent = dict[`${zKey}_dua_en`];

  // Dynamic Suggestion Rendering
  const dynTawafFocus = document.getElementById("dynamicTawafFocus");
  if (dynTawafFocus) {
    dynTawafFocus.innerHTML = `
      <div class="suggestion-title">💡 ${dict['iq_title'] || "Suggested Focus"}</div>
      <div class="suggestion-text">
        <strong>${dict[`iq_r${state.tawafRound}_title`]}</strong><br>
        ${dict[`iq_r${state.tawafRound}_desc`]}
      </div>
    `;
  }

  const ptActions = document.getElementById("postTawafActions");
  ptActions.style.display = (state.tawafRound === 7 && state.tawafZone === 3) ? "block" : "none";

  // Sa'i Undo Button Visibility
  const sUndo2 = document.getElementById("saiUndoBtn2");
  if (sUndo2) sUndo2.style.display = (state.saiLeg > 1) ? "block" : "none";

  // Sa'i Dynamic Rendering
  document.getElementById("saiLabel").textContent = `${legPrefix} ${state.saiLeg} ${ofStr} 7`;
  document.getElementById("saiNumber").textContent = state.saiLeg;

  // Sa'i Direction (Odd legs = Safa -> Marwah, Even legs = Marwah -> Safa)
  const isOddLeg = (state.saiLeg % 2 !== 0);
  const dirBadge = document.getElementById("saiDirectionBadge");
  if (dirBadge) {
    if (state.lang === 'ar') {
      dirBadge.textContent = isOddLeg ? "🟢 من الصفا إلى المروة" : "🔵 من المروة إلى الصفا";
    } else {
      dirBadge.textContent = isOddLeg ? "🟢 Safa → Marwah" : "🔵 Marwah → Safa";
    }
  }

  // Sa'i Dynamic Focus Du'aa
  const sDuaAr = document.getElementById("saiFocusDuaAr");
  const sDuaEn = document.getElementById("saiFocusDuaEn");
  
  if (state.saiLeg === 1) {
    if (sDuaAr) sDuaAr.innerHTML = `«﴿ ۞ إِنَّ الصَّفَا وَالْمَرْوَةَ مِن شَعَائِرِ اللَّهِ ۖ فَمَنْ حَجَّ الْبَيْتَ أَوِ اعْتَمَرَ فَلَا جُنَاحَ عَلَيْهِ أَن يَطَّوَّفَ بِهِمَا ۚ وَمَن تَطَوَّعَ خَيْرًا فَإِنَّ اللَّهَ شَاكِرٌ عَلِيمٌ﴾ [البقرة: 158]»<br><span style="font-size:0.75em; color:var(--accent-gold); font-weight:bold; display:block; margin-top:4px;">(أَبْدَأُ بِمَا بَدَأَ اللَّهُ بِهِ - تقرأ مرة واحدة فقط عند صعود الصفا قبل بداية الشوط الأول)</span>`;
    if (sDuaEn) sDuaEn.innerHTML = `"Indeed, as-Safa and al-Marwah are among the symbols of Allah. So whoever makes Hajj to the House or performs 'Umrah - there is no blame upon him for walking between them. And whoever volunteers good - then indeed, Allah is appreciative and Knowing." [Al-Baqarah: 158]<br><span style="font-size:0.8em; color:var(--accent-gold); display:block; margin-top:2px;">(Recited ONLY ONCE when reaching Safa before starting Leg 1)</span>`;
  } else if (state.saiLeg === 7) {
    if (sDuaAr) sDuaAr.innerHTML = `«اللَّهُ أَكْبَرُ، الحَمْدُ لِلَّهِ الَّذِي هَدَانَا لِهَذَا»<br><span style="font-size:0.8em; color:#34d399; font-weight:bold; display:block; margin-top:4px;">(الشوط الأخير - ينتهي عند المروة ثم التوجه للحلق/التقصير)</span>`;
    if (sDuaEn) sDuaEn.innerHTML = `"Allah is the Greatest. Praise be to Allah who guided us to this."<br><span style="font-size:0.8em; color:#34d399; display:block; margin-top:2px;">(Final Leg - Ends at Marwah, then proceed to Hair Trim)</span>`;
  } else {
    if (sDuaAr) sDuaAr.innerHTML = `«رَبِّ اغْفِرْ وَارْحَمْ، وَتَجَاوَزْ عَمَّا تَعْلَمُ، إِنَّكَ أَنْتَ الأَعَزُّ الأَكْرَمُ»<br><span style="font-size:0.75em; color:var(--text-secondary); display:block; margin-top:4px;">(دعاء السعي العام: يقال باستمرار طوال طريق المشي بين الجبلين، ويكرر مع الدعاء بما تشاء من خير الدنيا والآخرة)</span>`;
    if (sDuaEn) sDuaEn.innerHTML = `"O Lord, forgive and have mercy, and pardon what You know, for You are the Most Mighty, the Most Generous."<br><span style="font-size:0.8em; color:var(--text-secondary); display:block; margin-top:2px;">(General Sa'i Du'aa: Recited continuously while walking all the way between Safa & Marwah along with personal prayers)</span>`;
  }
}

// ==========================================
// LOCALIZATION
// ==========================================
function applyLocalization() {
  const dict = translations[state.lang] || {};
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (dict[key]) {
      el.placeholder = dict[key];
    }
  });

  // Sync Reminder Selector text
  const selector = document.getElementById("reminderTargetSelect");
  Array.from(selector.options).forEach(opt => {
    const key = opt.getAttribute("data-i18n");
    if (dict[key]) opt.textContent = dict[key];
  });
}

// ==========================================
// REMINDERS (TEXT & VOICE via IndexedDB)
// ==========================================
function addTextReminder() {
  const input = document.getElementById("reminderInput");
  const target = document.getElementById("reminderTargetSelect").value;
  const targetLabel = document.getElementById("reminderTargetSelect").options[document.getElementById("reminderTargetSelect").selectedIndex].text;
  
  const text = input.value.trim();
  if (!text) return;

  const reminder = { id: Date.now(), text, target, targetLabel };
  state.textReminders.push(reminder);
  saveState();
  input.value = '';
  renderTextReminders();
}

function renderTextReminders() {
  const list = document.getElementById("textRemindersList");
  list.innerHTML = "";
  state.textReminders.forEach(r => {
    const li = document.createElement("li");
    li.className = "recorded-item";
    li.innerHTML = `
      <div style="font-size:12px; color:var(--accent-gold);">${r.targetLabel || 'Step/Round'}</div>
      <div>${r.text}</div>
      <button class="delete-btn" onclick="deleteTextReminder(${r.id})">Delete</button>
    `;
    list.appendChild(li);
  });
}

window.deleteTextReminder = function(id) {
  state.textReminders = state.textReminders.filter(r => r.id !== id);
  saveState();
  renderTextReminders();
}

// --- Audio ---
let mediaRecorder;
let audioChunks = [];
let isRecording = false;

function initIndexedDB() {
  const request = indexedDB.open(DBNAME, 2); // bumped version
  request.onupgradeneeded = (e) => {
    db = e.target.result;
    if (!db.objectStoreNames.contains(STORENAME)) {
      db.createObjectStore(STORENAME, { keyPath: "id" });
    }
  };
  request.onsuccess = (e) => {
    db = e.target.result;
    loadVoiceReminders();
  };
  request.onerror = (e) => console.error("IndexedDB error:", e.target.error);
}

function toggleRecording() {
  const btn = document.getElementById("voiceRecordBtn");
  const status = document.getElementById("recordingStatus");

  if (!isRecording) {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.start();
        isRecording = true;
        btn.classList.add("recording");
        btn.textContent = "⏹"; // Stop icon
        status.textContent = state.lang === 'ar' ? "جاري التسجيل..." : "Recording...";

        mediaRecorder.ondataavailable = e => {
          audioChunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          audioChunks = [];
          const target = document.getElementById("reminderTargetSelect").value;
          const targetLabel = document.getElementById("reminderTargetSelect").options[document.getElementById("reminderTargetSelect").selectedIndex].text;
          saveVoiceReminder(audioBlob, target, targetLabel);
        };
      })
      .catch(err => {
        console.error("Mic access denied", err);
        alert("Microphone access is required to record voice notes.");
      });
  } else {
    mediaRecorder.stop();
    isRecording = false;
    btn.classList.remove("recording");
    btn.textContent = "🎤"; // Mic icon
    status.textContent = "";
  }
}

function saveVoiceReminder(blob, target, targetLabel) {
  if (!db) return;
  const transaction = db.transaction([STORENAME], "readwrite");
  const store = transaction.objectStore(STORENAME);
  const id = Date.now();
  const request = store.add({ id, blob, target, targetLabel });
  
  request.onsuccess = () => {
    loadVoiceReminders();
  };
}

function loadVoiceReminders() {
  if (!db) return;
  const list = document.getElementById("voiceRemindersList");
  list.innerHTML = "";
  
  const transaction = db.transaction([STORENAME], "readonly");
  const store = transaction.objectStore(STORENAME);
  const request = store.getAll();

  request.onsuccess = (e) => {
    const results = e.target.result;
    results.forEach(r => {
      const li = document.createElement("li");
      li.className = "recorded-item";
      
      const labelDiv = document.createElement("div");
      labelDiv.style.fontSize = "12px";
      labelDiv.style.color = "var(--accent-gold)";
      labelDiv.textContent = r.targetLabel || 'Step/Round';
      li.appendChild(labelDiv);

      const audio = document.createElement("audio");
      audio.controls = true;
      const blobUrl = URL.createObjectURL(r.blob);
      audio.src = blobUrl;
      li.appendChild(audio);

      const delBtn = document.createElement("button");
      delBtn.className = "delete-btn";
      delBtn.textContent = "Delete";
      delBtn.onclick = () => {
        deleteVoiceReminder(r.id);
        URL.revokeObjectURL(blobUrl);
      };
      li.appendChild(delBtn);

      list.appendChild(li);
    });
  };
}

function deleteVoiceReminder(id) {
  if (!db) return;
  const transaction = db.transaction([STORENAME], "readwrite");
  const store = transaction.objectStore(STORENAME);
  store.delete(id);
  transaction.oncomplete = () => loadVoiceReminders();
}
