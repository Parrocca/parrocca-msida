let photos = [];
let currentPhoto = 0;

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}

async function loadGallery() {
  const grid = document.getElementById('photo-grid');
  try {
    const response = await fetch('gallerija.txt', { cache: 'no-store' });
    if (!response.ok) throw new Error('Ma setax jinqara gallerija.txt');
    const text = await response.text();
    photos = text.split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
      .map(line => {
        const [file, ...rest] = line.split('|');
        return { file: file.trim(), caption: (rest.join('|').trim() || 'Ritratt mill-ħajja tal-Parroċċa') };
      });

    grid.innerHTML = photos.map((photo, index) => `
      <button class="photo-card" type="button" data-index="${index}" aria-label="${escapeHtml(photo.caption)}">
        <img src="${escapeHtml(photo.file)}" alt="${escapeHtml(photo.caption)}" loading="lazy">
      </button>`).join('');

    grid.addEventListener('click', event => {
      const button = event.target.closest('.photo-card');
      if (button) openPhoto(Number(button.dataset.index));
    });
  } catch (error) {
    grid.innerHTML = '<p>Il-gallerija ma setgħetx titgħabba bħalissa.</p>';
    console.error(error);
  }
}

function openPhoto(index) {
  if (!photos.length) return;
  currentPhoto = index;
  const box = document.getElementById('lightbox');
  const image = document.getElementById('lightbox-img');
  image.src = photos[currentPhoto].file;
  image.alt = photos[currentPhoto].caption;
  box.classList.add('show');
  box.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function changePhoto(step, event) {
  if (event) event.stopPropagation();
  if (!photos.length) return;
  currentPhoto = (currentPhoto + step + photos.length) % photos.length;
  const image = document.getElementById('lightbox-img');
  image.src = photos[currentPhoto].file;
  image.alt = photos[currentPhoto].caption;
}

function closePhoto(event) {
  if (event && (event.target.id === 'lightbox-img' || event.target.classList.contains('lightbox-prev') || event.target.classList.contains('lightbox-next'))) return;
  const box = document.getElementById('lightbox');
  box.classList.remove('show');
  box.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', event => {
  const box = document.getElementById('lightbox');
  if (!box.classList.contains('show')) return;
  if (event.key === 'Escape') closePhoto();
  if (event.key === 'ArrowLeft') changePhoto(-1);
  if (event.key === 'ArrowRight') changePhoto(1);
});

document.addEventListener('DOMContentLoaded', loadGallery);
