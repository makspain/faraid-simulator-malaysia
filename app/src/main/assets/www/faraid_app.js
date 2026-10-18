/**
 * Faraid Simulator Malaysia - Core Navigation & Computation Engine
 * Shariah compliant estate planning according to Mazhab Shafi'i in Malaysia.
 */

window.FaraidApp = (function () {
  const STORAGE_ESTATE_KEY = 'faraid_estate_data';
  const STORAGE_RESULT_KEY = 'faraid_result_data';
  const STORAGE_SAVED_CASES = 'faraid_saved_cases';
  const STORAGE_USER_PREFS = 'faraid_user_prefs';

  const defaultUserPrefs = {
    displayName: '',
    language: 'ms',
    lastUpdated: null
  };

  // Default initial values
  const defaultEstate = {
    gross: 550000,
    funeral: 5000,
    debt: 30000,
    wasiat: 15000,
    net: 500000
  };

  const defaultHeirs = {
    deceasedGender: 'male', // 'male' or 'female'
    wifeCount: 1,
    husbandCount: 0,
    sons: 2,
    daughters: 1,
    fatherAlive: true,
    motherAlive: true
  };

  function getEstateData() {
    try {
      const stored = localStorage.getItem(STORAGE_ESTATE_KEY);
      return stored ? JSON.parse(stored) : defaultEstate;
    } catch (e) {
      return defaultEstate;
    }
  }

  function setEstateData(data) {
    try {
      localStorage.setItem(STORAGE_ESTATE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  function getResultData() {
    try {
      const stored = localStorage.getItem(STORAGE_RESULT_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  }

  function setResultData(data) {
    try {
      localStorage.setItem(STORAGE_RESULT_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  function formatRM(num) {
    return (num || 0).toLocaleString('en-MY', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function parseRM(str) {
    if (!str) return 0;
    const clean = str.toString().replace(/[^0-9.]/g, '');
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  }

  // Calculate Faraid Distribution (Mazhab Shafi'i)
  function calculateFaraid(estate, heirs) {
    const net = estate.net > 0 ? estate.net : 500000;
    const hasChildren = (heirs.sons > 0 || heirs.daughters > 0);
    const shares = [];
    let allocatedTotal = 0;

    // 1. Pasangan (Spouse)
    if (heirs.deceasedGender === 'male' && heirs.wifeCount > 0) {
      // Isteri: 1/8 if children, 1/4 if no children
      const fractionStr = hasChildren ? '1/8' : '1/4';
      const pct = hasChildren ? 12.5 : 25.0;
      const totalSpouseRM = net * (pct / 100);
      const perSpouseRM = totalSpouseRM / heirs.wifeCount;
      allocatedTotal += totalSpouseRM;

      shares.push({
        id: 'wife',
        title: heirs.wifeCount > 1 ? `Isteri (${heirs.wifeCount}x berkongsi)` : 'Isteri (Wife)',
        englishTitle: 'Wife / Widows',
        fraction: fractionStr,
        percentage: pct,
        totalRM: totalSpouseRM,
        perPersonRM: perSpouseRM,
        count: heirs.wifeCount,
        category: 'Ashabul Furudh',
        color: '#775a00',
        note: hasChildren ? 'Mendapat 1/8 kerana si mati meninggalkan anak.' : 'Mendapat 1/4 kerana tiada anak.'
      });
    } else if (heirs.deceasedGender === 'female' && heirs.husbandCount > 0) {
      // Suami: 1/4 if children, 1/2 if no children
      const fractionStr = hasChildren ? '1/4' : '1/2';
      const pct = hasChildren ? 25.0 : 50.0;
      const totalSpouseRM = net * (pct / 100);
      allocatedTotal += totalSpouseRM;

      shares.push({
        id: 'husband',
        title: 'Suami (Husband)',
        englishTitle: 'Husband',
        fraction: fractionStr,
        percentage: pct,
        totalRM: totalSpouseRM,
        perPersonRM: totalSpouseRM,
        count: 1,
        category: 'Ashabul Furudh',
        color: '#775a00',
        note: hasChildren ? 'Mendapat 1/4 kerana si mati mempunyai waris keturunan.' : 'Mendapat 1/2 kerana tiada anak.'
      });
    }

    // 2. Ibu (Mother)
    if (heirs.motherAlive) {
      // 1/6 if children exist, or 1/3 if no children
      const fractionStr = hasChildren ? '1/6' : '1/3';
      const pct = hasChildren ? (100 / 6) : (100 / 3);
      const motherRM = net * (pct / 100);
      allocatedTotal += motherRM;

      shares.push({
        id: 'mother',
        title: 'Ibu (Mother)',
        englishTitle: 'Mother',
        fraction: fractionStr,
        percentage: Math.round(pct * 100) / 100,
        totalRM: motherRM,
        perPersonRM: motherRM,
        count: 1,
        category: 'Ashabul Furudh',
        color: '#475b52',
        note: hasChildren ? 'Memperoleh 1/6 fardh kerana ada zuriat si mati.' : 'Memperoleh 1/3 fardh kerana tiada anak.'
      });
    }

    // 3. Bapa (Father)
    if (heirs.fatherAlive) {
      if (heirs.sons > 0) {
        // Father gets 1/6 only when sons exist
        const pct = 100 / 6;
        const fatherRM = net * (pct / 100);
        allocatedTotal += fatherRM;

        shares.push({
          id: 'father',
          title: 'Bapa (Father)',
          englishTitle: 'Father',
          fraction: '1/6',
          percentage: Math.round(pct * 100) / 100,
          totalRM: fatherRM,
          perPersonRM: fatherRM,
          count: 1,
          category: 'Ashabul Furudh',
          color: '#30433b',
          note: 'Mendapat 1/6 fardh kerana kehadiran anak lelaki.'
        });
      } else if (heirs.daughters > 0) {
        // Father gets 1/6 + Asabah if only daughters
        const fardhPct = 100 / 6;
        const fatherFardhRM = net * (fardhPct / 100);
        allocatedTotal += fatherFardhRM;

        shares.push({
          id: 'father',
          title: 'Bapa (Father)',
          englishTitle: 'Father',
          fraction: '1/6 + Baki',
          percentage: Math.round(fardhPct * 100) / 100,
          totalRM: fatherFardhRM,
          perPersonRM: fatherFardhRM,
          count: 1,
          category: 'Fardh & ‘Asabah',
          color: '#30433b',
          note: 'Mendapat 1/6 fardh serta baki pusaka (jika ada).'
        });
      }
    }

    // 4. Anak-anak (Children) - Asabah bi al-Ghayr or Fardh
    const remainder = Math.max(0, net - allocatedTotal);

    if (heirs.sons > 0 && heirs.daughters > 0) {
      // 2 parts per son, 1 part per daughter
      const totalUnits = (heirs.sons * 2) + (heirs.daughters * 1);
      const unitValue = remainder / totalUnits;

      const totalSonsRM = unitValue * (heirs.sons * 2);
      const perSonRM = unitValue * 2;
      const sonsPct = (totalSonsRM / net) * 100;

      const totalDaughtersRM = unitValue * heirs.daughters;
      const perDaughterRM = unitValue * 1;
      const daughtersPct = (totalDaughtersRM / net) * 100;

      shares.push({
        id: 'sons',
        title: heirs.sons > 1 ? `Anak Lelaki (${heirs.sons}x)` : 'Anak Lelaki (Son)',
        englishTitle: 'Sons',
        fraction: `Baki (${heirs.sons * 2}/${totalUnits})`,
        percentage: Math.round(sonsPct * 100) / 100,
        totalRM: totalSonsRM,
        perPersonRM: perSonRM,
        count: heirs.sons,
        category: '‘Asabah bi al-Ghair',
        color: '#00492a',
        note: 'Nisbah 2:1 berbanding anak perempuan daripada baki pusaka.'
      });

      shares.push({
        id: 'daughters',
        title: heirs.daughters > 1 ? `Anak Perempuan (${heirs.daughters}x)` : 'Anak Perempuan (Daughter)',
        englishTitle: 'Daughters',
        fraction: `Baki (${heirs.daughters * 1}/${totalUnits})`,
        percentage: Math.round(daughtersPct * 100) / 100,
        totalRM: totalDaughtersRM,
        perPersonRM: perDaughterRM,
        count: heirs.daughters,
        category: '‘Asabah bi al-Ghair',
        color: '#8ad7a6',
        note: 'Nisbah 1 bahagian setiap anak perempuan daripada baki pusaka.'
      });
    } else if (heirs.sons > 0) {
      // Only sons: full remainder divided equally
      const totalSonsRM = remainder;
      const perSonRM = remainder / heirs.sons;
      const sonsPct = (totalSonsRM / net) * 100;

      shares.push({
        id: 'sons',
        title: heirs.sons > 1 ? `Anak Lelaki (${heirs.sons}x)` : 'Anak Lelaki (Son)',
        englishTitle: 'Sons',
        fraction: 'Baki Penuh',
        percentage: Math.round(sonsPct * 100) / 100,
        totalRM: totalSonsRM,
        perPersonRM: perSonRM,
        count: heirs.sons,
        category: '‘Asabah bi Nafsihi',
        color: '#00492a',
        note: 'Menghabiskan seluruh baki pusaka secara sama rata.'
      });
    } else if (heirs.daughters > 0) {
      // Only daughters: 1 daughter = 1/2, 2+ daughters = 2/3
      const fractionStr = heirs.daughters === 1 ? '1/2' : '2/3';
      const pct = heirs.daughters === 1 ? 50 : (200 / 3);
      const totalDaughtersRM = net * (pct / 100);
      const perDaughterRM = totalDaughtersRM / heirs.daughters;

      shares.push({
        id: 'daughters',
        title: heirs.daughters > 1 ? `Anak Perempuan (${heirs.daughters}x)` : 'Anak Perempuan (Daughter)',
        englishTitle: 'Daughters',
        fraction: fractionStr,
        percentage: Math.round(pct * 100) / 100,
        totalRM: totalDaughtersRM,
        perPersonRM: perDaughterRM,
        count: heirs.daughters,
        category: 'Ashabul Furudh',
        color: '#8ad7a6',
        note: heirs.daughters === 1 ? 'Mendapat 1/2 kerana seorang diri tanpa adik-beradik lelaki.' : 'Mendapat 2/3 berkongsi sama rata.'
      });

      // Remaining goes to father if alive
      if (heirs.fatherAlive) {
        const fatherItem = shares.find(s => s.id === 'father');
        const remainingToFather = Math.max(0, net - (allocatedTotal + totalDaughtersRM));
        if (fatherItem && remainingToFather > 0) {
          fatherItem.totalRM += remainingToFather;
          fatherItem.perPersonRM = fatherItem.totalRM;
          fatherItem.percentage = Math.round((fatherItem.totalRM / net) * 100 * 100) / 100;
        }
      }
    } else if (heirs.fatherAlive && !hasChildren) {
      // No children: Father takes all remainder as Asabah
      const fatherItem = shares.find(s => s.id === 'father');
      if (fatherItem) {
        fatherItem.totalRM += remainder;
        fatherItem.perPersonRM = fatherItem.totalRM;
        fatherItem.percentage = Math.round((fatherItem.totalRM / net) * 100 * 100) / 100;
        fatherItem.category = '‘Asabah bi Nafsihi';
        fatherItem.fraction = '1/6 + Seluruh Baki';
      }
    }

    return {
      netEstate: net,
      asalMasalah: 24,
      heirsSummary: heirs,
      shares: shares,
      totalHeirCount: shares.reduce((acc, s) => acc + s.count, 0)
    };
  }

  // Common UI Setup for Bottom Navigation & Quick Links
  function initNav() {
    // Bottom Nav Links
    document.querySelectorAll('nav a[data-path]').forEach(link => {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        const path = this.getAttribute('data-path');
        if (path === 'utama') {
          window.location.href = 'utama.html';
        } else if (path === 'simulasi') {
          window.location.href = 'langkah1.html';
        } else if (path === 'panduan') {
          window.location.href = 'panduan.html';
        } else if (path === 'tersimpan') {
          showSavedModal();
        }
      });
    });

    // Top CTA & Shortcuts in Utama
    document.querySelectorAll('a, button').forEach(el => {
      const text = (el.textContent || '').trim().toLowerCase();
      if (text.includes('mula kira sekarang') || text.includes('kalkulator pantas') || text.includes('sambung kira')) {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          window.location.href = 'langkah1.html';
        });
      } else if (text.includes('panduan waris') || text.includes('pusat rujukan')) {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          window.location.href = 'panduan.html';
        });
      } else if (text.includes('kes tersimpan') || text.includes('lihat semua')) {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          showSavedModal();
        });
      }
    });
  }

  const defaultSavedCases = [
    {
      id: 'case-hj-ismail',
      title: 'Keluarga Arwah Hj. Ismail',
      status: 'completed',
      date: '24 Okt 2024',
      estate: {
        gross: 550000,
        funeral: 5000,
        debt: 30000,
        wasiat: 15000,
        net: 500000
      },
      heirs: {
        deceasedGender: 'male',
        wifeCount: 1,
        husbandCount: 0,
        sons: 2,
        daughters: 1,
        fatherAlive: true,
        motherAlive: true
      },
      summary: 'Isteri (1) • 1/8 (RM 62.5k) | 2 Anak Lelaki, 1 Perempuan • Asabah (2:1)',
      totalHeirCount: 4
    },
    {
      id: 'case-puan-aminah',
      title: 'Simulasi Ringkas Puan Aminah',
      status: 'draft',
      date: '12 Okt 2024',
      estate: {
        gross: 300000,
        funeral: 5000,
        debt: 35000,
        wasiat: 10000,
        net: 250000
      },
      heirs: {
        deceasedGender: 'female',
        wifeCount: 0,
        husbandCount: 1,
        sons: 0,
        daughters: 1,
        fatherAlive: false,
        motherAlive: true
      },
      summary: 'Suami, Ibu & 1 Anak Perempuan',
      totalHeirCount: 3
    }
  ];

  function getSavedCases() {
    try {
      const stored = localStorage.getItem(STORAGE_SAVED_CASES);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {}
    return defaultSavedCases;
  }

  function setSavedCases(cases) {
    try {
      localStorage.setItem(STORAGE_SAVED_CASES, JSON.stringify(cases));
    } catch (e) {}
  }

  function getSavedCaseById(caseId) {
    const list = getSavedCases();
    return list.find(c => c.id === caseId) || defaultSavedCases.find(c => c.id === caseId) || null;
  }

  function deleteSavedCase(caseId) {
    const list = getSavedCases().filter(c => c.id !== caseId);
    setSavedCases(list);
    return list;
  }

  function renameSavedCase(caseId, newTitle) {
    const cleanTitle = (newTitle || '').trim();
    if (!cleanTitle) return getSavedCases();
    const list = getSavedCases().map(c => {
      if (c.id === caseId) {
        return Object.assign({}, c, { title: cleanTitle });
      }
      return c;
    });
    setSavedCases(list);
    return list;
  }

  function loadCaseForAction(caseId, actionType) {
    const item = getSavedCaseById(caseId);
    if (!item) return;

    if (item.estate) {
      setEstateData(item.estate);
    }

    if (actionType === 'view' || item.status === 'completed') {
      const res = calculateFaraid(item.estate || defaultEstate, item.heirs || defaultHeirs);
      setResultData(res);
      window.location.href = 'keputusan.html';
    } else {
      window.location.href = 'langkah1.html';
    }
  }

  function shareSavedCase(caseId) {
    const item = getSavedCaseById(caseId);
    if (!item) return;
    const netFormatted = formatRM(item.estate ? item.estate.net : (item.net || 0));
    const title = `Simulasi Faraid: ${item.title}`;
    const text = `Ringkasan Simulasi Faraid Malaysia (Mazhab Shafi'i)\n` +
      `Kes: ${item.title}\n` +
      `Status: ${item.status === 'completed' ? 'Selesai' : 'Draf'}\n` +
      `Baki Harta Bersih: RM ${netFormatted}\n` +
      `Jumlah Waris: ${item.totalHeirCount || item.heirCount || 0} Orang\n` +
      `Perincian: ${item.summary || 'Formula Ashabul Furud & Asabah'}\n\n` +
      `Rujukan awal mengikut hukum Syarak dan perundangan syariah di Malaysia.`;
    share(title, text);
  }

  function renderSavedCasesListHtml() {
    const cases = getSavedCases();
    if (!cases || cases.length === 0) {
      return `
        <div class="p-6 text-center text-on-surface-variant space-y-2">
          <span class="material-symbols-outlined text-[36px] text-outline">bookmark_border</span>
          <p class="font-label-md text-label-md font-medium">Tiada kes tersimpan ditemui.</p>
        </div>
      `;
    }

    return cases.map(c => {
      const isCompleted = c.status === 'completed';
      const badgeClass = isCompleted ? 'bg-primary-fixed text-primary' : 'bg-secondary-fixed text-secondary';
      const badgeText = isCompleted ? 'Selesai Ditapis' : 'Draf';
      const netVal = c.estate ? c.estate.net : (c.net || 0);
      const netStr = formatRM(netVal);
      const heirCount = c.totalHeirCount || c.heirCount || 0;
      return `
        <div class="p-3.5 rounded-xl bg-surface-container-lowest shadow-sm border border-surface-variant">
          <div class="flex items-center justify-between">
            <span class="font-label-sm text-label-sm px-2 py-0.5 rounded-full ${badgeClass} font-bold">${badgeText}</span>
            <span class="font-body-sm text-body-sm text-on-surface-variant">${c.date || ''}</span>
          </div>
          <h4 class="font-label-lg text-label-lg font-bold text-on-surface mt-1">${c.title}</h4>
          <p class="font-body-sm text-body-sm text-on-surface-variant">Baki Harta: <strong>RM ${netStr}</strong> • ${heirCount} Waris</p>
          <button onclick="FaraidApp.loadCaseForAction('${c.id}', '${isCompleted ? 'view' : 'continue'}')" class="mt-2.5 w-full py-2 ${isCompleted ? 'bg-primary text-on-primary' : 'bg-surface-container hover:bg-surface-container-high text-on-surface'} rounded-lg font-label-md text-label-md font-semibold flex items-center justify-center gap-1 transition-colors">
            <span>${isCompleted ? 'Buka Ringkasan Kes' : 'Sambung Kira'}</span>
            <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      `;
    }).join('');
  }

  function showSavedModal() {
    let modal = document.getElementById('saved-cases-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'saved-cases-modal';
      modal.className = 'fixed inset-0 z-50 bg-on-surface/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4';
      modal.innerHTML = `
        <div class="bg-surface rounded-t-2xl sm:rounded-2xl w-full max-w-md p-space-md shadow-2xl max-h-[85vh] flex flex-col">
          <div class="flex items-center justify-between pb-3 border-b border-surface-variant">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-[24px]">bookmark</span>
              <h3 class="font-headline-sm text-headline-sm font-bold text-on-surface">Kes Tersimpan</h3>
            </div>
            <button id="close-saved-modal" class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container text-on-surface-variant">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
          <div id="saved-modal-content-list" class="py-4 space-y-3 overflow-y-auto flex-1">
            ${renderSavedCasesListHtml()}
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      document.getElementById('close-saved-modal').addEventListener('click', () => {
        modal.classList.add('hidden');
      });
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
      });
    } else {
      const listContainer = document.getElementById('saved-modal-content-list');
      if (listContainer) {
        listContainer.innerHTML = renderSavedCasesListHtml();
      }
      modal.classList.remove('hidden');
    }
  }

  function loadSampleCase(netVal) {
    const estate = {
      gross: netVal + 50000,
      funeral: 5000,
      debt: 30000,
      wasiat: 15000,
      net: netVal
    };
    setEstateData(estate);
    const result = calculateFaraid(estate, defaultHeirs);
    setResultData(result);
    window.location.href = 'keputusan.html';
  }

  // Native Android notifications / toasts
  function notify(msg) {
    if (window.AndroidBridge && window.AndroidBridge.showToast) {
      window.AndroidBridge.showToast(msg);
    } else {
      console.log('Toast:', msg);
    }
  }

  function vibrate(ms) {
    const duration = typeof ms === 'number' ? ms : 30;
    if (window.AndroidBridge && window.AndroidBridge.vibrate) {
      window.AndroidBridge.vibrate(duration);
    } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(duration);
    }
  }

  function share(title, text) {
    if (window.AndroidBridge && window.AndroidBridge.shareText) {
      window.AndroidBridge.shareText(title, text);
    } else if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: title, text: text }).catch(() => {});
    } else {
      notify('Teks ringkasan telah disalin.');
    }
  }

  function getUserPrefs() {
    try {
      const stored = localStorage.getItem(STORAGE_USER_PREFS);
      if (stored) {
        return Object.assign({}, defaultUserPrefs, JSON.parse(stored));
      }
    } catch (e) {}
    return Object.assign({}, defaultUserPrefs);
  }

  function setUserPrefs(prefs) {
    try {
      const current = getUserPrefs();
      const updated = Object.assign({}, current, prefs, {
        lastUpdated: Date.now()
      });
      localStorage.setItem(STORAGE_USER_PREFS, JSON.stringify(updated));
      return updated;
    } catch (e) {
      return defaultUserPrefs;
    }
  }

  function clearAllSimulationData() {
    try {
      localStorage.removeItem(STORAGE_ESTATE_KEY);
      localStorage.removeItem(STORAGE_RESULT_KEY);
      localStorage.setItem(STORAGE_SAVED_CASES, '[]');
      return true;
    } catch (e) {
      return false;
    }
  }

  function openExternalUrl(url) {
    if (window.AndroidBridge && window.AndroidBridge.openExternalUrl) {
      window.AndroidBridge.openExternalUrl(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  return {
    getEstateData,
    setEstateData,
    getResultData,
    setResultData,
    calculateFaraid,
    formatRM,
    parseRM,
    initNav,
    showSavedModal,
    loadSampleCase,
    getSavedCases,
    setSavedCases,
    getSavedCaseById,
    deleteSavedCase,
    renameSavedCase,
    loadCaseForAction,
    shareSavedCase,
    getUserPrefs,
    setUserPrefs,
    clearAllSimulationData,
    openExternalUrl,
    vibrate,
    notify,
    share,
    defaultEstate,
    defaultHeirs,
    defaultSavedCases,
    defaultUserPrefs
  };
})();

document.addEventListener('DOMContentLoaded', function () {
  window.FaraidApp.initNav();
});
