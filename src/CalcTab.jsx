import { useState, useRef, useEffect } from 'react'
import { TypeBadge } from './components'

const SPECIES = [
  { key: 'dog', label: '🐶 개' },
  { key: 'cat', label: '🐱 고양이' },
]

export default function CalcTab({ drugs, selectedNames, recentNames, selectDrug, removeSelected, clearSelection }) {
  const [species, setSpecies]   = useState('dog')
  const [weight, setWeight]     = useState('')
  const [query, setQuery]       = useState('')
  const [ddOpen, setDdOpen]     = useState(false)
  const searchRef               = useRef(null)

  const wt        = parseFloat(weight)
  const hasResult = selectedNames.length > 0 && !isNaN(wt) && wt > 0

  const favDrugs = drugs.filter(d => d.fav)

  const ddItems = query.trim()
    ? drugs.filter(d => !selectedNames.includes(d.name) && d.name.toLowerCase().includes(query.toLowerCase()))
    : recentNames.map(n => drugs.find(d => d.name === n)).filter(Boolean).filter(d => !selectedNames.includes(d.name))

  const getDose = (d) => species === 'dog'
    ? { dose: d.dogDose, min: d.dogMin, max: d.dogMax, unit: d.dogUnit || 'mg/kg' }
    : { dose: d.catDose, min: d.catMin, max: d.catMax, unit: d.catUnit || 'mg/kg' }

  const handleSelect = (name) => { selectDrug(name); setQuery(''); setDdOpen(false) }
  const handleClear  = () => { setWeight(''); clearSelection() }

  useEffect(() => {
    const handler = (e) => { if (!searchRef.current?.contains(e.target)) setDdOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <>
      {/* 체중 + 종 선택 카드 */}
      <div className="card">

        {/* 종 토글 */}
        <div className="sec-label">환자 종류</div>
        <div className="species-toggle">
          {SPECIES.map(s => (
            <button
              key={s.key}
              className={`species-btn${species === s.key ? ' active' : ''}`}
              onClick={() => setSpecies(s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* 체중 */}
        <div className="sec-label">체중</div>
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

        {/* 즐겨찾기 */}
        {favDrugs.length > 0 && (
          <>
            <div className="sec-label">즐겨찾기</div>
            <div className="fav-row">
              {favDrugs.map(d => {
                const active = selectedNames.includes(d.name)
                const { dose } = getDose(d)
                return (
                  <button
                    key={d.name}
                    className={`fav-chip${active ? ' active' : ''}`}
                    onClick={() => active ? removeSelected(d.name) : handleSelect(d.name)}
                  >
                    <span className="fav-star">★</span>
                    {d.name}
                    {dose == null && <span className="fav-no-dose"> —</span>}
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
              : ddItems.map(d => {
                  const { dose } = getDose(d)
                  return (
                    <div key={d.name} className="dd-item" onMouseDown={() => handleSelect(d.name)}>
                      <TypeBadge type={d.type} />
                      <span className="dd-item-name">{d.name}</span>
                      <span className="dd-item-meta">
                        {dose != null ? `${dose} ${getDose(d).unit}` : '용량 미설정'}
                        {d.fav ? ' ★' : ''}
                      </span>
                    </div>
                  )
                })
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
                const { dose } = getDose(d)
                return (
                  <div key={name} className="sel-item">
                    <TypeBadge type={d.type} />
                    <span className="sel-item-name">{d.name}</span>
                    <span className="sel-item-meta">
                      {dose != null ? `${dose} ${getDose(d).unit} · ${d.conc} ${d.type === 'injection' ? 'mg/ml' : 'mg/정'}` : '용량 미설정'}
                    </span>
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
          <div className="sec-label">
            계산 결과 — {species === 'dog' ? '🐶 개' : '🐱 고양이'} · 체중 {wt} kg
          </div>
          {selectedNames.map(name => {
            const d = drugs.find(x => x.name === name)
            if (!d) return null
            const { dose, min, max, unit: doseUnit } = getDose(d)

            if (dose == null) return (
              <div key={name} className="result-card result-card-na">
                <div className="result-drug">{d.name} <TypeBadge type={d.type} /></div>
                <div className="result-na">이 약물은 {species === 'dog' ? '개' : '고양이'} 용량이 설정되지 않았어요</div>
              </div>
            )

            const volUnit  = d.type === 'injection' ? 'ml' : '정'
            const concUnit = d.type === 'injection' ? 'mg/ml' : 'mg/정'
            const isPerKg  = doseUnit.includes('/kg')  // mg/kg 계열이면 체중 곱셈

            const totalMg  = isPerKg ? (dose * wt) : dose
            const main     = (totalMg / d.conc).toFixed(2)
            const loMg     = min ? (isPerKg ? min * wt : min) : null
            const hiMg     = max ? (isPerKg ? max * wt : max) : null
            const lo       = loMg ? (loMg / d.conc).toFixed(2) : '?'
            const hi       = hiMg ? (hiMg / d.conc).toFixed(2) : '?'

            return (
              <div key={name} className="result-card">
                <div className="result-drug">{d.name} <TypeBadge type={d.type} /></div>
                <div className="result-main">{main} <span>{volUnit}</span></div>
                <div className="result-detail">
                  {isPerKg
                    ? `${dose} ${doseUnit} × ${wt} kg = ${totalMg.toFixed(2)} mg · ${d.conc} ${concUnit}`
                    : `${dose} ${doseUnit} · ${d.conc} ${concUnit}`
                  }
                </div>
                {(min || max) && (
                  <div className="result-range">범위: {lo} ~ {hi} {volUnit} &nbsp;({min ?? '?'} ~ {max ?? '?'} {doseUnit})</div>
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
