/**
 * Utility to convert modern CSS color formats (specifically OKLCH and gradients)
 * into standard RGB / RGBA strings that html2canvas and legacy canvas parsers support.
 * 
 * Tailwind CSS v4 compiles color utilities to oklch(...) which html2canvas 1.4.x cannot parse.
 */

// Memory cache to avoid recalculating the same color string repeatedly
const colorCache = new Map<string, string>();

/**
 * Safely parses a channel component that might be a number, percentage, or 'none'
 */
function parseComponent(val: string | undefined): number {
  if (!val || val === 'none') return 0;
  const trimmed = val.trim();
  if (trimmed.endsWith('%')) {
    return (parseFloat(trimmed) || 0) / 100;
  }
  return parseFloat(trimmed) || 0;
}

/**
 * Converts a single oklch(...) string into an rgb(...) or rgba(...) string.
 * Supports:
 * - oklch(0.623 0.214 259.815)
 * - oklch(0.985 0 none)
 * - oklch(0.205 0 0)
 * - oklch(62.3% 0.214 259.815)
 * - oklch(0.623 0.214 259.815 / 0.5)
 * - oklch(0 0 0 / 0.05)
 */
export function oklchToRgb(colorStr: string): string {
  if (!colorStr || !colorStr.includes('oklch')) return colorStr;

  const trimmed = colorStr.trim();
  if (colorCache.has(trimmed)) {
    return colorCache.get(trimmed)!;
  }

  // 1. Try native Canvas 2D context (Fastest in modern browsers where OKLCH is supported)
  if (typeof document !== 'undefined') {
    try {
      const helperCanvas = document.createElement('canvas');
      helperCanvas.width = 1;
      helperCanvas.height = 1;
      const ctx = helperCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#000000'; // reset
        ctx.fillStyle = trimmed;
        const res = ctx.fillStyle;
        if (res && !res.includes('oklch')) {
          colorCache.set(trimmed, res);
          return res;
        }
      }
    } catch {
      // Continue to math fallback
    }
  }

  // 2. Mathematical fallback conversion from OKLCH -> OKLab -> Linear sRGB -> sRGB
  const innerMatch = trimmed.match(/oklch\(([^)]+)\)/i);
  if (!innerMatch) {
    return '#334155';
  }

  const content = innerMatch[1].trim();
  const [channelsStr, alphaStr] = content.split('/').map((s) => s.trim());
  const channelParts = channelsStr.split(/\s+/);
  if (channelParts.length < 3) {
    return '#334155';
  }

  let L = parseComponent(channelParts[0]); // Lightness
  let C = channelParts[1] === 'none' ? 0 : parseFloat(channelParts[1]) || 0; // Chroma
  let H = channelParts[2] === 'none' ? 0 : parseFloat(channelParts[2].replace('deg', '')) || 0; // Hue
  let alpha = alphaStr !== undefined ? (alphaStr === 'none' ? 1 : parseComponent(alphaStr)) : 1;

  if (isNaN(L)) L = 0.5;
  if (isNaN(C)) C = 0;
  if (isNaN(H)) H = 0;
  if (isNaN(alpha)) alpha = 1;

  // OKLCH to OKLab
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  // OKLab to linear sRGB
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const rLinear = +4.0767434036 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gLinear = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bLinear = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  // Linear to sRGB (gamma correction)
  const transfer = (val: number) =>
    val <= 0.0031308 ? 12.92 * val : 1.055 * Math.pow(Math.max(0, val), 1 / 2.4) - 0.055;

  const r = Math.min(255, Math.max(0, Math.round(transfer(rLinear) * 255)));
  const g = Math.min(255, Math.max(0, Math.round(transfer(gLinear) * 255)));
  const bVal = Math.min(255, Math.max(0, Math.round(transfer(bLinear) * 255)));

  const result = alpha < 1 ? `rgba(${r}, ${g}, ${bVal}, ${alpha})` : `rgb(${r}, ${g}, ${bVal})`;
  colorCache.set(trimmed, result);
  return result;
}

/**
 * Replaces any oklch(...) inside a complex CSS string (such as box-shadow, linear-gradient, borders)
 * and strips unsupported gradient syntax like "in oklch,"
 */
export function sanitizeColorString(cssString: string | null | undefined): string {
  if (!cssString) return '';
  let clean = cssString;

  // Replace all oklch(...) occurrences
  if (clean.includes('oklch')) {
    clean = clean.replace(/oklch\([^)]+\)/gi, (matched) => oklchToRgb(matched));
  }

  // Remove "in oklch," from CSS gradients: e.g. "linear-gradient(to right, in oklch, ...)"
  clean = clean.replace(/\bin oklch,\s*/gi, '');

  return clean;
}

/**
 * Creates a proxied CSSStyleDeclaration where any property value containing "oklch" is automatically converted
 */
export function createSanitizedStyleDeclaration(origStyle: CSSStyleDeclaration): CSSStyleDeclaration {
  return new Proxy(origStyle, {
    get(target, prop, receiver) {
      if (prop === 'getPropertyValue') {
        return (propertyName: string) => {
          const raw = target.getPropertyValue(propertyName);
          return sanitizeColorString(raw);
        };
      }
      const val = Reflect.get(target, prop, receiver);
      if (typeof val === 'function') {
        return val.bind(target);
      }
      if (typeof val === 'string') {
        return sanitizeColorString(val);
      }
      return val;
    },
  });
}

/**
 * Installs a getComputedStyle interceptor on a window object so that html2canvas NEVER receives oklch
 */
export function installComputedStyleSanitizer(win: Window) {
  const orig = win.getComputedStyle.bind(win);
  win.getComputedStyle = function (elt: Element, pseudoElt?: string | null): CSSStyleDeclaration {
    const style = orig(elt, pseudoElt);
    return createSanitizedStyleDeclaration(style);
  };
}

/**
 * Sanitizes an entire cloned DOM Document before html2canvas parses it:
 * 1. Overrides getComputedStyle with a Proxy interceptor
 * 2. Sanitizes <style> tags to replace oklch definitions with rgb/rgba
 * 3. Scans all elements inside the cloned document and overrides any computed oklch styles with inline styles
 */
export function sanitizeClonedDocumentForHtml2Canvas(clonedDoc: Document, targetId: string = 'executive-pdf-report') {
  // 1. Intercept getComputedStyle in the cloned document window!
  if (clonedDoc.defaultView) {
    installComputedStyleSanitizer(clonedDoc.defaultView);
  }

  // 2. Sanitize all <style> elements
  const styleTags = clonedDoc.querySelectorAll('style');
  styleTags.forEach((styleTag) => {
    if (styleTag.textContent && (styleTag.textContent.includes('oklch') || styleTag.textContent.includes('in oklch'))) {
      styleTag.textContent = sanitizeColorString(styleTag.textContent);
    }
  });

  // 3. Scan all elements in the entire cloned document
  const win = clonedDoc.defaultView || window;
  const allElements = clonedDoc.querySelectorAll('*');

  const COLOR_CSS_PROPERTIES = [
    'color',
    'background-color',
    'border-top-color',
    'border-right-color',
    'border-bottom-color',
    'border-left-color',
    'outline-color',
    'fill',
    'stroke',
    'box-shadow',
    'text-shadow',
    'background-image',
  ];

  allElements.forEach((node) => {
    if (!(node instanceof win.HTMLElement || node instanceof win.SVGElement)) return;
    const el = node as HTMLElement;
    const computed = win.getComputedStyle(el);

    for (const prop of COLOR_CSS_PROPERTIES) {
      const val = computed.getPropertyValue(prop);
      if (val && (val.includes('oklch') || val.includes('in oklch'))) {
        const sanitized = sanitizeColorString(val);
        el.style.setProperty(prop, sanitized, 'important');
      }
    }
  });
}
