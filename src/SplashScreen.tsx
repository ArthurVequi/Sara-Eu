import { useLayoutEffect, useState, type ReactNode } from 'react'
import { useAnimate } from 'motion/react-mini'
import './splash.css'

const duration = 1.5
const at = (milliseconds: number) => milliseconds / 1500

export function SplashScreen({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(true)
  const [scope, animate] = useAnimate()

  useLayoutEffect(() => {
    if (!visible) return
    const overlay = scope.current as HTMLElement
    const icon = overlay.querySelector<HTMLElement>('.splash-icon')!
    const name = overlay.querySelector<HTMLElement>('.splash-name')!
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const iconBounds = icon.getBoundingClientRect()
    const centerOffset = overlay.clientWidth / 2 - (iconBounds.left + iconBounds.width / 2)
    const fade = animate(overlay, { opacity: [1, 1, 0] }, {
      duration, times: [0, at(1350), 1], ease: 'linear',
    })
    const iconMotion = animate(icon, {
      opacity: [0, 1, 1, 1],
      transform: reduced ? ['none', 'none', 'none', 'none'] : [
        `translateX(${centerOffset}px) scale(.9)`, `translateX(${centerOffset}px) scale(1)`,
        'translateX(0) scale(1)', 'translateX(0) scale(1)',
      ],
    }, { duration, times: [0, at(500), at(1100), 1], ease: ['easeOut', 'easeInOut', 'linear'] })
    const nameMotion = animate(name, {
      opacity: [0, 0, 1, 1, 1],
      transform: reduced ? ['none', 'none', 'none', 'none', 'none'] : [
        'translateX(-100vw)', 'translateX(-100vw)', 'translateX(-12px)', 'translateX(0)', 'translateX(0)',
      ],
    }, {
      duration, times: [0, at(500), at(880), at(1100), 1],
      ease: ['linear', 'easeOut', 'easeOut', 'linear'],
    })
    let active = true
    void fade.then(() => { if (active) setVisible(false) })
    return () => {
      active = false
      fade.stop()
      iconMotion.stop()
      nameMotion.stop()
    }
  }, [animate, scope, visible])

  return <>
    <div inert={visible}>{children}</div>
    {visible && <div ref={scope} className="splash-screen" aria-hidden="true">
      <div className="splash-brand">
        <img className="splash-icon" src="/organiza.svg" alt="" />
        <span className="splash-name">Organiza Aí</span>
      </div>
    </div>}
  </>
}
