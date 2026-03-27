'use client';

import { motion } from 'framer-motion';

const YELLOW_GRID = [
  [3, 6, 5, 0], // 0 is empty
  [2, 1, 0, 5],
  [1, 0, 2, 4],
  [0, 3, 4, 6]
];

export const YellowArea = ({ data, onMark }: { data: any, onMark: (r: number, c: number) => void }) => {
  return (
    <div className="bg-yellow-400 p-3 rounded-xl text-slate-900 shadow-lg">
      <h3 className="text-xs font-bold mb-2 uppercase tracking-tighter text-center">Yellow</h3>
      <div className="grid grid-cols-4 gap-1">
        {[0, 1, 2, 3].map(r => (
          [0, 1, 2, 3].map(c => {
            const val = YELLOW_GRID[r][c];
            const isMarked = data[`row${r}`][c];
            if (val === 0) return <div key={`y-${r}-${c}`} className="w-8 h-8 opacity-0" />;
            
            return (
              <motion.button
                key={`y-${r}-${c}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onMark(r, c)}
                className={`w-8 h-8 border-2 border-slate-900/20 rounded flex items-center justify-center font-bold text-sm transition-colors ${isMarked ? 'bg-slate-900 text-yellow-400' : 'bg-white/50 hover:bg-white/80'}`}
              >
                {isMarked ? 'X' : val}
              </motion.button>
            );
          })
        ))}
      </div>
    </div>
  );
};

export const BlueArea = ({ data, onMark }: { data: any, onMark: (val: number) => void }) => {
  const values = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  return (
    <div className="bg-blue-500 p-3 rounded-xl text-white shadow-lg">
      <h3 className="text-xs font-bold mb-2 uppercase tracking-tighter text-center">Blue</h3>
      <div className="grid grid-cols-4 gap-1">
        {values.map((val, idx) => {
          const isMarked = data.marks[idx];
          return (
            <motion.button
              key={`b-${val}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onMark(val)}
              className={`w-8 h-8 border-2 border-white/20 rounded flex items-center justify-center font-bold text-sm ${isMarked ? 'bg-white text-blue-500' : 'bg-blue-400/50 hover:bg-blue-400/80'}`}
            >
              {isMarked ? 'X' : val}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export const GreenArea = ({ data, onMark }: { data: any, onMark: (idx: number) => void }) => {
  const thresholds = ['≥1', '≥2', '≥3', '≥4', '≥5', '≥1', '≥2', '≥3', '≥4', '≥5', '≥6'];
  return (
    <div className="bg-green-500 p-3 rounded-xl text-white shadow-lg overflow-x-auto">
      <h3 className="text-xs font-bold mb-2 uppercase tracking-tighter">Green</h3>
      <div className="flex gap-1">
        {thresholds.map((t, idx) => {
          const isMarked = data.marks[idx];
          return (
            <button
              key={`g-${idx}`}
              onClick={() => onMark(idx)}
              className={`min-w-[32px] h-8 border-2 border-white/20 rounded flex items-center justify-center font-bold text-[10px] ${isMarked ? 'bg-white text-green-500' : 'bg-green-400/50 hover:bg-green-400/80'}`}
            >
              {isMarked ? 'X' : t}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const OrangeArea = ({ data, onMark }: { data: any, onMark: (idx: number) => void }) => {
  const multipliers = [1, 1, 1, 1, 2, 1, 1, 2, 1, 1, 1];
  return (
    <div className="bg-orange-500 p-3 rounded-xl text-white shadow-lg mt-4">
      <h3 className="text-xs font-bold mb-2 uppercase tracking-tighter">Orange</h3>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {data.values.map((val: number, idx: number) => {
          const m = multipliers[idx];
          return (
            <button
              key={`o-${idx}`}
              onClick={() => onMark(idx)}
              className="min-w-[34px] h-8 border-2 border-white/20 rounded flex flex-col items-center justify-center bg-orange-400/50 hover:bg-orange-400/80 transition-colors"
            >
              <span className="text-sm font-bold">{val > 0 ? val : ''}</span>
              {m > 1 && val === 0 && <span className="text-[8px] opacity-70">x{m}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const PurpleArea = ({ data, onMark }: { data: any, onMark: (idx: number) => void }) => {
  return (
    <div className="bg-purple-600 p-3 rounded-xl text-white shadow-lg mt-4">
      <h3 className="text-xs font-bold mb-2 uppercase tracking-tighter">Purple</h3>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {data.values.map((val: number, idx: number) => (
          <button
            key={`p-${idx}`}
            onClick={() => onMark(idx)}
            className="min-w-[34px] h-8 border-2 border-white/20 rounded flex items-center justify-center font-bold text-sm bg-purple-500/50 hover:bg-purple-500/80 transition-colors"
          >
            {val > 0 ? val : ''}
          </button>
        ))}
      </div>
    </div>
  );
};
