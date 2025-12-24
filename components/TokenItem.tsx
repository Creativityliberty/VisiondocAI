
import React from 'react';
import { motion } from 'framer-motion';
import { TOKEN_ICONS } from '../constants';

interface TokenItemProps {
  iconKey: keyof typeof TOKEN_ICONS;
  label: string;
  value: string;
  delay?: number;
}

export const TokenItem: React.FC<TokenItemProps> = ({ iconKey, label, value, delay = 0 }) => (
  <motion.div 
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay }}
    className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-[#FDEEEB] transition-colors group"
  >
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center text-[#E6644C] group-hover:scale-110 transition-transform">
        {TOKEN_ICONS[iconKey]}
      </div>
      <span className="text-[10px] font-black text-[#9A9A9A] uppercase tracking-wider">{label}</span>
    </div>
    <span className="text-xs font-mono font-bold text-[#1A1A1A] truncate max-w-[120px]" title={value}>
      {value}
    </span>
  </motion.div>
);
