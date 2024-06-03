// Fetching song folder / Playlist.
async function fetchFolders() {
    let fetchFolder = await fetch("/songs");
    let response = await fetchFolder.text();
    let div = document.createElement('div');
    div.innerHTML = response;
    let folders = [];
    let anchorTags = div.getElementsByTagName('a');
    for (const anchorTag of anchorTags) {
        if (anchorTag.href.includes("/songs/") && !anchorTag.href.includes('.htaccess')) {
            folders.push(anchorTag.href.split('/')[anchorTag.href.split('/').length - 1]);
        }
    }
    return folders;
}

// Fetching all mp3 file from the server.
async function fetchSongs(folderName) {
    let fetchedFile = await fetch(`${folderName}`);
    let response = await fetchedFile.text();
    let div = document.createElement('div');
    div.innerHTML = response;
    let songs = [];
    let anchorTags = div.getElementsByTagName('a');
    for (const anchorTag of anchorTags) {
        if (anchorTag.href.endsWith(".mp3")) {
            songs.push(anchorTag.href);
        }
    }
    return songs;
}

// Playing audio.
function playSong(url) {
    currentSong.src = url;
    currentSong.play();
}

// let's update time of the audio.
let tenthsPlace = 0, unitPlace = 0, minutePlace = 0;
let currentTime = document.querySelector('.time');
function timeUpdate() {
    interval = setInterval(() => {
        minutePlace = ((parseInt(currentSong.currentTime) - (parseInt(currentSong.currentTime) % 60)) / 60);
        unitPlace = (parseInt(currentSong.currentTime) - minutePlace * 60) % 10;
        tenthsPlace = ((parseInt(currentSong.currentTime) - unitPlace) - minutePlace * 60) / 10;

        currentTime.innerHTML = `<div class="current-time">
                                    <span>${minutePlace}</span>
                                    <span>:</span>
                                    <span>${tenthsPlace}${unitPlace}</span>
                                </div>
                                <div style="transform: scale(1.6);" class="separator">
                                    <span style="font-weight: 900">/</span>
                                </div>
                                <div class="duration">
                                    <span>${((currentSong.duration) - (currentSong.duration) % 60) / 60}</span>
                                    <span>:</span>
                                    <span>${parseInt((currentSong.duration)) % 60}</span>
                                </div>`;
    }, 1000);
}

// Adding event listener to seekBar ball.
let timeOver = document.querySelector('.time-over');
function updateSeekBar() {
    interval_1 = setInterval(() => {
        timeOver.style.width = `${(currentSong.currentTime / currentSong.duration) * 100}%`;
        if (currentSong.currentTime == currentSong.duration) {
            togglePlayState();
        }
        else if (currentSong.paused) {
            playPauseBtn.querySelector('img').src = "imgs/play.svg";
        }
        else {
            playPauseBtn.querySelector('img').src = "imgs/pause.svg";
        }
    }, 200);
}


// PlayPause Function
let playPauseBtn = document.querySelector('.play-pause');
function togglePlayState() {
    if (currentSong.currentTime == currentSong.duration) {
        playPauseBtn.querySelector('img').src = "imgs/play.svg";
        clearInterval(interval);
        clearInterval(interval_1);
        return;
    }
    if (currentSong.paused && currentSong.src != "") {
        currentSong.play();
        playPauseBtn.querySelector('img').src = "imgs/pause.svg";
        playPauseBtn.getAttribute('title', "Play");
        timeUpdate();
        updateSeekBar();
    }
    else if (!currentSong.paused) {
        currentSong.pause();
        playPauseBtn.querySelector('img').src = "imgs/play.svg";
        playPauseBtn.getAttribute('title', "Pause");
        clearInterval(interval);
        clearInterval(interval_1);
    }

}

// Adding event listener to seekBar line.
let line = document.querySelector('.line');
line.addEventListener('click', (e) => {
    if (currentSong.src != "") {
        currentSong.currentTime = `${(e.offsetX / e.currentTarget.getBoundingClientRect().width) * currentSong.duration}`;
    }
})

// Inserting all the songs in the songs container.
async function insertSongs(folderName) {
    songs = await fetchSongs(folderName);
    songs.forEach((song) => {
        let songRow = document.createElement('div');
        songRow.innerHTML = `<div class="m-icon-s-name flex align-center">
                                <div class="music-icon flex">
                                    <img class="invert select-none" src="imgs/music.svg" alt="">
                                </div>
                                <div class="song-name">
                                    <span>${song.split('/')[song.split('/').length - 1].replaceAll("%20", ' ').replace(".mp3", '')}</span>
                                </div>
                            </div>
                            <div class="play-icon flex align-center">
                                <span>play</span>
                                <img class="invert select-none" src="imgs/play.svg" alt="">
                            </div>`;
        songRow.classList = "song flex align-center space-between";
        document.querySelector('.song-container').insertAdjacentElement('beforeend', songRow);
        let button = songRow.querySelector('.play-icon');
        button.addEventListener('click', () => {
            if (previousButton != null) {
                previousButton.querySelector('span').innerHTML = 'play';
                previousButton.querySelector('img').src = "imgs/play.svg";
                previousButton.style.backgroundColor = '';
            }

            let butParent = button.parentElement.querySelector('.m-icon-s-name .song-name span');
            let file = butParent.innerHTML + ".mp3";
            document.querySelector('.pc-song-name span').innerHTML = butParent.innerHTML;
            playSong(`${folderName}/${file}`);
            button.querySelector('span').innerHTML = 'pause';
            button.querySelector('img').src = "imgs/pause.svg";
            button.style.backgroundColor = 'rgb(43, 107, 22)';
            previousButton = button;
            document.querySelector('.play-pause img').src = "imgs/pause.svg";
            tenthsPlace = unitPlace = minutePlace = 0;
            timeUpdate();
            updateSeekBar();
            let notAllowedBtn = [playPauseBtn, nextSong, previousSong, volume, line];
            notAllowedBtn.forEach(btn => {
                btn.style.cursor = "pointer";
            })
            currentSong.volume = parseInt(document.querySelector('.range > div input').value) / 100;
        })
    });
    if (songs.length == 0) {
        document.querySelector('.song-container').insertAdjacentHTML('beforeend', `<div class="no-songs">
                                                                                    <h2 style="padding: 20px 10px; color: red;">Zero Files Found</h2>
                                                                                    </div>`)
    }
}


// Driver Function of the program.
async function driver() {
    let folders = await fetchFolders();
    folders.forEach(async (folder) => {
        let infoJson = await fetch(`/songs/${folder}/info.json`);
        let iJResponse = await infoJson.json();
        let playlistInfo = iJResponse;
        let folderBox = document.createElement('div');
        folderBox.innerHTML = `<div style="background: url('/songs/${folder}/thumbnail.jpg'); background-repeat: no-repeat; background-position: center center; background-size: cover;" class="image flex">
                                    </div>
                                    <div class="title">
                                        <h3>${playlistInfo.title}</h3>
                                    </div>
                                    <div class="description">
                                        <span>${playlistInfo.description}</span>
                                    </div>`;
        folderBox.classList = "playlist br-10";
        folderBox.dataset.folder = `${folder}`
        document.querySelector('.playlists').insertAdjacentElement('beforeend', folderBox);

        // Adding event listener to change song playlist.
        folderBox.addEventListener('click', () => {
            document.querySelector('.song-container').innerHTML = "";
            let playlist_name = `<div class="active-playlist-name">
                                <h2>${playlistInfo.title}</h3>
                                </div>`
            document.querySelector('.song-container').insertAdjacentHTML("beforeend", playlist_name)
            insertSongs(`/songs/${folderBox.dataset.folder}`);
            currentSong.src = "";
            clearInterval(interval);
            clearInterval(interval_1);
        })
    });

    // Adding event listener to play/pause button.
    playPauseBtn.addEventListener('click', togglePlayState);

    //Adding event listener to previous button.
    previousSong.addEventListener('click', () => {
        for (const key in songs) {
            const element = songs[key];
            if (currentSong.src == element) {
                if (songs.indexOf(element) > 0) {
                    if (songs.indexOf(element) == 1) {
                        previousSong.style.cursor = "not-allowed";
                    }
                    if (!currentSong.paused) {
                        playSong(songs[parseInt(key) - 1]);
                    }
                    else {
                        currentSong.src = songs[parseInt(key) - 1];
                    }
                    break;
                }
                else {
                    alert('No more previous songs');
                }
            }
        }
    })


    //Adding event listener to next button.
    nextSong.addEventListener('click', () => {
        for (const key in songs) {
            const element = songs[key];
            if (currentSong.src == element) {
                if (songs.indexOf(element) < songs.length - 1) {
                    if (songs.indexOf(element) == songs.length - 2) {
                        nextSong.style.cursor = "not-allowed";
                    }
                    if (!currentSong.paused) {
                        playSong(songs[parseInt(key) + 1]);
                    }
                    else {
                        currentSong.src = songs[parseInt(key) + 1];
                    }
                    break;
                }
                else {
                    alert('No more new songs');
                }
            }
        }
    })

    // Adding event listener to volume.
    volume.addEventListener('click', () => {
        let volumeIcon = volume.querySelector('img');
        if (volumeIcon.src.split('/')[volumeIcon.src.split('/').length - 1] === 'volume.svg' && volume.style.cursor == "pointer") {
            volume.querySelector('img').src = "imgs/mute.svg";
            currentSong.volume = 0;
        }
        else if (volume.style.cursor == "pointer") {
            volume.querySelector('img').src = "imgs/volume.svg";
            currentSong.volume = parseInt(document.querySelector('.range > div input').value) / 100;
        }
        if (volume.style.cursor == "pointer") {
            if (timeout != "undefined") {
                clearTimeout(timeout);
            }
            volume_value.innerHTML = `${parseInt(currentSong.volume * 100)}` + '%';
            volume_value.style.transform = 'scale(1, 1)';
            timeout = setTimeout(() => {
                volume_value.style.transform = 'scale(0, 0)';
            }, 3000);
        }
    })

    // Adding event listener on volume seekBar

    volume_range.addEventListener('change', () => {
        currentSong.volume = parseInt(volume_range.value) / 100;
        if (volume.style.cursor == "pointer") {
            if (parseInt(currentSong.volume * 100) > 75) {
                volume_value.style.backgroundColor = "#aa0000";
                volume_value.style.color = "white";
                document.querySelector('.range > div').style.backgroundColor = "#aa000090";
            }
            else {
                volume_value.style.backgroundColor = "#009100";
                volume_value.style.color = "black";
                document.querySelector('.range > div').style.backgroundColor = "#00910090";
            }
            if (timeout != "undefined") {
                clearTimeout(timeout);
            }
            volume_value.innerHTML = `${parseInt(currentSong.volume * 100)}` + '%';
            volume_value.style.transform = 'scale(1, 1)';
            timeout = setTimeout(() => {
                volume_value.style.transform = 'scale(0, 0)';
            }, 3000);
        }
        if (volume_range.value == "0") {
            volume.querySelector('img').src = 'imgs/mute.svg'
        }
        else {
            volume.querySelector('img').src = 'imgs/volume.svg'
        }
    })

    // Adding event listener on hamburger to show songs container.
    hamburger.addEventListener('click', () => {
        document.querySelector('.spotify-left').classList.add('left-hide-vis');
        setTimeout(() => {
            document.querySelector('.hide-left').style.opacity = "1";
        }, 320);
    })

    // Adding event listener on hamburger to hide songs container.
    close.addEventListener('click', () => {
        document.querySelector('.spotify-left').classList.remove('left-hide-vis');
        close.style.opacity = "0";
    })

    // Adding controls using keyboard.
    document.addEventListener('keydown', (key) => {
        if (key.key === " " || key.key === "MediaPlayPause") {
            togglePlayState()
        }
        else if (key.key === "ArrowRight" && currentSong.currentTime <= currentSong.duration - 10) {
            currentSong.currentTime += 5;
        }
        else if (key.key === "ArrowLeft" && currentSong.currentTime >= 10) {
            currentSong.currentTime -= 5;
        }
    })
}
let songs;
let previousButton = null;
let previousSong = document.querySelector('.previous-song');
let nextSong = document.querySelector('.next-song');
let volume = document.querySelector('.volume-icon');
let volume_range = document.querySelector('.range > div input');
let volume_value = document.querySelector('.volume-value');
let hamburger = document.querySelector('.hamburger');
let close = document.querySelector('.hide-left');

let interval; // Interval for current time.
let interval_1; // Interval for seekBar.
let timeout; // Timeout for volume value.
let currentSong = new Audio()
playSong('songs/hamd/allah%20hu%20allah%20hu%20_%20laiba%20fatima%20_%20new%20hamd%202021-22%20-%2072%20stars%20production.mp3');
let folderName;
driver()
