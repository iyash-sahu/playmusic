// ====== Select elements ======
const libraryList = document.querySelector('.library .songList ul');
const playbarSongInfo = document.querySelector('.playbar .song-info #currentSong');
const likeBtn = document.getElementById('likeBtn');
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const repeatBtn = document.getElementById('repeatBtn');
const nowPlayingBtn = document.getElementById('nowPlayingBtn');
const lyricsBtn = document.getElementById('lyricsBtn');
const miniPlayerBtn = document.getElementById('miniPlayerBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const progress = document.getElementById('seek');
const timeDisplay = document.querySelector('.song-time span');
const volumeSlider = document.getElementById('volume');
const volumeIcon = document.getElementById('volumeIcon');
const knob = document.getElementById('volumeKnob');

const audio = new Audio();

// ====== State ======
let currentSongs = [];
let currentSongsData = [];
let currentIndex = -1;
let isLiked = false;
let repeatMode = false;
let shuffleMode = false;

// ====== Helpers ======
function formatTime(s) {
  if (isNaN(s)) return '00:00';
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

function updateHighlight() {
  libraryList.querySelectorAll('li').forEach(li => li.classList.remove('playing'));
  if (currentIndex >= 0) {
    const activeLi = libraryList.children[currentIndex];
    if (activeLi) activeLi.classList.add('playing');
  }
}

function updateSeekbarColor(seek, leftColor, rightColor) {
  const value = seek.value;
  const max = seek.max || 100;
  const percent = (value / max) * 100;
  seek.style.background = `linear-gradient(to right, ${leftColor} 0%, ${leftColor} ${percent}%, ${rightColor} ${percent}%, ${rightColor} 100%)`;
}

// ====== Play song ======
function playMusic(index) {
  if (index < 0 || index >= currentSongs.length) return;

  currentIndex = index;
  audio.src = currentSongs[index];
  audio.play().catch(console.error);

  const songData = currentSongsData[index];
  playbarSongInfo.textContent = `${songData.title} - ${songData.artist}`;
  playBtn.src = "img/pause-circle.svg";
  isLiked = false;
  likeBtn.src = "img/heart1.svg";
  updateHighlight();
  updateSeekbarColor(progress, '#ffb3b3', 'white');
}

// ====== Toggle play/pause ======
function togglePlay() {
  if (!audio.src) {
    // If no song loaded, start first song if available
    if (currentSongs.length > 0) {
      playMusic(0);
    }
    return;
  }

  if (audio.paused) {
    audio.play();
    playBtn.src = "img/pause-circle.svg";
  } else {
    audio.pause();
    playBtn.src = "img/play-circle.svg";
  }
}

// ====== Load playlist dynamically ======
async function loadPlaylist(folder, artist) {
  try {
    const res = await fetch(`${folder}/playlist.json`);
    if (!res.ok) throw new Error(`Cannot load ${folder}/playlist.json`);
    const data = await res.json();
    const songs = data.songs || [];

    currentSongsData = songs.map(song => ({
      file: song,
      title: song.replace(/\.mp3$/, ''),
      artist: artist || "Unknown Artist"
    }));

    currentSongs = currentSongsData.map(song => `${folder}/${encodeURIComponent(song.file)}`);
    currentIndex = -1;
    libraryList.innerHTML = '';

    currentSongsData.forEach((song, i) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <img class="invert" src="img/music.svg" alt="music" />
        <div class="info">
          <div>${song.title}</div>
          <div>${song.artist}</div>
        </div>
        <img src="img/play.svg" alt="play" />
      `;
      li.addEventListener('click', () => playMusic(i));
      libraryList.appendChild(li);
    });
  } catch (err) {
    console.error(err);
    alert('Could not load playlist. Check console.');
  }
}

// ====== Event listeners ======

// Play/pause button
playBtn.addEventListener('click', togglePlay);

// Previous / Next
prevBtn.addEventListener('click', () => {
  if (currentIndex > 0) playMusic(currentIndex - 1);
});
nextBtn.addEventListener('click', () => {
  if (currentIndex < currentSongs.length - 1) playMusic(currentIndex + 1);
});

// Like
likeBtn.addEventListener('click', () => {
  if (!audio.src) return;
  isLiked = !isLiked;
  likeBtn.src = isLiked ? 'img/heart2.svg' : 'img/heart1.svg';
});

// Shuffle / Repeat
shuffleBtn.addEventListener('click', () => {
  shuffleMode = !shuffleMode;
  shuffleBtn.classList.toggle('active', shuffleMode);
});
repeatBtn.addEventListener('click', () => {
  repeatMode = !repeatMode;
  repeatBtn.classList.toggle('active', repeatMode);
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  switch (e.code) {
    case 'Space':
      e.preventDefault();
      togglePlay();
      break;
    case 'ArrowRight':
      e.preventDefault();
      if (currentIndex < currentSongs.length - 1) playMusic(currentIndex + 1);
      break;
    case 'ArrowLeft':
      e.preventDefault();
      if (currentIndex > 0) playMusic(currentIndex - 1);
      break;
    case 'ArrowUp':
      e.preventDefault();
      audio.volume = Math.min(1, audio.volume + 0.1);
      volumeSlider.value = audio.volume * 100;
      updateSeekbarColor(volumeSlider, '#474343', 'white');
      break;
    case 'ArrowDown':
      e.preventDefault();
      audio.volume = Math.max(0, audio.volume - 0.1);
      volumeSlider.value = audio.volume * 100;
      updateSeekbarColor(volumeSlider, '#474343', 'white');
      break;
    case 'f':
    case 'F':
      if (audio.src) {
        e.preventDefault();
        audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
      }
      break;
    case 'b':
    case 'B':
      if (audio.src) {
        e.preventDefault();
        audio.currentTime = Math.max(0, audio.currentTime - 10);
      }
      break;
    case 'm':
    case 'M':
      if (audio.src) {
        e.preventDefault();
        audio.muted = !audio.muted;
        volumeIcon.src = audio.muted ? 'img/mute.svg' : 'img/volume.svg';
      }
      break;
  }
});

// Update progress & time
audio.addEventListener('timeupdate', () => {
  if (audio.duration) progress.value = (audio.currentTime / audio.duration) * 100;
  timeDisplay.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
  updateSeekbarColor(progress, '#ffb3b3', 'white');
});

// Seek
progress.addEventListener('input', () => {
  audio.currentTime = (progress.value / 100) * audio.duration;
  updateSeekbarColor(progress, '#ffb3b3', 'white');
});

// Volume
volumeSlider.addEventListener('input', () => {
  audio.volume = volumeSlider.value / 100;
  updateSeekbarColor(volumeSlider, '#474343', 'white');
});

// Mute toggle
volumeIcon.addEventListener('click', () => {
  audio.muted = !audio.muted;
  volumeIcon.src = audio.muted ? 'img/mute.svg' : 'img/volume.svg';
});

// Auto-play next song
audio.addEventListener('ended', () => {
  if (repeatMode) playMusic(currentIndex);
  else if (shuffleMode) playMusic(Math.floor(Math.random() * currentSongs.length));
  else if (currentIndex < currentSongs.length - 1) playMusic(currentIndex + 1);
  else playBtn.src = "img/play-circle.svg";
});

// Initialize gradients
updateSeekbarColor(progress, '#ffb3b3', 'white');
updateSeekbarColor(volumeSlider, '#474343', 'white');

// ====== Volume knob scroll control ======
let volume = 50; // default 0–100
knob.addEventListener('wheel', (e) => {
  e.preventDefault();
  if (e.deltaY < 0 && volume < 100) volume += 5; // scroll up
  if (e.deltaY > 0 && volume > 0) volume -= 5;   // scroll down
  const rotateDeg = (volume / 100) * 270 - 135; // rotate -135° to +135°
  knob.style.transform = `rotate(${rotateDeg}deg)`;
  audio.volume = volume / 100;
  volumeSlider.value = volume;
  updateSeekbarColor(volumeSlider, '#474343', 'white');
});
