let findButton = document.getElementById("findElementsButton");

window.onload = async () => {
  console.log("onload" + Date())
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(
      tabs[0].id,
      {
        greeting: "hello"
      },
      function(response) {
        console.log("response of find audios button");
        console.log(response);
        let container = document.getElementById("sliders");
        console.log(container)
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
            slider_clone.addEventListener('change', async () => {
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
          }
        } else {
          let audio_missing_message = document.getElementById("no_audio_message");
          audio_missing_message.style.removeProperty('display');
        }

      }
    );
  });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: addSliders,
  });
}

chrome.tabs.onUpdated.addListener( function (tabId, changeInfo, tab) {
  if (changeInfo.status == 'complete' && tab.active) {
    console.log("This Works");
    // do your things

    // chrome.tabs.sendMessage(
    //   tabId,
    //   {
    //     greeting: "hello"
    //   },
    //   function(response) {
    //     console.log("response of find audios button");
    //     console.log(response);
    //     let container = document.getElementById("sliders");
    //     console.log(container)
    //     while (container.firstChild) {
    //       container.removeChild(container.firstChild);
    //     }
    //     let audios = response.audio_element_data;
    //     for(var i = 0; i < audios.length; i++){
    //       console.log("what extension thinks the volume of " + audios[i].element_id + " is: " + audios[i].volume)
    //       let original = document.getElementById("baseline_volume_slider");
    //       let slider_clone = original.cloneNode(true);
    //       slider_clone.style.removeProperty('display');
    //       slider_clone.classList.add("volume_slider");
    //       slider_clone.dataset["relatedId"] = audios[i].element_id
    //       slider_clone.value = String(audios[i].volume * 100)
    //       console.log("set slider to " + slider_clone.value)
    //       container.append(slider_clone)
    //     }
    //   }
    // );
    //
    //
    // chrome.scripting.executeScript({
    //   target: { tabId: tab.id },
    //   function: addSliders,
    // });
  }
})



// chrome.tabs.onUpdated.addListener(async () => {
//   let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
//
//   chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//     chrome.tabs.sendMessage(
//       tabs[0].id,
//       {
//         greeting: "hello"
//       },
//       function(response) {
//         console.log("response of find audios button");
//         console.log(response);
//         let container = document.getElementById("sliders");
//         console.log(container)
//         while (container.firstChild) {
//           container.removeChild(container.firstChild);
//         }
//         let audios = response.audio_element_data;
//         for(var i = 0; i < audios.length; i++){
//           console.log("what extension thinks the volume of " + audios[i].element_id + " is: " + audios[i].volume)
//           let original = document.getElementById("baseline_volume_slider");
//           let slider_clone = original.cloneNode(true);
//           slider_clone.style.removeProperty('display');
//           slider_clone.classList.add("volume_slider");
//           slider_clone.dataset["relatedId"] = audios[i].element_id
//           slider_clone.value = String(audios[i].volume * 100)
//           console.log("set slider to " + slider_clone.value)
//           container.append(slider_clone)
//         }
//       }
//     );
//   });
//
//   chrome.scripting.executeScript({
//     target: { tabId: tab.id },
//     function: addSliders,
//   });
// });

// When the button is clicked, inject setPageBackgroundColor into current page

function addSliders() {
  var audios = document.getElementsByTagName('audio');
  var audios_array = [].slice.call(audios);

  let formatted_audio_array = audios_array.map(audio => {
    console.log("current audio volume: " + audio.volume)
     let rObj = {}
     rObj["element_id"] = audio.id;
     rObj["volume"] =  audio.volume;
     return rObj
  })

  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      console.log("triggered in addSliders");

      sendResponse({audio_element_data: formatted_audio_array});
    }
  );


}

// The body of this function will be executed as a content script inside the
// current page
function setVolume(sliders) {
  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {

      console.log(request)
      for (var i = 0; i < request.audio_changes.length; i++) {
        // array element example: {element_id: "jp_audio_0", volume: 0.2}
        var el = document.getElementById(request.audio_changes[i].element_id)
        console.log("element id: " + request.audio_changes[i].element_id);
        el.volume = request.audio_changes[i].volume;
        console.log("volume of element after setting: " + el.volume)
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
