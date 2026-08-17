const pdfModule = require('pdf-parse');

/**
 * Reading-Order PDF Text Extractor
 * Uses PDF positional coordinates (x, y, width, height) to reconstruct
 * human reading order (top-to-bottom lines, left-to-right fragments),
 * preserve speaker labels, paragraph boundaries, and filter headers/footers.
 */

/**
 * Page renderer callback passed to pdf-parse.
 * Collects text items with positional metadata and applies spatial line & paragraph reconstruction.
 */
function renderPageWithReadingOrder(pageData) {
  return pageData.getTextContent({ normalizeWhitespace: false })
    .then(textContent => {
      const items = textContent.items;
      if (!items || items.length === 0) {
        return '';
      }

      // 1. Extract raw items with position data
      const parsedItems = items
        .filter(item => item.str && item.str.trim().length > 0)
        .map(item => ({
          text: item.str,
          x: item.transform[4], // X coordinate (left to right)
          y: item.transform[5], // Y coordinate (bottom to top, higher Y = higher on page)
          width: item.width || 0,
          height: item.height || Math.abs(item.transform[3]) || 10
        }));

      if (parsedItems.length === 0) {
        return '';
      }

      // 2. Group items into horizontal lines based on Y-coordinate tolerance
      const Y_TOLERANCE = 3.5; // Points tolerance for same line
      const lines = [];

      parsedItems.forEach(item => {
        let line = lines.find(l => Math.abs(l.y - item.y) <= Y_TOLERANCE);
        if (!line) {
          line = { y: item.y, items: [] };
          lines.push(line);
        }
        line.items.push(item);
      });

      // 3. Sort lines vertically from TOP to BOTTOM (descending Y)
      lines.sort((a, b) => b.y - a.y);

      // 4. Within each line, sort items from LEFT to RIGHT (ascending X)
      const reconstructedLines = lines.map(line => {
        line.items.sort((a, b) => a.x - b.x);

        // Join items in line cleanly
        let lineText = '';
        line.items.forEach((item, idx) => {
          if (idx === 0) {
            lineText += item.text;
          } else {
            const prevItem = line.items[idx - 1];
            const gap = item.x - (prevItem.x + prevItem.width);
            // If gap is negative or tiny, don't add space; if gap > 2pt, add space
            if (gap > 2.5 && !lineText.endsWith(' ') && !item.text.startsWith(' ')) {
              lineText += ' ' + item.text;
            } else {
              lineText += item.text;
            }
          }
        });

        return {
          text: lineText.trim(),
          y: line.y
        };
      }).filter(l => l.text.length > 0);

      // 5. Reconstruct paragraphs using vertical spacing between lines
      let pageContent = '';
      for (let i = 0; i < reconstructedLines.length; i++) {
        const current = reconstructedLines[i];
        if (i === 0) {
          pageContent += current.text;
          continue;
        }

        const prev = reconstructedLines[i - 1];
        const vGap = prev.y - current.y; // Positive difference going down page

        // Check if current line starts a speaker label (e.g., "Neha:", "Maria:")
        const isSpeakerLabel = /^([A-Z][a-zA-Z0-9_\s]{1,35}):/.test(current.text);

        // If vertical gap is large (> 18 points) OR current line is a speaker label, start new paragraph
        if (vGap > 18 || isSpeakerLabel) {
          pageContent += '\n\n' + current.text;
        } else {
          // If sentence continues or normal line break
          pageContent += '\n' + current.text;
        }
      }

      return pageContent;
    });
}

/**
 * Main PDF Extraction Utility
 */
async function extractPdfTextWithReadingOrder(pdfBuffer) {
  if (!pdfBuffer || !(pdfBuffer instanceof Buffer)) {
    throw new Error('Invalid PDF buffer provided.');
  }

  const options = {
    pagerender: renderPageWithReadingOrder
  };

  let pdfData;
  if (pdfModule.PDFParse) {
    const parser = new pdfModule.PDFParse({ data: pdfBuffer });
    pdfData = await parser.getText(options);
  } else if (typeof pdfModule === 'function') {
    pdfData = await pdfModule(pdfBuffer, options);
  } else if (pdfModule.default && typeof pdfModule.default === 'function') {
    pdfData = await pdfModule.default(pdfBuffer, options);
  } else {
    throw new Error('Unsupported pdf-parse module structure.');
  }

  const rawText = pdfData ? pdfData.text : '';
  if (!rawText || !rawText.trim()) {
    throw new Error('PDF document contains no extractable text.');
  }

  // Normalize transcript text: filter repeated document header/footer artifacts
  const lines = rawText.split('\n');
  const lineCounts = {};
  lines.forEach(l => {
    const trimmed = l.trim();
    if (trimmed.length > 5 && !trimmed.includes(':')) {
      lineCounts[trimmed] = (lineCounts[trimmed] || 0) + 1;
    }
  });

  // Filter lines that repeat on almost every page (headers/footers like "Page 1 of 5", "Confidential")
  const numPages = (pdfData && pdfData.numpages) ? pdfData.numpages : 1;
  const cleanedLines = lines.filter(line => {
    const trimmed = line.trim();
    if (numPages > 2 && lineCounts[trimmed] && lineCounts[trimmed] >= numPages && /^(page\s+\d+|confidential|company name|draft)/i.test(trimmed)) {
      return false; // Remove header/footer artifact
    }
    return true;
  });

  const normalizedTranscript = cleanedLines.join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Extraction quality check
  if (normalizedTranscript.length < 15) {
    throw new Error('Extracted PDF text is suspiciously short. It may be a scanned image PDF.');
  }

  return normalizedTranscript;
}

module.exports = {
  extractPdfTextWithReadingOrder,
  renderPageWithReadingOrder
};
