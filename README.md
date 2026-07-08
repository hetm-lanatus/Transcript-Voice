# Transcript-Voice: Ultimate Speech-to-Text Integration Project

This project is a comprehensive React + TypeScript application that integrates and compares multiple Speech-to-Text (STT) providers. The goal is to provide a unified interface to test, evaluate, and understand the technical differences between various transcription services, specifically focusing on how they handle **Live (Streaming)** transcription versus **Pre-recorded (File Upload)** transcription.

## Overview of Speech-to-Text Approaches

Speech-to-text generally falls into two categories, both of which require distinct technical approaches:

1. **Live (Streaming) Transcription**: Used for real-time dictation, live captions, etc. Because audio needs to be processed continuously with minimal latency, this approach typically relies on **WebSockets (`wss://`)**. It establishes a persistent, bi-directional connection where the client sends small chunks of audio, and the server continuously returns partial and final text results.
   *(Note: Some providers like OpenAI and Groq do not offer native WebSockets for STT. In these cases, we simulate live transcription by repeatedly sending small, overlapping audio chunks via REST).*
2. **Pre-recorded (File Upload) Transcription**: Used for transcribing existing audio/video files. This approach uses standard **REST APIs (HTTP POST)**. The entire file is uploaded, the server processes it asynchronously or synchronously, and returns a single, complete JSON response. Large files usually require a polling mechanism (asking the server "is it done yet?").

Below is a highly detailed breakdown of every approach implemented in this project, why it is used, how it works, and the exact endpoints utilized.

---

## 1. Deepgram
Deepgram is known for extreme speed and low latency, making it excellent for real-time applications. It natively supports both WebSockets and REST.

### Live (Streaming)
* **Approach Used**: Native WebSocket Connection.
* **Why**: Deepgram's streaming API is designed for instant transcription. WebSockets provide the lowest possible latency.
* **How it works**: The app captures audio via `getUserMedia`, pipes it into a `MediaRecorder`, and sends chunks of `audio/webm` data every 250ms directly over the WebSocket. Deepgram responds with interim and final JSON messages.
* **Endpoint**: `wss://api.deepgram.com/v1/listen?model=nova-3&interim_results=true&smart_format=true`
* **Authentication**: Token passed in WebSocket protocols `['token', apiKey]`.

### File (Pre-recorded)
* **Approach Used**: Synchronous REST API.
* **Why**: For files, Deepgram can process them incredibly fast, so it returns the result in a single synchronous HTTP request without needing to poll.
* **How it works**: The file is sent directly in the body of an HTTP POST request.
* **Endpoint**: `https://api.deepgram.com/v1/listen?smart_format=true&model=nova-3`

---

## 2. AssemblyAI
AssemblyAI is highly accurate and provides advanced features like speaker diarization and sentiment analysis.

### Live (Streaming)
* **Approach Used**: Native WebSocket Connection (v3 API).
* **Why**: Required for real-time transcription.
* **How it works**: AssemblyAI requires raw PCM 16-bit audio. The app uses an `AudioContext` and a `ScriptProcessorNode` to extract Float32 audio data from the microphone, manually converts it to Int16 PCM binary, and streams it over the WebSocket.
* **Endpoint**: `wss://streaming.assemblyai.com/v3/ws?sample_rate=16000&speech_model=universal-3-5-pro`
* **Authentication**: Requires fetching a temporary token from a backend proxy to initiate the connection.

### File (Pre-recorded)
* **Approach Used**: Asynchronous REST API (Upload -> Transcribe -> Poll).
* **Why**: Standard pattern for heavy, accurate models that might take a few minutes to process large files.
* **How it works**: 
  1. Upload file to `https://api.assemblyai.com/v2/upload`.
  2. Start transcription job using the upload URL at `https://api.assemblyai.com/v2/transcript`.
  3. Poll `https://api.assemblyai.com/v2/transcript/{id}` every 3 seconds until status is "completed".

---

## 3. Gladia
Gladia provides highly accurate multilingual transcription using advanced Whisper-based architecture.

### Live (Streaming)
* **Approach Used**: Native WebSocket Connection.
* **Why**: Real-time requirements.
* **How it works**: Similar to AssemblyAI, Gladia requires raw 16000Hz PCM data. The app extracts raw audio buffers, converts them to Int16, and streams them. 
* **Endpoint**: Obtained dynamically via an initialization request to their API (proxied via `/api/gladia-init`).

### File (Pre-recorded)
* **Approach Used**: Asynchronous REST API (Upload -> Transcribe -> Poll).
* **Why**: To handle potentially large files without keeping an HTTP request hanging.
* **How it works**:
  1. Upload via `POST https://api.gladia.io/v2/upload` using `FormData`.
  2. Initiate transcription via `POST https://api.gladia.io/v2/transcription`.
  3. Poll `GET https://api.gladia.io/v2/transcription/{id}`.

---

## 4. Speechmatics
Speechmatics provides enterprise-grade ASR with excellent accuracy across diverse accents.

### Live (Streaming)
* **Approach Used**: Native WebSocket Connection.
* **Why**: For real-time continuous dictation.
* **How it works**: Connects via WebSocket using a JWT token. Sends a `StartRecognition` JSON payload, then streams `audio/webm` chunks from a `MediaRecorder` every 250ms.
* **Endpoint**: `wss://eu2.rt.speechmatics.com/v2/en?jwt={token}`

### File (Pre-recorded)
* **Approach Used**: Asynchronous REST API (Submit Job -> Poll).
* **Why**: Standard batch processing mechanism.
* **How it works**:
  1. Submit file and config via `FormData` to `POST https://asr.api.speechmatics.com/v2/jobs`.
  2. Poll `GET https://asr.api.speechmatics.com/v2/jobs/{id}`.
  3. Once done, fetch transcript text at `GET https://asr.api.speechmatics.com/v2/jobs/{id}/transcript?format=txt`.

---

## 5. OpenAI (Whisper)
OpenAI's Whisper API is immensely popular but is strictly a REST-based architecture.

### Live (Simulated Streaming)
* **Approach Used**: Simulated Streaming via Chunked REST API Calls.
* **Why**: OpenAI **does not** offer a native WebSocket endpoint for real-time STT. 
* **How it works**: The app uses `MediaRecorder` to capture 2-second chunks of audio. It appends these chunks together to form a growing `.webm` file in memory. Every 2 seconds, it sends this accumulated audio file via an HTTP POST request to the API. It overwrites the text on the screen with the latest response.
* **Endpoint**: Proxied through `/api/openai/audio/transcriptions` (target: `https://api.openai.com/v1/audio/transcriptions`).

### File (Pre-recorded)
* **Approach Used**: Synchronous REST API.
* **Why**: Designed natively for files.
* **How it works**: Simple `FormData` POST with the file.
* **Endpoint**: Proxied through `/api/openai/audio/transcriptions`. Model: `whisper-1`.

---

## 6. Groq (Whisper Hardware Accelerated)
Groq uses custom hardware (LPUs) to run LLMs and Whisper models at blazing fast speeds. Like OpenAI, it uses a REST architecture.

### Live (Simulated Streaming)
* **Approach Used**: Simulated Streaming via Chunked REST API Calls.
* **Why**: Groq mimics the OpenAI API standard and does not provide a WebSocket endpoint. However, because Groq's inference speed is practically instantaneous, the "simulated" chunking approach feels much closer to real-time than OpenAI.
* **How it works**: Same as OpenAI. Records 2-second chunks, appends them, and POSTs the growing file repeatedly.
* **Endpoint**: Proxied through `/api/groq/audio/transcriptions` (target: `https://api.groq.com/openai/v1/audio/transcriptions`).

### File (Pre-recorded)
* **Approach Used**: Synchronous REST API.
* **Why**: Designed natively for files. Fast enough to return immediately.
* **How it works**: Simple `FormData` POST. Model used: `whisper-large-v3-turbo`.
* **Endpoint**: Proxied through `/api/groq/audio/transcriptions`.

---

## 7. Web Speech API (Browser Native)
The Web Speech API is built directly into modern browsers (primarily Chrome and Safari). 

### Live (Streaming) Only
* **Approach Used**: Internal Browser API (`window.SpeechRecognition`).
* **Why**: It is completely free, requires no API keys, and is handled natively by the operating system/browser.
* **How it works**: The browser records audio and sends it to its own native cloud provider (e.g., Google's servers if using Chrome) under the hood. Developers just receive JavaScript events with the text.
* **Endpoint**: N/A (Handled internally by the browser engine).
* **Limitations**: Does not natively support transcribing pre-recorded files, cannot be relied upon for consistent cross-browser behavior, and stops recording automatically if there is too much silence.

---

## Technical Summary: Audio Processing in React

To handle these different APIs, this project demonstrates two distinct ways of capturing audio in JavaScript:

1. **`MediaRecorder` API**: Used for Deepgram, Speechmatics, OpenAI, and Groq. It easily records chunks of encoded audio (like `audio/webm`), which is sent directly over websockets or REST.
2. **`AudioContext` & `ScriptProcessorNode` (Raw PCM)**: Used for AssemblyAI and Gladia. Some APIs demand completely uncompressed, raw binary audio (usually 16-bit Int16 PCM at 16kHz). The browser's microphone natively captures Float32 data, which this app mathematically converts to Int16 before sending the buffer arrays over the WebSocket.
