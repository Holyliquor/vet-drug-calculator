import { useState, useCallback } from 'react';

const LS_DRUGS  = 'vet_drugs_v1';
const LS_SEL    = 'vet_sel_v1';
const LS_RECENT = 'vet_recent_v1';
const RECENT_MAX = 5;

const DEFAULT_DRUGS = [
  { name: 'Omeprazole',              type: 'injection', dose: 1,    conc: 5,    min: null, max: null, memo: '',                                        fav: true  },
  { name: 'Maropitant',              type: 'injection', dose: 1,    conc: 10,   min: null, max: null, memo: 'SC 또는 IV(슬로우), 최소 1분',            fav: true  },
  { name: 'Metronidazole',           type: 'injection', dose: 15,   conc: 5,    min: 10,   max: 20,   memo: 'IV 슬로우 (30분 이상), 혐기균·원충',      fav: false },
  { name: 'Tramadol',                type: 'oral',      dose: 2,    conc: 50,   min: 1,    max: 4,    memo: '신부전·간부전 시 용량 감소',              fav: true  },
  { name: 'Prednisolone',            type: 'oral',      dose: 1,    conc: 5,    min: 0.5,  max: 2,    memo: '장기 투여 시 격일 요법 고려',             fav: false },
  { name: 'Amoxicillin-Clavulanate', type: 'oral',      dose: 12.5, conc: 62.5, min: null, max: null, memo: '식후 투여 권장',                          fav: false },
  { name: 'Butorphanol',             type: 'injection', dose: 0.2,  conc: 2,    min: 0.1,  max: 0.4,  memo: '진통·진정, 고양이 가능',                 fav: false },
  { name: 'Furosemide',              type: 'injection', dose: 2,    conc: 10,   min: 1,    max: 4,    memo: 'IV 슬로우, 전해질 모니터링',              fav: false },
];

function load(key, def) {
  try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : def; } catch { return def; }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

export function useDrugs() {
  const [drugs, setDrugsRaw]         = useState(() => load(LS_DRUGS, JSON.parse(JSON.stringify(DEFAULT_DRUGS))));
  const [selectedNames, setSelRaw]   = useState(() => { const s = load(LS_SEL, []); return s.filter(n => load(LS_DRUGS, DEFAULT_DRUGS).some(d => d.name === n)); });
  const [recentNames, setRecentRaw]  = useState(() => load(LS_RECENT, []));

  const setDrugs = useCallback((val) => {
    setDrugsRaw(prev => { const next = typeof val === 'function' ? val(prev) : val; save(LS_DRUGS, next); return next; });
  }, []);

  const setSelected = useCallback((val) => {
    setSelRaw(prev => { const next = typeof val === 'function' ? val(prev) : val; save(LS_SEL, next); return next; });
  }, []);

  const pushRecent = useCallback((name) => {
    setRecentRaw(prev => { const next = [name, ...prev.filter(n => n !== name)].slice(0, RECENT_MAX); save(LS_RECENT, next); return next; });
  }, []);

  const selectDrug = useCallback((name) => {
    setSelected(prev => prev.includes(name) ? prev : [...prev, name]);
    pushRecent(name);
  }, [setSelected, pushRecent]);

  const removeSelected = useCallback((name) => {
    setSelected(prev => prev.filter(n => n !== name));
  }, [setSelected]);

  const clearSelection = useCallback(() => setSelected([]), [setSelected]);

  const addDrug = useCallback((drug) => {
    setDrugs(prev => [...prev, drug]);
  }, [setDrugs]);

  const updateDrug = useCallback((index, updated) => {
    setDrugs(prev => {
      const oldName = prev[index].name;
      const next = prev.map((d, i) => i === index ? { ...d, ...updated } : d);
      save(LS_DRUGS, next);
      if (oldName !== updated.name) {
        setSelRaw(s => { const ns = s.map(n => n === oldName ? updated.name : n); save(LS_SEL, ns); return ns; });
        setRecentRaw(r => { const nr = r.map(n => n === oldName ? updated.name : n); save(LS_RECENT, nr); return nr; });
      }
      return next;
    });
  }, [setDrugs]);

  const deleteDrug = useCallback((index) => {
    setDrugs(prev => {
      const name = prev[index].name;
      const next = prev.filter((_, i) => i !== index);
      setSelRaw(s => { const ns = s.filter(n => n !== name); save(LS_SEL, ns); return ns; });
      return next;
    });
  }, [setDrugs]);

  const toggleFav = useCallback((index) => {
    setDrugs(prev => prev.map((d, i) => i === index ? { ...d, fav: !d.fav } : d));
  }, [setDrugs]);

  const importDrugs = useCallback((imported) => {
    setDrugs(imported);
    setSelected(prev => prev.filter(n => imported.some(d => d.name === n)));
  }, [setDrugs, setSelected]);

  return { drugs, selectedNames, recentNames, selectDrug, removeSelected, clearSelection, addDrug, updateDrug, deleteDrug, toggleFav, importDrugs };
}
