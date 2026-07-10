(() => {
  const wait = (test, done, attempts = 80) => {
    if (test()) return done();
    if (attempts <= 0) return;
    setTimeout(() => wait(test, done, attempts - 1), 100);
  };

  function installGsapAnimations() {
    if (!window.gsap) return;

    window.fly = function flyWithGsap(colors, fromRects, toRects) {
      return Promise.all(colors.map((colorIndex, i) => new Promise(resolve => {
        const from = fromRects[i];
        const to = toRects[i];
        if (!from || !to) return resolve();

        const clone = document.createElement('div');
        clone.className = 'nut fly';
        clone.style.setProperty('--c', COLORS[colorIndex]);
        clone.style.left = `${from.left}px`;
        clone.style.top = `${from.top}px`;
        clone.style.width = `${from.width}px`;
        clone.style.height = `${from.height}px`;
        document.body.appendChild(clone);

        const dx = to.left - from.left;
        const dy = to.top - from.top;
        const lift = Math.min(170, 88 + Math.abs(dx) * 0.38 + i * 8);
        const spin = (i % 2 === 0 ? 18 : -18) + i * 4;

        gsap.timeline({
          delay: i * 0.055,
          defaults: { overwrite: true },
          onComplete: () => {
            clone.remove();
            resolve();
          }
        })
          .to(clone, {
            duration: 0.44,
            x: dx * 0.46,
            y: dy * 0.32 - lift,
            scale: 1.12,
            rotation: spin,
            ease: 'power2.out'
          })
          .to(clone, {
            duration: 0.48,
            x: dx,
            y: dy,
            scale: 1,
            rotation: 0,
            ease: 'power3.inOut'
          });
      })));
    };

    window.pulse = function pulseWithGsap(index) {
      const tube = boardEl.children[index];
      if (!tube) return;
      gsap.fromTo(tube,
        { scale: 1.012, filter: 'brightness(1)' },
        { scale: 1.04, filter: 'brightness(1.08)', duration: 0.22, yoyo: true, repeat: 1, ease: 'sine.inOut' }
      );
    };

    const originalSetHint = window.setHint;
    window.setHint = function setHintWithGsap(message) {
      originalSetHint(message);
      gsap.fromTo(hintline,
        { opacity: 0.72, scale: 0.985 },
        { opacity: 1, scale: 1, duration: 0.34, ease: 'power2.out', overwrite: true }
      );
    };

    const originalWin = window.win;
    window.win = function winWithGsap() {
      originalWin();
      const box = document.querySelector('.modal-box');
      if (box) {
        gsap.fromTo(box,
          { opacity: 0, y: 26, scale: 0.9, rotationX: -8 },
          { opacity: 1, y: 0, scale: 1, rotationX: 0, duration: 0.62, ease: 'back.out(1.5)', delay: 0.5 }
        );
      }
    };
  }

  function installThreeScene() {
    if (!window.THREE) return;
    const card = document.querySelector('.card');
    if (!card || document.getElementById('threeLayer')) return;

    const host = document.createElement('div');
    host.id = 'threeLayer';
    host.setAttribute('aria-hidden', 'true');
    Object.assign(host.style, {
      position: 'absolute',
      inset: '0',
      pointerEvents: 'none',
      opacity: '0.24',
      zIndex: '0'
    });
    card.prepend(host);

    const board = document.getElementById('board');
    if (board) board.style.zIndex = '1';
    const hint = document.getElementById('hintline');
    if (hint) {
      hint.style.position = 'relative';
      hint.style.zIndex = '2';
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 8.5);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.4));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    host.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1.7));
    const key = new THREE.DirectionalLight(0xffffff, 3.1);
    key.position.set(4, 6, 8);
    scene.add(key);

    const cool = new THREE.PointLight(0x38bdf8, 16, 18);
    cool.position.set(-4, 1, 5);
    scene.add(cool);

    const warm = new THREE.PointLight(0xfacc15, 12, 16);
    warm.position.set(4, -2, 4);
    scene.add(warm);

    const group = new THREE.Group();
    scene.add(group);
    const palette = [0x22c55e, 0x8b5cf6, 0xef4444, 0x06b6d4, 0xfacc15];

    function makeNut(color) {
      const shape = new THREE.Shape();
      const radius = 0.72;
      for (let i = 0; i < 6; i++) {
        const angle = Math.PI / 3 * i + Math.PI / 6;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      }
      shape.closePath();
      const hole = new THREE.Path();
      hole.absarc(0, 0, 0.28, 0, Math.PI * 2, true);
      shape.holes.push(hole);

      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: 0.24,
        bevelEnabled: true,
        bevelSegments: 3,
        steps: 1,
        bevelSize: 0.08,
        bevelThickness: 0.06
      });
      geometry.center();

      const material = new THREE.MeshStandardMaterial({
        color,
        metalness: 0.5,
        roughness: 0.22,
        transparent: true,
        opacity: 0.76
      });
      return new THREE.Mesh(geometry, material);
    }

    for (let i = 0; i < 7; i++) {
      const mesh = makeNut(palette[i % palette.length]);
      mesh.position.set((i % 4 - 1.5) * 2.25, (Math.floor(i / 4) - 0.45) * 3.1, -1.7 - (i % 2) * 0.4);
      mesh.rotation.set(0.85, 0, i * 0.36);
      mesh.scale.setScalar(0.72 + (i % 3) * 0.08);
      mesh.userData = {
        baseY: mesh.position.y,
        speed: 0.35 + i * 0.045,
        phase: i * 0.8
      };
      group.add(mesh);
    }

    const resize = () => {
      const width = host.clientWidth || 1;
      const height = host.clientHeight || 1;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    let last = 0;
    const animate = time => {
      const delta = Math.min((time - last) / 1000, 0.05) || 0;
      last = time;
      group.children.forEach(mesh => {
        mesh.rotation.z += delta * mesh.userData.speed;
        mesh.rotation.x += delta * 0.12;
        mesh.position.y = mesh.userData.baseY + Math.sin(time * 0.00055 + mesh.userData.phase) * 0.18;
      });
      group.rotation.z = Math.sin(time * 0.00012) * 0.035;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }

  wait(() => window.gsap && window.THREE && window.boardEl, () => {
    installGsapAnimations();
    installThreeScene();
  });
})();