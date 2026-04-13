import { useState, useRef } from 'react'
import { TypeBadge } from './components'

const EMPTY = {
  name: '', type: 'injection', conc: '',
  dogDose: '', dogMin: '', dogMax: '',
  catDose: '', catMin: '', catMax: '',
  memo: '',
}

export default function DrugsTab({ drugs, addDrug, updateDrug, deleteDrug, toggleFav, importDrugs }) {
  const [form, setForm]         = useState(EMPTY)
  const [addMsg, setAddMsg]     = useState({ text: '', ok: true })
  const [editIdx, setEditIdx]   = useState(-1)
  const [editForm, setEditForm] = useState(EMPTY)
  const [syncMsg, setSyncMsg]   = useState({ text: '', ok: true })
  const fileRef = useRef(null)

  const showSync = (text, ok) => { setSyncMsg({ text, ok }); setTimeout(() => setSyncMsg({ text: '' }), 3500) }

  /* ── 내보내기 ── */
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(drugs, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = Object.assign(document.createElement('a'), { href: url, download: 'vet_drugs_' + new Date().toISOString().slice(0, 10) + '.json' })
    a.click(); URL.revokeObjectURL(url)
    showSync(`✓ ${drugs.length}개 약물을 내보냈어요.`, true)
  }

  /* ── 가져오기 ── */
  const handleImportFile = (e) => {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result)
        if (!Array.isArray(imported)) throw new Error('올바른 형식이 아닙니다.')
        if (!imported.every(d => d.name && d.type && d.conc != null)) throw new Error('약물 데이터 형식이 잘못됐습니다.')
        if (!window.confirm(`${imported.length}개 약물을 불러올까요? 기존 데이터는 대체됩니다.`)) return
        importDrugs(imported); showSync(`✓ ${imported.length}개 약물을 불러왔어요.`, true)
      } catch (err) { showSync('✗ 오류: ' + err.message, false) }
      e.target.value = ''
    }
    reader.readAsText(file)
  }

  /* ── 추가 ── */
  const handleAdd = () => {
    const name = form.name.trim()
    const conc = parseFloat(form.conc)
    if (!name || isNaN(conc)) { setAddMsg({ text: '약물명과 농도/함량은 필수입니다.', ok: false }); return }
    if (drugs.some(d => d.name.toLowerCase() === name.toLowerCase())) { setAddMsg({ text: '이미 존재하는 약물명입니다.', ok: false }); return }
    addDrug({
      name, type: form.type, conc,
      dogDose: parseFloat(form.dogDose) || null, dogMin: parseFloat(form.dogMin) || null, dogMax: parseFloat(form.dogMax) || null,
      catDose: parseFloat(form.catDose) || null, catMin: parseFloat(form.catMin) || null, catMax: parseFloat(form.catMax) || null,
      memo: form.memo.trim(), fav: false,
    })
    setForm(EMPTY)
    setAddMsg({ text: `${name} 추가됨!`, ok: true }); setTimeout(() => setAddMsg({ text: '' }), 2000)
  }

  /* ── 편집 ── */
  const openEdit = (i) => {
    const d = drugs[i]; setEditIdx(i)
    setEditForm({
      name: d.name, type: d.type, conc: String(d.conc),
      dogDose: d.dogDose != null ? String(d.dogDose) : '', dogMin: d.dogMin != null ? String(d.dogMin) : '', dogMax: d.dogMax != null ? String(d.dogMax) : '',
      catDose: d.catDose != null ? String(d.catDose) : '', catMin: d.catMin != null ? String(d.catMin) : '', catMax: d.catMax != null ? String(d.catMax) : '',
      memo: d.memo || '',
    })
  }
  const handleSave = () => {
    const name = editForm.name.trim(); const conc = parseFloat(editForm.conc)
    if (!name || isNaN(conc)) return
    updateDrug(editIdx, {
      name, type: editForm.type, conc,
      dogDose: parseFloat(editForm.dogDose) || null, dogMin: parseFloat(editForm.dogMin) || null, dogMax: parseFloat(editForm.dogMax) || null,
      catDose: parseFloat(editForm.catDose) || null, catMin: parseFloat(editForm.catMin) || null, catMax: parseFloat(editForm.catMax) || null,
      memo: editForm.memo.trim(),
    })
    setEditIdx(-1)
  }

  const handleDelete = (i) => {
    if (!window.confirm(`'${drugs[i].name}'을(를) 삭제할까요?`)) return
    deleteDrug(i)
  }

  /* ── 폼 컴포넌트 ── */
  const DrugForm = ({ f, setF }) => (
    <>
      {/* 약물명 + 제형 */}
      <div className="form-row">
        <div className="fg">
          <label>약물명</label>
          <input type="text" value={f.name} onChange={e => setF(p => ({ ...p, name: e.target.value }))} placeholder="예: Omeprazole" />
        </div>
        <div className="fg">
          <label>제형</label>
          <select value={f.type} onChange={e => setF(p => ({ ...p, type: e.target.value }))}>
            <option value="injection">주사제 (ml)</option>
            <option value="oral">경구제 (정)</option>
          </select>
        </div>
      </div>

      {/* 농도 */}
      <div className="form-row" style={{ gridTemplateColumns: '1fr' }}>
        <div className="fg">
          <label>{f.type === 'injection' ? '농도 (mg/ml)' : '함량 (mg/정)'}</label>
          <input type="number" value={f.conc} onChange={e => setF(p => ({ ...p, conc: e.target.value }))} placeholder="예: 5" step="0.01" min="0" />
        </div>
      </div>

      {/* 개 용량 */}
      <div className="species-form-section">
        <div className="species-form-label dog">🐶 개 용량</div>
        <div className="form-row three-col">
          <div className="fg">
            <label>용량 (mg/kg)</label>
            <input type="number" value={f.dogDose} onChange={e => setF(p => ({ ...p, dogDose: e.target.value }))} placeholder="예: 1" step="0.01" min="0" />
          </div>
          <div className="fg">
            <label>최소 (mg/kg)</label>
            <input type="number" value={f.dogMin} onChange={e => setF(p => ({ ...p, dogMin: e.target.value }))} step="0.01" min="0" />
          </div>
          <div className="fg">
            <label>최대 (mg/kg)</label>
            <input type="number" value={f.dogMax} onChange={e => setF(p => ({ ...p, dogMax: e.target.value }))} step="0.01" min="0" />
          </div>
        </div>
      </div>

      {/* 고양이 용량 */}
      <div className="species-form-section">
        <div className="species-form-label cat">🐱 고양이 용량</div>
        <div className="form-row three-col">
          <div className="fg">
            <label>용량 (mg/kg)</label>
            <input type="number" value={f.catDose} onChange={e => setF(p => ({ ...p, catDose: e.target.value }))} placeholder="예: 1" step="0.01" min="0" />
          </div>
          <div className="fg">
            <label>최소 (mg/kg)</label>
            <input type="number" value={f.catMin} onChange={e => setF(p => ({ ...p, catMin: e.target.value }))} step="0.01" min="0" />
          </div>
          <div className="fg">
            <label>최대 (mg/kg)</label>
            <input type="number" value={f.catMax} onChange={e => setF(p => ({ ...p, catMax: e.target.value }))} step="0.01" min="0" />
          </div>
        </div>
      </div>

      {/* 메모 */}
      <div className="fg" style={{ marginBottom: '12px' }}>
        <label>메모/주의사항 (선택)</label>
        <textarea value={f.memo} onChange={e => setF(p => ({ ...p, memo: e.target.value }))} placeholder="예: 신부전 시 용량 감소 필요" />
      </div>
    </>
  )

  return (
    <>
      {/* 동기화 */}
      <div className="sync-section">
        <div className="sec-label">기기 간 동기화</div>
        <p className="sync-desc">약물 DB를 JSON 파일로 내보내고, 다른 기기에서 가져오면 동기화돼요.</p>
        <div className="sync-row">
          <button className="btn" onClick={handleExport}>⬇ 내보내기</button>
          <label className="btn" style={{ cursor: 'pointer' }}>
            ⬆ 가져오기
            <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportFile} />
          </label>
        </div>
        {syncMsg.text && <div className="sync-msg" style={{ color: syncMsg.ok ? 'var(--success)' : 'var(--danger)' }}>{syncMsg.text}</div>}
      </div>

      {/* 추가 폼 */}
      <div className="add-form">
        <div className="sec-label" style={{ marginBottom: '10px' }}>새 약물 추가</div>
        <DrugForm f={form} setF={setForm} />
        <div className="action-row">
          <button className="btn btn-primary" onClick={handleAdd}>추가</button>
          {addMsg.text && <span style={{ fontSize: '12px', color: addMsg.ok ? 'var(--success)' : 'var(--danger)' }}>{addMsg.text}</span>}
        </div>
      </div>

      {/* 약물 목록 */}
      <div className="card">
        <div className="sec-label" style={{ marginBottom: '10px' }}>등록된 약물 ({drugs.length})</div>
        {drugs.length === 0
          ? <div className="empty">등록된 약물이 없습니다.</div>
          : drugs.map((d, i) => (
            editIdx === i ? (
              <div key={d.name} className="drug-edit-form">
                <DrugForm f={editForm} setF={setEditForm} />
                <div className="action-row">
                  <button className="btn btn-primary" onClick={handleSave}>저장</button>
                  <button className="btn" onClick={() => setEditIdx(-1)}>취소</button>
                </div>
              </div>
            ) : (
              <div key={d.name} className="drug-item">
                <button className={`fav-btn${d.fav ? ' on' : ''}`} onClick={() => toggleFav(i)}>{d.fav ? '★' : '☆'}</button>
                <div className="drug-info">
                  <div className="drug-name-row">
                    <span className="drug-name">{d.name}</span>
                    <TypeBadge type={d.type} />
                  </div>
                  <div className="drug-meta">
                    {d.conc} {d.type === 'injection' ? 'mg/ml' : 'mg/정'}
                  </div>
                  <div className="drug-species-doses">
                    <span className="species-dose-tag dog">
                      🐶 {d.dogDose != null ? `${d.dogDose} mg/kg` : '미설정'}
                      {(d.dogMin || d.dogMax) ? ` (${d.dogMin ?? '?'}~${d.dogMax ?? '?'})` : ''}
                    </span>
                    <span className="species-dose-tag cat">
                      🐱 {d.catDose != null ? `${d.catDose} mg/kg` : '미설정'}
                      {(d.catMin || d.catMax) ? ` (${d.catMin ?? '?'}~${d.catMax ?? '?'})` : ''}
                    </span>
                  </div>
                  {d.memo && <div className="drug-memo-prev">{d.memo}</div>}
                </div>
                <div className="action-row">
                  <button className="btn btn-sm" onClick={() => openEdit(i)}>편집</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(i)}>삭제</button>
                </div>
              </div>
            )
          ))
        }
      </div>
    </>
  )
}
