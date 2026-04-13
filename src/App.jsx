import { useState } from 'react'
import { useDrugs } from './hooks/useDrugs'
import CalcTab from './CalcTab'
import DrugsTab from './DrugsTab'
import './App.css'

export default function App() {
  const [tab, setTab] = useState('calc')
  const drugState = useDrugs()

  return (
    <div className="app">
      <header className="app-header">
        <h1>수의 약물 용량 계산기</h1>
        <p className="subtitle">체중을 입력하고 약물을 검색 또는 즐겨찾기에서 선택하세요</p>
      </header>

      <nav className="tabs">
        <button className={`tab${tab === 'calc' ? ' active' : ''}`} onClick={() => setTab('calc')}>계산</button>
        <button className={`tab${tab === 'drugs' ? ' active' : ''}`} onClick={() => setTab('drugs')}>약물 관리</button>
      </nav>

      <main className="tab-content">
        {tab === 'calc'  && <CalcTab  {...drugState} />}
        {tab === 'drugs' && <DrugsTab {...drugState} />}
      </main>
    </div>
  )
}
