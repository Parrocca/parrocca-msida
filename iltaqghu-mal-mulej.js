let photos = [];
let currentPhoto = 0;

const GITHUB_API = 'https://api.github.com/repos/Parrocca/parrocca-msida/contents';
const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif)$/i;

function niceCaption(filename) {
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/^iltaqghu-/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

async function loadGallery() {
  const grid = document.getElementById('photo-grid');
  try {
    const response = await fetch(GITHUB_API, {
      headers: { 'Accept': 'application/vnd.github+json' },
      cache: 'no-store'
    });
    if (!response.ok) throw new Error('Ma setgħux jinqraw ir-ritratti.');

    const files = await response.json();
    const galleryFiles = files.filter(item =>
      item.type === 'file' && IMAGE_EXTENSIONS.test(item.name) && /^iltaqghu-/i.test(item.name)
    );

    // Sib id-data tal-aħħar upload/tibdil għal kull ritratt.
    // B'hekk l-aktar ritratt li ttella' reċentement jidher l-ewwel.
    const datedFiles = await Promise.all(galleryFiles.map(async item => {
      try {
        const commitsUrl = `https://api.github.com/repos/Parrocca/parrocca-msida/commits?path=${encodeURIComponent(item.name)}&per_page=1`;
        const commitResponse = await fetch(commitsUrl, {
          headers: { 'Accept': 'application/vnd.github+json' },
          cache: 'no-store'
        });
        if (!commitResponse.ok) throw new Error('Commit date unavailable');
        const commits = await commitResponse.json();
        const uploadedAt = commits[0]?.commit?.committer?.date || commits[0]?.commit?.author?.date || '';
        return { ...item, uploadedAt };
      } catch (error) {
        return { ...item, uploadedAt: '' };
      }
    }));

    photos = datedFiles
      .sort((a, b) => {
        const byDate = (Date.parse(b.uploadedAt) || 0) - (Date.parse(a.uploadedAt) || 0);
        if (byDate) return byDate;
        return b.name.localeCompare(a.name, 'mt', { numeric: true });
      })
      .map(item => ({ file: item.download_url, caption: niceCaption(item.name) }));

    if (!photos.length) {
      grid.innerHTML = '<p>Għad m’hemmx ritratti f’din il-gallerija.</p>';
      return;
    }

    grid.innerHTML = photos.map((photo, index) => `
      <button class="photo-card" type="button" data-index="${index}" aria-label="${photo.caption}">
        <img src="${photo.file}" alt="${photo.caption}" loading="lazy">
      </button>`).join('');

    grid.addEventListener('click', event => {
      const button = event.target.closest('.photo-card');
      if (button) openPhoto(Number(button.dataset.index));
    });
  } catch (error) {
    grid.innerHTML = '<p>Il-gallerija ma setgħetx titgħabba bħalissa. Erġa’ pprova aktar tard.</p>';
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
