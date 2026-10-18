/**
 * Faraid Simulator Malaysia - Core Navigation & Computation Engine
 * Shariah compliant estate planning according to Mazhab Shafi'i in Malaysia.
 */

window.FaraidApp = (function () {
  const SAVED_CASES_KEY = 'faraid_saved_cases';
  const STORAGE_ESTATE_KEY = 'faraid_estate_data';
  const STORAGE_RESULT_KEY = 'faraid_result_data';
  const STORAGE_SAVED_CASES = SAVED_CASES_KEY;
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

  let isNavigating = false;

  function updateBottomNav(activePath) {
    document.querySelectorAll('nav a[data-path]').forEach(link => {
      const path = link.getAttribute('data-path');
      if (path === activePath) {
        link.setAttribute('aria-current', 'page');
        link.className = 'group flex flex-col items-center justify-center gap-1 w-20 py-1 transition-all select-none [&_.indicator]:bg-tertiary-fixed [&_.indicator]:text-primary text-primary font-semibold';
      } else {
        link.removeAttribute('aria-current');
        link.className = 'group flex flex-col items-center justify-center gap-1 w-20 py-1 text-on-surface-variant hover:text-on-surface transition-all select-none';
      }
    });
  }

  function navigateTo(page) {
    if (isNavigating) return;
    isNavigating = true;
    setTimeout(() => { isNavigating = false; }, 800);

    if (page === 'langkah1.html') {
      updateBottomNav('simulasi');
    } else if (page === 'panduan.html') {
      updateBottomNav('panduan');
    } else if (page === 'utama.html') {
      updateBottomNav('utama');
    }

    if (window.AndroidBridge && typeof window.AndroidBridge.navigateTo === 'function') {
      window.AndroidBridge.navigateTo(page);
    } else {
      window.location.href = page;
    }
  }

  // Common UI Setup for Bottom Navigation & Quick Links
  function initNav() {
    // Nav Links & Elements with data-path
    document.querySelectorAll('[data-path]').forEach(link => {
      if (link.dataset.navBound) return;
      link.dataset.navBound = 'true';
      link.addEventListener('click', function (e) {
        e.preventDefault();
        const path = this.getAttribute('data-path');
        if (path === 'utama') {
          navigateTo('utama.html');
        } else if (path === 'simulasi') {
          navigateTo('langkah1.html');
        } else if (path === 'panduan') {
          navigateTo('panduan.html');
        } else if (path === 'tersimpan') {
          showSavedModal();
        }
      });
    });

    // Top CTA & Shortcuts in Utama and Panduan
    document.querySelectorAll('a, button').forEach(el => {
      if (el.dataset.navBound) return;
      const text = (el.textContent || '').trim().toLowerCase();
      if (
        text.includes('mula kira sekarang') ||
        text.includes('kalkulator pantas') ||
        text.includes('sambung kira') ||
        text.includes('mula simulasi faraid') ||
        text === 'kira' ||
        text.startsWith('kira')
      ) {
        el.dataset.navBound = 'true';
        el.addEventListener('click', (e) => {
          e.preventDefault();
          navigateTo('langkah1.html');
        });
      } else if (text.includes('panduan waris') || text.includes('pusat rujukan')) {
        el.dataset.navBound = 'true';
        el.addEventListener('click', (e) => {
          e.preventDefault();
          navigateTo('panduan.html');
        });
      } else if (text.includes('kes tersimpan') || text.includes('lihat semua')) {
        el.dataset.navBound = 'true';
        el.addEventListener('click', (e) => {
          e.preventDefault();
          showSavedModal();
        });
      }
    });

    updateSavedBadges();
  }

  const defaultSavedCases = [
    {
      id: 'case-hj-ismail',
      title: 'Keluarga Arwah Hj. Ismail',
      status: 'completed',
      date: '24 Okt 2024',
      createdAt: new Date('2024-10-24T00:00:00.000Z').toISOString(),
      updatedAt: new Date('2024-10-24T00:00:00.000Z').toISOString(),
      netEstate: 500000,
      heirCount: 4,
      totalHeirCount: 4,
      estate: {
        gross: 550000,
        funeral: 5000,
        debt: 30000,
        wasiat: 15000,
        net: 500000
      },
      estateData: {
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
      resultData: {
        netEstate: 500000,
        asalMasalah: 24,
        totalHeirCount: 4
      },
      summary: 'Isteri (1) • 1/8 (RM 62.5k) | 2 Anak Lelaki, 1 Perempuan • Asabah (2:1)'
    },
    {
      id: 'case-puan-aminah',
      title: 'Simulasi Ringkas Puan Aminah',
      status: 'draft',
      date: '12 Okt 2024',
      createdAt: new Date('2024-10-12T00:00:00.000Z').toISOString(),
      updatedAt: new Date('2024-10-12T00:00:00.000Z').toISOString(),
      netEstate: 250000,
      heirCount: 3,
      totalHeirCount: 3,
      estate: {
        gross: 300000,
        funeral: 5000,
        debt: 35000,
        wasiat: 10000,
        net: 250000
      },
      estateData: {
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
      resultData: {
        netEstate: 250000,
        asalMasalah: 24,
        totalHeirCount: 3
      },
      summary: 'Suami, Ibu & 1 Anak Perempuan'
    }
  ];

  function seedDefaultCasesIfEmpty() {
    try {
      const stored = localStorage.getItem(SAVED_CASES_KEY);
      if (stored === null) {
        localStorage.setItem(SAVED_CASES_KEY, JSON.stringify(defaultSavedCases));
        return defaultSavedCases;
      }
    } catch (e) {
      console.error('Failed to seed default cases:', e);
    }
    return null;
  }

  function getSavedCases() {
    try {
      const stored = localStorage.getItem(SAVED_CASES_KEY);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
        return [];
      }
      // Fresh install: seed once
      seedDefaultCasesIfEmpty();
      return defaultSavedCases.slice();
    } catch (e) {
      console.error('Error reading saved cases from storage:', e);
      return [];
    }
  }

  function setSavedCases(cases) {
    try {
      localStorage.setItem(SAVED_CASES_KEY, JSON.stringify(cases || []));
      updateSavedBadges((cases || []).length);
      refreshHomeSavedUI();
    } catch (e) {
      console.error('Error writing saved cases to storage:', e);
      throw e;
    }
  }

  function saveCase(caseObj) {
    if (!caseObj || !caseObj.id) {
      console.error('Invalid case object passed to saveCase');
      return getSavedCases();
    }
    const cases = getSavedCases();
    const existingIndex = cases.findIndex(c => c.id === caseObj.id);
    if (existingIndex >= 0) {
      cases[existingIndex] = Object.assign({}, cases[existingIndex], caseObj, {
        updatedAt: new Date().toISOString()
      });
    } else {
      cases.unshift(caseObj);
    }
    try {
      localStorage.setItem(SAVED_CASES_KEY, JSON.stringify(cases));
      updateSavedBadges(cases.length);
      refreshHomeSavedUI();
      return cases;
    } catch (e) {
      console.error('Failed to save case to localStorage:', e);
      throw e;
    }
  }

  function deleteCase(id) {
    try {
      const current = getSavedCases();
      const updated = current.filter(c => c.id !== id);
      localStorage.setItem(SAVED_CASES_KEY, JSON.stringify(updated));
      updateSavedBadges(updated.length);
      refreshHomeSavedUI();
      // Re-render modal list if modal is present
      const listContainer = document.getElementById('saved-modal-content-list');
      if (listContainer) {
        listContainer.innerHTML = renderSavedCasesListHtml();
      }
      return updated;
    } catch (e) {
      console.error('Failed to delete case:', e);
      return getSavedCases();
    }
  }

  const deleteSavedCase = deleteCase;

  function createCaseFromCurrentState(title) {
    let estateData = null;
    try {
      const rawEstate = localStorage.getItem(STORAGE_ESTATE_KEY);
      if (rawEstate) estateData = JSON.parse(rawEstate);
    } catch (e) {}
    if (!estateData) estateData = Object.assign({}, defaultEstate);

    let resultData = null;
    try {
      const rawResult = localStorage.getItem(STORAGE_RESULT_KEY);
      if (rawResult) resultData = JSON.parse(rawResult);
    } catch (e) {}
    if (!resultData) {
      resultData = calculateFaraid(estateData, defaultHeirs);
    }

    const netEstate = typeof estateData.net === 'number'
      ? estateData.net
      : (resultData.netEstate || 0);

    let heirCount = 0;
    if (resultData && typeof resultData.totalHeirCount === 'number') {
      heirCount = resultData.totalHeirCount;
    } else if (resultData && Array.isArray(resultData.shares)) {
      heirCount = resultData.shares.reduce((acc, s) => acc + (s.count || 1), 0);
    }

    let caseId = '';
    try {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        caseId = crypto.randomUUID();
      }
    } catch (e) {}
    if (!caseId) {
      caseId = Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 7);
    }

    const nowIso = new Date().toISOString();
    let dateFormatted = '';
    try {
      dateFormatted = new Date().toLocaleDateString('ms-MY', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      dateFormatted = new Date().toLocaleDateString('ms-MY');
    }

    const defaultTitle = `Simulasi ${new Date().toLocaleDateString('ms-MY')}`;
    const cleanTitle = (title || '').trim() || defaultTitle;

    return {
      id: caseId,
      title: cleanTitle,
      status: 'completed',
      date: dateFormatted,
      createdAt: nowIso,
      updatedAt: nowIso,
      netEstate: Number(netEstate),
      heirCount: Number(heirCount),
      totalHeirCount: Number(heirCount),
      estateData: estateData,
      estate: estateData,
      resultData: resultData,
      heirs: resultData.heirsSummary || defaultHeirs
    };
  }

  function getSavedCaseById(caseId) {
    const list = getSavedCases();
    return list.find(c => c.id === caseId) || defaultSavedCases.find(c => c.id === caseId) || null;
  }

  function renameSavedCase(caseId, newTitle) {
    const cleanTitle = (newTitle || '').trim();
    if (!cleanTitle) return getSavedCases();
    const list = getSavedCases().map(c => {
      if (c.id === caseId) {
        return Object.assign({}, c, {
          title: cleanTitle,
          updatedAt: new Date().toISOString()
        });
      }
      return c;
    });
    setSavedCases(list);
    return list;
  }

  function updateSavedBadges(count) {
    const realCount = typeof count === 'number' ? count : getSavedCases().length;
    const badges = document.querySelectorAll('#saved-cases-badge, .saved-cases-badge, [data-saved-badge]');
    badges.forEach(el => {
      el.textContent = realCount;
    });
  }

  function refreshHomeSavedUI() {
    if (typeof window.refreshHomeCardsFromStorage === 'function') {
      window.refreshHomeCardsFromStorage();
    }
  }

  function loadCaseForAction(caseId, actionType) {
    const item = getSavedCaseById(caseId);
    if (!item) return;

    const estate = item.estateData || item.estate || defaultEstate;
    setEstateData(estate);

    if (actionType === 'view' || item.status === 'completed') {
      const res = item.resultData || calculateFaraid(estate, item.heirs || defaultHeirs);
      setResultData(res);
      navigateTo('keputusan.html');
    } else {
      navigateTo('langkah1.html');
    }
  }

  function shareSavedCase(caseId) {
    const item = getSavedCaseById(caseId);
    if (!item) return;
    const netVal = typeof item.netEstate === 'number'
      ? item.netEstate
      : (item.estate ? item.estate.net : (item.net || 0));
    const netFormatted = formatRM(netVal);
    const heirCount = typeof item.heirCount === 'number' ? item.heirCount : (item.totalHeirCount || 0);
    const title = `Simulasi Faraid: ${item.title}`;
    const text = `Ringkasan Simulasi Faraid Malaysia (Mazhab Shafi'i)\n` +
      `Kes: ${item.title}\n` +
      `Status: ${item.status === 'completed' ? 'Selesai' : 'Draf'}\n` +
      `Baki Harta Bersih: RM ${netFormatted}\n` +
      `Jumlah Waris: ${heirCount} Orang\n` +
      `Perincian: ${item.summary || 'Formula Ashabul Furud & Asabah'}\n\n` +
      `Rujukan awal mengikut hukum Syarak dan perundangan syariah di Malaysia.`;
    share(title, text);
  }

  function renderSavedCasesListHtml() {
    const cases = getSavedCases();
    updateSavedBadges(cases.length);

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
      const netVal = typeof c.netEstate === 'number'
        ? c.netEstate
        : (c.estate ? c.estate.net : (c.net || 0));
      const netStr = formatRM(netVal);
      const heirCount = typeof c.heirCount === 'number' ? c.heirCount : (c.totalHeirCount || 0);
      const dateStr = c.date || (c.createdAt ? new Date(c.createdAt).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' }) : '');

      return `
        <div class="p-3.5 rounded-xl bg-surface-container-lowest shadow-sm border border-surface-variant relative">
          <div class="flex items-center justify-between">
            <span class="font-label-sm text-label-sm px-2 py-0.5 rounded-full ${badgeClass} font-bold">${badgeText}</span>
            <div class="flex items-center gap-2">
              <span class="font-body-sm text-body-sm text-on-surface-variant">${dateStr}</span>
              <button onclick="event.stopPropagation(); FaraidApp.deleteCase('${c.id}');" class="text-on-surface-variant hover:text-error p-1 rounded-full transition-colors" title="Padam kes" aria-label="Padam kes">
                <span class="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
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
    updateSavedBadges();
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
    navigateTo('keputusan.html');
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
    SAVED_CASES_KEY,
    getEstateData,
    setEstateData,
    getResultData,
    setResultData,
    calculateFaraid,
    formatRM,
    parseRM,
    navigateTo,
    updateBottomNav,
    initNav,
    showSavedModal,
    loadSampleCase,
    getSavedCases,
    setSavedCases,
    saveCase,
    deleteCase,
    deleteSavedCase,
    createCaseFromCurrentState,
    updateSavedBadges,
    renderSavedCasesListHtml,
    getSavedCaseById,
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

// Global convenience bindings
if (typeof window !== 'undefined' && window.FaraidApp) {
  window.SAVED_CASES_KEY = window.FaraidApp.SAVED_CASES_KEY;
  window.getSavedCases = window.FaraidApp.getSavedCases;
  window.saveCase = window.FaraidApp.saveCase;
  window.deleteCase = window.FaraidApp.deleteCase;
  window.deleteSavedCase = window.FaraidApp.deleteSavedCase;
  window.createCaseFromCurrentState = window.FaraidApp.createCaseFromCurrentState;
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () {
    window.FaraidApp.initNav();
  });
} else {
  window.FaraidApp.initNav();
}
