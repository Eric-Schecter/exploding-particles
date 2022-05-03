import React, { useRef, useEffect } from 'react';
import styles from './index.module.scss';
import {
  Scene, ShaderMaterial, WebGLRenderer, Points,
  Vector2, TextureLoader, PerspectiveCamera, PlaneBufferGeometry, Clock, Texture,
} from 'three';
import fragment from './shader/fragment.frag';
import vertex from './shader/vertex.vert';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import gsap from 'gsap';

class World {
  private scene: Scene;
  private camera: PerspectiveCamera;
  private timer = 0;
  private renderer: WebGLRenderer;
  private textureLoader = new TextureLoader();
  private clock = new Clock();
  private mat: ShaderMaterial;
  private composer: EffectComposer;
  private bloomPass: UnrealBloomPass;
  private imgs: Texture[] = [];
  private index = 1;
  private first = true;
  constructor(private container: HTMLDivElement) {
    const { offsetWidth: width, offsetHeight: height } = container;
    this.renderer = new WebGLRenderer();
    this.renderer.setClearColor(0x000000);
    this.renderer.setPixelRatio(window.devicePixelRatio || 1);
    this.renderer.setSize(width, height);
    container.append(this.renderer.domElement);

    this.camera = new PerspectiveCamera(70, width / height, 0.1, 1500);
    this.camera.position.set(0, 0, 1500);
    this.scene = new Scene();

    const renderScene = new RenderPass(this.scene, this.camera);

    this.bloomPass = new UnrealBloomPass(new Vector2(width, height), 1.5, 0.4, 0.85);
    this.bloomPass.threshold = 0;
    this.bloomPass.strength = 0;
    this.bloomPass.radius = 0;

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(renderScene);
    this.composer.addPass(this.bloomPass);

    const ratio = 1.745;
    const geo = new PlaneBufferGeometry(480 * ratio, 820 * ratio, 480, 820);
    const imgs = [
      'img/video-01-first.jpg',
      'img/video-01-end.jpg',
      'img/video-02-first.jpg',
      'img/video-02-end.jpg',
      'img/video-03-first.jpg',
      'img/video-03-end.jpg',
    ];
    imgs.forEach((img, index) => this.imgs[index] = this.textureLoader.load(img));

    this.mat = new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uDistortion: { value: 0 },
        uProgress: { value: 0 },
        uTexture1: { value: null },
        uTexture2: { value: null },
      },
      vertexShader: vertex,
      fragmentShader: fragment,
    });
    const points = new Points(geo, this.mat);
    this.scene.add(points);

    window.addEventListener('resize', this.resize);
  }
  private resize = () => {
    const { offsetWidth: width, offsetHeight: height } = this.container;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.composer.setSize(width, height);
    this.camera.updateProjectionMatrix();
  }
  public draw = () => {
    const time = this.clock.getElapsedTime();
    this.mat.uniforms.uTime.value = time;
    this.composer.render();
    this.timer = requestAnimationFrame(this.draw);
  }
  private exchangeImage = () => {
    if (!this.first) {
      this.index = (this.index + 1) % this.imgs.length;
    }
    this.mat.uniforms.uTexture1.value = this.imgs[this.index % this.imgs.length];
    this.mat.uniforms.uTexture2.value = this.imgs[(this.index + 1) % this.imgs.length];
  }
  public play = (cb: () => void) => {
    this.exchangeImage();
    gsap.to(this.mat.uniforms.uDistortion, {
      duration: 2,
      value: 5,
      ease: 'power2.inOut',
      onComplete: () => {
        this.exchangeImage();
        this.first = false;
      }
    })
    gsap.to(this.mat.uniforms.uDistortion, {
      duration: 2,
      value: 0,
      delay: 2,
      ease: 'power2.inOut',
    })
    gsap.to(this.bloomPass, {
      duration: 2,
      strength: 20,
      ease: 'power2.in',
    })
    gsap.to(this.bloomPass, {
      duration: 2,
      strength: 0,
      delay: 2,
      ease: 'power2.out',
      onComplete: () => {
        cb();
      }
    })
    gsap.to(this.mat.uniforms.uProgress, {
      duration: 1,
      delay: 1.5,
      value: 1,
    })
  }
  public dispose = () => {
    cancelAnimationFrame(this.timer);
  }
}

export const App = () => {
  const ref = useRef<HTMLDivElement>(null);
  const refWorld = useRef<World>();
  useEffect(() => {
    if (!ref.current) { return }
    const container = ref.current;
    refWorld.current = new World(container);
    refWorld.current.draw();
    return () => refWorld.current?.dispose();
  }, [ref])

  const refvideo = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = refvideo.current;
    const world = refWorld.current;
    if (!video || !world) {
      return;
    }
    const videos = [
      'media/video-01.mp4',
      'media/video-02.mp4',
      'media/video-03.mp4',
    ];
    let index = 0;
    video.src = videos[index];
    video.addEventListener('ended', () => {
      gsap.to(video, {
        opacity: 0,
        duration: 0.1,
      })
      const cb = () => {
        index++;
        video.src = videos[index % 3];
        video.load();
        video.play();
        video.style.opacity = '1';
      };
      world.play(cb);
    })
  }, [])

  return <div
    ref={ref}
    className={styles.container}
  >
    <video ref={refvideo} className={styles.video} autoPlay muted />
  </div>
}