document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('reveal-btn');
  const img = document.getElementById('character-img');
  const canvas1 = document.getElementById('canvas1');
  const canvas2 = document.getElementById('canvas2');
  const container = document.getElementById('scratch-container');
  const stopMusicBtn = document.getElementById('stop-music-btn');

  let audioContext;
  let scratchBuffer, successBuffer, bgMusicBuffer;
  let scratchSource = null;
  let bgMusicSource = null;

  // ฟังก์ชันหยุดเพลงพื้นหลัง
  function stopBackgroundMusic() {
    if (bgMusicSource) {
      bgMusicSource.stop();
      bgMusicSource.disconnect();
      bgMusicSource = null;
    }
  }

  // ฟังก์ชันโหลดเสียง
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

  // ฟังก์ชันเล่นเพลงพื้นหลัง
  function playBackgroundMusic() {
    if (!bgMusicBuffer || bgMusicSource) return;
    bgMusicSource = audioContext.createBufferSource();
    bgMusicSource.buffer = bgMusicBuffer;
    bgMusicSource.loop = true;
    bgMusicSource.connect(audioContext.destination);
    bgMusicSource.start(0);
  }

  // เมื่อกดปุ่มเริ่มเกม
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

  // ปุ่มหยุดเพลง
  stopMusicBtn.addEventListener('click', stopBackgroundMusic);
});
