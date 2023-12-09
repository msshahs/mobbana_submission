// content.js

console.log("Hi, I have been injected whoopie!!!");

let recorder = null;
let recognition = null;
let recognitionStopped = false;
let fullTranscript = '';

function onAccessApproved(stream) {
    recorder = new MediaRecorder(stream);
    recognition = new webkitSpeechRecognition();

    recognition.onresult = function (event) {
        const transcript = event.results[0][0].transcript;
        fullTranscript += transcript
        recognitionStopped = false;
        console.log("fullTranscript", fullTranscript)
    };

    recognition.onerror = function (event) {
        console.error('Speech recognition error:', event.error);
    };

    recognition.onend = function (num) {
        if (!recognitionStopped) {
            console.log('Speech recognition ended and restarted.');
            recognition.start();
        } else {
            downloadTranscript(fullTranscript);
            fullTranscript = ""
            console.log('Speech recognition ended completely.');
        }
    };

    recognition.lang = 'en-US';

    recognition.start()
    recorder.start();

    recorder.onstop = function () {
        stream.getTracks().forEach(function (track) {
            if (track.readyState === "live") {
                track.stop();
            }
        });
    };

    recorder.ondataavailable = function (event) {
        let recordedBlob = event.data;
        let url = URL.createObjectURL(recordedBlob);
        stopRecognition();
        downloadVideo(url);
    };
}


function stopRecognition() {

    if (recognition) {
        recognitionStopped = true;
        recognition.stop();
        console.log('Speech recognition stopped.');
    }
}


function downloadTranscript(transcript) {
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    console.log(url);

    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'transcript.txt';

    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);

    URL.revokeObjectURL(url);
}


function downloadVideo(videoUrl) {
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = videoUrl;
    a.download = 'screen-recording.webm';

    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);

    URL.revokeObjectURL(videoUrl);
}

// Checking if the current page is a Google Meet page
function isGoogleMeetPage() {
    console.log(location.href);

    const pathname = new URL(location.href).pathname;
    console.log(pathname);
    return (
        location.hostname === "meet.google.com" && pathname && pathname.length > 1
    );
}

document.addEventListener("click", (event) => {
    const clickedElement = event.target;
    console.log("clickedElement",clickedElement);
    if (clickedElement.classList.contains("VfPpkd-kBDsod")) {
        // Perform recorder.stop() or any other actions you need
        console.log("Element with class 'VfPpkd-kBDsod' clicked. Stopping recorder.");

        // Check if recorder is defined before stopping
        if (recorder) {
            recorder.stop();
        }
    }
});



chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "request_recording") {
        if (isGoogleMeetPage()) {
            console.log("requesting recording");

            sendResponse(`processed: ${message.action}`);

            navigator.mediaDevices
                .getDisplayMedia({
                    audio: true,
                    video: {
                        width: 9999999999,
                        height: 9999999999,
                    },
                })
                .then((stream) => {

                    const isAudioActive = stream.getAudioTracks().some(track => track.readyState === 'live');
                    const isVideoActive = stream.getVideoTracks().some(track => track.readyState === 'live');

                    console.log('Audio track:', stream.getAudioTracks());
                    console.log('Video track:', stream.getVideoTracks());

                    onAccessApproved(stream);
                })
                .catch(error => {
                    console.error('Error accessing media devices:', error);
                });
        } else {
            alert("Please start the meeting first.");
        }
    }

    if (message.action === "stopvideo") {
        console.log("stopping video");
        sendResponse(`processed: ${message.action}`);
        if (!recorder) return console.log("no recorder");

        recorder.stop();
    }
});
