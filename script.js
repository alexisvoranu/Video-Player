// Video sources
const url1 = 'media/video1.mp4';
const url2 = 'media/video2.mp4';
const url3 = 'media/video3.mp4';
const url4 = 'media/video4.mp4';

let subtitles = 'media/subtitles.json';

// Video list, contains: title, source and subtitles source
let list = [
    {
        title: 'video1',
        url: url1, 
        subtitles: subtitles
    },
    {
        title: 'video2',
        url: url2, 
        subtitles: subtitles
    },
    {
        title: 'video3',
        url: url3, 
        subtitles: subtitles
    },
    {
        title: 'video4',
        url: url4, 
        subtitles: subtitles
    }
];

// DOM Elements 
// Declare variables for various DOM elements used in the code
let canvas, context, video, source, container;
let display;
let addVideoBtn;
let listItems;
let effectForm;

// Mouse coordinates in canvas 
let mx = 0, my = 0;

// Canvas dimensions (Weight and Height)
let W, H;

let startPlaylistSwitch = false;

// Container (playlist) dimensions 
let containerW; // Weight
let containerH; // Height
let containerX; // Starting X Position
let containerY; // Starting Y Position

// Playlist item height 
let itemH;

// Size of: prev, play/pause, next buttons
let buttonSize;

// Volume Bar 
let volumeBarWidth;

// The video that is currently playing
let index = 0; 

let displayFrame = false;    
let frameW;
let frameH;
let auxVideo;

// Starting points 
let volumeX;
let subtitlesX;

// progress Bar - how much progress of the video is done
let pb; 

// Controls bar 
let displayControls = false;
let controlsBarY ;
let progressBarH; 
let controlsBarUnderPBy;

// Effects switches
let outline, contrast, c2, blur;
let subtitlesSwitch = false;
let volumeLevel;

// Captions/Subtitles 
let captions;
let captionsArray;

// Function that starts the playlist 
function startPlaylist() {
    setup();
    next(0);    
        
    video.addEventListener("ended", () => {
         next(1);
    });

    canvas.addEventListener('click', canvasClick);
}

// Functions for the setup
function setup() {
    initComponents();
    initDimensions();
    
    if (window.sessionStorage) {
        getStorage();
    } else {
        index = 0;
    }

    initPlaylist();    
}

// Mouse functions 
function mouseDown() {
    if (mx >= containerX) {
        for (let i=0;  i < list.length; i++) {

            let itemArea =  mx >= listItems[i].getBoundingClientRect().x && 
                            my >= listItems[i].getBoundingClientRect().y && 
                            my <= listItems[i].getBoundingClientRect().y + itemH;

            if (itemArea) {
                playItem(i);
            } else {
                finishItem(i);
            }
        }        
    }
}

async function mouseMove(e) {
    mx = e.x;
    my = e.y;

    if (my >= canvas.getBoundingClientRect().y + H-0.05*H) {
        if (my <= canvas.getBoundingClientRect().y + H-0.05*H + 0.02*H) {
            mx = e.x - canvas.getBoundingClientRect().x;
            displayFrame = true;
        } else {
            displayFrame = false;
        }
    }

    drawFrame();

}

function canvasClick(e) {
    mx = e.x - canvas.getBoundingClientRect().x;

    if (my >= canvas.getBoundingClientRect().y + controlsBarY) {
        if (my <= canvas.getBoundingClientRect().y + controlsBarY + progressBarH) {
            video.currentTime = mx * video.duration / W;
        } else {
            let buttonIndex = Math.floor(mx / buttonSize);
            switch (buttonIndex) {
                case 0: // prev
                    next(-1);
                    break;
                case 1: // play/pause
                    video.paused ? video.play() : video.pause();
                    break;
                case 2: // next
                    next(1);
                    break;
            }

            if (mx >= volumeX && mx <= volumeX + volumeBarWidth) {
                let vol = mx - volumeX;
                video.volume = vol / volumeBarWidth;
                volumeLevel = vol / 100;
                window.sessionStorage.setItem('volume', volumeLevel);
            } 

            if (mx >= subtitlesX - canvas.getBoundingClientRect().x
                && mx <= subtitlesX - canvas.getBoundingClientRect().x + volumeBarWidth) {
                setSubtitles();
            }

        }
    }  
}

// Auxiliar functions 
    // DOM Elements 
    function initComponents() {
        // Get references to various HTML elements
        canvas = document.querySelector('canvas');
        context = canvas.getContext('2d');
        video = document.querySelector('video');
        source = document.querySelector('#videoSource');
        container = document.querySelector('#container');
        display = document.querySelector('#main-video');
        auxVideo = document.createElement('video');
        addVideoBtn = document.querySelector('#btnAdd');
        addVideoBtn.addEventListener('change', addNewVideo, false);
        effectForm = document.querySelector('#effect-form');

        canvas.addEventListener('mouseenter', () => {
            displayControls = true;
        });

        canvas.addEventListener('mouseleave', () => {
            displayControls = false;
        });
    }
    
    // Dimensions 
    function initDimensions() {
        // Set up initial dimensions for the canvas and other elements
        W = canvas.width = 0.9 * display.getBoundingClientRect().width;
        H = canvas.height = 0.6 * display.getBoundingClientRect().height;
    
        let marginLR = (display.getBoundingClientRect().width - W) / 2;
        let marginTB = (display.getBoundingClientRect().height - H) / 2;
        
        containerW = container.getBoundingClientRect().width;
        containerH = container.getBoundingClientRect().height;
        containerX = container.getBoundingClientRect().x;
        containerY = container.getBoundingClientRect().y;
    
        canvas.style = `margin-left: ${marginLR}px; 
                        margin-top: ${marginTB}px;`;

        effectForm.style = `margin-left: ${marginLR}px;
                        margin-top: ${0.1*marginTB}px;`
    
        buttonSize = 0.05 * W;
        volumeBarWidth = 0.2 * W;
        volumeX = buttonSize * 5;
        volumeLevel = video.volume;
        subtitlesX = buttonSize * 13;
    }
    
    // Playlist 
    function initPlaylist() {
        listItems = [];  
    
        container.innerHTML = ""
    
        for (let item=0; item < list.length; item++) {

                listItems[item] = document.createElement('div');
                listItems[item].className = "card";
            
                let vidDim = containerW / 2.7;
        
                // Each video in playlist
                listItems[item].innerHTML = `<video width="${vidDim}" 
                                alt="video-preview"
                                style="margin-top: 10px;
                                border-radius: 10px;
                                margin-left: 30px;
                                border: 1px solid white;
                                margin-bottom: 10px;">
                                <source src=${list[item].url} type="video/mp4">
                                </video>`;
                // Delete button for every video in playlist
                listItems[item].innerHTML += `<img class="delete"
                onclick="deleteVideo(${item})" src="media/delete.png"
                alt="delete" style="margin-left: 230px;"> 
                </img>`;
                       
                container.append(listItems[item]);
        
                itemH = listItems[item].getBoundingClientRect().height;        
            }
    }

// Storage 
function getStorage() {
    // Get values from sessionStorage and initialize variables
    if (JSON.parse(window.sessionStorage.getItem('playlist')) != null) {
        list = JSON.parse(window.sessionStorage.getItem('playlist'));
    }

    if ( parseInt(window.sessionStorage.getItem('index'))) {
        index = parseInt(window.sessionStorage.getItem('index')); 
    } else {
        index = 0;
    }
    volumeLevel = parseFloat(window.sessionStorage.getItem('volume'));
    subtitlesSwitch =  window.sessionStorage.getItem('subtitles') == 'true';
    outline =  window.sessionStorage.getItem('outline') == 'true';
    document.querySelector('#outline').checked = outline;
    contrast =  window.sessionStorage.getItem('contrast') == 'true';
    document.querySelector('#contrast').checked = contrast;
    c2 =  window.sessionStorage.getItem('c2') == 'true';
    document.querySelector('#c2').checked = c2;
    blur =  window.sessionStorage.getItem('blur') == 'true';
    document.querySelector('#blur').checked = blur;
}

// Actions on playlist 
function addNewVideo() {
    // Add a new video to the playlist
    let file = this.files[0];
    let fileURL = URL.createObjectURL(file);
    list.push({
        url: fileURL
    });

    savePlaylist();
    setup();
}

function deleteVideo(id) {
    // Delete a video from the playlist
    list.splice(id, 1);
    savePlaylist();
    setup();
}

function savePlaylist() {
    // Save the playlist to sessionStorage
    window.sessionStorage.setItem("playlist", JSON.stringify(list));
}

// Playing and finishing video 
async function playItem(i) {
    // Play a specific item from the playlist
    listItems[i].style = 'background-color: rgb(45, 58, 58, 0.3); border-radius: 10px';
    
    video.src = list[i].url;

    auxVideo.src = video.src;
    // auxVideo.muted = 'true';
    await auxVideo.load();
    await video.load();
    await video.play();

    // video.muted = false;
    if (list[i].subtitles) {
        readFromJson(list[i].subtitles);
    }
    drawVideo();
    index = i;
    window.sessionStorage.setItem('index', index);
}

function finishItem(i) {
    // Mark a playlist item as finished
    listItems[i].style = 'background-color: #2acf74;';
}

function next(delta) {
    // Move to the next or previous video in the playlist
    if (index >= 0 && index < list.length) {
        finishItem(index);
    }
    index = index + delta;
    if (index >= list.length) {
        index = 0;
    }

    if (index < 0) {
        index = list.length - 1;
    }
    window.sessionStorage.setItem('index', index);
    playItem(index);
}

// Drawing the video 
function drawVideo() {
    // Draw the video on the canvas with optional effects
    context.drawImage(video, 0, 0, W, H);
    let imageData = context.getImageData(0, 0, W, H);
    imageData.crossOrigin = "Anonymous";
    let v = imageData.data;

    for (let i=0; i<v.length; i+= 4) 
    {
        if (outline)
        {
            let threshold = 100; // Can be adjusted based on preferences
            let isEdge = (v[i] + v[i + 1] + v[i + 2]) / 3 < threshold;

            if (isEdge) {
                v[i] = 0; // Set the outline color to black for the red channel
                v[i + 1] = 0; // Set the outline color to black for the green channel
                v[i + 2] = 0; // Set the outline color to black for the blue channel
            }
        }

        if (c2) //Red and green
        {
            var r = v[i],
                g = v[i+1],
                b = v[i+2];
            v[i] = r;
            v[i+1] = g;
            v[i+2] = g;
        }

        if (contrast)
        {
            let contrastFactor = 2; 
            v[i] = (v[i] - 128) * contrastFactor + 128;
            v[i + 1] = (v[i + 1] - 128) * contrastFactor + 128;
            v[i + 2] = (v[i + 2] - 128) * contrastFactor + 128; 
        }

        if(blur)
        {
            let blurAmount = 5; // Can be adjusted based on preferences
            let avgColor = [0, 0, 0];
            for (let j = 0; j < blurAmount; j++) {
                avgColor[0] += v[i + j];
                avgColor[1] += v[i + 1 + j];
                avgColor[2] += v[i + 2 + j];
            }
            avgColor[0] /= blurAmount;
            avgColor[1] /= blurAmount;
            avgColor[2] /= blurAmount;

            v[i] = avgColor[0];
            v[i + 1] = avgColor[1];
            v[i + 2] = avgColor[2];
        }
    }

    context.putImageData(imageData, 0, 0);

    if (subtitlesSwitch) {
        drawCaptions();
    }

    drawControls();
    requestAnimationFrame(drawVideo);
}

// Drawing the frames 
async function drawFrame() {
    // Draw a frame preview when hovering over the progress bar
    frameW = 0.2 * W;
    frameH = 0.2 * H;
    
    if (displayFrame) {
        auxVideo.currentTime = Math.round(mx * video.duration / W);
        auxVideo.pause();  
            
        context.beginPath();        
        context.moveTo(0, 0);
        context.rect(mx - frameW/2, controlsBarY - 0.1*frameH, frameW, -frameH);
        context.fill();

        context.drawImage(auxVideo, mx - frameW/2, controlsBarY - 0.1*frameH, frameW, -frameH);
        requestAnimationFrame(drawFrame);
    } 
} 

// Drawing the controls 
function drawControls() {
    if (displayControls) {
    controlsBarY = H - 0.07 * H;
    progressBarH = 0.02 * H; 
    controlsBarUnderPBy = controlsBarY + progressBarH;
    // Controls bar draw
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(0, controlsBarY, W, H);

    // Progress bar draw
    context.fillStyle = 'rgba(0, 200, 0, 0.7)';
    pb = (video.currentTime * W) / video.duration;
    context.fillRect(0, controlsBarY, pb, progressBarH);
   
    // Buttons draw
    context.fillStyle = 'rgb(0, 200, 0, 0.7)';
    context.strokeStyle = 'rgb(0, 200, 0, 0.7)';
    context.lineWidth = 3;

    let paddingLR = 15;
    let paddingTB = 5;
    
    // button back
    context.beginPath();
    context.moveTo(buttonSize - paddingLR, controlsBarUnderPBy + paddingTB);
    context.lineTo(paddingLR, controlsBarUnderPBy + (H - controlsBarUnderPBy)/2);
    context.lineTo(buttonSize - paddingLR, H - paddingTB);
    context.stroke();

    // button play/pause 
    if (video.paused) {
        context.beginPath();
        context.moveTo(buttonSize  + paddingLR, controlsBarUnderPBy + paddingTB);
        context.lineTo(buttonSize * 1.7, controlsBarUnderPBy + (H - controlsBarUnderPBy)/2);
        context.lineTo(buttonSize  + paddingLR, H - paddingTB);
        context.fill();
    } else {
        context.beginPath();
        context.moveTo(buttonSize * 1.33 + paddingLR, controlsBarUnderPBy + paddingTB);
        context.lineTo(buttonSize * 1.33 + paddingLR, H - paddingTB);
        context.moveTo(buttonSize * 1.67 - paddingLR, controlsBarUnderPBy + paddingTB);
        context.lineTo(buttonSize * 1.67 - paddingLR, H - paddingTB);
        context.stroke();
    }

    // button next
    context.beginPath();
    context.moveTo(buttonSize * 2 + paddingLR, controlsBarUnderPBy + paddingTB);
    context.lineTo(buttonSize * 3 - paddingLR, controlsBarUnderPBy + (H - controlsBarUnderPBy)/2);
    context.lineTo(buttonSize * 2 + paddingLR, H - paddingTB);
    context.stroke();

    // drawing volume button
    context.textAlign = 'right';
    context.textBaseline = 'middle';
    context.font = '10pt Tahoma';
    context.fillText('Volume', buttonSize * 4.5, controlsBarUnderPBy + (H-controlsBarUnderPBy)/2); 

    context.strokeStyle = 'gray';
    context.lineWidth = 10;
    context.beginPath();
    context.moveTo(buttonSize * 5, controlsBarUnderPBy + (H-controlsBarUnderPBy)/2);
    context.lineTo(buttonSize * 5 + volumeBarWidth, controlsBarUnderPBy + (H-controlsBarUnderPBy)/2);
    context.stroke();

    context.strokeStyle = 'rgb(0, 200, 0, 0.7)'
    context.beginPath();
    context.moveTo(buttonSize * 5, controlsBarUnderPBy + (H-controlsBarUnderPBy)/2);
    context.lineTo(buttonSize * 5 + volumeLevel * 100, controlsBarUnderPBy + (H-controlsBarUnderPBy)/2);
    context.stroke();

    // drawing sybtitles button
    context.fillStyle = 'rgb(0, 200, 0, 0.7)';
    context.strokeStyle = 'rgb(0, 200, 0, 0.7)';
    let sub = 'Subtitles: ' + (subtitlesSwitch ? 'On' : 'Off');  
    context.fillText(sub, subtitlesX, controlsBarUnderPBy + (H-controlsBarUnderPBy)/2);
    }
    requestAnimationFrame(drawControls);
}

// Drawing the subtitles 
let i = 0;
function drawCaptions() {

    if (captionsArray[i]) {
        if (video.currentTime < parseFloat(captionsArray[i+1].timestamp)) {
            context.beginPath();
            context.fillStyle = 'rgb(0, 0, 0, 0)';
            context.moveTo(0, controlsBarY - 0.1 * H);
            context.rect(0, controlsBarY - 0.1 * H, W, 20);
            context.fill();

            context.beginPath();
            context.fillStyle = 'white';
            context.textAlign = 'center';
            context.textBaseline = 'left';
            context.font = '10pt Tahoma';
            context.fillText(captionsArray[i].caption, W/2, controlsBarY - 0.1 * H + 10);
        } else {
            if (i < captionsArray.length - 1) {
                i++;
            }
        }
          
    }
}

// Switching the effects 
function setSubtitles() {
    subtitlesSwitch = !subtitlesSwitch;
    window.sessionStorage.setItem('subtitles', subtitlesSwitch);
}

function setEffect(id) {
    switch(id) {
        case 0:
            outline = !outline;
            window.sessionStorage.setItem('outline', outline);
            break;
        case 1:
            contrast = !contrast;
            window.sessionStorage.setItem('contrast', contrast);
            break;
        case 2:
            c2 = !c2;
            window.sessionStorage.setItem('c2', c2);
            break;
        case 3:
            blur = !blur;
            window.sessionStorage.setItem('blur', blur);
            break;
        
    }
}

// Reading the subtitles from url and putting them in an array 
async function readFromJson(json) {

    captionsArray = [];

    let raspuns = await fetch(json);
    captions = await raspuns.json();

    let i=0;
    for (let item in captions) {
        let c = {};
        c.timestamp = item;
        c.caption = captions[item];
        captionsArray.push(c);
    }
    captionsArray.sort();
}

// Switching the videos in playlist
const videoListContainer = document.getElementById("container");
const sortableList = new Sortable(videoListContainer, {
    animation: 150,
    onEnd: function (event) {
        const oldIndex = event.oldIndex;
        const newIndex = event.newIndex;

        // Reordering the videos in playlist
        const movedVideo = list.splice(oldIndex, 1)[0];
        list.splice(newIndex, 0, movedVideo);
    }
});

document.addEventListener('DOMContentLoaded', startPlaylist)
document.addEventListener('onresize', setup);
document.addEventListener('mousedown', mouseDown);
document.addEventListener('mousemove', mouseMove);
