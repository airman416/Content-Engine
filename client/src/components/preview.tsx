import { useRef, useCallback, useEffect, useState } from "react";
import { useHopperStore } from "@/lib/store";
import { SiLinkedin, SiX, SiInstagram } from "react-icons/si";
import {
  Mail,
  User,
  Copy,
  Download,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Quote,
  Loader2,
} from "lucide-react";
import { toPng } from "html-to-image";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { useToast } from "@/hooks/use-toast";

const FONTS = [
  "Inter",
  "Roboto",
  "Playfair Display",
  "Merriweather",
  "JetBrains Mono",
  "Georgia",
  "Lora",
];

const DIMENSIONS: { key: "1080x1080" | "1080x1350" | "1080x1920"; label: string; w: number; h: number }[] = [
  { key: "1080x1080", label: "Square", w: 1080, h: 1080 },
  { key: "1080x1350", label: "Portrait", w: 1080, h: 1350 },
  { key: "1080x1920", label: "Story", w: 1080, h: 1920 },
];

function loadGoogleFont(font: string) {
  const id = `gfont-${font.replace(/\s/g, "-")}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;600;700&display=swap`;
  document.head.appendChild(link);
}

function proxyPhotoUrl(url: string | null): string | null {
  if (!url) return null;
  return `/api/proxy/image?url=${encodeURIComponent(url)}`;
}

function LinkedInMockup({
  content,
  profilePhoto,
  nodeRef,
  bgColor,
}: {
  content: string;
  profilePhoto: string | null;
  nodeRef: React.RefObject<HTMLDivElement | null>;
  bgColor: string;
}) {
  const paragraphs = content.split("\n").filter((l) => l.trim());
  const proxiedPhoto = proxyPhotoUrl(profilePhoto);
  return (
    <div ref={nodeRef} style={{ backgroundColor: bgColor, padding: "40px" }}>
      <div className="bg-white border border-[#D9D9D9]" style={{ borderRadius: "8px", overflow: "hidden", maxWidth: "500px", margin: "0 auto" }}>
        <div className="flex items-center gap-3 p-4 pb-3">
          {proxiedPhoto ? (
            <img src={proxiedPhoto} alt="" className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 bg-[#0A66C2] rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
          )}
          <div>
            <p className="text-[14px] font-semibold text-[#000]">Sam Parr</p>
            <p className="text-[12px] text-[#666]">Founder & CEO</p>
            <p className="text-[11px] text-[#999]">1d · 🌐</p>
          </div>
        </div>
        <div className="px-4 pb-4">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-[14px] leading-[1.5] text-[#000] mb-2 last:mb-0">{p}</p>
          ))}
        </div>
        <div className="flex items-center justify-around px-4 py-3 border-t border-[#E8E8E8]">
          <span className="text-[12px] text-[#666] font-medium">👍 Like</span>
          <span className="text-[12px] text-[#666] font-medium">💬 Comment</span>
          <span className="text-[12px] text-[#666] font-medium">🔄 Repost</span>
          <span className="text-[12px] text-[#666] font-medium">📤 Send</span>
        </div>
      </div>
    </div>
  );
}

function XMockup({
  content,
  profilePhoto,
  nodeRef,
  bgColor,
}: {
  content: string;
  profilePhoto: string | null;
  nodeRef: React.RefObject<HTMLDivElement | null>;
  bgColor: string;
}) {
  const proxiedPhoto = proxyPhotoUrl(profilePhoto);
  return (
    <div ref={nodeRef} style={{ backgroundColor: bgColor, padding: "40px" }}>
      <div className="bg-white border border-[#E1E8ED]" style={{ borderRadius: "16px", overflow: "hidden", maxWidth: "500px", margin: "0 auto" }}>
        <div className="flex items-start gap-3 p-4">
          {proxiedPhoto ? (
            <img src={proxiedPhoto} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-12 h-12 bg-[#111827] rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-white" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[15px] font-bold text-[#0F1419]">Sam Parr</span>
              <span className="text-[15px] text-[#536471]">@thesamparr</span>
              <span className="text-[15px] text-[#536471]">· 1h</span>
            </div>
            <p className="text-[15px] leading-[1.4] text-[#0F1419] whitespace-pre-wrap">{content}</p>
            <div className="flex items-center justify-between mt-4 text-[#536471] max-w-[360px]">
              <span className="text-[13px]">💬 42</span>
              <span className="text-[13px]">🔄 128</span>
              <span className="text-[13px]">❤️ 1.2K</span>
              <span className="text-[13px]">📊 45K</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssetCard({
  content,
  nodeRef,
  bgColor,
  textColor,
  font,
  align,
  dimension,
}: {
  content: string;
  nodeRef: React.RefObject<HTMLDivElement | null>;
  bgColor: string;
  textColor: string;
  font: string;
  align: "left" | "center" | "right";
  dimension: "1080x1080" | "1080x1350" | "1080x1920";
}) {
  const dimConfig = DIMENSIONS.find((d) => d.key === dimension)!;
  const aspect = dimConfig.h / dimConfig.w;
  const previewWidth = 340;
  const previewHeight = previewWidth * aspect;

  const contentLength = content.length;
  let fontSize = 24;
  if (contentLength > 400) fontSize = 16;
  else if (contentLength > 200) fontSize = 18;
  else if (contentLength > 100) fontSize = 20;

  const renderContent = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} style={{ fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div
      ref={nodeRef}
      data-testid="asset-preview-node"
      style={{
        width: `${previewWidth}px`,
        height: `${previewHeight}px`,
        backgroundColor: bgColor,
        color: textColor,
        fontFamily: `'${font}', sans-serif`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px",
        textAlign: align,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <p
        style={{
          fontSize: `${fontSize}px`,
          lineHeight: 1.6,
          maxWidth: "100%",
          wordWrap: "break-word",
          overflowWrap: "break-word",
        }}
      >
        {renderContent(content)}
      </p>
    </div>
  );
}

function CarouselSlideCard({
  slide,
  index,
  total,
  nodeRef,
  bgColor,
  textColor,
  font,
  align,
  dimension,
}: {
  slide: string;
  index: number;
  total: number;
  nodeRef: React.RefObject<HTMLDivElement | null>;
  bgColor: string;
  textColor: string;
  font: string;
  align: "left" | "center" | "right";
  dimension: "1080x1080" | "1080x1350" | "1080x1920";
}) {
  const dimConfig = DIMENSIONS.find((d) => d.key === dimension)!;
  const aspect = dimConfig.h / dimConfig.w;
  const previewWidth = 340;
  const previewHeight = previewWidth * aspect;

  const slideLength = slide.length;
  let fontSize = 22;
  if (slideLength > 200) fontSize = 16;
  else if (slideLength > 100) fontSize = 18;

  return (
    <div
      ref={nodeRef}
      style={{
        width: `${previewWidth}px`,
        height: `${previewHeight}px`,
        backgroundColor: bgColor,
        color: textColor,
        fontFamily: `'${font}', sans-serif`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px",
        textAlign: align,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "12px",
          right: "16px",
          fontSize: "11px",
          opacity: 0.5,
          fontFamily: "monospace",
        }}
      >
        {index + 1}/{total}
      </div>
      <p style={{ fontSize: `${fontSize}px`, lineHeight: 1.6, maxWidth: "100%", wordWrap: "break-word" }}>
        {slide}
      </p>
    </div>
  );
}

export default function Preview() {
  const {
    sourcePosts,
    selectedPostIndex,
    drafts,
    activeTab,
    profilePhoto,
    assetBgColor,
    setAssetBgColor,
    assetTextColor,
    setAssetTextColor,
    assetFont,
    setAssetFont,
    assetDimension,
    setAssetDimension,
    assetAlign,
    setAssetAlign,
    mockupBgColor,
    setMockupBgColor,
  } = useHopperStore();

  const { toast } = useToast();
  const previewRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadGoogleFont(assetFont);
  }, [assetFont]);

  const selectedPost = sourcePosts[selectedPostIndex];
  const activeDraft = drafts.find(
    (d) =>
      d.sourcePostId === selectedPost?.id &&
      d.platform === activeTab &&
      d.status !== "rejected",
  );

  const content = activeDraft?.content || "";

  const isSameToSame =
    selectedPost &&
    activeDraft &&
    ((activeTab === "linkedin" && selectedPost.platform === "linkedin") ||
      (activeTab === "twitter" && selectedPost.platform === "twitter"));

  const isAssetMode = activeTab === "quote" || activeTab === "instagram";

  const platformLabels: Record<string, { icon: any; label: string }> = {
    linkedin: { icon: SiLinkedin, label: "LinkedIn" },
    twitter: { icon: SiX, label: "X" },
    instagram: { icon: SiInstagram, label: "Instagram" },
    newsletter: { icon: Mail, label: "Newsletter" },
    quote: { icon: Quote, label: "Quote" },
  };

  const { icon: PlatformIcon, label } =
    platformLabels[activeTab] || platformLabels.linkedin;

  const handleCopyText = useCallback(async () => {
    if (!content) return;
    let textToCopy = content;
    if (activeTab === "linkedin") {
      textToCopy = content.replace(/\n\n/g, "\n\u200B\n");
    }
    await navigator.clipboard.writeText(textToCopy);
    toast({
      title: "Copied to clipboard",
      description: activeTab === "linkedin" ? "Formatted with zero-width spaces." : "Text copied.",
    });
  }, [content, activeTab]);

  const handleDownloadImage = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);

    try {
      if (activeTab === "instagram" && content.includes("---")) {
        const slides = content.split("---").map((s) => s.trim()).filter(Boolean);
        const zip = new JSZip();

        for (let i = 0; i < slideRefs.current.length; i++) {
          const node = slideRefs.current[i];
          if (!node) continue;
          const dimConfig = DIMENSIONS.find((d) => d.key === assetDimension)!;
          const dataUrl = await toPng(node, {
            width: dimConfig.w,
            height: dimConfig.h,
            style: {
              transform: `scale(${dimConfig.w / 340})`,
              transformOrigin: "top left",
            },
            pixelRatio: 1,
          });
          const response = await fetch(dataUrl);
          const blob = await response.blob();
          zip.file(`slide-${i + 1}.png`, blob);
        }

        const zipBlob = await zip.generateAsync({ type: "blob" });
        saveAs(zipBlob, "carousel-slides.zip");
        toast({ title: "Downloaded", description: `${slideRefs.current.length} slides saved as ZIP.` });
      } else {
        const node = previewRef.current;
        if (!node) return;

        if (isSameToSame) {
          const dataUrl = await toPng(node, { pixelRatio: 2 });
          const link = document.createElement("a");
          link.download = `${activeTab}-mockup.png`;
          link.href = dataUrl;
          link.click();
        } else if (isAssetMode) {
          const dimConfig = DIMENSIONS.find((d) => d.key === assetDimension)!;
          const dataUrl = await toPng(node, {
            width: dimConfig.w,
            height: dimConfig.h,
            style: {
              transform: `scale(${dimConfig.w / 340})`,
              transformOrigin: "top left",
            },
            pixelRatio: 1,
          });
          const link = document.createElement("a");
          link.download = `${activeTab}-asset.png`;
          link.href = dataUrl;
          link.click();
        } else {
          const dataUrl = await toPng(node, { pixelRatio: 2 });
          const link = document.createElement("a");
          link.download = `${activeTab}-preview.png`;
          link.href = dataUrl;
          link.click();
        }

        toast({ title: "Downloaded", description: "Image saved." });
      }
    } catch (err) {
      console.error("Export error:", err);
      toast({ title: "Export failed", description: "Could not generate image.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  }, [content, activeTab, isSameToSame, isAssetMode, assetDimension, isExporting]);

  const showControls = isAssetMode || isSameToSame;

  const renderPreview = () => {
    if (!content) {
      return (
        <div className="flex items-center justify-center h-32 text-[13px] text-[#999]">
          Generate a draft to see the preview
        </div>
      );
    }

    if (isSameToSame) {
      if (activeTab === "linkedin") {
        return <LinkedInMockup content={content} profilePhoto={profilePhoto} nodeRef={previewRef} bgColor={mockupBgColor} />;
      }
      if (activeTab === "twitter") {
        return <XMockup content={content} profilePhoto={profilePhoto} nodeRef={previewRef} bgColor={mockupBgColor} />;
      }
    }

    if (activeTab === "quote") {
      return (
        <AssetCard
          content={content}
          nodeRef={previewRef}
          bgColor={assetBgColor}
          textColor={assetTextColor}
          font={assetFont}
          align={assetAlign}
          dimension={assetDimension}
        />
      );
    }

    if (activeTab === "instagram") {
      const slides = content.split("---").map((s) => s.trim()).filter(Boolean);
      slideRefs.current = [];
      return (
        <div className="space-y-3">
          {slides.map((slide, i) => (
            <CarouselSlideCard
              key={i}
              slide={slide}
              index={i}
              total={slides.length}
              nodeRef={(el: HTMLDivElement | null) => { slideRefs.current[i] = el; }}
              bgColor={assetBgColor}
              textColor={assetTextColor}
              font={assetFont}
              align={assetAlign}
              dimension={assetDimension}
            />
          ))}
        </div>
      );
    }

    if (activeTab === "linkedin") {
      const paragraphs = content.split("\n").filter((l) => l.trim());
      const proxiedPhoto = proxyPhotoUrl(profilePhoto);
      return (
        <div ref={previewRef} className="bg-white border border-[#E5E5E5] p-0" style={{ borderRadius: "3px" }}>
          <div className="flex items-center gap-3 p-4 pb-3">
            {proxiedPhoto ? (
              <img src={proxiedPhoto} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 bg-[#111827] rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
            <div>
              <p className="text-[14px] font-semibold text-[#111827]">Sam Parr</p>
              <p className="text-[12px] text-[#666]">Building in public</p>
            </div>
          </div>
          <div className="px-4 pb-4">
            {paragraphs.map((p, i) => (
              <p key={i} className="text-[14px] leading-[1.6] text-[#111827] mb-2 last:mb-0">{p}</p>
            ))}
          </div>
          <div className="flex items-center gap-6 px-4 py-3 border-t border-[#F0F0F0]">
            <span className="text-[12px] text-[#666]">Like</span>
            <span className="text-[12px] text-[#666]">Comment</span>
            <span className="text-[12px] text-[#666]">Repost</span>
            <span className="text-[12px] text-[#666]">Send</span>
          </div>
        </div>
      );
    }

    if (activeTab === "twitter") {
      const charCount = content.length;
      const isOverLimit = charCount > 280;
      const proxiedPhoto = proxyPhotoUrl(profilePhoto);
      return (
        <div ref={previewRef} className="bg-white border border-[#E5E5E5] p-0" style={{ borderRadius: "3px" }}>
          <div className="flex items-start gap-3 p-4">
            {proxiedPhoto ? (
              <img src={proxiedPhoto} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 bg-[#111827] rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[14px] font-bold text-[#111827]">Sam Parr</span>
                <span className="text-[14px] text-[#666]">@thesamparr</span>
                <span className="text-[14px] text-[#666]">· now</span>
              </div>
              <p className="text-[15px] leading-[1.5] text-[#111827] whitespace-pre-wrap">{content}</p>
              <div className="flex items-center gap-10 mt-3 text-[#666]">
                <span className="text-[13px]">Reply</span>
                <span className="text-[13px]">Repost</span>
                <span className="text-[13px]">Like</span>
                <span className="text-[13px]">Share</span>
              </div>
            </div>
          </div>
          <div className="px-4 py-2 border-t border-[#F0F0F0] flex items-center justify-end">
            <span className={`text-[12px] font-mono ${isOverLimit ? "text-red-500" : "text-[#999]"}`}>
              {charCount}/280
            </span>
          </div>
        </div>
      );
    }

    if (activeTab === "newsletter") {
      const lines = content.split("\n");
      let subject = "";
      let body = content;
      if (lines[0]?.startsWith("Subject:")) {
        subject = lines[0].replace("Subject:", "").trim();
        body = lines.slice(1).join("\n").trim();
      }
      const paragraphs = body.split("\n").filter((l) => l.trim());
      return (
        <div ref={previewRef} className="bg-white border border-[#E5E5E5]" style={{ borderRadius: "3px" }}>
          {subject && (
            <div className="px-6 py-4 border-b border-[#E5E5E5] bg-[#FAFAFA]">
              <p className="text-[11px] text-[#999] uppercase tracking-wider mb-1">Subject Line</p>
              <p className="text-[15px] font-semibold text-[#111827]">{subject}</p>
            </div>
          )}
          <div className="px-6 py-5">
            {paragraphs.map((p, i) => (
              <p key={i} className="text-[14px] leading-[1.8] text-[#333] mb-3 last:mb-0">{p}</p>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="h-full flex flex-col bg-[#FAFAFA]">
      <div className="flex items-center justify-between px-4 h-[49px] border-b border-[#E5E5E5]">
        <div className="flex items-center gap-2">
          <PlatformIcon className="w-3.5 h-3.5 text-[#666]" />
          <h2 className="text-[13px] font-semibold text-[#111827] tracking-tight">
            {label} Preview
          </h2>
        </div>
        {content && (
          <div className="flex items-center gap-1.5">
            <button
              data-testid="button-copy-text"
              onClick={handleCopyText}
              className="inline-flex items-center gap-1.5 h-7 px-2.5 text-[11px] font-medium text-[#666] bg-white border border-[#E5E5E5] transition-colors hover-elevate"
              style={{ borderRadius: "3px" }}
            >
              <Copy className="w-3 h-3" />
              Copy Text
            </button>
            <button
              data-testid="button-download-image"
              onClick={handleDownloadImage}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 h-7 px-2.5 text-[11px] font-medium text-white border transition-colors disabled:opacity-50"
              style={{ borderRadius: "3px", backgroundColor: "#FF4F00", borderColor: "#FF4F00" }}
            >
              {isExporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
              Download Image
            </button>
          </div>
        )}
      </div>

      {showControls && content && (
        <div className="px-4 py-3 border-b border-[#E5E5E5] bg-white space-y-3">
          {isSameToSame && (
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-mono text-[#999] uppercase tracking-wider w-[60px]">BG</label>
              <input
                data-testid="input-mockup-bg"
                type="color"
                value={mockupBgColor}
                onChange={(e) => setMockupBgColor(e.target.value)}
                className="w-7 h-7 border border-[#E5E5E5] cursor-pointer bg-transparent"
                style={{ borderRadius: "3px" }}
              />
              <span className="text-[11px] font-mono text-[#999]">{mockupBgColor}</span>
            </div>
          )}

          {isAssetMode && (
            <>
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-mono text-[#999] uppercase tracking-wider w-[60px]">BG</label>
                <input
                  data-testid="input-asset-bg"
                  type="color"
                  value={assetBgColor}
                  onChange={(e) => setAssetBgColor(e.target.value)}
                  className="w-7 h-7 border border-[#E5E5E5] cursor-pointer bg-transparent"
                  style={{ borderRadius: "3px" }}
                />
                <span className="text-[11px] font-mono text-[#999]">{assetBgColor}</span>
                <div className="w-px h-4 bg-[#E5E5E5] mx-1" />
                <label className="text-[10px] font-mono text-[#999] uppercase tracking-wider w-[40px]">Text</label>
                <input
                  data-testid="input-asset-text"
                  type="color"
                  value={assetTextColor}
                  onChange={(e) => setAssetTextColor(e.target.value)}
                  className="w-7 h-7 border border-[#E5E5E5] cursor-pointer bg-transparent"
                  style={{ borderRadius: "3px" }}
                />
                <span className="text-[11px] font-mono text-[#999]">{assetTextColor}</span>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-[10px] font-mono text-[#999] uppercase tracking-wider w-[60px]">Font</label>
                <select
                  data-testid="select-font"
                  value={assetFont}
                  onChange={(e) => setAssetFont(e.target.value)}
                  className="h-7 px-2 text-[12px] text-[#111827] bg-white border border-[#E5E5E5] font-mono"
                  style={{ borderRadius: "3px" }}
                >
                  {FONTS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-[10px] font-mono text-[#999] uppercase tracking-wider w-[60px]">Size</label>
                <div className="flex gap-1">
                  {DIMENSIONS.map((dim) => (
                    <button
                      key={dim.key}
                      data-testid={`button-dim-${dim.key}`}
                      onClick={() => setAssetDimension(dim.key)}
                      className={`h-7 px-2.5 text-[11px] font-mono border transition-colors ${
                        assetDimension === dim.key
                          ? "bg-[#111827] text-white border-[#111827]"
                          : "bg-white text-[#666] border-[#E5E5E5] hover:border-[#999]"
                      }`}
                      style={{ borderRadius: "3px" }}
                    >
                      {dim.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-[10px] font-mono text-[#999] uppercase tracking-wider w-[60px]">Align</label>
                <div className="flex gap-1">
                  {(["left", "center", "right"] as const).map((a) => (
                    <button
                      key={a}
                      data-testid={`button-align-${a}`}
                      onClick={() => setAssetAlign(a)}
                      className={`h-7 w-8 flex items-center justify-center border transition-colors ${
                        assetAlign === a
                          ? "bg-[#111827] text-white border-[#111827]"
                          : "bg-white text-[#666] border-[#E5E5E5] hover:border-[#999]"
                      }`}
                      style={{ borderRadius: "3px" }}
                    >
                      {a === "left" ? <AlignLeft className="w-3 h-3" /> : a === "center" ? <AlignCenter className="w-3 h-3" /> : <AlignRight className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {renderPreview()}
      </div>
    </div>
  );
}
