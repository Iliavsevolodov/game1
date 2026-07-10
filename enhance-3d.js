(() => {
  const wait = (test, done, attempts = 100) => {
    if (test()) return done();
    if (attempts <= 0) return;
    setTimeout(() => wait(test, done, attempts - 1), 100);
  };

  function installGsapAnimationUpgrade() {
    if (!window.gsap || !window.NutSort) return;

    const api = window.NutSort;
    const { gsap } = window;

    api.animateTransfer = function animateTransferWithGsap(colors, fromRects, toRects, meta) {
      const fromTubeRect = api.getTubeElement(meta.fromIndex)?.getBoundingClientRect();
      const toTubeRect = api.getTubeElement(meta.toIndex)?.getBoundingClientRect();

      if (!fromTubeRect || !toTubeRect) {
        return api.fallbackFly(colors, fromRects, toRects, meta);
      }

      return Promise.all(colors.map((colorIndex, i) => new Promise(resolve => {
        const from = fromRects[i];
        const to = toRects[i];
        if (!from || !to) return resolve();

        const clone = document.createElement('div');
        clone.className = 'nut fly';
        clone.style.setProperty('--c', api.COLORS[colorIndex]);
        clone.style.left = `${from.left}px`;
        clone.style.top = `${from.top}px`;
        clone.style.width = `${from.width}px`;
        clone.style.height = `${from.height}px`;
        document.body.appendChild(clone);

        const dx = to.left - from.left;
        const dy = to.top - from.top;
        const sourceTopY = fromTubeRect.top + 8 - from.top;
        const targetTopY = toTubeRect.top + 8 - from.top;
        const direction = dx >= 0 ? 1 : -1;
        const fullTurns = direction * (1080 + i * 120);
        const settleTurns = fullTurns + direction * 180;

        gsap.set(clone, {
          x: 0,
          y: 0,
          rotation: 0,
          scale: 1,
          transformPerspective: 800,
          transformOrigin: '50% 50%'
        });

        const tl = gsap.timeline({
          delay: i * 0.045,
          defaults: { overwrite: true },
          onComplete: () => {
            clone.remove();
            resolve();
          }
        });

        tl.to(clone, {
          duration: 0.24,
          y: sourceTopY,
          scale: 1.08,
          rotation: fullTurns * 0.32,
          ease: 'power2.out'
        })
        .to(clone, {
          duration: 0.34,
          x: dx,
          y: targetTopY,
          scale: 1.11,
          rotation: fullTurns,
          ease: 'none'
        })
        .to(clone, {
          duration: 0.20,
          y: targetTopY + (dy - targetTopY) * 0.48,
          scale: 1.04,
          rotation: fullTurns + direction * 220,
          ease: 'power1.in'
        })
        .to(clone, {
          duration: 0.20,
          y: dy,
          scale: 1,
          rotation: settleTurns,
          ease: 'back.out(1.1)'
        });
      })));
    };

    api.pulseTube = function pulseTubeWithGsap(index) {
      const tube = api.getTubeElement(index);
      if (!tube) return;
      gsap.fromTo(tube,
        { y: -2, scale: 1.02, filter: 'brightness(1)' },
        { y: -5, scale: 1.05, filter: 'brightness(1.1)', duration: 0.24, yoyo: true, repeat: 1, ease: 'sine.inOut' }
      );
    };

    const nativeSetHint = api.setHint.bind(api);
    api.setHint = message => {
      nativeSetHint(message);
      gsap.fromTo(api.hintline,
        { opacity: 0.76, scale: 0.986 },
        { opacity: 1, scale: 1, duration: 0.32, ease: 'power2.out', overwrite: true }
      );
    };

    const nativeShowWin = api.showWin.bind(api);
    api.showWin = () => {
      nativeShowWin();
      const box = document.querySelector('.modal-box');
      if (!box) return;
      gsap.fromTo(box,
        { opacity: 0, y: 28, scale: 0.88, rotationX: -10 },
        { opacity: 1, y: 0, scale: 1, rotationX: 0, duration: 0.64, ease: 'back.out(1.5)' }
      );
    };
  }

  function installThreeDecor() {
    if (!window.THREE) return;

    const card = document.querySelector('.card');
    const boardWrap = document.querySelector('.board-wrap');
    if (!card || !boardWrap || document.getElementById('threeLayer')) return;

    const host = document.createElement('div');
    host.id = 'threeLayer';
    host.setAttribute('aria-hidden', 'true');
    Object.assign(host.style, {
      position: 'absolute',
      inset: '0',
      pointerEvents: 'none',
      zIndex: '1',
      opacity: '0.78',
      mixBlendMode: 'screen'
    });
    card.prepend(host);
    boardWrap.style.position = 'relative';
    boardWrap.style.zIndex = '2';

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(0, 0, 9.5);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    host.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1.4));

    const key = new THREE.DirectionalLight(0xffffff, 2.6);
    key.position.set(3.5, 4.5, 6);
    scene.add(key);

    const rim = new THREE.PointLight(0x51d7ff, 13, 20);
    rim.position.set(-4, 1, 5);
    scene.add(rim);

    const warm = new THREE.PointLight(0xffd44d, 10, 18);
    warm.position.set(4, -2, 4);
    scene.add(warm);

    const group = new THREE.Group();
    scene.add(group);

    const sparkleGroup = new THREE.Group();
    scene.add(sparkleGroup);

    function createNutMesh(color) {
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
      hole.absarc(0, 0, 0.27, 0, Math.PI * 2, true);
      shape.holes.push(hole);

      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: 0.26,
        bevelEnabled: true,
        bevelSegments: 3,
        steps: 1,
        bevelSize: 0.08,
        bevelThickness: 0.06
      });
      geometry.center();

      const material = new THREE.MeshStandardMaterial({
        color,
        metalness: 0.52,
        roughness: 0.2,
        transparent: true,
        opacity: 0.86,
        emissive: color,
        emissiveIntensity: 0.08
      });

      return new THREE.Mesh(geometry, material);
    }

    const palette = [0x31df74, 0x9b69ff, 0xff605b, 0x39d6ff, 0xffd44d];
    for (let i = 0; i < 8; i++) {
      const mesh = createNutMesh(palette[i % palette.length]);
      mesh.position.set((i % 4 - 1.5) * 2.35, (Math.floor(i / 4) - 0.5) * 3.2, -1.6 - (i % 2) * 0.4);
      mesh.rotation.set(0.9, 0.24, i * 0.35);
      mesh.scale.setScalar(0.72 + (i % 3) * 0.08);
      mesh.userData = {
        baseY: mesh.position.y,
        speed: 0.35 + i * 0.05,
        phase: i * 0.75
      };
      group.add(mesh);
    }

    const sparkleGeometry = new THREE.SphereGeometry(0.06, 10, 10);
    for (let i = 0; i < 22; i++) {
      const material = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xffffff : 0xffd44d,
        transparent: true,
        opacity: 0.68
      });
      const particle = new THREE.Mesh(sparkleGeometry, material);
      particle.position.set((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 7, -2.8 - Math.random());
      particle.userData = {
        baseX: particle.position.x,
        baseY: particle.position.y,
        phase: Math.random() * Math.PI * 2,
        speed: 0.4 + Math.random() * 0.6
      };
      sparkleGroup.add(particle);
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
        mesh.rotation.x += delta * 0.16;
        mesh.position.y = mesh.userData.baseY + Math.sin(time * 0.0006 + mesh.userData.phase) * 0.18;
      });

      sparkleGroup.children.forEach(particle => {
        particle.position.y = particle.userData.baseY + Math.sin(time * 0.001 * particle.userData.speed + particle.userData.phase) * 0.16;
        particle.position.x = particle.userData.baseX + Math.cos(time * 0.00085 * particle.userData.speed + particle.userData.phase) * 0.08;
        particle.material.opacity = 0.25 + (Math.sin(time * 0.002 + particle.userData.phase) + 1) * 0.22;
      });

      group.rotation.z = Math.sin(time * 0.00016) * 0.03;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  wait(() => window.NutSort, () => {
    installGsapAnimationUpgrade();
    installThreeDecor();
  });
})();