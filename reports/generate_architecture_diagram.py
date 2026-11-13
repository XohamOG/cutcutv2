import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from pathlib import Path

REPORTS_DIR = Path("D:/Downlods D/AAI Miniproject/cutcutv2/reports")
REPORTS_DIR.mkdir(parents=True, exist_ok=True)
IMG_PATH = REPORTS_DIR / "clutchcut_architecture_diagram.png"

def draw_architecture():
    # High resolution figure: 16 x 11 inches, 300 DPI
    fig, ax = plt.subplots(figsize=(16, 11), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    # Background canvas color
    fig.patch.set_facecolor('#F8FAFC')
    ax.set_facecolor('#F8FAFC')

    # Color Palette
    c_blue_dark   = '#0F172A'  # Deep slate navy
    c_blue_primary= '#1E3A8A'  # Deep Royal Blue
    c_blue_light  = '#EFF6FF'  # Very soft blue
    c_indigo      = '#3730A3'  # Indigo
    c_indigo_light= '#EEF2FF'
    c_emerald     = '#065F46'  # Dark Emerald
    c_emerald_lt  = '#ECFDF5'
    c_purple      = '#5B21B6'  # Purple
    c_purple_lt   = '#F5F3FF'
    c_amber       = '#92400E'  # Amber
    c_amber_lt    = '#FFFBEB'
    c_rose        = '#9F1239'  # Rose
    c_rose_lt     = '#FFF1F2'

    # Title Banner
    ax.text(50, 96.5, "CLUTCHCUT AI: CONCEPTUAL SYSTEM DESIGN & ARCHITECTURE",
            fontsize=18, fontweight='bold', ha='center', va='center', color=c_blue_dark, family='sans-serif')
    ax.text(50, 94.0, "Autonomous Multi-Agent Gaming Stream Highlight Extraction, Vertical Reformatting & Publishing System",
            fontsize=11, fontstyle='italic', ha='center', va='center', color='#475569', family='sans-serif')

    # Draw Layer Containers
    def draw_container(x, y, w, h, title, fill_color, border_color):
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.6,rounding_size=1.2",
                                      facecolor=fill_color, edgecolor=border_color, linewidth=1.8, linestyle='--')
        ax.add_patch(rect)
        ax.text(x + 2, y + h - 2.0, title.upper(), fontsize=10, fontweight='bold', color=border_color, family='sans-serif')

    # Draw Module Nodes
    def draw_node(x, y, w, h, title, subtitle, fill_c, text_c, border_c):
        node = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.4,rounding_size=0.8",
                                      facecolor=fill_c, edgecolor=border_c, linewidth=1.4)
        ax.add_patch(node)
        ax.text(x + w/2, y + h*0.62, title, fontsize=9.5, fontweight='bold', ha='center', va='center', color=text_c, family='sans-serif')
        ax.text(x + w/2, y + h*0.28, subtitle, fontsize=7.5, ha='center', va='center', color='#475569', family='sans-serif')

    # Draw Connecting Arrows
    def draw_arrow(x1, y1, x2, y2, label=None, color='#64748B'):
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(facecolor=color, edgecolor=color, width=1.4, headwidth=6, headlength=7, shrink=0.04))
        if label:
            mx, my = (x1 + x2)/2, (y1 + y2)/2
            ax.text(mx, my + 1.2, label, fontsize=7.5, fontweight='bold', color='#1E293B', ha='center', va='center',
                    bbox=dict(boxstyle='round,pad=0.2', facecolor='white', edgecolor='#CBD5E1', lw=0.8))

    # ==========================================
    # LAYER 1: DATA INGESTION & DEMUX (Y: 77 to 92)
    # ==========================================
    draw_container(2, 77, 96, 15, "Layer 1: Edge Ingestion & Demuxing (Client-Side Browser Sandbox)", c_blue_light, c_blue_primary)
    draw_node(5, 79, 26, 9.5, "Raw Gaming Stream VOD", "1080p 60fps MP4/MKV (WebCodecs)", "#FFFFFF", c_blue_dark, c_blue_primary)
    draw_node(37, 79, 26, 9.5, "Live Chat Replay Data", "YouTube / Twitch Replay JSON", "#FFFFFF", c_blue_dark, c_blue_primary)
    draw_node(69, 79, 26, 9.5, "WebCodecs Audio Decoder", "16kHz Float32 PCM Waveform", "#FFFFFF", c_blue_dark, c_blue_primary)

    draw_arrow(31, 83.7, 37, 83.7)
    draw_arrow(63, 83.7, 69, 83.7)

    # ==========================================
    # LAYER 2: MULTIMODAL FEATURE EXTRACTION (Y: 53 to 73)
    # ==========================================
    draw_container(2, 53, 96, 21, "Layer 2: Multimodal Feature Extraction & Signal Processing (Web Worker / WebGPU)", c_emerald_lt, c_emerald)
    draw_node(5, 62, 28, 9, "Voice & Pitch Tracker", "RMS Loudness + F0 vs 120s Baseline", "#FFFFFF", c_emerald, c_emerald)
    draw_node(5, 55, 28, 5.5, "Rolling 120s Median Gating", "Excludes ambient gameplay noise", "#FFFFFF", '#1E293B', '#94A3B8')

    draw_node(36, 62, 28, 9, "Chat Lag Alignment Engine", "Cross-correlation offset (7 - 25s)", "#FFFFFF", c_emerald, c_emerald)
    draw_node(36, 55, 28, 5.5, "Message Density Attenuation", "Dynamic scaling for small streams", "#FFFFFF", '#1E293B', '#94A3B8')

    draw_node(67, 62, 29, 9, "AudioSet Reaction Classifier", "Local model: Laughter & Shouts", "#FFFFFF", c_emerald, c_emerald)
    draw_node(67, 55, 29, 5.5, "Whisper ASR Speech Engine", "Word timestamps & transcript", "#FFFFFF", c_emerald, c_emerald)

    draw_arrow(18, 79, 18, 71, "Audio Stream")
    draw_arrow(50, 79, 50, 71, "Chat Stream")
    draw_arrow(82, 79, 82, 71, "PCM Buffer")

    # ==========================================
    # LAYER 3: AGENTIC ORCHESTRATION & VIRALITY GATING (Y: 27 to 49)
    # ==========================================
    draw_container(2, 27, 96, 23, "Layer 3: 10-Agent Orchestration Engine (LangGraph StateGraph Engine)", c_purple_lt, c_purple)

    draw_node(4, 38, 20, 8.5, "Candidate Gen Agent", "NMS (14s pre, 8s tail)", "#FFFFFF", c_purple, c_purple)
    draw_node(4, 29, 20, 7.5, "Excitement Agent", "Correlates Pitch + Chat", "#FFFFFF", c_purple, c_purple)

    draw_node(28, 38, 21, 8.5, "Virality Ranking Agent", "Late Fusion Score S_fused", "#FFFFFF", c_purple, c_purple)
    draw_node(28, 29, 21, 7.5, "Game Event Agent", "Clutch / 3HP / Defuse", "#FFFFFF", c_purple, c_purple)

    draw_node(52, 38, 21, 8.5, "Caption & Hook Agent", "Animated word subtitles", "#FFFFFF", c_purple, c_purple)
    draw_node(52, 29, 21, 7.5, "Rights & Safety Agent", "DMCA & Profanity Scan", "#FFFFFF", c_purple, c_purple)

    draw_node(76, 38, 20, 8.5, "LLM Judge (Optional)", "Claude/Gemini/Groq", "#FFFFFF", c_purple, c_purple)
    draw_node(76, 29, 20, 7.5, "Feedback Agent", "Weight update on likes", "#FFFFFF", c_purple, c_purple)

    # Connections between Layer 2 and 3
    draw_arrow(18, 53, 14, 46.5)
    draw_arrow(50, 53, 38, 46.5, "Fused Signals")
    draw_arrow(82, 53, 62, 46.5)

    # Internal pipeline flow in Layer 3
    draw_arrow(24, 42.2, 28, 42.2)
    draw_arrow(49, 42.2, 52, 42.2)
    draw_arrow(73, 42.2, 76, 42.2)

    # ==========================================
    # LAYER 4: REFORMATTING, HUMAN GATE & PUBLISH (Y: 3 to 23)
    # ==========================================
    draw_container(2, 3, 96, 21, "Layer 4: Adaptive Reformatting, Human Gate & Multi-Platform Distribution", c_amber_lt, c_amber)

    draw_node(5, 6.5, 27, 14, "Vertical Reformat Agent", "16:9 -> 9:16 Action Center Crop\nFacecam PiP + Blur Background\nHardware VideoEncoder Render", "#FFFFFF", c_amber, c_amber)
    draw_node(37, 6.5, 26, 14, "Human Review Gate", "Interactive Crop Bounding Box\nCaption Word Timestamp Editor\nTrim Duration & Hook Approval", "#FFFFFF", c_rose, c_rose)
    draw_node(68, 6.5, 27, 14, "Publishing Agent", "YouTube Shorts (1080x1920)\nTikTok / Instagram Reels Export\nViral Tags, Title & JSON Manifest", "#FFFFFF", c_emerald, c_emerald)

    # Connections between Layer 3 and 4
    draw_arrow(86, 29, 86, 22, "Shortlisted Clips")
    draw_arrow(86, 22, 18, 20.5)

    draw_arrow(32, 13.5, 37, 13.5, "Rendered 9:16")
    draw_arrow(63, 13.5, 68, 13.5, "Approved")

    plt.tight_layout()
    fig.savefig(str(IMG_PATH), dpi=300, facecolor=fig.get_facecolor(), edgecolor='none', bbox_inches='tight')
    plt.close(fig)
    print(f"Architecture diagram generated successfully at: {IMG_PATH}")

if __name__ == "__main__":
    draw_architecture()
