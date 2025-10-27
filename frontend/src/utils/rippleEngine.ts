export interface Ripple {
  x: number;
  y: number;
  t0: number;
  strength: number;
  isTrail: boolean;
}

export interface Params {
  speed: number;
  maxRipples: number;
  expansionSpeed: number;
  maxRadius: number;
  fadeSpeed: number;
  minAlpha: number;
  maxAlpha: number;
}

export class RippleEngine {
  private ripples: Ripple[] = [];
  private lastMousePos: { x: number; y: number } = { x: 0, y: 0 };
  private mouseStopTimer: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private DPR: number = 1;
  private animationFrame: number | null = null;
  private lastMoveTime: number = 0;
  private lastMouseMoveTime: number = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    private ctx: CanvasRenderingContext2D,
    private params: Params
  ) {
    this.DPR = Math.max(1, window.devicePixelRatio || 1);
  }

  public initialize() {
    this.resizeCanvas();
    this.setupEventListeners();
    this.startAnimationLoop();
  }

  public destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    if (this.mouseStopTimer) {
      clearTimeout(this.mouseStopTimer);
    }
    this.stopHeartbeat();
    this.removeEventListeners();
  }

  private resizeCanvas() {
    this.DPR = Math.max(1, window.devicePixelRatio || 1);
    const w = Math.floor(window.innerWidth);
    const h = Math.floor(window.innerHeight);
    this.canvas.style.width = w + 'px';
    this.canvas.style.height = h + 'px';
    this.canvas.width = Math.floor(w * this.DPR);
    this.canvas.height = Math.floor(h * this.DPR);
    this.ctx.setTransform(this.DPR, 0, 0, this.DPR, 0, 0);
  }

  private pushRipple(x: number, y: number, strength: number = 1, isTrail: boolean = false) {
    const now = performance.now() / 1000;
    this.ripples.push({ x, y, t0: now, strength, isTrail });
    if (this.ripples.length > this.params.maxRipples) {
      this.ripples.shift();
    }
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private clearOldHeartbeatRipples() {
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      if (!this.ripples[i].isTrail) {
        this.ripples.splice(i, 1);
      }
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    let beatCount = 0;
    this.heartbeatInterval = setInterval(() => {
      if (beatCount % 2 === 0) {
        this.pushRipple(this.lastMousePos.x, this.lastMousePos.y, 1.0, false);
        setTimeout(() => {
          this.pushRipple(this.lastMousePos.x, this.lastMousePos.y, 0.75, false);
        }, 150);
      }
      beatCount++;
    }, 900);
  }

  private onMouseStop() {
    this.pushRipple(this.lastMousePos.x, this.lastMousePos.y, 0.8, false);
    this.startHeartbeat();
  }

  private cleanupRipples() {
    const now = performance.now() / 1000;
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const age = now - this.ripples[i].t0;
      if (age > 4) {
        this.ripples.splice(i, 1);
      }
    }
  }

  private drawRippleCircle(centerX: number, centerY: number, radius: number, alpha: number) {
    const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);

    gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 1.3})`);
    gradient.addColorStop(0.3, `rgba(120, 160, 200, ${alpha * 1.1})`);
    gradient.addColorStop(0.7, `rgba(40, 90, 150, ${alpha * 0.7})`);
    gradient.addColorStop(1, `rgba(20, 60, 120, 0)`);

    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private draw = () => {
    const now = performance.now() / 1000;

    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, this.canvas.width / this.DPR, this.canvas.height / this.DPR);

    for (let i = 0; i < this.ripples.length; i++) {
      const ripple = this.ripples[i];
      const age = now - ripple.t0;
      const currentRadius = age * this.params.expansionSpeed;
      const alpha = Math.max(0,
        (1 - age * this.params.fadeSpeed) * this.params.maxAlpha * ripple.strength
      );

      if (alpha < this.params.minAlpha) continue;

      this.drawRippleCircle(ripple.x, ripple.y, currentRadius, alpha);

      if (currentRadius > 6) {
        const innerRadius = currentRadius * 0.6;
        const innerAlpha = alpha * 2.5;
        if (innerAlpha > 0) {
          this.drawRippleCircle(ripple.x, ripple.y, innerRadius, Math.min(innerAlpha, 1));
        }
      }
    }

    this.cleanupRipples();
    this.animationFrame = requestAnimationFrame(this.draw);
  };

  private startAnimationLoop() {
    this.animationFrame = requestAnimationFrame(this.draw);
  }

  private handlePointerDown = (e: PointerEvent) => {
    this.pushRipple(e.clientX, e.clientY, 1.6);
  };

  private handlePointerMove = (e: PointerEvent) => {
    const nowMs = performance.now();
    if (nowMs - this.lastMoveTime > 8) {
      this.lastMoveTime = nowMs;
      this.pushRipple(e.clientX, e.clientY, 0.8, true);
    }
    this.stopHeartbeat();
    this.clearOldHeartbeatRipples();
  };

  private handlePointerUp = () => {
  };

  private handleMouseMove = (e: MouseEvent) => {
    const nowMs = performance.now();
    if (nowMs - this.lastMouseMoveTime > 12) {
      this.lastMouseMoveTime = nowMs;
      this.pushRipple(e.clientX, e.clientY, 0.7, true);
    }

    this.lastMousePos.x = e.clientX;
    this.lastMousePos.y = e.clientY;

    this.stopHeartbeat();
    this.clearOldHeartbeatRipples();

    if (this.mouseStopTimer) clearTimeout(this.mouseStopTimer);
    this.mouseStopTimer = setTimeout(() => this.onMouseStop(), 300);
  };

  private handleResize = () => {
    this.resizeCanvas();
  };

  private setupEventListeners() {
    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    this.canvas.addEventListener('pointerup', this.handlePointerUp);
    this.canvas.addEventListener('pointercancel', this.handlePointerUp);
    this.canvas.addEventListener('pointerleave', this.handlePointerUp);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('resize', this.handleResize);
  }

  private removeEventListeners() {
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('pointercancel', this.handlePointerUp);
    this.canvas.removeEventListener('pointerleave', this.handlePointerUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('resize', this.handleResize);
  }
}
