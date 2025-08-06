document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const getStartedBtn = document.getElementById("getStartedBtn");
  const backBtn = document.getElementById("backBtn");
  const landing = document.getElementById("landing");
  const cloneScreen = document.getElementById("cloneScreen");
  const resultDiv = document.getElementById("result");
  const callModal = document.getElementById("callModal");
  const callInput = document.getElementById("callInput");
  const callSubmit = document.getElementById("callSubmit");
  const callCancel = document.getElementById("callCancel");
  const manualCallModal = document.getElementById("manualCallModal");
  const manualCallSubmit = document.getElementById("manualCallSubmit");
  const manualCallCancel = document.getElementById("manualCallCancel");
  const manualCallNumber = document.getElementById("manualCallNumber");
  const voiceUrlInput = document.getElementById("voiceUrl");
  const callScriptInput = document.getElementById("callScript");
  const firstMessageInput = document.getElementById("firstMessage");
  const callLanguageSelect = document.getElementById("callLanguage");
  const voiceTypeRadios = document.querySelectorAll('input[name="voiceType"]');
  const voiceUrlGroup = document.getElementById("voiceUrlGroup");

  // Default voice samples (replace with your actual URLs)
  const DEFAULT_VOICES = {
    male: "https://example.com/voices/default_male.wav",
    female: "https://example.com/voices/default_female.wav"
  };

  // Navigation
  getStartedBtn.addEventListener("click", () => {
    landing.classList.add("hidden");
    cloneScreen.classList.remove("hidden");
  });

  backBtn.addEventListener("click", () => {
    cloneScreen.classList.add("hidden");
    landing.classList.remove("hidden");
    resultDiv.innerHTML = "";
  });

  // Voice type selection handler
  voiceTypeRadios.forEach(radio => {
    radio.addEventListener("change", function() {
      voiceUrlGroup.style.display = this.value === "custom" ? "block" : "none";
      if (this.value !== "custom") {
        voiceUrlInput.value = "";
      }
    });
  });

  // Generate or get a persistent user ID
  const getOrCreateUserId = () => {
    let userId = localStorage.getItem('voiceCloneUserId');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('voiceCloneUserId', userId);
    }
    return userId;
  };

  // Existing call initiation flow
  let currentCallData = null;
  callSubmit.addEventListener("click", async () => {
    const phoneInput = callInput.value.trim();
    if (!phoneInput) return;
    
    callModal.classList.add("hidden");
    resultDiv.innerHTML += "<br>⏳ Starting call...";
    
    try {
      const callRes = await fetch("/make-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          toNumber: phoneInput,
          aiText: currentCallData.aiText,
          userId: currentCallData.userId
        }),
      });

      const callResult = await callRes.json();
      if (callResult.success) {
        resultDiv.innerHTML += "<br>📞 Call initiated successfully!";
      } else {
        resultDiv.innerHTML += `<br>❌ Call failed: ${callResult.error || callResult.details}`;
      }
    } catch (err) {
      resultDiv.innerHTML += `<br>❌ Error: ${err.message}`;
    }
  });

  callCancel.addEventListener("click", () => {
    callModal.classList.add("hidden");
  });

  // Manual call modal handling
  manualCallCancel?.addEventListener("click", () => {
    manualCallModal.classList.add("hidden");
  });

  manualCallSubmit?.addEventListener("click", async () => {
    const phoneNumber = manualCallNumber.value.trim();
    const callScript = callScriptInput.value.trim();
    const firstMessage = firstMessageInput.value.trim();
    const language = callLanguageSelect.value;
    const userId = getOrCreateUserId();
    const selectedVoiceType = document.querySelector('input[name="voiceType"]:checked').value;

    if (!phoneNumber || !callScript) {
      alert("Please fill in all required fields");
      return;
    }

    // Determine voice URL based on selection
    let voiceUrl;
    if (selectedVoiceType === "custom") {
      voiceUrl = voiceUrlInput.value.trim();
      if (!voiceUrl) {
        alert("Please provide a custom voice URL");
        return;
      }
    } else {
      voiceUrl = DEFAULT_VOICES[selectedVoiceType];
    }

    manualCallModal.classList.add("hidden");
    resultDiv.innerHTML = "⏳ Initiating manual call...";

    try {
      const response = await fetch("/manual-call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          voice_url: voiceUrl,
          task: callScript,
          first_message: firstMessage || callScript,
          language: language,
          userId: userId,
          voice_type: selectedVoiceType
        }),
      });

      const result = await response.json();
      if (result.success) {
        resultDiv.innerHTML = `
          ✅ Manual call initiated successfully!<br>
          Call ID: ${result.callId}<br>
          ${result.audioUrl ? `<a href="${result.audioUrl}" target="_blank">Preview Audio</a>` : ''}
        `;
      } else {
        resultDiv.innerHTML = `❌ Call failed: ${result.error || result.details}`;
      }
    } catch (err) {
      console.error("Manual call error:", err);
      resultDiv.innerHTML = `❌ Error: ${err.message}`;
    }
  });

  // Main form submission
  const form = document.getElementById("cloneForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector("button[type='submit']");
    submitBtn.disabled = true;
    resultDiv.innerHTML = "⏳ Cloning & generating AI response...";

    try {
      const formData = new FormData(form);
      const userId = getOrCreateUserId();
      formData.append("userId", userId);

      const response = await fetch("/clone", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();

      if (data.audio && data.aiText) {
        // Play the WAV version for immediate feedback
        const audioPlayer = document.createElement("audio");
        audioPlayer.controls = true;
        audioPlayer.autoplay = true;
        audioPlayer.src = data.audio.wav;

        resultDiv.innerHTML = `
          ✅ Voice cloned!<br><br>
          🧠 AI Response: <b>${data.aiText}</b><br><br>
          <button id="initiateCallBtn" class="call-btn">📞 Quick Call</button>
          <button id="manualCallBtn" class="manual-call-btn call-btn">⚙️ Manual Call Setup</button>
        `;
        resultDiv.appendChild(audioPlayer);

        // Store call data for later use
        currentCallData = {
          aiText: data.aiText,
          userId: userId,
          audioUrl: data.audio.url
        };

        // Add click handlers for the new buttons
        document.getElementById("initiateCallBtn").addEventListener("click", () => {
          callInput.value = "";
          callModal.classList.remove("hidden");
        });

        document.getElementById("manualCallBtn").addEventListener("click", () => {
          // Pre-fill manual call form with cloned data
          document.getElementById("voiceDefaultMale").checked = false;
          document.getElementById("voiceDefaultFemale").checked = false;
          document.getElementById("voiceCustom").checked = true;
          voiceUrlGroup.style.display = "block";
          voiceUrlInput.value = data.audio.url;
          callScriptInput.value = data.aiText;
          manualCallNumber.value = "";
          firstMessageInput.value = "";
          manualCallModal.classList.remove("hidden");
        });
      } else {
        resultDiv.innerHTML = "❌ Failed to process voice clone.";
      }
    } catch (err) {
      console.error("Error:", err);
      resultDiv.innerHTML = `❌ Error: ${err.message}`;
    } finally {
      submitBtn.disabled = false;
    }
  });
});