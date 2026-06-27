import { motion } from 'framer-motion';

export default function NotificationBadge({ count }) {
  if (!count || count === 0) return null;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="absolute -top-1 -right-2 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center shadow-sm"
    >
      {count > 9 ? '9+' : count}
    </motion.div>
  );
}
