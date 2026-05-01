const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  Header,
  Footer,
  PageNumber,
  AlignmentType,
  WidthType,
  BorderStyle,
  HeadingLevel,
  PageBreak,
  TableOfContents,
} = require('docx');

const ROOT = 'd:/SEM_six_SGP/Crop_geniues';
const MD_PATH = path.join(ROOT, 'CROP_genuies_final.md');
const OUT_PATH = path.join(ROOT, 'CROP_GENUIES_Final_Report_Detailed.docx');

const BORDER = { style: BorderStyle.SINGLE, size: 6, color: '000000' };

function createHeader() {
  return new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: 'DEPSTAR/CSE/2026/CROP_GENUIES',
            size: 20,
            color: '000000',
            font: 'Times New Roman',
          }),
        ],
      }),
    ],
  });
}

function createFooter() {
  const noBorder = {
    top: { style: BorderStyle.NONE },
    bottom: { style: BorderStyle.NONE },
    left: { style: BorderStyle.NONE },
    right: { style: BorderStyle.NONE },
    insideHorizontal: { style: BorderStyle.NONE },
    insideVertical: { style: BorderStyle.NONE },
  };

  return new Footer({
    children: [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: noBorder,
        rows: [
          new TableRow({
            children: [
              new TableCell({
                width: { size: 33, type: WidthType.PERCENTAGE },
                borders: noBorder,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.LEFT,
                    children: [
                      new TextRun({
                        text: 'DEPSTAR',
                        size: 18,
                        color: '000000',
                        font: 'Times New Roman',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 34, type: WidthType.PERCENTAGE },
                borders: noBorder,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({
                        children: [PageNumber.CURRENT],
                        size: 18,
                        color: '000000',
                        font: 'Times New Roman',
                      }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                width: { size: 33, type: WidthType.PERCENTAGE },
                borders: noBorder,
                children: [
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [
                      new TextRun({
                        text: 'Department of Computer Science & Engineering',
                        size: 18,
                        color: '000000',
                        font: 'Times New Roman',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function textRun(text, opts = {}) {
  return new TextRun({
    text,
    font: 'Times New Roman',
    size: opts.size || 24,
    bold: !!opts.bold,
    italics: !!opts.italics,
    color: '000000',
  });
}

function normalizeLine(line) {
  return line.replace(/\r/g, '').trim();
}

function addScreenshotPlaceholder(children, caption) {
  children.push(
    new Paragraph({
      spacing: { before: 120, after: 80 },
      children: [textRun(caption.replace(/^-\s*/, ''), { bold: true })],
    })
  );

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              borders: {
                top: BORDER,
                bottom: BORDER,
                left: BORDER,
                right: BORDER,
              },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { before: 300, after: 300 },
                  children: [textRun('[ INSERT SCREENSHOT HERE ]', { bold: true })],
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  children.push(new Paragraph({ spacing: { after: 140 }, children: [textRun('')] }));
}

function parseMarkdownToDocChildren(mdContent) {
  const lines = mdContent.split('\n');
  const children = [];

  let inContentsBlock = false;
  let inMathBlock = false;

  for (const raw of lines) {
    const line = normalizeLine(raw);

    if (!line) {
      children.push(new Paragraph({ children: [textRun('')] }));
      continue;
    }

    if (line === '```' || line.startsWith('```')) {
      continue;
    }

    if (line === '$$') {
      inMathBlock = !inMathBlock;
      continue;
    }

    if (inMathBlock) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 40, after: 40 },
          children: [textRun(line)],
        })
      );
      continue;
    }

    if (line.startsWith('# CROP GENIUES FINAL REPORT')) {
      continue;
    }

    if (line.startsWith('## Contents')) {
      inContentsBlock = true;
      continue;
    }

    if (inContentsBlock && line.startsWith('## ') && line !== '## Contents') {
      inContentsBlock = false;
    }

    if (inContentsBlock) {
      continue;
    }

    if (line === '---') {
      children.push(new Paragraph({ children: [new PageBreak()] }));
      continue;
    }

    if (line.startsWith('## ')) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 120 },
          children: [textRun(line.slice(3), { bold: true, size: 28 })],
        })
      );
      continue;
    }

    if (line.startsWith('### ')) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 180, after: 100 },
          children: [textRun(line.slice(4), { bold: true, size: 26 })],
        })
      );
      continue;
    }

    if (line.startsWith('#### ')) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 140, after: 80 },
          children: [textRun(line.slice(5), { bold: true, size: 24 })],
        })
      );
      continue;
    }

    if (line.startsWith('- Fig ')) {
      addScreenshotPlaceholder(children, line);
      continue;
    }

    if (line.startsWith('- ')) {
      children.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 50 },
          children: [textRun(line.slice(2))],
        })
      );
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      children.push(
        new Paragraph({
          numbering: { reference: 'numbered-list', level: 0 },
          spacing: { after: 50 },
          children: [textRun(line.replace(/^\d+\.\s+/, ''))],
        })
      );
      continue;
    }

    children.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 80 },
        children: [textRun(line)],
      })
    );
  }

  return children;
}

function buildDoc(mdContent) {
  const cover = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 500, after: 120 },
      children: [textRun('CROP GENUIES', { bold: true, size: 48 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [textRun('FINAL PROJECT REPORT', { bold: true, size: 40 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [textRun('(SRS STYLE REPORT - BLACK TEXT FORMAT)', { size: 24 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [textRun('Project: Crop Genuies', { bold: true, size: 26 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [textRun('Academic Year: 2025-2026', { size: 24 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [textRun('Date: 26-April-2026', { size: 24 })],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];

  const toc = [
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      children: [textRun('Contents', { bold: true, size: 32 })],
    }),
    new Paragraph({
      spacing: { before: 120, after: 120 },
      children: [
        new TableOfContents('Table of Contents', {
          hyperlink: true,
          headingStyleRange: '1-3',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [textRun('Right-click TOC and select Update Field after opening in Word.', { italics: true, size: 20 })],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];

  const body = parseMarkdownToDocChildren(mdContent);

  return new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Times New Roman',
            size: 24,
            color: '000000',
          },
          paragraph: {
            spacing: { line: 360 },
          },
        },
      },
      paragraphStyles: [
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { font: 'Times New Roman', size: 28, bold: true, color: '000000' },
          paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 0 },
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { font: 'Times New Roman', size: 26, bold: true, color: '000000' },
          paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 1 },
        },
        {
          id: 'Heading3',
          name: 'Heading 3',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { font: 'Times New Roman', size: 24, bold: true, color: '000000' },
          paragraph: { spacing: { before: 160, after: 80 }, outlineLevel: 2 },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: 'numbered-list',
          levels: [
            {
              level: 0,
              format: 'decimal',
              text: '%1.',
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: { left: 720, hanging: 360 },
                },
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        headers: { default: createHeader() },
        footers: { default: createFooter() },
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
            size: { width: 12240, height: 15840 },
          },
        },
        children: [...cover, ...toc, ...body],
      },
    ],
  });
}

async function main() {
  if (!fs.existsSync(MD_PATH)) {
    throw new Error(`Markdown file not found: ${MD_PATH}`);
  }

  const mdContent = fs.readFileSync(MD_PATH, 'utf-8');
  const doc = buildDoc(mdContent);
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(OUT_PATH, buffer);
  console.log(`Report generated successfully: ${OUT_PATH}`);
}

main().catch((err) => {
  console.error('Failed to generate report:', err);
  process.exit(1);
});
