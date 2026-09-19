class ConfettiEngine {
	constructor(confetCanv, gravity) {
		this.gravity = gravity;
		this.canvas = confetCanv;
		this.ctx = this.canvas.getContext("2d");
		this.particles = [];
		this.resize();
		window.addEventListener("resize", () => this.resize());
		this.animate();
	}
	resize() {
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
	}
	burst({
		x = this.canvas.width / 2,
		y = this.canvas.height / 2,
		count = 80,
		velmod = 1.0,
		angmod1 = 1.0,
		angmod2 = 0,
	}) {
		for (let i = 0; i < count; i++) {
			const angle = angmod1 * (Math.random() * Math.PI * 2) + angmod2;
			const speed = velmod * (Math.random() * 25 + 5);
			this.particles.push({
				x, y,
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed - 5,
				size: Math.random() * 8 + 4,
				colour: `hsl(${Math.random() * 360}, 100%, 60%)`,
				opacity: 1,
				rotation: Math.random() * 360,
				spin: (Math.random() - 0.5) * 10
			});
		}
	}
	animate() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.particles.forEach((p, idx) => {
			p.x += p.vx;
			p.y += p.vy;
			p.vy += this.gravity;
			p.opacity -= 0.01;
			p.rotation += p.spin;

			this.ctx.save();
			this.ctx.globalAlpha = Math.max(p.opacity, 0);
			this.ctx.translate(p.x, p.y);
			this.ctx.rotate((p.rotation * Math.PI) / 180);
			this.ctx.fillStyle = p.colour;
			this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
			this.ctx.restore();

			if (p.opacity <= 0) this.particles.splice(idx, 1);
		});
		requestAnimationFrame(() => this.animate());
	}
}