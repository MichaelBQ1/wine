
import React from 'react';
import { AppState, Step, WineMode } from '../types';
import { ThermometerIcon, CheckIcon, XIcon } from './Icons';

interface QualityPanelProps {
  state: AppState;
  onOpenDictionary?: () => void;
  onRestart?: () => void;
}

const QualityPanel: React.FC<QualityPanelProps> = ({ state, onOpenDictionary, onRestart }) => {
  const getTasteAroma = () => {
    if (state.fermentationStatus === 'spoiled') return "Критический дефект: резкий запах уксуса и окисления.";
    if (state.currentStep === Step.PREPARATION) return state.isCrushed ? "Аромат свежераздавленных ягод, косточки." : "Сырье еще не обработано.";
    if (state.wineMode === WineMode.SPARKLING) {
        if (state.isDisgorged) return "Букет высокого класса: цветочные ноты, бриошь, тонкий перляж.";
        if (state.isFrozen) return "Стабилизированная база, готовность к очистке от осадка.";
        if (state.isBottled) return "Тона вторичного брожения, нарастающее давление CO2.";
    }
    if (state.fermentationTemp > 30) return "Тяжелый аромат вареных фруктов, избыточная спиртуозность.";
    if (state.isFiltered && state.agingWeeks >= 4) return "Благородный профиль: ваниль, шоколад, мягкие танины дуба.";
    if (state.isFiltered) return "Чистый сортовой аромат, высокая свежесть и кислотность.";
    return "Стадия формирования органолептического профиля.";
  };

  const getClarityText = () => {
    if (state.isFiltered) return "КРИСТАЛЬНОЕ / БЛЕСК";
    if (state.isCleaning) return "ТОНКАЯ ОЧИСТКА...";
    if (state.isPressed) return "ИНТЕНСИВНО МУТНОЕ";
    if (state.isCrushed) return "ПЛОТНАЯ СУСПЕНЗИЯ";
    return "НЕОБРАБОТАННОЕ СЫРЬЕ";
  };

  return (
    <div className="w-full md:w-96 bg-white border-l border-stone-200 p-10 flex flex-col gap-10 shadow-2xl h-full relative z-10">
      <div className="space-y-2">
          <h2 className="text-3xl font-black text-stone-950 tracking-tighter uppercase leading-none">АНАЛИТИКА</h2>
          <div className="h-1.5 w-16 bg-rose-950 rounded-full"></div>
      </div>
      
      <div className="space-y-8 flex-grow overflow-y-auto pr-2 custom-scrollbar">
        <div className="group">
          <div className="flex items-center justify-between text-[11px] text-stone-400 uppercase font-black mb-3"><span>ТЕРМОСТАТ</span><ThermometerIcon className="w-5 h-5" /></div>
          <div className={`text-5xl font-black tracking-tighter ${state.fermentationTemp > 30 ? 'text-red-600 animate-pulse' : 'text-stone-950'}`}>{state.fermentationTemp}°C</div>
          <div className="mt-3 p-4 bg-stone-50 rounded-2xl border text-[10px] font-black text-stone-500 uppercase leading-relaxed">
              {state.fermentationTemp < 18 ? "РИСК ОСТАНОВКИ БРОЖЕНИЯ" : state.fermentationTemp > 30 ? "КРИТИЧЕСКИЙ ПЕРЕГРЕВ СУСЛА" : "ОПТИМАЛЬНАЯ ТЕМПЕРАТУРА"}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-[11px] text-stone-400 uppercase font-black mb-3"><span>СТАТУС ТАРЫ</span><CheckIcon className="w-5 h-5" /></div>
          <div className={`text-xl font-black uppercase ${state.isHermetic ? 'text-green-600' : 'text-rose-600 animate-pulse'}`}>
            {state.isHermetic ? 'ГЕРМЕТИЧНО' : 'РИСК ОКИСЛЕНИЯ'}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-[11px] text-stone-400 uppercase font-black mb-3"><span>ЧИСТОТА ПРОДУКТА</span></div>
          <div className="text-xl font-black text-stone-950 uppercase border-l-4 border-rose-200 pl-4">{getClarityText()}</div>
        </div>

        <div>
          <div className="flex items-center justify-between text-[11px] text-stone-400 uppercase font-black mb-3"><span>ТЕХНОЛОГИЧЕСКИЙ ПРОФИЛЬ</span></div>
          <div className="text-md font-bold text-stone-800 leading-tight italic bg-stone-50 p-6 rounded-3xl border border-stone-100">«{getTasteAroma()}»</div>
        </div>

        {state.wineMode === WineMode.SPARKLING && state.currentStep === Step.FREEZING && (
           <div className="p-4 bg-sky-50 border-2 border-sky-100 rounded-2xl animate-pulse">
              <span className="text-[10px] font-black text-sky-800 uppercase">Сенсор криостата: {state.isFrozen ? 'ЗАМОРОЖЕНО' : 'ОЖИДАНИЕ...'}</span>
           </div>
        )}
      </div>

      <div className="mt-auto pt-8 border-t border-stone-100">
        <button onClick={onRestart} className="w-full flex items-center justify-center gap-3 py-4 bg-stone-100 text-stone-900 rounded-2xl transition-all hover:bg-rose-50 hover:text-rose-700 font-black text-[10px] uppercase shadow-sm"><XIcon className="w-5 h-5" /><span>СБРОСИТЬ ТЕХПРОЦЕСС</span></button>
      </div>
    </div>
  );
};

export default QualityPanel;
