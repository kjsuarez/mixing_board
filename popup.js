let findButton = document.getElementById("findElementsButton");
let setVolumeButton = document.getElementById("setVolumeButton");

// chrome.storage.sync.get("color", ({ color }) => {
//   changeColor.style.backgroundColor = color;
// });

// When the button is clicked, inject setPageBackgroundColor into current page
findButton.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: addSliders,
  });
});

setVolumeButton.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let volume_info = get_volume_info();
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(
      tabs[0].id,
      {
        greeting: "hello",
        audio_changes: volume_info
      },
      function(response) {
        console.log(response.farewell);
      }
    );
  });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: setVolume,
  });
});


function addSliders() {
  var audios = document.getElementsByTagName('audio');
  for(var i = 0; i < audios.length; i++){
    console.log(audios[i].id)
    //audios[i].volume = 0.1
  }
}

// The body of this function will be executed as a content script inside the
// current page
function setVolume(sliders) {
  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      console.log(sender.tab ?
                  "from a content script:" + sender.tab.url :
                  "from the extension");
      if (request.greeting === "hello")
        console.log(request)
        for (var i = 0; i < request.audio_changes.length; i++) {
          // array element example: {element_id: "jp_audio_0", volume: 0.2}
          var el = document.getElementById(request.audio_changes[i].element_id)
          console.log("element id: " + request.audio_changes[i].element_id);
          el.volume = request.audio_changes[i].volume;
        }
        sendResponse({farewell: "goodbye"});
    }
  );
}

function get_volume_info() {
  sliders = document.getElementsByClassName("volume_slider");
  var slider_array = [].slice.call(sliders);

  let formatted_slider_array = slider_array.map(slider => {
     let rObj = {}
     rObj["element_id"] = slider.dataset.relatedId;
     rObj["volume"] =  parseInt(slider.value) * 0.01;
     return rObj
  })
  return formatted_slider_array;
}
