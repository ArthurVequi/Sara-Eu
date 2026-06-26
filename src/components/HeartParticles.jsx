import { useEffect, useRef } from 'react';

export default function HeartParticles() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class HeartParticle {
      constructor() {
        this.reset();
        // Começa em posições aleatórias na tela na inicialização
        this.y = Math.random() * canvas.height;
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = canvas.height + Math.random() * 20 + 10;
        this.size = Math.random() * 8 + 4; // Tamanho pequeno e sutil
        this.speed = Math.random() * 0.4 + 0.2; // Velocidade lenta e suave
        this.opacity = Math.random() * 0.3 + 0.1; // Bem transparente para não atrapalhar a leitura
        this.swing = Math.random() * 0.02; // Balanço lateral
        this.swingPhase = Math.random() * Math.PI * 2;
      }

      update() {
        this.y -= this.speed;
        this.swingPhase += this.swing;
        this.x += Math.sin(this.swingPhase) * 0.3;

        // Se passar do topo, reseta para o fundo
        if (this.y < -this.size) {
          this.reset();
        }
      }

      draw() {
        ctx.fillStyle = `rgba(244, 63, 94, ${this.opacity})`; // rose-500 com opacidade
        ctx.beginPath();
        
        const x = this.x;
        const y = this.y;
        const size = this.size;

        // Desenhar uma forma de coração perfeita no Canvas
        ctx.moveTo(x, y + size / 4);
        ctx.quadraticCurveTo(x, y, x + size / 2, y);
        ctx.quadraticCurveTo(x + size, y, x + size, y + size / 3);
        ctx.quadraticCurveTo(x + size, y + size * 2/3, x + size / 2, y + size);
        ctx.quadraticCurveTo(x, y + size * 2/3, x, y + size / 3);
        ctx.quadraticCurveTo(x, y, x, y + size / 4);
        
        ctx.closePath();
        ctx.fill();
      }
    }

    // Criar um número moderado de partículas para manter excelente performance no celular
    const particleCount = Math.min(30, Math.floor(window.innerWidth / 15));
    for (let i = 0; i < particleCount; i++) {
      particles.push(new HeartParticle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((particle) => {
        particle.update();
        particle.draw();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ mixBlendMode: 'multiply' }}
    />
  );
}
