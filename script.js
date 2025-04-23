document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('reveal-btn');
  const img = document.getElementById('character-img');
  const canvas1 = document.getElementById('canvas1');
  const canvas2 = document.getElementById('canvas2');
  const container = document.getElementById('scratch-container');

  const images = [
    'https://i.pinimg.com/736x/5d/9c/1b/5d9c1baf737a98435be4d841ae002381.jpg',
    'https://i.pinimg.com/736x/4a/9d/1b/4a9d1b42f029b1f015d0994040c92f9b.jpg',
    'https://i.pinimg.com/736x/f1/61/fd/f161fd35f9876e48249bc8fa921f646a.jpg',
    'https://i.pinimg.com/736x/42/79/f7/4279f797ffecfc40da7bf09aad023da4.jpg',
    'https://i.pinimg.com/736x/67/76/53/67765303398140f138ea920d1b644c55.jpg',
    'https://i.pinimg.com/474x/ce/04/a6/ce04a661085ce8fb71125e7d2d07ba18.jpg'
  ];

  let ctx1, ctx2;
  let isDrawing = false;
  let stage = 1;

  let audioContext;
  let scratchBuffer, successBuffer, bgMusicBuffer;
  let scratchSource = null;
  let bgMusicSource = null;

  async function loadSounds() {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      const scratchResponse = await fetch('sound/scratch.mp3');
      const scratchArrayBuffer = await scratchResponse.arrayBuffer();
      scratchBuffer = await audioContext.decodeAudioData(scratchArrayBuffer);

      const successResponse = await fetch('sound/success.wav');
      const successArrayBuffer = await successResponse.arrayBuffer();
      successBuffer = await audioContext.decodeAudioData(successArrayBuffer);

      const bgMusicResponse = await fetch('sound/background-music.mp3');
      const bgMusicArrayBuffer = await bgMusicResponse.arrayBuffer();
      bgMusicBuffer = await audioContext.decodeAudioData(bgMusicArrayBuffer);
    } catch (err) {
      console.error("โหลดเสียงไม่สำเร็จ:", err);
    }
  }

  function playBackgroundMusic() {
    if (!bgMusicBuffer || bgMusicSource) return;
    bgMusicSource = audioContext.createBufferSource();
    bgMusicSource.buffer = bgMusicBuffer;
    bgMusicSource.loop = true;
    bgMusicSource.connect(audioContext.destination);
    bgMusicSource.start(0);
  }

  function stopBackgroundMusic() {
    if (bgMusicSource) {
      bgMusicSource.stop();
      bgMusicSource.disconnect();
      bgMusicSource = null;
    }
  }

  function playScratchLoop() {
    if (!scratchBuffer || scratchSource) return;
    scratchSource = audioContext.createBufferSource();
    scratchSource.buffer = scratchBuffer;
    scratchSource.loop = true;
    scratchSource.connect(audioContext.destination);
    scratchSource.start(0);
  }

  function stopScratchSound() {
    if (scratchSource) {
      scratchSource.stop();
      scratchSource.disconnect();
      scratchSource = null;
    }
  }

  function setupCanvas(canvas, color) {
    const ctx = canvas.getContext('2d');
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'destination-out';
    canvas.style.display = 'block';
    return ctx;
  }

  function playSuccessSound() {
    if (!successBuffer) return;
    const successSource = audioContext.createBufferSource();
    successSource.buffer = successBuffer;
    successSource.connect(audioContext.destination);
    successSource.start(0);
  }

  function handleScratch(e, canvas, ctx, stageNum) {
    if (!isDrawing) return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;

    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();

    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let cleared = 0;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) cleared++;
    }
    const ratio = cleared / (pixels.length / 4);

    if (stageNum === 1 && ratio > 0.5) {
      canvas1.style.display = 'none';
      stage = 2;
    } else if (stageNum === 2 && ratio > 0.5) {
      canvas2.style.display = 'none';
      stopScratchSound();
      playSuccessSound();
    }
  }

  window.onload = () => {
    localStorage.removeItem('usedCharacters');
  };

  document.getElementById('reset-btn').addEventListener('click', () => {
    localStorage.removeItem('usedCharacters');
    window.location.reload();
  });

  btn.addEventListener('click', async () => {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      await loadSounds(); // โหลดเสียง
      playBackgroundMusic(); // เริ่มเพลงพื้นหลัง
    }
  
    btn.disabled = true;
    let usedCharacters = JSON.parse(localStorage.getItem('usedCharacters')) || [];
    console.log("ค่าที่เก็บใน localStorage ตอนนี้:", usedCharacters);
  
    if (usedCharacters.length >= images.length) {
      alert("ไม่มีตัวละครให้สุ่มแล้วนะ!");
      return;
    }
  
    let randomImg;
    do {
      randomImg = images[Math.floor(Math.random() * images.length)];
    } while (usedCharacters.includes(randomImg));
  
    usedCharacters.push(randomImg);
    localStorage.setItem('usedCharacters', JSON.stringify(usedCharacters));
  
    img.src = randomImg;
  
    img.onload = () => {
      console.log('ภาพโหลดเสร็จแล้ว:', img.src);
      canvas1.style.display = "block";
      canvas2.style.display = "block";
      img.style.display = "block";
      setupCanvas(canvas1);
  
      // เริ่มการขูด
      requestAnimationFrame(() => {
        ctx2 = setupCanvas(canvas2, '#888');
        ctx1 = setupCanvas(canvas1, '#bbb');
        stage = 1;
        console.log('แสดง canvas แล้ว');
  
        ['mousedown', 'touchstart'].forEach(evt => {
          [canvas1, canvas2].forEach(c => c.addEventListener(evt, () => {
            isDrawing = true;
            playScratchLoop();
          }));
        });
  
        ['mouseup', 'touchend'].forEach(evt => {
          [canvas1, canvas2].forEach(c => c.addEventListener(evt, () => {
            isDrawing = false;
            stopScratchSound();
          }));
        });
  
        ['mousemove', 'touchmove'].forEach(evt => {
          [canvas1, canvas2].forEach((c, i) => {
            c.addEventListener(evt, e => {
              if (stage === i + 1) handleScratch(e, c, i === 0 ? ctx1 : ctx2, i + 1);
            });
          });
        });
      });
    };
  
    img.onerror = () => {
      console.error('เกิดข้อผิดพลาดในการโหลดรูปภาพ');
    };
  });
  

  document.getElementById('stop-music-btn').addEventListener('click', stopBackgroundMusic);
});