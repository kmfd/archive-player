javascript:(function(){
	console.log("
Archive-player, a JS Bookmarklet.
\n
A better webplayer for stream-only videos hosted on archive.org
\n
Mainly intended to be used for items in the TV Archive collection at https://archive.org/details/tvarchive
\n
License: GPL-3.0
\n
Repository: https://github.com/kmfd/archive-player
\n
Usage: run this bookmarklet when you are on the page of a stream-only video on archive.org. A modal overlay will appear with a video player alongside a list of segments of the video in 6-minute pieces, listed by airtime.
");
  var url = window.location.href;
  var identifier = url.match(/archive\.org\/details\/([^\/]+)/)[1];

  var playlist = [];
  var m3uContent = "#EXTM3U\n";

var titleElement = document.querySelector(".tv-ttl");

var dateString = "";
var timeString = "00:00 am";

if (titleElement) {
  var trimmedTextContent = titleElement.textContent.trim();
  var startTimeIndex = trimmedTextContent.indexOf(" ", trimmedTextContent.indexOf(" ") + 1);
  console.log("Start time index:", startTimeIndex);
  var showName = trimmedTextContent.slice(0, startTimeIndex);
  console.log("Show name:", showName);
  var timeStringElement = trimmedTextContent.slice(startTimeIndex).replace("PST", "");
  var dateTimeRegex = /(\w+ \d{1,2}, \d{4}) (\d{1,2}):(\d{2})(am|pm)?/;
  var dateTimeMatch = dateTimeRegex.exec(timeStringElement);
  if (dateTimeMatch) {
    dateString = dateTimeMatch[1];
    timeString = dateTimeMatch[2] + ":" + dateTimeMatch[3] + " " + dateTimeMatch[4];
  } else {
    console.log("Error: Invalid date/time format, using default time string.");
  }
} else {
  console.log("Error: Header element not found, no start time, can't put accurate timestamps in.");
}

console.log("Date string:", dateString);
console.log("Time string:", timeString);


if (titleElement === null) {
  console.log("Error: element not found.");
  console.log("HTML of the page:");
  console.log(document.body.innerHTML);
} else {
    console.log("Header element found. Full header text:", titleElement.textContent);
	var dlElements = document.querySelectorAll("dl.metadata-definition");
	if (dlElements.length === 0) {
	  console.log("Error: No metadata-definition elements found.");
	} else {
	  for (var i = 0; i < dlElements.length; i++) {
		var dtElement = dlElements[i].querySelector("dt");
		if (dtElement && dtElement.textContent.trim() === "Duration") {
			var duration = dlElements[i].querySelector("dd").textContent.trim();
			console.log("Duration:", duration);
			var durationParts = duration.split(":");
			var hours = parseInt(durationParts[0]);
			var minutes = parseInt(durationParts[1]);
			var seconds = parseInt(durationParts[2]);
			var totalSeconds = hours * 3600 + minutes * 60 + seconds;
			var clipCount = Math.ceil(totalSeconds / 360); 
			console.log("Total seconds:", totalSeconds, "Clip count:", clipCount);
		    break;
		}
	  }
	  if (i === dlElements.length) {
		console.log("Error: No duration element found.");
	  }
	}
}



  createPlaylist(timeString, clipCount, identifier);
  createModalPanel();
  var modalPanel = document.querySelector(".modal-panel");
  addPlaylistToVideoList();
  if (playlist.length > 0) {
    document.querySelector("video").src = playlist[0].url;
    document.querySelector(".video-header").textContent = titleElement.textContent.trim();
    videoList = document.querySelector(".modal-panel ul");
    videoList.children[0].click();
  }

function createPlaylist(timeString, clipCount, identifier) {
  if (typeof timeString !== 'string') {
    timeString = timeString.toString();
  }

	var timeParts = timeString.split(":");
	var startHours = parseInt(timeParts[0]);
	var startMinutes = parseInt(timeParts[1]);
	var startMeridian = timeString.slice(-2);
	console.log(`Time parts: ${timeParts}, Start hours: ${startHours}, Start minutes: ${startMinutes}, Start meridian: ${startMeridian}`);

	for (var j = 0; j < clipCount; j++) {
	  var start = j * 360;
	  var clipName = `Start ${startHours}:${startMinutes.toString().padStart(2, '0')} ${startMeridian}`;

    var clipUrl = `https://archive.org/download/${identifier}/${identifier}.mp4?t=${start}/${start + 360}&ignore=x.mp4`;
    playlist.push({name: clipName, url: clipUrl});
    m3uContent += `#EXTINF:360,${identifier}\n${clipUrl}\n`;

    startMinutes += 6;
    if (startMinutes >= 60) {
      startHours++;
      startMinutes -= 60;
      if (startHours === 12) {
        if (startMeridian === "AM") {
          startMeridian = "PM";
        } else {
          startMeridian = "AM";
        }
      }
    }
  }
}

  function createModalPanel() {
    var modalPanel = document.createElement("div");
    modalPanel.style.position = "fixed";
    modalPanel.style.top = "7vh";
    modalPanel.style.left = "0";
    modalPanel.style.width = "100vw";
    modalPanel.style.height = "93vh";
    modalPanel.style.background = "rgba(0, 0, 0, 0.8)";
    modalPanel.style.zIndex = "1000";
    modalPanel.style.display = "flex";
    modalPanel.style.flexDirection = "row";
    modalPanel.style.alignItems = "center";
    modalPanel.style.justifyContent = "center";
	modalPanel.className = "modal-panel";

    var closeButton = document.createElement("button");
    closeButton.textContent = "close player";
    closeButton.style.position = "absolute";
    closeButton.style.top = "10px";
    closeButton.style.right = "10px";
    closeButton.style.background = "#333";
    closeButton.style.color = "#fff";
    closeButton.style.border = "none";
    closeButton.style.padding = "10px";
    closeButton.style.borderRadius = "5px";
    closeButton.style.cursor = "pointer";
    closeButton.onclick = function() {
      modalPanel.remove();
    };
    modalPanel.appendChild(closeButton);

    var videoPlayer = document.createElement("div");
    videoPlayer.style.width = "75%";
    videoPlayer.style.height = "96%";
    videoPlayer.style.background = "#333";
    videoPlayer.style.color = "#fff";
    videoPlayer.style.border = "1px solid #444";
    videoPlayer.style.marginRight = "10px";
    modalPanel.appendChild(videoPlayer);

    var videoHeader = document.createElement("h4");
    videoHeader.style.margin = "0";
    videoHeader.style.color = "#fff";
	videoHeader.className = "video-header";
    videoPlayer.appendChild(videoHeader);

    var videoElement = document.createElement("video");
    videoElement.style.width = "100%";
    videoElement.style.height = "90%";
    videoElement.controls = true;
    videoPlayer.appendChild(videoElement);

    document.body.appendChild(modalPanel);
  }

 function createVideoList() {
  var videoList = document.createElement("ul");
  videoList.style.listStyle = "none";
  videoList.style.padding = "0";
  videoList.style.margin = "0";
  videoList.style.width = "20%";
  videoList.style.height = "90%";
  videoList.style.overflowY = "auto";
  videoList.style.background = "#333";
  videoList.style.color = "#fff";
  videoList.style.border = "1px solid #444";
  videoList.style.padding = "20px";
  document.querySelector(".modal-panel").appendChild(videoList);
  return videoList;
}

function addPlaylistToVideoList() {
  var videoList = createVideoList();
  playlist.forEach(function(clip, index) {
    var listItem = document.createElement("li");
    listItem.style.cursor = "pointer";
    listItem.textContent = clip.name;
    listItem.style.color = "#fff";
	listItem.onclick = function() {
	  var videoElement = document.querySelector(".modal-panel video");
	  videoElement.src = clip.url;
	  videoElement.play();
	  selectClip(listItem);
	};
    videoList.appendChild(listItem);
  });
}

function selectClip(listItem) {
  const listItems = document.querySelectorAll("li");
  listItems.forEach(item => {
    item.style.background = "#333";
    item.style.fontWeight = "normal";
    item.classList.remove("selected");
  });
  listItem.style.background = "#444";
  listItem.style.fontWeight = "bold";
  listItem.classList.add("selected");
}

function playNextClip() {
  const videoList = document.querySelector(".modal-panel ul");
  const currentClipIndex = Array.prototype.indexOf.call(videoList.children, document.querySelector(".selected"));
  const nextClipIndex = (currentClipIndex + 1) % playlist.length;
  const nextClip = videoList.children[nextClipIndex];

  document.querySelector(".modal-panel video").src = playlist[nextClipIndex].url;
  selectClip(nextClip);
  document.querySelector(".modal-panel video").play();
}

document.querySelector(".modal-panel video").addEventListener("ended", function() {
  const videoList = document.querySelector(".modal-panel ul");
  const currentClipIndex = Array.prototype.indexOf.call(videoList.children, document.querySelector(".selected"));
  if (currentClipIndex < playlist.length - 1) {
    playNextClip();
  }
});



var downloadLink = document.createElement("a");
downloadLink.href = "data:text/plain;base64," + btoa(m3uContent);
downloadLink.download = `${identifier}.m3u`;
downloadLink.textContent = "Download Playlist";
downloadLink.style.background = "#333";
downloadLink.style.color = "#fff";
downloadLink.style.padding = "10px";
downloadLink.style.border = "none";
downloadLink.style.borderRadius = "5px";
downloadLink.style.cursor = "pointer";
document.body.appendChild(downloadLink);

var codeBlock = document.createElement("pre");
codeBlock.textContent = m3uContent;
codeBlock.style.background = "#333";
codeBlock.style.color = "#fff";
codeBlock.style.padding = "10px";
codeBlock.style.border = "1px solid #444";
var copyButton = document.createElement("button");
copyButton.textContent = "Copy to Clipboard";
copyButton.style.background = "#333";
copyButton.style.color = "#fff";
copyButton.style.padding = "10px";
copyButton.style.border = "none";
copyButton.style.borderRadius = "5px";
copyButton.style.cursor = "pointer";
copyButton.onclick = function() {
  navigator.clipboard.writeText(m3uContent);
};
codeBlock.appendChild(copyButton);
document.body.appendChild(codeBlock);

console.log("Script complete.");
}
)();
