
import React, { useState, useEffect, useRef } from 'react';
import { Step, AppState, WineMode } from './types';
import QualityPanel from './components/QualityPanel';
import { GrapeIcon, InfoIcon, BookOpenIcon, XIcon, StarIcon, CheckIcon } from './components/Icons';

const ADVICE_MAP: Record<Step, string> = {
  [Step.MODE_SELECTION]: "Обычное вино ценится за выдержку в дубе, игристое — за мастерство управления давлением и осадком.",
  [Step.PREPARATION]: "Мойка удаляет полевую пыль. Дробилка должна разрушить ягоду, но не раздавить косточку, иначе вино будет горьким.",
  [Step.FERMENTATION]: "Температура выше 28°C убивает ароматику. Если брожение слишком бурное, охладите резервуар.",
  [Step.FILTRATION]: "Вино подается в резервуар сверху через фильтр-картон. Это насыщает его кислородом и удаляет муть.",
  [Step.TIRAGE]: "Для игристого используем бутылки с толстым стеклом. Вторичное брожение создаст давление 6 бар.",
  [Step.RIDDLING]: "Осадок должен сползти на пробку. Ежедневный поворот и наклон — ключ к прозрачности.",
  [Step.FREEZING]: "Заморозка горлышка фиксирует осадок в ледяной пробке. Это необходимо для чистого дегоржажа.",
  [Step.DISGORGEMENT]: "В момент открытия давление выталкивает лед. Осадок удален, вино остается чистым.",
  [Step.AGING]: "Бочка 'дышит'. Микрооксидация делает вкус мягким и богатым.",
  [Step.BOTTLING]: "Важна герметичность. Кислород — враг готового вина.",
  [Step.RESULTS]: "Технологический аудит завершен. Проверьте замечания в журнале.",
};

const INITIAL_STATE: AppState = {
  currentStep: Step.MODE_SELECTION,
  wineMode: null,
  isWashed: false,
  isWashing: false,
  isCrushed: false,
  crushGranularity: 45,
  isYeastAdded: false,
  isFermenting: false,
  fermentationTemp: 22,
  fermentationProgress: 0,
  fermentationTime: 0,
  fermentationStatus: 'active',
  isPressed: false,
  isFiltered: false,
  isCleaning: false,
  agingWeeks: 1,
  riddlingProgress: 0,
  isFrozen: false,
  isDisgorged: false,
  isBottled: false,
  isHermetic: true,
  qualityLogs: [],
  finalScore: 100,
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false);
  const [showAdvice, setShowAdvice] = useState(false);
  const [fillLevel, setFillLevel] = useState(0);
  const [isCrushing, setIsCrushing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getStepList = () => {
    const base = [
      { id: Step.PREPARATION, label: 'Сырьё' },
      { id: Step.FERMENTATION, label: 'Брожение' },
      { id: Step.FILTRATION, label: 'Фильтрация' },
    ];
    if (state.wineMode === WineMode.SPARKLING) {
      return [
        ...base,
        { id: Step.TIRAGE, label: 'Тираж' },
        { id: Step.RIDDLING, label: 'Ремюаж' },
        { id: Step.FREEZING, label: 'Заморозка' },
        { id: Step.DISGORGEMENT, label: 'Дегоржаж' },
        { id: Step.RESULTS, label: 'Итог' }
      ];
    }
    return [
      ...base,
      { id: Step.AGING, label: 'Выдержка' },
      { id: Step.BOTTLING, label: 'Розлив' },
      { id: Step.RESULTS, label: 'Итог' }
    ];
  };

  const steps = getStepList();

  const updateState = (updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const handleRestart = () => {
    setState(INITIAL_STATE);
    setShowAdvice(false);
    setFillLevel(0);
    setIsCrushing(false);
  };

  const handleWash = () => {
    updateState({ isWashing: true });
    setTimeout(() => updateState({ isWashing: false, isWashed: true }), 2000);
  };

  const handleCrush = () => {
    if (!state.isWashed) return;
    setIsCrushing(true);
    updateState({ isCrushed: true });
    setTimeout(() => setIsCrushing(false), 2500);
  };

  const handlePressing = () => {
    updateState({ isPressed: true });
    let level = 0;
    const interval = setInterval(() => {
      level += 2;
      setFillLevel(level);
      if (level >= 80) clearInterval(interval);
    }, 40);
  };

  const handleFiltration = () => {
    updateState({ isCleaning: true });
    setTimeout(() => updateState({ isCleaning: false, isFiltered: true }), 3000);
  };

  const addLog = (message: string, scorePenalty: number = 0) => {
    setState(prev => ({
      ...prev,
      qualityLogs: [...prev.qualityLogs, message],
      finalScore: Math.max(0, prev.finalScore - scorePenalty)
    }));
  };

  useEffect(() => {
    if (state.isFermenting && state.fermentationStatus === 'active') {
      timerRef.current = setInterval(() => {
        setState(prev => {
          let speed = 1.0;
          if (prev.fermentationTemp >= 20 && prev.fermentationTemp <= 25) speed = 2.0;
          if (prev.fermentationTemp > 28) speed = 4.0;
          const newProgress = prev.fermentationProgress + speed;
          let newStatus = prev.fermentationStatus;
          if (newProgress >= 140) newStatus = 'spoiled';
          else if (newProgress >= 100) newStatus = 'done';
          return { ...prev, fermentationProgress: newProgress, fermentationStatus: newStatus };
        });
      }, 500);
    } else if (timerRef.current) clearInterval(timerRef.current);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state.isFermenting]);

  const nextStep = () => {
    const currentIndex = steps.findIndex(s => s.id === state.currentStep);
    if (currentIndex < steps.length - 1) {
      const cur = state.currentStep;
      if (cur === Step.PREPARATION) {
        if (!state.isWashed) addLog("Сырье не мыто: привкус пыли и риск заражения", 20);
        if (state.crushGranularity > 80) addLog("Сильное дробление: горечь косточки во вкусе", 15);
        if (!state.isYeastAdded) addLog("Брожение на 'дикарях': нечистый аромат", 25);
      }
      if (cur === Step.FERMENTATION) {
        if (state.fermentationTemp > 28) addLog("Температурный стресс: потеря ароматики", 15);
        if (state.fermentationStatus === 'spoiled') addLog("Уксусное скисание: продукт испорчен", 60);
      }
      if (cur === Step.FREEZING && !state.isFrozen) addLog("Дегоржаж без заморозки: огромные потери и муть", 40);
      if (cur === Step.BOTTLING && !state.isHermetic) addLog("Окисление: вино превратится в уксус через месяц", 50);
      updateState({ currentStep: steps[currentIndex + 1].id });
      setShowAdvice(false);
      setFillLevel(0);
    }
  };

  // UI RENDERING HELPERS
  const Pipe = ({ horizontal = false, active = false, className = "" }) => (
    <div className={`${horizontal ? 'h-3' : 'w-3'} bg-stone-300 border border-stone-400 relative overflow-hidden ${className}`}>
      {active && <div className={`absolute inset-0 pipe-fluid ${horizontal ? 'w-full' : 'h-full'}`}></div>}
    </div>
  );

  const renderModeSelection = () => (
    <div className="flex flex-col items-center gap-10 animate-in fade-in duration-500 max-w-4xl w-full">
      <div className="text-center space-y-4">
        <h2 className="text-5xl font-black text-stone-900 tracking-tighter uppercase">Выбор технологии</h2>
        <p className="text-stone-500 font-medium italic">Определите вектор производства продукта</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        <button 
          onClick={() => updateState({ wineMode: WineMode.STILL, currentStep: Step.PREPARATION })} 
          className="group bg-white p-12 rounded-[56px] border-4 border-stone-100 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 text-left"
        >
          <div className="mb-6 bg-rose-100 w-16 h-16 rounded-3xl flex items-center justify-center text-rose-950">
            <StarIcon className="w-8 h-8" />
          </div>
          <h3 className="text-4xl font-black text-stone-900 mb-2 uppercase tracking-tighter">Тихое вино</h3>
          <p className="text-stone-500 text-sm leading-relaxed italic">Классика: выдержка в дубе, глубокий вкус, отсутствие газа.</p>
        </button>
        <button 
          onClick={() => updateState({ wineMode: WineMode.SPARKLING, currentStep: Step.PREPARATION })} 
          className="group bg-white p-12 rounded-[56px] border-4 border-stone-100 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-2 text-left"
        >
          <div className="mb-6 bg-sky-100 w-16 h-16 rounded-3xl flex items-center justify-center text-sky-950">
             <div className="flex gap-1">
               <div className="w-2 h-2 rounded-full bg-current animate-bounce"></div>
               <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{animationDelay:'0.1s'}}></div>
             </div>
          </div>
          <h3 className="text-4xl font-black text-stone-900 mb-2 uppercase tracking-tighter">Игристое вино</h3>
          <p className="text-stone-500 text-sm leading-relaxed italic">Престиж: вторичное брожение в бутылке, пузырьки и свежесть.</p>
        </button>
      </div>
      {renderAdvice()}
    </div>
  );

  const renderPreparation = () => (
    <div className="flex flex-col items-center gap-12 w-full max-w-2xl animate-in fade-in duration-700">
      <div className="flex gap-4 z-20">
        <button onClick={handleWash} disabled={state.isWashing || state.isWashed} className={`px-8 py-4 rounded-3xl font-black shadow-xl transition-all ${state.isWashed ? 'bg-green-600 text-white' : 'bg-stone-900 text-white hover:bg-stone-800'}`}>
          {state.isWashing ? 'МОЙКА...' : state.isWashed ? 'ПРОМЫТО ✓' : 'ПРОМЫТЬ ВИНОГРАД'}
        </button>
        <button onClick={handleCrush} disabled={!state.isWashed || isCrushing || state.isCrushed} className={`px-8 py-4 rounded-3xl font-black shadow-xl transition-all ${state.isCrushed ? 'bg-rose-950 text-white' : 'bg-stone-900 text-white hover:bg-stone-800'}`}>
          {state.isCrushed ? 'ДРОБИЛКА: ГОТОВО' : 'ЗАПУСТИТЬ ДРОБИЛКУ'}
        </button>
      </div>

      <div className="flex flex-col items-center relative">
        <div className={`w-80 h-48 bg-stone-300 rounded-t-3xl border-4 border-stone-400 relative overflow-hidden flex flex-col items-center justify-center ${isCrushing ? 'crush-anim' : ''}`}>
           {state.isWashing && <div className="absolute inset-0 z-10 flex justify-center pointer-events-none">
             {[...Array(24)].map((_,i)=>(<div key={i} className="water-drop" style={{left:`${Math.random()*100}%`, animationDelay:`${Math.random()*0.4}s`}}></div>))}
           </div>}
           <div className="grid grid-cols-5 gap-2 p-6 z-0">
             {!state.isCrushed && [...Array(10)].map((_,i)=>(<div key={i} className="w-8 h-10 bg-rose-900 rounded-full shadow-lg transition-transform duration-1000"></div>))}
             {state.isCrushed && [...Array(10)].map((_,i)=>(<div key={i} className="w-8 h-10 bg-rose-950 blur-[2px] opacity-40 rounded-full transition-transform duration-1000 translate-y-20"></div>))}
           </div>
           <div className="absolute bottom-4 text-[10px] font-black uppercase text-stone-500 tracking-widest">ДРОБИЛКА-ГРЕБНЕОТДЕЛИТЕЛЬ</div>
        </div>

        <Pipe active={isCrushing} className="h-24" />

        <div className="w-96 h-64 bg-stone-50 border-4 border-stone-200 rounded-b-[64px] relative overflow-hidden shadow-2xl">
           <div className="absolute bottom-0 w-full bg-gradient-to-t from-rose-950 via-rose-900 to-rose-800 transition-all duration-1000 liquid-wave" style={{height: state.isCrushed ? '80%' : '0%'}}>
              <div className="absolute inset-0 flex items-center justify-center text-white/5 font-black text-6xl select-none uppercase">МЕЗГА</div>
              <div className="absolute top-0 w-full h-4 bg-rose-400/20 rounded-full blur-[2px]"></div>
           </div>
        </div>
      </div>

      {state.isCrushed && (
        <div className="w-full flex flex-col gap-6 z-20 animate-in slide-in-from-top-4">
          <div className="bg-white p-8 rounded-[40px] shadow-sm border space-y-3">
            <div className="flex justify-between text-[11px] font-black uppercase text-stone-400"><span>Зазор вальцов</span><span>{state.crushGranularity}%</span></div>
            <input type="range" min="20" max="100" value={state.crushGranularity} onChange={(e)=>updateState({crushGranularity:parseInt(e.target.value)})} className="w-full h-2 bg-stone-100 rounded-lg appearance-none accent-rose-900 cursor-pointer" />
          </div>
          <button onClick={()=>updateState({isYeastAdded:true})} disabled={state.isYeastAdded} className={`w-full py-5 rounded-[40px] font-black text-xl shadow-xl transition-all ${state.isYeastAdded ? 'bg-amber-500 text-white' : 'bg-stone-900 text-white hover:bg-stone-800'}`}>
            {state.isYeastAdded ? 'ДРОЖЖИ ВНЕСЕНЫ ✓' : 'ВНЕСТИ КУЛЬТУРНЫЕ ДРОЖЖИ'}
          </button>
          {state.isYeastAdded && <button onClick={nextStep} className="bg-amber-600 text-white py-6 rounded-full font-black text-3xl shadow-2xl animate-bounce">ПЕРЕЙТИ К БРОЖЕНИЮ →</button>}
        </div>
      )}
      {renderAdvice()}
    </div>
  );

  const renderFiltration = () => (
    <div className="flex flex-col items-center gap-12 w-full animate-in fade-in duration-700">
      <div className="flex gap-4 z-20">
        <button onClick={handlePressing} disabled={state.isPressed} className={`px-10 py-5 rounded-3xl font-black shadow-xl transition-all ${state.isPressed ? 'bg-stone-200' : 'bg-stone-900 text-white'}`}>
          {state.isPressed ? 'ОТЖАТО ✓' : 'ОТЖАТЬ МЕЗГУ'}
        </button>
        {state.isPressed && <button onClick={handleFiltration} disabled={state.isFiltered || state.isCleaning} className={`px-10 py-5 rounded-3xl font-black shadow-xl transition-all ${state.isFiltered ? 'bg-green-600 text-white' : 'bg-stone-900 text-white'}`}>
          {state.isCleaning ? 'ФИЛЬТРАЦИЯ...' : 'ЗАПУСТИТЬ ФИЛЬТР-ПРЕСС'}
        </button>}
      </div>

      <div className="flex flex-col lg:flex-row items-end gap-0 relative min-h-[450px] w-full justify-center">
        <div className="w-72 h-80 relative bg-stone-800 rounded-2xl shadow-2xl border-x-4 border-stone-900 flex flex-col justify-end p-4">
           <div className={`absolute bottom-0 inset-x-0 transition-all duration-[3000ms] bg-rose-950/40 ${state.isPressed ? 'h-4' : 'h-[90%]'}`}></div>
           <div className="text-[10px] font-black text-stone-500 uppercase text-center mb-4 z-10">BASKET PRESS v4</div>
        </div>

        <div className="flex flex-col items-center">
          <Pipe active={state.isPressed} className="h-12" />
          <Pipe horizontal active={state.isPressed} className="w-32" />
          <div className={`w-24 h-24 bg-stone-100 border-4 border-stone-400 rounded-2xl flex flex-col items-center justify-center shadow-lg relative ${state.isCleaning ? 'animate-pulse' : ''}`}>
             <div className="grid grid-cols-4 grid-rows-4 gap-1 opacity-20"><div className="w-2 h-2 bg-stone-900 rounded-full"></div></div>
             <div className="absolute -bottom-4 text-[8px] font-black text-stone-400 uppercase">ФИЛЬТР-КАРТОН</div>
             {state.isCleaning && [...Array(12)].map((_,i)=>(<div key={i} className="filter-particle" style={{left:`${Math.random()*100}%`, animationDelay:`${Math.random()}s`}}></div>))}
          </div>
          <Pipe horizontal active={state.isCleaning || (state.isPressed && !state.isCleaning && fillLevel > 0)} className="w-32" />
          <Pipe active={state.isCleaning || (state.isPressed && !state.isCleaning && fillLevel > 0)} className="h-12" />
        </div>

        <div className="w-80 h-96 bg-stone-50 border-4 border-stone-200 rounded-[64px] relative overflow-hidden shadow-2xl">
          {(state.isCleaning || (state.isPressed && fillLevel < 80)) && (
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-full z-10">
                <div className="juice-stream h-full w-full opacity-100"></div>
             </div>
          )}
          <div className={`absolute bottom-0 w-full transition-all duration-300 ${state.isFiltered ? 'bg-rose-800' : 'bg-rose-950/80'}`} style={{ height: `${fillLevel}%` }}>
             <div className="absolute inset-0 flex items-center justify-center text-white/10 font-black text-3xl uppercase tracking-widest text-center px-8">БАЗОВОЕ ВИНО</div>
             <div className="absolute top-0 w-full h-6 bg-rose-400/10 rounded-full blur-[2px]"></div>
          </div>
        </div>
      </div>

      {state.isFiltered && <button onClick={nextStep} className="bg-amber-600 text-white px-20 py-6 rounded-full font-black text-3xl shadow-2xl border-b-8 border-amber-800 animate-bounce">К СЛЕДУЮЩЕМУ ЭТАПУ →</button>}
      {renderAdvice()}
    </div>
  );

  const renderFreezing = () => (
    <div className="flex flex-col items-center gap-10 animate-in fade-in duration-700 w-full max-w-xl">
      <div className="text-center space-y-2">
        <h3 className="text-3xl font-black text-stone-900 uppercase">Крио-стабилизация</h3>
        <p className="text-stone-500 font-medium italic">Подготовка к дегоржажу: заморозка осадка в горлышке</p>
      </div>
      <button onClick={()=>updateState({isFrozen:true})} disabled={state.isFrozen} className={`w-full px-10 py-6 rounded-full font-black text-2xl shadow-xl transition-all ${state.isFrozen ? 'bg-sky-500 text-white' : 'bg-stone-900 text-white hover:bg-stone-800'}`}>
        {state.isFrozen ? 'ЗАМОРОЖЕНО ✓' : 'ЗАМОРОЗИТЬ ГОРЛЫШКО (КРИО)'}
      </button>
      <div className="relative flex flex-col items-center">
         <div className="w-24 h-80 relative flex flex-col items-center">
            <div className="w-20 h-56 bg-rose-900/60 border-4 border-stone-200 rounded-b-3xl relative overflow-hidden">
               <div className="absolute inset-0 bg-stone-950/20"></div>
            </div>
            <div className="w-10 h-24 bg-rose-900/60 border-x-4 border-stone-200 relative">
               <div className={`absolute top-0 inset-x-0 bg-stone-950 transition-all duration-1000 ${state.isFrozen ? 'h-16' : 'h-8 opacity-40 blur-[1px]'}`}></div>
               {state.isFrozen && <div className="absolute inset-0 bg-sky-100/40 ice-fx"></div>}
            </div>
         </div>
         <div className="absolute bottom-0 w-56 h-32 bg-sky-200/30 border-t-8 border-sky-400 rounded-b-3xl backdrop-blur-md -z-10 flex items-start justify-center pt-4">
            <span className="text-[10px] font-black text-sky-800 uppercase tracking-widest">Крио-раствор (-27°C)</span>
         </div>
      </div>
      {state.isFrozen && <button onClick={nextStep} className="bg-amber-600 text-white px-16 py-6 rounded-full font-black text-2xl shadow-2xl border-b-8 border-amber-800 animate-bounce">К ДЕГОРЖАЖУ →</button>}
      {renderAdvice()}
    </div>
  );

  const renderDisgorgement = () => (
    <div className="flex flex-col items-center gap-10 animate-in fade-in duration-700 w-full max-w-xl">
      <button onClick={()=>updateState({isDisgorged:true})} disabled={state.isDisgorged} className={`w-full px-12 py-8 rounded-full font-black text-3xl shadow-2xl transition-all ${state.isDisgorged ? 'bg-green-600 text-white' : 'bg-stone-900 text-white'}`}>
        {state.isDisgorged ? 'ДЕГОРЖАЖ ВЫПОЛНЕН ✓' : 'УДАЛИТЬ ЛЕДЯНУЮ ПРОБКУ!'}
      </button>
      <div className="relative w-32 h-[450px] flex flex-col items-center justify-end">
         <div className="w-20 h-72 bg-rose-800/20 border-4 border-stone-200 rounded-b-[40px] rounded-t-xl overflow-hidden relative shadow-2xl">
            {state.isDisgorged ? (
               <div className="absolute inset-0 flex flex-col items-center pt-10">
                  {[...Array(12)].map((_,i)=>(<div key={i} className="bubble w-2 h-2 bg-white rounded-full animate-ping mb-2"></div>))}
               </div>
            ) : (
               <div className={`absolute bottom-0 w-full h-12 ${state.isFrozen ? 'bg-sky-200' : 'bg-stone-950'}`}></div>
            )}
         </div>
         {state.isDisgorged && (
           <div className="absolute -top-32 animate-out fade-out slide-out-to-top-32 duration-[1500ms]">
              <div className="w-14 h-16 bg-sky-100 border-2 border-sky-400 rounded-lg flex flex-col items-center justify-center shadow-2xl">
                 <div className="w-full h-1/2 bg-stone-950/80 rounded-t-sm"></div>
                 <span className="text-[8px] font-black text-sky-900 mt-1 uppercase">ICE PLUG</span>
              </div>
           </div>
         )}
      </div>
      {state.isDisgorged && <button onClick={nextStep} className="bg-sky-600 text-white px-20 py-8 rounded-full font-black text-4xl shadow-2xl border-b-8 border-sky-800 animate-bounce">ФИНАЛЬНЫЙ АУДИТ →</button>}
      {renderAdvice()}
    </div>
  );

  const renderAging = () => (
    <div className="flex flex-col items-center gap-12 w-full max-w-xl animate-in fade-in duration-700">
      <div className="text-center space-y-2">
        <h3 className="text-3xl font-black text-stone-900 uppercase">Выдержка в дубе</h3>
        <p className="text-stone-500 font-medium italic">Микрооксидация и насыщение танинами</p>
      </div>
      <div className="relative w-full h-64 flex items-center justify-center">
        <div className={`w-80 h-56 rounded-[45%] border-[16px] border-stone-900 transition-all duration-1000 ${state.agingWeeks >= 3 ? 'bg-rose-950' : 'bg-rose-900'} shadow-2xl relative border-x-[24px]`}>
           <div className="absolute inset-x-0 top-[25%] h-2 bg-stone-950/40"></div>
           <div className="absolute inset-x-0 bottom-[25%] h-2 bg-stone-950/40"></div>
           <div className="absolute top-4 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-stone-950 shadow-inner"></div>
        </div>
      </div>
      <div className="w-full bg-white p-8 rounded-[40px] shadow-sm border space-y-4">
        <div className="flex justify-between items-center"><label className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Длительность (недели)</label><span className="text-rose-900 font-black text-2xl">{state.agingWeeks}</span></div>
        <input type="range" min="1" max="4" value={state.agingWeeks} onChange={(e)=>updateState({agingWeeks:parseInt(e.target.value)})} className="w-full h-3 bg-stone-100 rounded-lg appearance-none accent-rose-900 cursor-pointer" />
      </div>
      <button onClick={nextStep} className="bg-amber-600 text-white px-20 py-6 rounded-full font-black text-3xl shadow-2xl border-b-8 border-amber-800 transition-all hover:scale-105">К РОЗЛИВУ →</button>
      {renderAdvice()}
    </div>
  );

  const renderBottling = () => (
    <div className="flex flex-col items-center gap-12 w-full max-w-xl animate-in fade-in duration-700">
      <button onClick={()=>updateState({isBottled:true})} disabled={state.isBottled} className={`w-full py-8 rounded-[40px] font-black text-2xl shadow-xl transition-all ${state.isBottled ? 'bg-green-600 text-white' : 'bg-stone-900 text-white'}`}>
        {state.isBottled ? 'ПАРТИЯ ГОТОВА ✓' : 'ЗАПУСТИТЬ ЛИНИЮ РОЗЛИВА'}
      </button>
      <div className="flex gap-10 items-end h-80">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="relative w-24 h-72 border-4 border-stone-200 rounded-b-2xl shadow-2xl overflow-hidden flex flex-col justify-end rounded-t-[40px] bg-stone-50/20">
            <div className={`w-full transition-all duration-[2000ms] ${state.isBottled ? 'h-[92%] bg-rose-950' : 'h-0'}`} />
            {state.isHermetic && state.isBottled && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-10 bg-amber-900 rounded-t-sm shadow-md border-b-4 border-amber-950"></div>}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between w-full bg-white p-8 rounded-[40px] border-2 shadow-xl">
        <span className="font-black text-stone-900 uppercase tracking-tight text-xl">ГЕРМЕТИЧНОСТЬ</span>
        <button onClick={()=>updateState({isHermetic:!state.isHermetic})} className={`w-24 h-12 rounded-full transition-colors relative shadow-inner ${state.isHermetic ? 'bg-stone-950' : 'bg-stone-200'}`}>
          <div className={`absolute top-1 w-10 h-10 rounded-full bg-white shadow-lg transition-all ${state.isHermetic ? 'left-13' : 'left-1'}`} />
        </button>
      </div>
      {state.isBottled && <button onClick={nextStep} className="bg-green-600 text-white px-24 py-8 rounded-full font-black text-4xl shadow-2xl animate-bounce border-b-8 border-green-800">ИТОГИ →</button>}
      {renderAdvice()}
    </div>
  );

  const renderAdvice = () => (
    <div className="w-full mt-10">
      <button onClick={() => setShowAdvice(!showAdvice)} className="flex items-center gap-2 text-[10px] font-black uppercase text-stone-400 hover:text-rose-900 transition-colors">
        <InfoIcon className="w-4 h-4" />
        <span>{showAdvice ? 'СКРЫТЬ СОВЕТ' : 'СОВЕТ ТЕХНОЛОГА'}</span>
      </button>
      {showAdvice && (
        <div className="mt-4 p-6 bg-rose-50 border-2 border-rose-100 rounded-[32px] animate-in slide-in-from-top-4">
          <p className="text-rose-950 font-bold text-sm leading-relaxed italic">«{ADVICE_MAP[state.currentStep]}»</p>
        </div>
      )}
    </div>
  );

  const renderResults = () => {
    const score = state.finalScore;
    let rank = "Технический брак";
    let desc = "Грубые нарушения технологии привели к потере всей партии.";
    if (score > 90) { rank = "Премиальный продукт"; desc = "Идеальное соблюдение техкарты. Продукт готов к выходу на рынок."; }
    else if (score > 70) { rank = "Столовое вино"; desc = "Хорошее качество, но есть замечания к техпроцессу."; }
    else if (score > 40) { rank = "Виноматериал"; desc = "Требуется исправление купажированием или переработка."; }

    return (
      <div className="flex flex-col items-center gap-10 animate-in zoom-in-95 duration-700 max-w-2xl w-full">
        <div className="text-center space-y-4">
          <h2 className="text-5xl font-black text-stone-900 tracking-tighter uppercase leading-tight">Технологический аудит</h2>
          <div className="flex items-center justify-center gap-2">
             {[...Array(5)].map((_, i) => (
               <StarIcon key={i} className={`w-10 h-10 ${i < Math.floor(score/20) ? 'text-amber-500 fill-amber-500' : 'text-stone-200'}`} />
             ))}
          </div>
        </div>
        <div className="w-full bg-white rounded-[64px] border-4 border-stone-100 shadow-2xl p-12 space-y-10">
          <div className="flex justify-between items-end border-b-2 border-stone-100 pb-8">
             <div className="space-y-1">
                <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Категория</span>
                <h3 className="text-3xl font-black text-rose-900 uppercase tracking-tight">{rank}</h3>
             </div>
             <span className="text-7xl font-black text-stone-950 tracking-tighter">{score}<span className="text-2xl text-stone-400">/100</span></span>
          </div>
          <p className="text-xl text-stone-600 font-medium leading-relaxed italic">«{desc}»</p>
          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Журнал отклонений:</h4>
            {state.qualityLogs.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-4">
                {state.qualityLogs.map((log, i) => (
                  <div key={i} className="flex gap-4 items-start p-5 bg-rose-50 rounded-3xl border border-rose-100">
                    <XIcon className="w-5 h-5 text-rose-600 shrink-0 mt-1" />
                    <p className="text-sm font-bold text-rose-900 leading-snug">{log}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex gap-4 items-center p-8 bg-green-50 rounded-[40px] border border-green-100">
                <CheckIcon className="w-8 h-8 text-green-600" />
                <p className="text-lg font-black text-green-900 uppercase">Процесс выполнен безупречно</p>
              </div>
            )}
          </div>
          <button onClick={handleRestart} className="w-full py-7 bg-stone-950 text-white rounded-[40px] font-black text-2xl hover:bg-stone-800 transition-all active:scale-95 shadow-2xl uppercase tracking-widest border-b-8 border-stone-700">Начать заново</button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-stone-50 selection:bg-rose-100">
      {isDictionaryOpen && (
        <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-2xl z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-[64px] w-full max-w-3xl shadow-2xl overflow-hidden border border-white/20">
            <div className="p-10 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
              <div className="flex items-center gap-6"><BookOpenIcon className="w-10 h-10 text-rose-900" /><h2 className="text-4xl font-black text-stone-900 uppercase">БАЗА ЗНАНИЙ</h2></div>
              <button onClick={() => setIsDictionaryOpen(false)} className="p-4 hover:bg-stone-200 rounded-full"><XIcon className="w-8 h-8 text-stone-500" /></button>
            </div>
            <div className="p-10 max-h-[60vh] overflow-y-auto space-y-8 custom-scrollbar">
              {[
                { term: 'Дробилка-гребнеотделитель', definition: 'Механическое устройство для отделения ягод от гребней и их аккуратного раздавливания.' },
                { term: 'Тиражная смесь', definition: 'Вино с добавлением сахара и дрожжей, разливаемое в бутылки для создания давления газа.' },
                { term: 'Крио-дегоржаж', definition: 'Замораживание горлышка бутылки в солевом растворе, чтобы извлечь осадок в виде ледяной пробки.' },
                { term: 'Мезгонасос', definition: 'Насос для перекачки раздробленного винограда из дробилки в емкости для брожения.' },
                { term: 'Фильтр-картон', definition: 'Специальный материал, задерживающий мельчайшие частицы дрожжей для придания вину блеска.' },
              ].map((item, idx) => (
                <div key={idx} className="border-l-4 border-stone-100 pl-6 py-2 hover:border-rose-900 transition-all">
                  <h3 className="text-2xl font-black text-rose-950 mb-3 uppercase">{item.term}</h3>
                  <p className="text-stone-600 font-bold text-lg leading-relaxed">{item.definition}</p>
                </div>
              ))}
            </div>
            <div className="p-10 bg-stone-50 border-t text-center"><button onClick={() => setIsDictionaryOpen(false)} className="px-16 py-5 bg-stone-900 text-white rounded-3xl font-black active:scale-95 transition-all">ПОНЯТНО</button></div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-2xl border-b border-stone-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 h-28 flex items-center justify-between">
          <div className="flex items-center gap-6">
             <div onClick={handleRestart} className="bg-stone-950 p-4 rounded-3xl shadow-2xl rotate-3 cursor-pointer hover:rotate-0 transition-all"><GrapeIcon className="w-10 h-10 text-white" /></div>
             <div>
                <h1 className="text-3xl font-black text-stone-950 tracking-tighter uppercase leading-none">VINUM.ENGINEER</h1>
                <div className="flex items-center gap-2 mt-1"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div><span className="text-[10px] font-black text-stone-400 uppercase">SYS_ACTIVE • {state.wineMode || 'MODE_SELECT'}</span></div>
             </div>
          </div>
          <nav className="hidden xl:flex items-center gap-2 bg-stone-50 p-2 rounded-[32px] border border-stone-200 overflow-x-auto max-w-[50%]">
            {steps.map((s, idx) => (
              <React.Fragment key={s.id}>
                <div onClick={() => (s.id !== Step.RESULTS && state.wineMode) && updateState({ currentStep: s.id })} className={`flex flex-col items-center px-5 py-3 rounded-2xl cursor-pointer ${state.currentStep === s.id ? 'bg-white shadow-md' : 'opacity-40 hover:opacity-100'}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${state.currentStep === s.id ? 'bg-rose-950 text-white' : 'bg-stone-200 text-stone-500'}`}>{idx + 1}</div>
                  <span className={`text-[10px] mt-2 font-black uppercase ${state.currentStep === s.id ? 'text-stone-900' : 'text-stone-400'}`}>{s.label}</span>
                </div>
                {idx < steps.length - 1 && <div className="w-4 h-[2px] bg-stone-200 mx-1" />}
              </React.Fragment>
            ))}
          </nav>
          <button onClick={() => setIsDictionaryOpen(true)} className="p-5 bg-stone-900 text-white rounded-3xl hover:bg-stone-800 transition-all shadow-xl flex items-center gap-4 active:scale-95"><BookOpenIcon className="w-6 h-6" /><span className="hidden lg:block text-xs font-black uppercase">БАЗА</span></button>
        </div>
      </header>

      <main className="flex-grow flex flex-col md:flex-row relative">
        <div className="flex-grow p-8 md:p-16 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-stone-50 to-stone-100 overflow-y-auto">
          <div className="max-w-5xl w-full flex justify-center py-10">
            {state.currentStep === Step.MODE_SELECTION && renderModeSelection()}
            {state.currentStep === Step.PREPARATION && renderPreparation()}
            {state.currentStep === Step.FERMENTATION && (
              <div className="w-full max-w-md animate-in fade-in duration-700">
                <button onClick={() => updateState({ isFermenting: true })} disabled={state.isFermenting} className={`w-full py-6 rounded-3xl font-black text-xl shadow-lg mb-8 transition-all ${state.isFermenting ? 'bg-green-100 text-green-700' : 'bg-stone-900 text-white'}`}>
                  {state.isFermenting ? (state.fermentationStatus === 'done' ? 'БРОЖЕНИЕ ЗАВЕРШЕНО' : 'АКТИВНОЕ БРОЖЕНИЕ...') : 'СТАРТ ФЕРМЕНТАЦИИ'}
                </button>
                <div className="w-full bg-stone-200 h-8 rounded-full overflow-hidden mb-12 shadow-inner border-2 border-stone-100">
                    <div className={`h-full transition-all duration-500 ${state.fermentationStatus === 'spoiled' ? 'bg-red-700' : 'bg-rose-800'}`} style={{ width: `${Math.min(100, state.fermentationProgress)}%` }}></div>
                </div>
                <div className="relative w-64 h-80 bg-stone-100 rounded-t-xl rounded-b-[64px] border-8 border-stone-200 overflow-hidden shadow-2xl mx-auto">
                  <div className={`absolute bottom-0 w-[110%] -left-[5%] transition-all duration-700 liquid-wave ${state.fermentationStatus === 'spoiled' ? 'bg-stone-900' : 'bg-gradient-to-t from-rose-950 via-rose-900 to-rose-800'}`} style={{ height: `${65 + (Math.min(100, state.fermentationProgress) * 0.15)}%` }}>
                    {state.isFermenting && state.fermentationStatus === 'active' && [...Array(30)].map((_, i) => (
                      <div key={i} className="bubble" style={{ left: `${Math.random() * 95}%`, bottom: '0px', width: `${Math.random() * 8 + 3}px`, height: `${Math.random() * 8 + 3}px`, animationDelay: `${Math.random() * 3}s` }} />
                    ))}
                  </div>
                </div>
                {state.fermentationStatus === 'done' && <button onClick={nextStep} className="w-full mt-10 bg-amber-600 text-white py-6 rounded-[40px] font-black text-2xl shadow-2xl border-b-8 border-amber-800 animate-bounce">К ОЧИСТКЕ И ФИЛЬТРАЦИИ →</button>}
                {renderAdvice()}
              </div>
            )}
            {state.currentStep === Step.FILTRATION && renderFiltration()}
            {state.currentStep === Step.TIRAGE && (
               <div className="w-full max-w-xl flex flex-col items-center gap-12 animate-in fade-in">
                  <button onClick={() => updateState({ isBottled: true })} disabled={state.isBottled} className={`w-full py-6 rounded-[40px] font-black text-2xl shadow-xl transition-all ${state.isBottled ? 'bg-green-600 text-white' : 'bg-stone-900 text-white'}`}>
                    {state.isBottled ? 'ТИРАЖ ВЫПОЛНЕН ✓' : 'РАЗЛИТЬ ТИРАЖНУЮ СМЕСЬ'}
                  </button>
                  <div className="flex gap-6 items-end h-80">
                     {[...Array(3)].map((_, i) => (
                        <div key={i} className="relative w-20 h-72 bg-stone-50 border-2 border-stone-200 rounded-t-[45px] rounded-b-xl shadow-xl overflow-hidden flex flex-col justify-end">
                           <div className={`w-full transition-all duration-[2000ms] ${state.isBottled ? 'h-[85%] bg-rose-900/90' : 'h-0'}`}>
                              <div className="bubble w-1.5 h-1.5 bg-white/20" style={{ left: '40%', bottom: '20px' }}></div>
                           </div>
                           {state.isBottled && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-4 bg-stone-700 rounded-t-sm"></div>}
                        </div>
                     ))}
                  </div>
                  {state.isBottled && <button onClick={nextStep} className="bg-amber-600 text-white px-20 py-6 rounded-full font-black text-3xl shadow-2xl animate-bounce">К РЕМЮАЖУ →</button>}
                  {renderAdvice()}
               </div>
            )}
            {state.currentStep === Step.RIDDLING && (
               <div className="w-full max-w-xl flex flex-col items-center gap-12 animate-in fade-in">
                  <button onClick={() => updateState({ riddlingProgress: Math.min(100, state.riddlingProgress + 25) })} disabled={state.riddlingProgress >= 100} className="w-full py-6 rounded-[40px] bg-stone-900 text-white font-black text-2xl shadow-xl">
                    {state.riddlingProgress >= 100 ? 'РЕМЮАЖ ЗАВЕРШЕН ✓' : 'ПОВОРОТ НА 1/4 (РЕМЮАЖ)'}
                  </button>
                  <div className="flex gap-16 items-center h-80">
                    {[...Array(2)].map((_, i) => (
                        <div key={i} className="relative transition-all duration-1000" style={{ transform: `rotate(${150 + (state.riddlingProgress * 0.3)}deg)` }}>
                            <div className="w-24 h-72 bg-rose-900/50 border-4 border-stone-200 rounded-t-[50px] rounded-b-2xl shadow-2xl overflow-hidden relative">
                               <div className={`absolute inset-x-0 top-0 transition-all duration-1000 bg-stone-950/90 ${state.riddlingProgress >= 100 ? 'h-14 blur-[2px]' : 'h-4 opacity-30 blur-[4px]'}`}></div>
                            </div>
                        </div>
                    ))}
                  </div>
                  {state.riddlingProgress >= 100 && <button onClick={nextStep} className="bg-amber-600 text-white px-20 py-6 rounded-full font-black text-3xl shadow-2xl">К ЗАМОРОЗКЕ ГОРЛЫШКА →</button>}
                  {renderAdvice()}
               </div>
            )}
            {state.currentStep === Step.FREEZING && renderFreezing()}
            {state.currentStep === Step.DISGORGEMENT && renderDisgorgement()}
            {state.currentStep === Step.AGING && renderAging()}
            {state.currentStep === Step.BOTTLING && renderBottling()}
            {state.currentStep === Step.RESULTS && renderResults()}
          </div>
        </div>
        {(state.currentStep !== Step.RESULTS && state.currentStep !== Step.MODE_SELECTION) && (
          <QualityPanel state={state} onOpenDictionary={() => setIsDictionaryOpen(true)} onRestart={handleRestart} />
        )}
      </main>

      <footer className="bg-white border-t border-stone-200 p-8 flex justify-between items-center z-10">
        <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest">VINUM ENGINEER v5.0</p>
        <p className="text-stone-800 text-[10px] font-black uppercase border-b-2 border-rose-900/20">УЧЕБНО-ИНЖЕНЕРНАЯ МОДЕЛЬ • НЕ ЯВЛЯЕТСЯ ПРОПАГАНДОЙ</p>
      </footer>
    </div>
  );
};

export default App;
