function resize() {
    canvas.a.width = canvas.b.width = window.innerWidth;
    canvas.a.height = canvas.b.height = window.innerHeight;
}

function draw() {
    const { frequencyData } = audio;
    const spectrumWidth = 0.5 * frequencyData.length;
    const lineWidth = canvas.a.width / spectrumWidth * 0.5;
    const y = 0.5 * canvas.a.height;
    
    ctx.a.clearRect(0, 0, canvas.a.width, canvas.a.height);
    ctx.b.clearRect(0, 0, canvas.b.width, canvas.b.height);
    
    let i, frequency, fNorm, x, hue, height;
    
    for (i = frequencyData.length - 1; i >= 0; i--) {
        frequency = frequencyData[i];
        fNorm = frequency / 256;
        x = i / spectrumWidth * canvas.a.width;
        hue = 110 * (1 - fNorm);
        height = 0.25 * canvas.a.height * fNorm;
        
        ctx.a.beginPath();
        ctx.a.lineWidth = lineWidth;
        ctx.a.strokeStyle = `hsla(${hue}, 60%, 50%, 1)`;
        ctx.a.moveTo(x, y);
        ctx.a.lineTo(x, y - height);
        ctx.a.stroke();
        ctx.a.closePath();
        
        ctx.a.beginPath();
        ctx.a.lineWidth = lineWidth;
        ctx.a.strokeStyle = `hsla(${hue}, 60%, 50%, 1)`;
        ctx.a.moveTo(x, y);
        ctx.a.lineTo(x, y + height);
        ctx.a.stroke();
        ctx.a.closePath();
    }
    
    ctx.b.save();
    ctx.b.filter = 'blur(5px)';
    ctx.b.drawImage(canvas.a, 0, 0);
    ctx.b.restore();
    
    ctx.b.save();
    ctx.b.globalCompositeOperation = 'lighter';
    ctx.b.drawImage(canvas.a, 0, 0);
    ctx.b.restore();
    window.requestAnimationFrame(draw);
}

function createAudio() {
    if (audio) return audio;

    const element = document.createElement("audio");
    document.body.appendChild(element);
    const ctx = new AudioContext();
    const source = ctx.createMediaElementSource(element);
    const gain = ctx.createGain();
    const analyser = ctx.createAnalyser();
    const btn = document.querySelector('.btn-play-pause');
    
    analyser.smoothingTimeConstant = 0.88;
    analyser.minDecibels = -120;
    analyser.maxDecibels = -10;
    analyser.fftSize = 1024;

    const frequencies = new Uint8Array(analyser.frequencyBinCount);

    source.connect(gain);
    gain.connect(analyser);
    analyser.connect(ctx.destination);
    return {
        element,
        btn,
        ctx,
        gain,
        analyser,
        load(data) {
            element.src = window.URL.createObjectURL(data);
            return this;
        },
        play() {
            element.play();
            ctx.resume();
            return this;

        },
        pause() {
            element.pause();
            return this;
        },
        get frequencyData() {
            analyser.getByteFrequencyData(frequencies);
            return frequencies;
        }
    };
}

function fetchFile(url = defaultTrackUrl) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = 'blob';
        xhr.addEventListener("load", () => resolve(xhr.response));
        xhr.send();
    });
}

function setup() {
    canvas = {
        a: document.createElement("canvas"),
        b: document.createElement("canvas")
    };
    canvas.b.style = `
        user-select: none;
        position: fixed;
        bottom: 0;
        left: 0;
        height: 10%;
        width: 100%;
        z-index:20
    `;
    document.body.appendChild(canvas.b);
    
    ctx = {
        a: canvas.a.getContext("2d"),
        b: canvas.b.getContext("2d")
    };
    resize();
}

const app = Vue.createApp({
    delimiters: ['[{', '}]'],
    compatConfig: { MODE: 3 },
    data(){
        return {
            ret:'ok',
            user: null,
            entries: [],
            entrySelected:-1,
            replies:[],
            videos: [],
            isPlaying: false,
            tracks: [],
            userTracks: [],
            host:"127.0.0.1:8080/",
            yOffsetBuf: -1,
        } 
    },
    computed: {
        currentEntry(){
            return (this.entrySelected>-1) ? this.entries[this.entrySelected]:{}
        },
        boxHeight(){
            return this.tracks.length*40+40;
        },
        getValue(num){
            return num;
        },
    },
    methods:{
        expandPlayer(){
            this.$refs.musicPlayer.style.width = '600px';
            this.$refs.musicPlayer.style.height = this.boxHeight +'px';
        },
        shrinkPlayer(){
            this.$refs.musicPlayer.style.width = '50px';
            this.$refs.musicPlayer.style.height = '50px';
        },
        backToMain(){
            this.entrySelected = -1;
            window.scrollTo(0, this.yOffsetBuf);
        },
        clickOnEntry(e){
            this.entrySelected = this.entries.indexOf(e);
            this.yOffsetBuf = window.pageYOffset;
            window.scrollTo(0, 0);
            this.fetchReplies();
        },
        fetchEntries(){
            fetch("api_entries")
            .then(r => r.json())
            .then(json => {
                this.entries = json["entires"];
                this.videos = json["videos"];
            })
        },
        submitPost() {    // Simple POST request with a JSON body using fetch
          let requestOptions = {
            method: "POST",
            headers: { 'Content-Type': 'application/json', },
            body: JSON.stringify({
                title: this.$refs.submitTitle.value,
                content: this.$refs.submitPost.value}),
          };
          fetch("api_submit_post", requestOptions)
            .then(response => response.json())
            .then(data =>{
                if(data['ret']=="ok"){
                    this.fetchEntries();
                    title: this.$refs.submitTitle.value = '';
                    $('#summernote').summernote('reset');
                }
                else{
                    alert(data['ret'])
                }
          })
        },
        submitReply(){
            let requestOptions = {
            method: "POST",
            headers: { 'Content-Type': 'application/json', },
            body: JSON.stringify({
                postID: this.currentEntry['id'],
                content: this.$refs.submitReply.value}),
          };
          fetch("api_submit_reply", requestOptions)
            .then(response => response.json())
            .then(data =>{
                if(data['ret']=="ok"){
                    this.fetchReplies();
                    $('#summernoteReply').summernote('reset');
                }
                else{
                    alert(data['ret'])
                }
          })
        },
        fetchReplies() {    // Simple POST request with a JSON body using fetch
          let requestOptions = {
            method: "POST",
            headers: { 'Content-Type': 'application/json', },
            body: JSON.stringify({postID: this.currentEntry['id']}),
          };
          fetch("api_replies", requestOptions)
            .then(response => response.json())
            .then(data =>{
                this.replies = (data['replies'])? data['replies']:[] })
        },
        fetchMusic(){
            fetch("api_music_list")
            .then(r => r.json())
            .then(json => {
                let tracks = json["music"]
                let user_tracks = json["user_music"]
                this.tracks = tracks 
                this.userTracks = json["user_tracks"]
                this.user = json["user"]
            })
        },
        playMusic(name){
            console.log(name)
            fetchFile('static/music/Default_user/'+name).then(audioData =>  {
                audio = createAudio();
                audio.load(audioData);
                audio.play();
                draw();
                this.isPlaying = true;
            })
        },
        pauseOrContinueAudio(){
            if(audio){
                if(this.isPlaying){
                    audio.pause();
                    this.isPlaying = false;
                }
                else{
                    audio.play();
                    this.isPlaying = true;
                }
                
            }
        },
    },
    mounted(){
        this.fetchMusic();
        this.fetchEntries();
    },
})

let canvas, ctx, audio;
app.mount("#app")

$(document).ready(function() {
  $('#summernotePost').summernote({
    dialogsInBody: true,
    placeholder: 'Please do be respectful submitting any posts',
    tabsize: 4,
    height: 200
  });
});
$(document).ready(function() {
  $('#summernoteReply').summernote({
    dialogsInBody: true,
    placeholder: 'Please do be respectful submitting any posts',
    tabsize: 4,
    height: 200
  });
});