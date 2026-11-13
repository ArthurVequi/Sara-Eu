import { useState, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import './splash.css'

const easeOut = [.22, 1, .36, 1] as const

export function SplashScreen({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(true)
  const reduced = useReducedMotion()
  const showSplash = visible && !reduced

  return <>
    <div inert={showSplash}>{children}</div>
    {showSplash && <motion.div
      className="splash-screen"
      aria-hidden="true"
      initial={{ opacity: 1 }}
      animate={{ opacity: [1, 1, 0] }}
      transition={{ duration: 1.45, times: [0, .76, 1], ease: ['linear', 'easeInOut'] }}
      onAnimationComplete={() => setVisible(false)}
    >
      <motion.div
        className="splash-brand"
        initial={{ y: 0 }}
        animate={{ y: [0, 0, -10] }}
        transition={{ duration: 1.45, times: [0, .76, 1], ease: ['linear', 'easeIn'] }}
      >
        <motion.svg
          className="splash-icon"
          viewBox="0 0 192 192"
          fill="none"
          initial={{ scale: .94 }}
          animate={{ scale: 1 }}
          transition={{ duration: .65, ease: easeOut }}
        >
          <motion.rect
            x="12" y="12" width="168" height="168" rx="42"
            stroke="currentColor" strokeWidth="3" strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: .42 }}
            transition={{ duration: .54, ease: 'easeOut' }}
          />
          <motion.path
            d="m52 98 29 29 59-64"
            stroke="currentColor" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: .19, duration: .39, ease: easeOut }}
          />
        </motion.svg>
        <div className="splash-name-window">
          <motion.span
            className="splash-name"
            initial={{ y: '65%', opacity: 0 }}
            animate={{ y: '0%', opacity: 1 }}
            transition={{ delay: .42, duration: .38, ease: easeOut }}
          >Organiza Aí</motion.span>
        </div>
      </motion.div>
    </motion.div>}
  </>
}
