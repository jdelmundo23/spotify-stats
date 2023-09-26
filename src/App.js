import getData from './token.js'
import {useState, useRef} from 'react';

/* User token goes here */
const user = null;

const scopes = [
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'user-library-read',
  'user-top-read'
]

const topTracks = await getData(token,"/me/top/tracks?time_range=medium_term",scopes.join(' '));
console.log(topTracks);

export default function App() {
  return (
    <div className="">
      <SongList songsList={topTracks.items}/>
    </div>
  );
};

function SongList({ songsList }){
  const [activeNum, setActive] = useState(null);
  const [activeSong, setSong] = useState(null);
  const audio = useRef(null);

  function setActiveSongNum(num, preview){
    if(num === activeNum){
      setActive(null);
      setSong(null);
    }
    else{
      setActive(num);
      setSong(preview);
      fadeIn(audio);
    }
  }

  const songs = songsList.map((song, index) => {
    const songNum = index + 1;
    return <Song song={song} songNum={songNum} isActive={songNum === activeNum} onClick={setActiveSongNum}/>;
  });
  return (
    <div className="max-w-4xl flex flex-wrap justify w-10/12 mx-auto my-16 gap-16 justify-between">
      {songs}
      {!activeSong ? <audio ref={audio} src="" autoPlay></audio> : <audio ref={audio} src={activeSong} autoPlay></audio>}
      <button className="text-white"onClick={()=> changeVolume(audio, 1)}>UP</button>
      <button className="text-white"onClick={()=> changeVolume(audio, -1)}>DOWN</button>
      <button className="text-white"onClick={()=> fadeIn(audio)}>Fade in</button>
      <button className="text-white"onClick={()=> fadeOut(audio)}>Fade out</button>
    </div>
  );
}

function Song({ song, songNum, isActive, onClick }){
  const artists = song.artists.map(artist => {
    return <span className="after:content-[',_'] after:text-zinc-500 after:last:content-['']" key={artist.name}><a className="text-zinc-500 hover:text-white hover:underline " key={artist.name} href={artist.external_urls.spotify} target="_blank" rel="noopener noreferrer">{artist.name}</a></span>
  });
  const playButton = isActive ? 
  <>
    <rect width="4.5" height="14" x="23.5" y="13" fill="black"></rect>
    <rect width="4.5" height="14" x="32" y="13" fill="black"></rect>
  </> 
  : 
  <polygon points="25,12 25,28 38,20" fill="black"></polygon>;
  function onPlayButtonClick(){
    onClick(songNum, song.preview_url);
  }
  return (  
    <div className="relative group bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg flex-none basis-64 flex flex-col items-center p-3 h-72 hover:scale-105 transition duration-150">
      <p className="absolute left-2 top-2 text-xl group-hover:text-green-500">{songNum}.</p>
      <button>
        <svg className="absolute right-2 top-2 pointer-events-none active:scale-95 active:transition duration-100" height="50" width="50">
        <circle className="pointer-events-auto cursor-pointer" cx="30" cy="20" r="15" fill="white" onClick={onPlayButtonClick}></circle>
        {playButton}
      </svg></button>
      <img className="group-hover:shadow-2xl mb-2.5 rounded-sm" src={song.album.images[1].url/*album.images[1].url*/} width={150} alt="artist img"></img>
      <h1 className="font-semibold w-9/12 text-center"><a className="hover:text-green-500" href={song.external_urls.spotify} target="_blank" rel="noopener noreferrer">{song.name}</a></h1>
      <p className="text-zinc-400">{getDuration(song.duration_ms)}</p>
      <h2>{artists}</h2>
    </div>
  );
}

// Stateless Functions
function getDuration(ms){
  let seconds = ms / 1000;
  seconds = seconds % Math.floor(seconds) >= 0.8 ? 
  Math.round(seconds) : Math.floor(seconds);
  return Math.floor(seconds / 60) + ':' + (seconds % 60 < 10 ? `0${seconds % 60}` : seconds % 60) ;
}

// function fadeInOut(audio, type){
//   let interval;
//   const volume = audio.current.volume;
//   function fadeIn(start, end){
//     if(start > end){

//     }
//   }
//   function fadeOut(start, end){
//     if(start < end){
      
//     }
//   }
//   if(type === "start"){
//     audio.current.volume = 0;
//     interval = setInterval(toVolume, 50, 0, volume);
//   }
//   if(type === "end"){
//     interval = setInterval(toVolume, 50, volume, 0);
//   }
// }

function fadeIn(audio){
  let interval;
  const volume = audio.current.volume;
  audio.current.volume = 0;
  function raiseVol(){
    if(audio.current.volume >= volume){
      clearInterval(interval);
      interval = null;
    }
    else{
      let num = audio.current.volume + 0.01;
      audio.current.volume = num.toFixed(12);
    }
  }
  interval = setInterval(raiseVol, 15);
}

function fadeOut(audio){
  let interval;
  const volume = audio.current.volume;
  function lowerVol(){
    if(audio.current.volume === 0){
      clearInterval(interval);
      interval = null;
      audio.current.pause();
      audio.current.volume = volume;
    }
    else{
      let num = audio.current.volume - 0.01;
      audio.current.volume = num.toFixed(12);
    }
  }
  interval = setInterval(lowerVol, 10);
}

function changeVolume(audio, direction){
  if(direction === 1 && audio.current.volume <= 0.9){
    audio.current.volume += 0.1;
  }
  if(direction === -1 && audio.current.volume >= 0.1){
    audio.current.volume += -0.1;
  }
}