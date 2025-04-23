document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('reveal-btn');
  const img = document.getElementById('character-img');
  const canvas1 = document.getElementById('canvas1');
  const canvas2 = document.getElementById('canvas2');
  const container = document.getElementById('scratch-container');
  const stopMusicBtn = document.getElementById('stop-music-btn');

  const images = [
    'https://i.pinimg.com/736x/5d/9c/1b/5d9c1baf737a98435be4d841ae002381.jpg',
    'https://i.pinimg.com/736x/4a/9d/1b/4a9d1b42f029b1f015d0994040c92f9b.jpg',
    'https://i.pinimg.com/736x/f1/61/fd/f161fd35f9876e48249bc8fa921f646a.jpg',
    'https://i.pinimg.com/736x/42/79/f7/4279f797ffecfc40da7bf09aad023da4.jpg',
    'https://i.pinimg.com/736x/67/76/53/67765303398140f138ea920d1b644c55.jpg',
    'https://i.pinimg.com/474x/ce/04/a6/ce04a661085ce8fb71125e7d2d07ba18.jpg'
  ];

  let audioContext;
  let bgMusicSource = null;
  
  // เพิ่มฟังก์ชันอื่นๆ ที่จำเป็น

  // ปุ่มหยุดเพลง
  stopMusicBtn.addEventListener('click', stopBackgroundMusic);

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

  function stopBackgroundMusic() {
    if (bgMusicSource) {
      bgMusicSource.stop();
      bgMusicSource.disconnect();
      bgMusicSource = null;
    }
  }

  function loadSounds() {
    // โหลดเสียงต่างๆ
  }

  function playBackgroundMusic() {
    // เล่นเพลงพื้นหลัง
  }
});
