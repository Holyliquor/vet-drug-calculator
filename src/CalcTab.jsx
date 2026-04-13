import { useState, useRef, useEffect } from 'react'
import { TypeBadge } from './components'

export default function CalcTab({ drugs, selectedNames, recentNames, selectDrug, removeSelected, clearSelection }) {
  const [weight, setWeight]       = useState('')
  const [query, setQuery]         = useState('')
  const [ddOpen, setDdOpen]       = useState(false)
  const searchRef                 = useRef(null)
  const inputRef                  = useRef(null)

  const wt       = parseFloat(weight)
  const hasResult = selectedNames.length > 0 && !isNaN(wt) && wt > 0
  const favDrugs  = drugs.filter(d => d.fav)

  const ddItems = query.trim()
    ? drugs.filter(d => !selectedNames.includes(d.name) && d.name.toLowerCase().includes(query.toLowerCase()))
    : recentNames.map(n => drugs.find(d => d.name === n)).filter(Boolean).filter(d => !selectedNames.includes(d.name))

  const handleSelect = (name) => {
    selectDrug(name)
    setQuery('')
    setDdOpen(false)
  }

  const handleClear = () => {
    setWeight('')
    clearSelection()
  }

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handler = (e) => { if (!searchRef.current?.contains(e.target)) setDdOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <>
      {/* 체중 카드 */}
      <div className="card">
        <div className="sec-label">환자 체중</div>
        <div className="weight-row">
          <input
            className="weight-input"
            type="number"
            placeholder="0.0"
            step="0.1"
            min="0"
            value={weight}
            onChange={e => setWeight(e.target.value)}
          />
          <span className="weight-unit">kg</span>
        </div>

        {favDrugs.length > 0 && (
          <>
            <div className="sec-label">즐겨찾기</div>
            <div className="fav-row">
              {favDrugs.map(d => {
                const active = selectedNames.includes(d.name)
                return (
                  <button
                    key={d.name}
                    className={`fav-chip${active ? ' active' : ''}`}
                    onClick={() => active ? removeSelected(d.name) : handleSelect(d.name)}
                  >
                    <span className="fav-star">★</span>{d.name}
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* 검색 */}
      <div className="sec-label">약물 검색</div>
      <div className="search-anchor" ref={searchRef}>
        <span className="search-icon">🔍</span>
        <input
          ref={inputRef}
          className="search-input"
          type="text"
          placeholder="약물명 검색 후 선택..."
          autoComplete="off"
          value={query}
          onChange={e => { setQuery(e.target.value); setDdOpen(true) }}
          onFocus={() => setDdOpen(true)}
        />
        {ddOpen && (
          <div className="dropdown">
            <div className="dd-section">{query.trim() ? '검색 결과' : '최근 검색'}</div>
            {ddItems.length === 0
              ? <div className="dd-empty">{query.trim() ? '검색 결과 없음' : '최근 검색 없음'}</div>
              : ddItems.map(d => (
                <div key={d.name} className="dd-item" onMouseDown={() => handleSelect(d.name)}>
                  <TypeBadge type={d.type} />
                  <span className="dd-item-name">{d.name}</span>
                  <span className="dd-item-meta">{d.dose} mg/kg{d.fav ? ' ★' : ''}</span>
                </div>
              ))
            }
          </div>
        )}
      </div>

      {/* 선택된 약물 */}
      <div className="card">
        <div className="selected-list">
          {selectedNames.length === 0
            ? <div className="sel-empty">선택된 약물 없음</div>
            : selectedNames.map(name => {
                const d = drugs.find(x => x.name === name)
                if (!d) return null
                return (
                  <div key={name} className="sel-item">
                    <TypeBadge type={d.type} />
                    <span className="sel-item-name">{d.name}</span>
                    <span className="sel-item-meta">{d.dose} mg/kg · {d.conc} {d.type === 'injection' ? 'mg/ml' : 'mg/정'}</span>
                    <button className="sel-remove" onClick={() => removeSelected(name)}>✕</button>
                  </div>
                )
              })
          }
        </div>
        <div className="action-row">
          <button className="btn btn-primary" onClick={() => {}}>계산하기</button>
          <button className="btn" onClick={handleClear}>초기화</button>
        </div>
      </div>

      {/* 결과 */}
      {hasResult && (
        <div id="results-section">
          <div className="sec-label">계산 결과 — 체중 {wt} kg</div>
          {selectedNames.map(name => {
            const d = drugs.find(x => x.name === name)
            if (!d) return null
            const mg   = (d.dose * wt).toFixed(2)
            const main = (d.dose * wt / d.conc).toFixed(2)
            const unit = d.type === 'injection' ? 'ml' : '정'
            const lo   = d.min ? (d.min * wt / d.conc).toFixed(2) : '?'
            const hi   = d.max ? (d.max * wt / d.conc).toFixed(2) : '?'
            return (
              <div key={name} className="result-card">
                <div className="result-drug">
                  {d.name} <TypeBadge type={d.type} />
                </div>
                <div className="result-main">{main} <span>{unit}</span></div>
                <div className="result-detail">{d.dose} mg/kg × {wt} kg = {mg} mg · {d.conc} {d.type === 'injection' ? 'mg/ml' : 'mg/정'}</div>
                {(d.min || d.max) && (
                  <div className="result-range">범위: {lo} ~ {hi} {unit} &nbsp;({d.min ?? '?'} ~ {d.max ?? '?'} mg/kg)</div>
                )}
                {d.memo && <div className="memo-box">⚠ {d.memo}</div>}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
