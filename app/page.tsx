"use client";

import { useEffect, useMemo, useState } from "react";
import JSZip from "jszip";
import { buildOutputHtml, sanitizeFilename, type BuildMode } from "@/lib/bundle";
import { EMOJI_OPTIONS, fileToDataUrl, generateEmojiIcon, generateInitialsIcon } from "@/lib/icon";
import { saveAppToFolder, supportsFolderSave } from "@/lib/save";

type IconMode = "auto" | "upload" | "emoji";

const EXAMPLE_CODE = `<!DOCTYPE html>
<html>
<head>
  <title>Click Counter</title>
  <style>
    body { font-family: sans-serif; display: flex; flex-direction: column;
           align-items: center; justify-content: center; height: 100vh; margin: 0;
           background: #f4f4f5; }
    button { font-size: 1.5rem; padding: 1rem 2rem; border-radius: 12px; border: none;
             background: #6366f1; color: white; cursor: pointer; }
    h1 { font-size: 4rem; margin: 0 0 1rem; }
  </style>
</head>
<body>
  <h1 id="count">0</h1>
  <button onclick="document.getElementById('count').textContent = Number(document.getElementById('count').textContent) + 1">
    Click me
  </button>
</body>
</html>`;

export default function Home() {
  const [title, setTitle] = useState("My App");
  const [mode, setMode] = useState<BuildMode>("single");
  const [singleCode, setSingleCode] = useState("");
  const [htmlPart, setHtmlPart] = useState("");
  const [cssPart, setCssPart] = useState("");
  const [jsPart, setJsPart] = useState("");

  const [iconMode, setIconMode] = useState<IconMode>("auto");
  const [uploadedIconDataUrl, setUploadedIconDataUrl] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("🧩");
  const [iconDataUrl, setIconDataUrl] = useState("");

  useEffect(() => {
    if (iconMode === "upload" && uploadedIconDataUrl) {
      setIconDataUrl(uploadedIconDataUrl);
    } else if (iconMode === "emoji") {
      setIconDataUrl(generateEmojiIcon(selectedEmoji));
    } else {
      setIconDataUrl(generateInitialsIcon(title));
    }
  }, [iconMode, uploadedIconDataUrl, selectedEmoji, title]);

  const outputHtml = useMemo(
    () => buildOutputHtml({ mode, title, singleCode, htmlPart, cssPart, jsPart, iconDataUrl }),
    [mode, title, singleCode, htmlPart, cssPart, jsPart, iconDataUrl]
  );

  const [previewHtml, setPreviewHtml] = useState(outputHtml);
  useEffect(() => {
    const t = setTimeout(() => setPreviewHtml(outputHtml), 300);
    return () => clearTimeout(t);
  }, [outputHtml]);

  const hasCode =
    mode === "single" ? singleCode.trim().length > 0 : (htmlPart + cssPart + jsPart).trim().length > 0;

  const folderName = sanitizeFilename(title);

  const [folderSaveSupported, setFolderSaveSupported] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFolderSaveSupported(supportsFolderSave());
  }, []);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setUploadedIconDataUrl(dataUrl);
    setIconMode("upload");
  }

  async function handleSaveToFolder() {
    setSaving(true);
    setSaveStatus("");
    try {
      await saveAppToFolder(outputHtml, folderName);
      setSaveStatus(`Saved — look for the "${folderName}" folder where you chose to save it.`);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // user cancelled the picker, nothing to report
      } else {
        console.error(err);
        setSaveStatus("Couldn't save directly — try the .zip download instead.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDownloadZip() {
    const zip = new JSZip();
    zip.folder(folderName)?.file("index.html", outputHtml);
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${folderName}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setSaveStatus(`Downloaded "${folderName}.zip" — double-click it to unzip into a "${folderName}" folder.`);
  }

  function loadExample() {
    setMode("single");
    setSingleCode(EXAMPLE_CODE);
    setTitle("Click Counter");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-white/10 px-6 py-5">
        <h1 className="text-2xl font-bold">AppBox</h1>
        <p className="text-white/60 mt-1 text-sm">
          Paste code from your AI assistant → add an icon → download a single{" "}
          <code className="bg-white/10 px-1.5 py-0.5 rounded">index.html</code> you can double-click to run. No
          install, no server, works offline.
        </p>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-0">
        {/* Left: inputs */}
        <div className="p-6 space-y-6 border-r border-white/10 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">App name</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My App"
              className="w-full rounded-lg bg-white/5 border border-white/15 px-3 py-2 outline-none focus:border-indigo-400"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-white/80">Your code</label>
              <button
                type="button"
                onClick={loadExample}
                className="text-xs text-indigo-300 hover:text-indigo-200 underline"
              >
                Load example
              </button>
            </div>

            <div className="flex gap-2 mb-3 text-sm">
              <button
                type="button"
                onClick={() => setMode("single")}
                className={`px-3 py-1.5 rounded-full border ${
                  mode === "single"
                    ? "bg-indigo-500 border-indigo-500 text-white"
                    : "border-white/20 text-white/70 hover:border-white/40"
                }`}
              >
                Paste one block
              </button>
              <button
                type="button"
                onClick={() => setMode("parts")}
                className={`px-3 py-1.5 rounded-full border ${
                  mode === "parts"
                    ? "bg-indigo-500 border-indigo-500 text-white"
                    : "border-white/20 text-white/70 hover:border-white/40"
                }`}
              >
                HTML / CSS / JS separately
              </button>
            </div>

            {mode === "single" ? (
              <textarea
                value={singleCode}
                onChange={(e) => setSingleCode(e.target.value)}
                placeholder={`Paste whatever your AI assistant gave you — a full HTML page, or just a snippet. It'll be wrapped into a working app automatically.`}
                spellCheck={false}
                className="w-full h-72 rounded-lg bg-white/5 border border-white/15 px-3 py-2 outline-none focus:border-indigo-400 text-sm resize-y"
              />
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-white/50 mb-1">HTML</label>
                  <textarea
                    value={htmlPart}
                    onChange={(e) => setHtmlPart(e.target.value)}
                    placeholder="<div>...</div>"
                    spellCheck={false}
                    className="w-full h-28 rounded-lg bg-white/5 border border-white/15 px-3 py-2 outline-none focus:border-indigo-400 text-sm resize-y"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">CSS</label>
                  <textarea
                    value={cssPart}
                    onChange={(e) => setCssPart(e.target.value)}
                    placeholder="body { ... }"
                    spellCheck={false}
                    className="w-full h-28 rounded-lg bg-white/5 border border-white/15 px-3 py-2 outline-none focus:border-indigo-400 text-sm resize-y"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 mb-1">JavaScript</label>
                  <textarea
                    value={jsPart}
                    onChange={(e) => setJsPart(e.target.value)}
                    placeholder="console.log('hello')"
                    spellCheck={false}
                    className="w-full h-28 rounded-lg bg-white/5 border border-white/15 px-3 py-2 outline-none focus:border-indigo-400 text-sm resize-y"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Icon</label>
            <div className="flex gap-2 mb-3 text-sm">
              <button
                type="button"
                onClick={() => setIconMode("auto")}
                className={`px-3 py-1.5 rounded-full border ${
                  iconMode === "auto"
                    ? "bg-indigo-500 border-indigo-500 text-white"
                    : "border-white/20 text-white/70 hover:border-white/40"
                }`}
              >
                Auto
              </button>
              <button
                type="button"
                onClick={() => setIconMode("emoji")}
                className={`px-3 py-1.5 rounded-full border ${
                  iconMode === "emoji"
                    ? "bg-indigo-500 border-indigo-500 text-white"
                    : "border-white/20 text-white/70 hover:border-white/40"
                }`}
              >
                Emoji
              </button>
              <label
                className={`px-3 py-1.5 rounded-full border cursor-pointer ${
                  iconMode === "upload"
                    ? "bg-indigo-500 border-indigo-500 text-white"
                    : "border-white/20 text-white/70 hover:border-white/40"
                }`}
              >
                Upload image
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            </div>

            {iconMode === "emoji" && (
              <div className="flex flex-wrap gap-2 mb-3">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedEmoji(emoji)}
                    className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center border ${
                      selectedEmoji === emoji
                        ? "border-indigo-400 bg-indigo-500/20"
                        : "border-white/15 hover:border-white/30"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3">
              {iconDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={iconDataUrl} alt="App icon preview" className="w-12 h-12 rounded-lg border border-white/15" />
              )}
              <span className="text-xs text-white/50">
                {iconMode === "auto" && "Generated automatically from your app name."}
                {iconMode === "emoji" && "Pick an emoji above."}
                {iconMode === "upload" && (uploadedIconDataUrl ? "Using your uploaded image." : "Choose an image file.")}
              </span>
            </div>
          </div>
        </div>

        {/* Right: preview + download */}
        <div className="flex flex-col">
          <div className="px-6 py-3 border-b border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-white/60">Live preview</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {folderSaveSupported ? (
                <>
                  <button
                    type="button"
                    onClick={handleSaveToFolder}
                    disabled={!hasCode || saving}
                    className="px-5 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm"
                  >
                    {saving ? "Saving…" : "Save app to folder…"}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadZip}
                    disabled={!hasCode}
                    className="text-xs text-indigo-300 hover:text-indigo-200 underline disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    or download .zip
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleDownloadZip}
                  disabled={!hasCode}
                  className="px-5 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm"
                >
                  Download app (.zip)
                </button>
              )}
            </div>
            {saveStatus && <p className="text-xs text-white/50 mt-2">{saveStatus}</p>}
          </div>
          <div className="flex-1 bg-white min-h-[420px]">
            {hasCode ? (
              <iframe
                srcDoc={previewHtml}
                sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin"
                title="Live preview"
                className="w-full h-full border-0"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-black/30 text-sm">
                Paste some code to see a live preview
              </div>
            )}
          </div>
          <div className="px-6 py-3 border-t border-white/10 text-xs text-white/40">
            {folderSaveSupported
              ? `"Save app to folder…" lets you pick a location — like your Desktop — and creates a "${folderName}" folder there with index.html inside, ready to open.`
              : `The .zip unzips into a "${folderName}" folder — drag it to your Desktop, then open index.html inside to launch your app.`}
          </div>
        </div>
      </main>
    </div>
  );
}
