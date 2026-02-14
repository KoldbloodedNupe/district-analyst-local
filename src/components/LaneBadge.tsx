
import React from 'react';
import { DALane } from '../types.ts';

interface LaneBadgeProps {
  lane: DALane;
}

const LaneBadge: React.FC<LaneBadgeProps> = ({ lane }) => {
  const styles = {
    [DALane.ANALYTICS]: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    [DALane.FINANCE]: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    [DALane.AUTOMATION]: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    [DALane.SECURITY]: 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  return (
    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border shadow-sm ${styles[lane]}`}>
      {lane}
    </span>
  );
};

export default LaneBadge;
