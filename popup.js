let findButton = document.getElementById("findElementsButton");

window.onload = drawSliders();

async function sendVolumeSetMessage() {
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
}

async function drawSliders() {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {

    chrome.tabs.sendMessage(
      tabs[0].id,
      {
        greeting: "hello"
      },
      function(response) {
        let container = document.getElementById("sliders");
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }
        let audios = response.audio_element_data;
        if (audios.length > 0) {
          for(var i = 0; i < audios.length; i++){
            console.log("what extension thinks the volume of " + audios[i].element_id + " is: " + audios[i].volume)
            let original_label = document.getElementById("baseline_label");
            let label_clone = original_label.cloneNode(true);
            label_clone.style.removeProperty('display');
            label_clone.innerText = audios[i].element_id

            let original = document.getElementById("baseline_volume_slider");
            let slider_clone = original.cloneNode(true);
            slider_clone.style.removeProperty('display');
            slider_clone.classList.add("volume_slider");
            slider_clone.dataset["relatedId"] = audios[i].element_id
            slider_clone.value = String(audios[i].volume * 100)
            console.log("set slider to " + slider_clone.value)
            container.append(label_clone)
            container.append(slider_clone)
            slider_clone.addEventListener('change', sendVolumeSetMessage);
          }
        } else {
          let audio_missing_message = document.getElementById("no_audio_message");
          audio_missing_message.style.removeProperty('display');
        }
      }
    )
  });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: addSliders,
  });
}

// Functions executed on DOM rather than extention pop-up

function addSliders() {
  var audio_elements = document.getElementsByTagName('audio');
  var video_elements = document.getElementsByTagName('video');
  var audios_array = [].slice.call(audio_elements);
  var videos_array = [].slice.call(video_elements);
  var volume_scalable_array = audios_array.concat(videos_array);
  for (var i = 0; i < volume_scalable_array.length; i++) {
    if(volume_scalable_array[i].id.length == 0){
      volume_scalable_array[i].id = ("volume_scalable_" + i)
    }
  }

  let formatted_audio_array = volume_scalable_array.map(audio => {
    console.log("current audio volume: " + audio.volume)
     let rObj = {}
     rObj["element_id"] = audio.id;
     rObj["volume"] =  audio.volume;
     return rObj
  })

  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      sendResponse({audio_element_data: formatted_audio_array});
    }
  );
}

function setVolume(sliders) {
  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      for (var i = 0; i < request.audio_changes.length; i++) {
        // array element example: {element_id: "jp_audio_0", volume: 0.2}
        var el = document.getElementById(request.audio_changes[i].element_id)
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
     let slider_metadata = {}
     slider_metadata["element_id"] = slider.dataset.relatedId;
     slider_metadata["volume"] =  parseInt(slider.value) * 0.01;
     return slider_metadata
  })
  return formatted_slider_array;
}
