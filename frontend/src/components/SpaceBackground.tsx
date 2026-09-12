import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function SpaceBackground() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    
    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 3000);
    camera.position.z = 400;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // 4. Create a Soft Glowing Circle Texture
    const createStarTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const context = canvas.getContext('2d');
      if (context) {
        const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
        gradient.addColorStop(0.5, 'rgba(255,255,255,0.2)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 32, 32);
      }
      return new THREE.CanvasTexture(canvas);
    };

    // 5. Particles Setup
    const starCount = 8000; // 🔹 Ginti double kar di (4000 -> 8000)
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const velocities = new Float32Array(starCount);

    const spaceColors = [
      new THREE.Color(0x00b4d8), // Cyan
      new THREE.Color(0x7b2cbf), // Deep Purple
      new THREE.Color(0xff006e), // Neon Pink
      new THREE.Color(0x0077b6), // Deep Blue
      new THREE.Color(0xffd60a), // Star Gold
      new THREE.Color(0xffffff)  // Pure White
    ];

    for (let i = 0; i < starCount; i++) {
      // 🔹 Space ka area thoda bada kiya taaki particles ache se faile rahein
      positions[i * 3] = (Math.random() - 0.5) * 2500;     // x
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2500; // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2500; // z

      velocities[i] = 0.5 + Math.random() * 2;

      const color = spaceColors[Math.floor(Math.random() * spaceColors.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // 6. Material with Glow
    const material = new THREE.PointsMaterial({
      size: 7, // 🔹 Size increase kar diya (4 -> 7) for better visibility & glow
      vertexColors: true,
      map: createStarTexture(),
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending, 
      depthWrite: false 
    });

    const stars = new THREE.Points(geometry, material);
    scene.add(stars);

    // 7. Animation loop
    const animate = () => {
      const positionsArray = geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < starCount; i++) {
        positionsArray[i * 3 + 2] += velocities[i];
        
        if (positionsArray[i * 3 + 2] > 500) {
          positionsArray[i * 3 + 2] = -2000; // 🔹 Peche se aane ka depth bada diya
          positionsArray[i * 3] = (Math.random() - 0.5) * 2500;
          positionsArray[i * 3 + 1] = (Math.random() - 0.5) * 2500;
        }
      }
      
      geometry.attributes.position.needsUpdate = true;
      
      stars.rotation.y += 0.0005;
      stars.rotation.x += 0.0002;
      stars.rotation.z += 0.0001;

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      className="fixed inset-0 z-0 pointer-events-none transition-opacity duration-1000 opacity-60 dark:opacity-100"
      style={{
        background: 'radial-gradient(circle at bottom center, rgba(30,27,75,0.8) 0%, rgba(5,5,15,1) 100%)'
      }}
    />
  );
}