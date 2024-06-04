async function fetchSongs() {
let songs = await fetch("playList.json");
let response = await songs.json();
    let song = new Audio(response.playLists.playList_1.songs.song_1);
    document.body.addEventListener('click', ()=> {
        song.play();
    })
}

fetchSongs()