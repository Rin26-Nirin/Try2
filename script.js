document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('reveal-btn');
  const img = document.getElementById('character-img');
  const canvas1 = document.getElementById('canvas1');
  const canvas2 = document.getElementById('canvas2');
  const stopMusicBtn = document.getElementById('stop-music-btn');
  const images = [
    'https://i.pinimg.com/736x/5d/9c/1b/5d9c1baf737a98435be4d841ae002381.jpg',
    'https://i.pinimg.com/736x/4a/9d/1b/4a9d1b42f029b1f015d0994040c92f9b.jpg',
    'https://i.pinimg.com/736x/f1/61/fd/f161fd35f9876e48249bc8fa921f646a.jpg',
    'https://i.pinimg.com/736x/42/79/f7/4279f797ffecfc40da7bf09aad023da4.jpg',
    'https://i.pinimg.com/736x/67/76/53/67765303398140f138ea920d1b644c55.jpg',
    'https://i.pinimg.com/474x/ce/04/a6/ce04a661085ce8fb71125e7d2d07ba18.jpg'
  ];

  let audioContext, bgMusicBuffer, scratchBuffer, successBuffer;
  let scratchSource, bgMusicSource;
  let isDrawing = false;
  let ctx1, ctx2;
  let stage = 1;

  stopMusicBtn.addEventListener('click', stopBackgroundMusic);

  btn.addEventListener('click', async () => {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      await loadSounds();
      playBackgroundMusic();
    }

    btn.disabled = true;

    let usedCharacters = JSON.parse(localStorage.getItem('usedCharacters')) || [];
    if (usedCharacters.length >= images.length) {
      alert("ไม่มีตัวละครให้สุ่มแล้วนะ!");
      btn.disabled = false;
      return;
    }

    let randomImg;
    do {
      randomImg = images[Math.floor(Math.random() * images.length)];
    } while (usedCharacters.includes(randomImg));

    img.style.display = "none";
    img.src = randomImg;

    img.onload = () => {
      // บันทึกหลังโหลดเสร็จเท่านั้น
      usedCharacters.push(randomImg);
      localStorage.setItem('usedCharacters', JSON.stringify(usedCharacters));

      canvas1.style.display = "block";
      canvas2.style.display = "block";
      setupCanvas(canvas1, '#bbb');
      setupCanvas(canvas2, '#888');

      ctx1 = canvas1.getContext('2d', { willReadFrequently: true });
      ctx2 = canvas2.getContext('2d', { willReadFrequently: true });

      stage = 1;

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
    };

    img.onerror = () => {
      alert("โหลดรูปภาพตัวละครไม่สำเร็จ ลองใหม่อีกครั้งนะ");
      btn.disabled = false;
    };
  });

  function setupCanvas(canvas, fillColor = '#ccc') {
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = fillColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return ctx;
  }

  function handleScratch(e, canvas, ctx, stageNumber) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    if (!isDrawing) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let cleared = 0;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] < 128) cleared++;
    }

    const clearedPercent = cleared / (canvas.width * canvas.height) * 100;
    if (clearedPercent > 50 && stage === stageNumber) {
      stage++;
      if (stage === 3) {
        img.style.display = "block";
        stopScratchSound();
        playSuccessSound();
      }
    }
  }

  async function loadSounds() {
    const bgMusicRes = await fetch('sound/background-music.mp3');
    const scratchRes = await fetch('sound/scratch.mp3');
    const successRes = await fetch('sound/success.wav');

    bgMusicBuffer = await audioContext.decodeAudioData(await bgMusicRes.arrayBuffer());
    scratchBuffer = await audioContext.decodeAudioData(await scratchRes.arrayBuffer());
    successBuffer = await audioContext.decodeAudioData(await successRes.arrayBuffer());
  }

  function playBackgroundMusic() {
    if (!bgMusicBuffer) return;
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

  function playSuccessSound() {
    if (!successBuffer) return;
    const successSource = audioContext.createBufferSource();
    successSource.buffer = successBuffer;
    successSource.connect(audioContext.destination);
    successSource.start(0);
  }
});
