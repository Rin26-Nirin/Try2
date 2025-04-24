document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('reveal-btn');
  const resetBtn = document.getElementById('reset-btn');
  const img = document.getElementById('character-img');
  const canvas1 = document.getElementById('canvas1');
  const canvas2 = document.getElementById('canvas2');
  const images = [
    'https://i.pinimg.com/736x/5d/9c/1b/5d9c1baf737a98435be4d841ae002381.jpg',
    'https://i.pinimg.com/736x/4a/9d/1b/4a9d1b42f029b1f015d0994040c92f9b.jpg',
    'https://i.pinimg.com/736x/f1/61/fd/f161fd35f9876e48249bc8fa921f646a.jpg',
    'https://i.pinimg.com/736x/42/79/f7/4279f797ffecfc40da7bf09aad023da4.jpg',
    'https://i.pinimg.com/736x/67/76/53/67765303398140f138ea920d1b644c55.jpg',
    'https://i.pinimg.com/474x/ce/04/a6/ce04a661085ce8fb71125e7d2d07ba18.jpg'
  ];

  let isDrawing = false;
  let ctx1, ctx2;
  let stage = 1;

  btn.addEventListener('click', () => {
    let usedCharacters = JSON.parse(localStorage.getItem('usedCharacters')) || [];
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
    img.style.display = "block";

    canvas1.style.display = "block";
    canvas2.style.display = "block";
    ctx1 = setupCanvas(canvas1, '#bbb');
    ctx2 = setupCanvas(canvas2, '#888');
    stage = 1;
  });

  resetBtn.addEventListener('click', () => {
    localStorage.removeItem('usedCharacters');
    alert('รีเซ็ตตัวละครทั้งหมดแล้ว');
  });

  function setupCanvas(canvas, fillColor = '#ccc') {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = fillColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return ctx;
  }

  [canvas1, canvas2].forEach((canvas, i) => {
    canvas.addEventListener('mousedown', () => isDrawing = true);
    canvas.addEventListener('mouseup', () => isDrawing = false);
    canvas.addEventListener('mousemove', e => {
      if (stage !== i + 1 || !isDrawing) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const ctx = i === 0 ? ctx1 : ctx2;
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 20, 0, Math.PI * 2);
      ctx.fill();

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let cleared = 0;
      for (let j = 3; j < imageData.data.length; j += 4) {
        if (imageData.data[j] < 128) cleared++;
      }

      const clearedPercent = cleared / (canvas.width * canvas.height) * 100;
      if (clearedPercent > 50 && stage === i + 1) {
        stage++;
        if (stage === 3) {
          alert("คุณได้ตัวละครนี้แล้ว!");
        }
      }
    });
  });
});
